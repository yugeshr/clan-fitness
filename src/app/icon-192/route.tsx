import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const dynamic = "force-static";

export async function GET() {
  const source = await readFile(path.join(process.cwd(), "public/logo/app-icon-512.png"));
  const png = await sharp(source).flatten({ background: "#0d0d0d" }).resize(192, 192).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
