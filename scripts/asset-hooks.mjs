import { fileURLToPath } from "node:url";

const IMAGE = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

/**
 * Lets Node load content/*.ts outside Next: a static image import becomes { src: "/images/…", width: 0, height: 0 },
 * the public URL path. The seed reads the real file from public/ and measures it.
 */
export async function load(url, context, next) {
  if (url.startsWith("file:") && IMAGE.test(url)) {
    const path = fileURLToPath(url);
    const at = path.lastIndexOf("/public/");
    const src = at >= 0 ? path.slice(at + "/public".length) : path;
    return { format: "module", shortCircuit: true, source: `export default ${JSON.stringify({ src, width: 0, height: 0 })};` };
  }
  return next(url, context);
}
