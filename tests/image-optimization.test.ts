import assert from 'node:assert/strict';
import test from 'node:test';
import { optimizeImage } from '../src/lib/imageOptimization.ts';

function installCanvasMock({ width = 1200, height = 800, createBlob }: {
  width?: number;
  height?: number;
  createBlob: (canvas: { width: number; height: number }, quality: number) => Blob;
}) {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalDocument = globalThis.document;
  let closed = false;
  let calls = 0;
  let lastDrawSize = { width: 0, height: 0 };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: () => { lastDrawSize = { width: canvas.width, height: canvas.height }; } }),
    toBlob: (callback: BlobCallback, _type?: string, quality?: number) => {
      calls += 1;
      callback(createBlob(canvas, quality ?? 1));
    },
  };

  Object.assign(globalThis, {
    createImageBitmap: async () => ({ width, height, close: () => { closed = true; } }),
    document: { createElement: () => canvas },
  });

  return {
    canvas,
    get calls() { return calls; },
    get lastDrawSize() { return lastDrawSize; },
    get closed() { return closed; },
    restore() {
      Object.assign(globalThis, { createImageBitmap: originalCreateImageBitmap, document: originalDocument });
    },
  };
}

test('optimizes a PNG cover to WebP below the configured upload limit', async () => {
  const mock = installCanvasMock({ createBlob: () => new Blob(['x'.repeat(1024)], { type: 'image/webp' }) });
  try {
    const source = new File(['x'.repeat(5000)], 'cover.png', { type: 'image/png' });
    const optimized = await optimizeImage(source, { maxBytes: 2 * 1024 * 1024 });
    assert.equal(optimized.type, 'image/webp');
    assert.equal(optimized.name, 'cover.webp');
    assert.ok(optimized.size < source.size);
    assert.equal(mock.closed, true);
  } finally {
    mock.restore();
  }
});

test('keeps a small WebP unchanged when it already meets size and dimension limits', async () => {
  const mock = installCanvasMock({ createBlob: () => new Blob(['unused'], { type: 'image/webp' }) });
  try {
    const source = new File(['small'], 'cover.webp', { type: 'image/webp' });
    assert.equal(await optimizeImage(source), source);
    assert.equal(mock.calls, 0);
  } finally {
    mock.restore();
  }
});

test('reduces quality and dimensions until a large image meets the upload limit', async () => {
  const mock = installCanvasMock({
    width: 4000,
    height: 2000,
    createBlob: (_canvas, quality) => new Blob(['x'.repeat(quality > 0.75 ? 2_500_000 : 1_500_000)], { type: 'image/webp' }),
  });
  try {
    const source = new File(['x'.repeat(3_000_000)], 'article.jpg', { type: 'image/jpeg' });
    const optimized = await optimizeImage(source, { maxBytes: 2 * 1024 * 1024 });
    assert.equal(optimized.type, 'image/webp');
    assert.ok(optimized.size <= 2 * 1024 * 1024);
    assert.deepEqual(mock.lastDrawSize, { width: 1800, height: 900 });
  } finally {
    mock.restore();
  }
});

test('rejects unsupported files and images that cannot be reduced to the upload limit', async () => {
  await assert.rejects(
    optimizeImage(new File(['not an image'], 'animation.gif', { type: 'image/gif' })),
    /JPG, PNG o WebP/,
  );

  const mock = installCanvasMock({ createBlob: () => new Blob(['x'.repeat(2_100_000)], { type: 'image/webp' }) });
  try {
    await assert.rejects(
      optimizeImage(new File(['x'.repeat(3_000_000)], 'large.png', { type: 'image/png' })),
      /No se pudo reducir la imagen/,
    );
    assert.equal(mock.closed, true);
  } finally {
    mock.restore();
  }
});
