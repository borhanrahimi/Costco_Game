// tools/bundle.js — packs the whole game into ONE html file you can text, email or upload.
//   node tools/bundle.js              -> dist/prestons-shift.html
// It copies every local css/js file listed in www/index.html into the page itself.

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const www = path.join(root, "www");
const fragment = process.argv.includes("--fragment");   // body-only version (used for claude.ai previews)
let html = fs.readFileSync(path.join(www, "index.html"), "utf8");

const isLocal = src => !/^https?:\/\//.test(src);
const read = rel => fs.readFileSync(path.join(www, rel), "utf8");

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) =>
  isLocal(href) ? `<style>\n${read(href)}\n</style>` : m);

html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) =>
  isLocal(src) ? `<script>\n// ---- ${src} ----\n${read(src)}\n</script>` : m);

// Put face pictures and other images right into the file too.
html = html.replace(/(["'])(characters\/portraits\/[^"']+\.png)\1/g, (m, q, rel) => {
  const file = path.join(www, rel);
  if (!fs.existsSync(file)) return m;
  return q + "data:image/png;base64," + fs.readFileSync(file).toString("base64") + q;
});

if (fragment){
  html = html
    .replace(/<!doctype html>\s*/i, "")
    .replace(/<\/?html[^>]*>\s*/gi, "")
    .replace(/<\/?head>\s*/gi, "")
    .replace(/<\/?body>\s*/gi, "");
}

const out = path.join(root, "dist", fragment ? "prestons-shift.fragment.html" : "prestons-shift.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log("Wrote", path.relative(root, out), `(${(html.length / 1024).toFixed(0)} KB)`);
