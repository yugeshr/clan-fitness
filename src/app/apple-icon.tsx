import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function AppleIcon() {
  const source = await readFile(path.join(process.cwd(), "public/logo/app-icon-512.png"));
  const png = await sharp(source).flatten({ background: "#0d0d0d" }).resize(size.width, size.height).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": contentType } });
}
