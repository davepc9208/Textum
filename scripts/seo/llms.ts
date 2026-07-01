import fs from "fs";
import { getPosts } from "./client.js";
import { SITE_URL } from "./constants.js";

export async function generateLlms() {
  const posts = await getPosts();

  const content = `# Knowledge Base

${posts
  .map(
    (p) => `
## ${p.title_es}

URL: ${SITE_URL}/blog/${p.slug}

ES: ${p.excerpt_es ?? ""}
EN: ${p.excerpt_en ?? ""}
`
  )
  .join("\n")}
`;

  fs.writeFileSync("public/llms.txt", content);
}