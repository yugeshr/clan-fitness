import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const dynamic = "force-static";

// Android's maskable-icon spec crops to a safe zone (~80% diameter circle centered on the
// canvas), so we flatten to a full-bleed background (matching the app's own dark background)
// rather than the source's transparent margin, which would otherwise show through the mask.
export async function GET() {
  const source = await readFile(path.join(process.cwd(), "public/logo/app-icon-512.png"));
  const png = await sharp(source).flatten({ background: "#0d0d0d" }).resize(512, 512).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
