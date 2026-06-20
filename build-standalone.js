/* build-standalone.js — 把 index.html + style.css + data.js + app.js 内联成单个 standalone.html
 * 用途：方便单文件上传 / 本地直接双击打开预览。
 * 运行：node build-standalone.js
 */
const fs = require("fs");
const path = require("path");

let html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "style.css"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
const data = fs.readFileSync(path.join(__dirname, "data.js"), "utf8");

// CSS link -> inline <style>（用 indexOf，避免正则处理 css 内容）
const cssLink = '<link rel="stylesheet" href="style.css">';
{
  const i = html.indexOf(cssLink);
  html = html.slice(0, i) + "<style>\n" + css + "\n</style>" + html.slice(i + cssLink.length);
}
// 两个 <script src> -> 内联（indexOf 拼接，避免 app.js 源码里的正则/反引号干扰）
const dataTag = '<script src="data.js"></script>';
const appTag = '<script src="app.js"></script>';
{
  const di = html.indexOf(dataTag);
  const ai = html.indexOf(appTag);
  const head = html.slice(0, di);
  const mid = html.slice(di + dataTag.length, ai);
  const tail = html.slice(ai + appTag.length);
  html = head + "<scr" + "ipt>\n" + data + "\n" + mid + app + "\n</scr" + "ipt>" + tail;
}

fs.writeFileSync(path.join(__dirname, "standalone.html"), html);
const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((l) => !l.startsWith("data:") && !l.startsWith("#") && l !== "");
console.log("✅ standalone.html 已生成，大小", fs.statSync(path.join(__dirname, "standalone.html")).size, "bytes");
console.log("   外部引用数:", refs.length, refs.length ? refs.join(", ") : "（无，完全自包含）");
