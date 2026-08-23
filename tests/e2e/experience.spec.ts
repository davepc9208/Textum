import { expect, test, type Page } from '@playwright/test';

const supabasePosts = '**/rest/v1/posts**';

async function mockEmptyPosts(page: Page) {
  await page.route(supabasePosts, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
}

async function openHome(page: Page) {
  await page.goto('/');
  await expect(page.locator('#inicio')).toBeVisible();
}

async function mockPost(page: Page) {
  await page.route(supabasePosts, async route => {
    const url = new URL(route.request().url());
    const isArticleRequest = url.searchParams.has('slug');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(isArticleRequest ? {
        id: 'post-1',
        slug: 'articulo-de-prueba',
        title_es: 'Artículo de prueba',
        title_en: 'Test article',
        excerpt_es: 'Resumen de prueba.',
        excerpt_en: 'Test summary.',
        content_es: '<p>Contenido de prueba.</p>',
        content_en: '<p>Test content.</p>',
        keywords_es: '',
        keywords_en: '',
        author: 'TEXTUM',
        cover_url: '',
        cover_alt: null,
        published: true,
        created_at: '2026-01-01T00:00:00.000Z',
        reading_time: 1,
        category: null,
        collection_type: null,
      } : []),
    });
  });
}

test.describe('component rendering and navigation', () => {
  test('renders the homepage landmarks, primary CTA and cookie consent dialog', async ({ page }) => {
    await openHome(page);

    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /diagnóstico académico gratuito/i }).first()).toBeVisible();

    const cookieDialog = page.getByRole('dialog', { name: /preferencias de cookies/i });
    await expect(cookieDialog).toBeVisible();
    await expect(cookieDialog.getByRole('button', { name: /solo esenciales/i })).toBeVisible();
    await expect(cookieDialog.getByRole('button', { name: /aceptar todas/i })).toBeVisible();
  });

  test('opens and closes the mobile navigation with correct ARIA state', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    const menuButton = page.getByRole('button', { name: /abrir menú/i });
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await menuButton.click();
    const closeButton = page.getByRole('button', { name: /cerrar menú/i });
    await expect(closeButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: 'BLOG' }).last()).toBeVisible();

    await closeButton.click();
    await expect(page.getByRole('button', { name: /abrir menú/i })).toHaveAttribute('aria-expanded', 'false');
  });

  test('renders empty blog and collections states without runtime errors', async ({ page }) => {
    await mockEmptyPosts(page);
    const consoleErrors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: /artículos|articles/i })).toBeVisible();
    await expect(page.getByText(/próximamente publicaremos|articles and academic reflections coming soon/i)).toBeVisible();

    await page.goto('/colecciones');
    await expect(page.getByRole('heading', { name: /pensar metodológicamente|thinking methodologically/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /principios textum|textum principles/i })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('navigates to legal and unsubscribe pages', async ({ page }) => {
    await page.goto('/privacidad');
    await expect(page.getByRole('heading', { name: /política de privacidad|privacy policy/i })).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    await page.goto('/baja');
    await expect(page.getByRole('heading', { name: /baja de la lista/i })).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
  });
});

test.describe('internationalization', () => {
  test('switches the homepage to English and updates the document language', async ({ page }) => {
    await openHome(page);

    const languageToggle = page.locator('nav').getByRole('button', { name: /idioma actual: español/i }).first();
    await languageToggle.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('International Academic Mentoring', { exact: true }).first()).toBeVisible();
    await expect(page.locator('nav').getByRole('button', { name: /current language: english/i }).first()).toBeVisible();
    await expect(page.evaluate(() => localStorage.getItem('textum_lang'))).resolves.toBe('en');
  });

  test('restores the persisted language after a reload', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('textum_lang', 'en'));
    await openHome(page);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('International Academic Mentoring', { exact: true }).first()).toBeVisible();
  });
});

test.describe('accessibility patterns', () => {
  test('associates every contact form control with an accessible label', async ({ page }) => {
    await openHome(page);
    const form = page.locator('#contacto form');

    await expect(form.getByLabel(/nombre y apellidos/i)).toBeVisible();
    await expect(form.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(form.getByLabel(/país/i)).toBeVisible();
    await expect(form.getByLabel(/nivel académico/i)).toBeVisible();
    await expect(form.getByLabel(/tipo de proyecto/i)).toBeVisible();
    await expect(form.getByLabel(/etapa actual del manuscrito/i)).toBeVisible();
    await expect(form.getByLabel(/programa de interés/i)).toBeVisible();
    await expect(form.getByLabel(/mensaje breve/i)).toBeVisible();
  });

  test('provides a skip link and keeps the hidden sticky CTA out of keyboard navigation', async ({ page }) => {
    await openHome(page);
    const skipLink = page.getByRole('link', { name: /saltar al contenido principal/i });
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    const stickyCta = page.locator('a[aria-hidden="true"][tabindex="-1"]');
    await expect(stickyCta).toHaveCount(1);
    await expect(stickyCta).toHaveAttribute('aria-label', /agendar diagnóstico académico gratuito/i);
  });

  test('exposes the share control as a disclosure button on article pages', async ({ page }) => {
    await mockPost(page);
    await page.goto('/blog/articulo-de-prueba');

    const shareButton = page.getByRole('button', { name: /compartir artículo/i });
    await expect(shareButton).toBeVisible();
    await expect(shareButton).toHaveAttribute('aria-haspopup', 'menu');
    await expect(shareButton).toHaveAttribute('aria-expanded', 'false');

    await shareButton.click();
    await expect(shareButton).toHaveAttribute('aria-expanded', 'true');
  });
});
