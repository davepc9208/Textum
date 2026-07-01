import { generateSitemaps } from "./sitemap.js";
import { generateSitemapIndex } from "./sitemap-index.js";
import { generateRss } from "./rss.js";
import { generateLlms } from "./llms.js";

async function run() {
  try {
    console.log("🚀 Generando SEO internacional...");

    await generateSitemaps();
    await generateSitemapIndex();
    await generateRss();
    await generateLlms();

    console.log("✅ SEO completado");
  } catch (error) {
    console.log("❌ ERROR RAW:");
    console.log(error);

    console.log("❌ STRINGIFIED:");
    console.log(JSON.stringify(error, null, 2));

    throw error;
  }
}

run().catch((err) => {
  console.error("💥 FATAL:");
  console.error(err);
});