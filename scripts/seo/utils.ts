import { writeFileSync } from "node:fs";

export function saveFile(path: string, content: string) {
  writeFileSync(path, content, "utf8");

  console.log(`✅ ${path} generado`);
}