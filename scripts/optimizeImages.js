import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

async function optimizeImages() {
  console.log('🖼️  Optimizing images...');
  console.log(`📁 Working directory: ${publicDir}`);

  try {
    // Find all image files
    const allFiles = fs.readdirSync(publicDir);
    const imageFiles = allFiles.filter(f => /\.(jpg|png|jpeg)$/i.test(f));
    
    console.log(`📸 Found ${imageFiles.length} images to optimize\n`);
    
    if (imageFiles.length === 0) {
      console.log('ℹ️  No images found to optimize');
      return;
    }

    // Process each image
    for (const file of imageFiles) {
      const inputPath = path.join(publicDir, file);
      const nameWithoutExt = path.parse(file).name;
      
      // Get original size
      const stats = fs.statSync(inputPath);
      const originalSize = (stats.size / 1024 / 1024).toFixed(2);
      
      console.log(`📄 Processing: ${file} (${originalSize} MB)`);

      try {
        // Optimize original (PNG/JPEG)
        const buffer = fs.readFileSync(inputPath);
        const optimized = await sharp(buffer)
          .resize(2048, 2048, { withoutEnlargement: true })
          .withMetadata()
          [file.toLowerCase().endsWith('.png') ? 'png' : 'jpeg']({
            quality: 80,
            progressive: true,
          })
          .toBuffer();

        fs.writeFileSync(inputPath, optimized);
        const optimizedSize = (optimized.length / 1024 / 1024).toFixed(2);
        const saved = ((1 - optimized.length / stats.size) * 100).toFixed(0);
        console.log(`  ✅ Optimized: ${optimizedSize} MB (saved ${saved}%)`);

        // Generate WebP version
        const webpPath = path.join(publicDir, `${nameWithoutExt}.webp`);
        await sharp(optimized)
          .resize(2048, 2048, { withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(webpPath);
        
        const webpStats = fs.statSync(webpPath);
        const webpSize = (webpStats.size / 1024 / 1024).toFixed(2);
        console.log(`  ✅ WebP generated: ${webpSize} MB\n`);
      } catch (err) {
        console.error(`  ❌ Error processing ${file}:`, err.message);
      }
    }

    console.log('✨ Image optimization complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

optimizeImages();
