import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const dynamic = "force-static";

// Android's push-notification "badge" (the small monochrome icon shown in the notification
// shade next to the app name, distinct from the full-color icon shown alongside the body) is
// rendered from the image's alpha channel alone — unlike icon-192/icon-512/apple-icon, this one
// must stay transparent rather than flattened onto a solid background, or Android has no
// silhouette to draw and shows a blank box instead.
export async function GET() {
  const source = await readFile(path.join(process.cwd(), "public/logo/icon-mark-transparent.png"));
  const png = await sharp(source).resize(96, 96).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
