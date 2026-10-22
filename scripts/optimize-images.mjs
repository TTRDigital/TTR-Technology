/*
 * Makes WebP copies of every image in public/images at the widths next/image
 * asks for (see lib/image-loader.ts), into public/_img. Animated GIFs become
 * animated WebP. Runs before `next build`; files that already exist and are
 * newer than the source are skipped, so repeat builds are fast. Output has no
 * metadata (sharp drops EXIF/XMP unless asked to keep it).
 * Also writes lib/data/image-sizes.json (each original's pixel size): copies are
 * never upscaled, so components/eb/Img.tsx uses it to give every srcset entry
 * its real width (otherwise the browser would draw small originals too small).
 */
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// deviceSizes + imageSizes from next.config.ts.
const WIDTHS = [96, 256, 384, 640, 828, 1200, 1920];
const SRC = path.resolve("public/images");
const OUT = path.resolve("public/_img/images");

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(jpe?g|png|webp|gif)$/i.test(entry.name)) yield full;
  }
}

let made = 0;
let files = 0;
const sizes = {};
for await (const file of walk(SRC)) {
  files++;
  const rel = path.relative(SRC, file).replace(/\.(jpe?g|png|webp|gif)$/i, "");
  const srcTime = (await stat(file)).mtimeMs;
  const animated = /\.(gif|webp)$/i.test(file) && ((await sharp(file).metadata()).pages ?? 1) > 1;
  const meta = await sharp(file).metadata();
  sizes["/images/" + path.relative(SRC, file).split(path.sep).join("/")] = [meta.width, animated ? (meta.pageHeight ?? meta.height) : meta.height];
  await mkdir(path.dirname(path.join(OUT, rel)), { recursive: true });
  for (const w of WIDTHS) {
    const target = path.join(OUT, `${rel}-${w}.webp`);
    const existing = await stat(target).catch(() => null);
    if (existing && existing.mtimeMs >= srcTime) continue;
    // Never upscale: widths above the original get the original size.
    await sharp(file, { animated })
      .rotate()
      .resize({ width: Math.min(w, meta.width ?? w), withoutEnlargement: true })
      .webp({ quality: animated ? 80 : 74, effort: animated ? 4 : 5 })
      .toFile(target);
    made++;
  }
}
const sorted = Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => (a < b ? -1 : 1)));
await writeFile(path.resolve("lib/data/image-sizes.json"), JSON.stringify(sorted, null, 0) + "\n");
console.log(`[images] ${files} images, ${made} WebP files written to public/_img`);
