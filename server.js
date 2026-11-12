/** 本地上传服务：静态站 + POST /api/digest 写入 data/ */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const PORT = Number(process.env.DIGEST_PORT || 8790);
const TOKEN = process.env.DIGEST_TOKEN || "yuan-digest";

function send(res, code, body, type = "application/json; charset=utf-8") {
  res.writeHead(code, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function updateIndex(date) {
  const indexPath = path.join(DATA, "index.json");
  let index = { latest: date, dates: [] };
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } catch (_) {}
  }
  const set = new Set(index.dates || []);
  set.add(date);
  const dates = [...set].sort((a, b) => b.localeCompare(a));
  const out = { latest: dates[0] || date, dates };
  fs.writeFileSync(indexPath, JSON.stringify(out, null, 2), "utf8");
  return out;
}

function saveDigest(doc) {
  if (!doc?.date || !/^\d{4}-\d{2}-\d{2}$/.test(doc.date)) {
    throw new Error("date 必须为 YYYY-MM-DD");
  }
  if (!Array.isArray(doc.sections)) throw new Error("缺少 sections");
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  doc.updatedAt = doc.updatedAt || new Date().toISOString();
  const file = path.join(DATA, `${doc.date}.json`);
  fs.writeFileSync(file, JSON.stringify(doc, null, 2), "utf8");
  const index = updateIndex(doc.date);
  return { file, index };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/api/digest") {
    const token = req.headers["x-digest-token"] || "";
    if (TOKEN && token !== TOKEN) {
      send(res, 401, JSON.stringify({ error: "口令错误" }));
      return;
    }
    try {
      const raw = await readBody(req);
      const doc = JSON.parse(raw);
      const saved = saveDigest(doc);
      send(res, 200, JSON.stringify({ ok: true, date: doc.date, index: saved.index }));
    } catch (e) {
      send(res, 400, JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT)) {
    send(res, 403, "forbidden", "text/plain; charset=utf-8");
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    send(res, 404, "not found", "text/plain; charset=utf-8");
    return;
  }
  send(res, 200, fs.readFileSync(file), contentType(file));
});

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });

server.listen(PORT, "127.0.0.1", () => {
  console.log(`digest-site http://127.0.0.1:${PORT}/`);
  console.log(`upload     http://127.0.0.1:${PORT}/upload.html`);
  console.log(`token      ${TOKEN}`);
});
