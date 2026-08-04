import { copyFileSync, existsSync } from "node:fs";

// adapter-static with `fallback: "404.html"` and no prerendered routes emits
// only 404.html — GitHub Pages needs a real index.html at the root, otherwise
// every document request 404s (with 404.html served as the body).
if (existsSync("build/404.html") && !existsSync("build/index.html")) {
  copyFileSync("build/404.html", "build/index.html");
  console.log("postbuild: copied 404.html -> index.html");
}
