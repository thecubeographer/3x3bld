// Minimal no-cache static server. Copied to <project>/.preview-server.js by /scaffold.
// Use this instead of `python3 -m http.server`: http.server caches aggressively and
// kept serving stale js/data/*.js on THE NEXUS PARK until we switched.
// Sends Cache-Control: no-store so edits appear on a normal reload (no hard-refresh needed).
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || ".");
const port = parseInt(process.argv[3] || "8000", 10);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".mp4": "video/mp4"
};

http.createServer(function (req, res) {
  let rel = decodeURIComponent(req.url.split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const fp = path.join(root, rel);
  if (!fp.startsWith(root)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(fp, function (err, data) {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(fp).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    });
    res.end(data);
  });
}).listen(port, function () {
  console.log("serving " + root + " on http://localhost:" + port + " (no-cache)");
});
