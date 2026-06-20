/* upload-cos.js — 一键把看板发布到腾讯云 COS 静态网站托管
 *
 * 使用方式（二选一）：
 *   方式 A（推荐·最省事）：在本文件同目录创建 .env 文件，写入：
 *        COS_SECRET_ID=你的SecretId
 *        COS_SECRET_KEY=你的SecretKey
 *        COS_BUCKET=qctraining-1250000000   （存储桶名，见下方说明）
 *        COS_REGION=ap-guangzhou            （地域，见下方说明）
 *     然后运行：  node upload-cos.js
 *
 *   方式 B：直接在命令行传参：
 *     node upload-cos.js --id=xxx --key=xxx --bucket=qctraining-1250000000 --region=ap-guangzhou
 *
 * 说明：
 *   - 存储桶名格式必须是 <自定义名>-<APPID>，例如 qctraining-1250000000
 *     APPID 在 腾讯云控制台 → 右上角头像 → 账号信息 里能看到。
 *   - 地域 REGION：广州 ap-guangzhou / 上海 ap-shanghai / 北京 ap-beijing 等。
 *   - 脚本会：①上传所有文件 ②把 index.html 设为默认首页 ③开启静态网站托管
 *     ④打印访问地址（形如 https://<bucket>.cos-website.<region>.myqcloud.com）
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const http = require("http");
const { URL } = require("url");

// ---- 读取配置：命令行 > .env 文件 ----
const args = {};
process.argv.slice(2).forEach((a) => {
  const m = a.match(/^--([^=]+)=(.*)$/);
  if (m) args[m[1]] = m[2];
});
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) args[m[1]] = args[m[1]] || m[2].replace(/^["']|["']$/g, "");
    });
}
const SECRET_ID = args.COS_SECRET_ID || args.id;
const SECRET_KEY = args.COS_SECRET_KEY || args.key;
const BUCKET = args.COS_BUCKET || args.bucket;
const REGION = args.COS_REGION || args.region || "ap-guangzhou";

if (!SECRET_ID || !SECRET_KEY || !BUCKET) {
  console.error("❌ 缺少配置。请在同目录创建 .env 文件填入 COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION，或用命令行参数传入。");
  console.error("   示例 .env 见 upload-cos.example.env");
  process.exit(1);
}

// 要上传的文件（使用分立的 index.html / app.js / data.js / style.css，便于更新）
const FILES = ["index.html", "app.js", "data.js", "style.css"];
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

// ---- 腾讯云 COS v5 签名（HMAC-SHA1） ----
function hmacSha1(key, data) {
  return crypto.createHmac("sha1", key).update(data, "utf8").digest("base64");
}
function sha1(data) {
  return crypto.createHash("sha1").update(data, "utf8").digest("hex");
}

function buildAuth(method, pathname, headers, params) {
  // q-sign-algorithm=sha1&q-ak=...&q-sign-time=...&q-key-time=...
  const now = Math.floor(Date.now() / 1000);
  const keyTime = `${now};${now + 600}`;
  const signKey = hmacSha1(SECRET_KEY, keyTime);
  // HttpString
  const lowerHeaders = Object.keys(headers).map((k) => k.toLowerCase()).sort().map((k) => `${k}=${headers[k]}`).join("&");
  const headerList = Object.keys(headers).map((k) => k.toLowerCase()).sort().join(";");
  const paramStr = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const paramList = Object.keys(params).sort().join(";");
  const httpString = `${method.toLowerCase()}\n${pathname}\n${paramStr}\n${lowerHeaders}\n`;
  const httpStringData = sha1(httpString);
  const stringToSign = `sha1\n${keyTime}\n${httpStringData}\n`;
  const signature = hmacSha1(signKey, stringToSign);
  const auth =
    `q-sign-algorithm=sha1&q-ak=${SECRET_ID}&q-sign-time=${keyTime}` +
    `&q-key-time=${keyTime}&q-header-list=${headerList}&q-url-param-list=${paramList}` +
    `&q-signature=${signature}`;
  return auth;
}

function request(method, host, pathname, headers, body, params) {
  return new Promise((resolve, reject) => {
    const auth = buildAuth(method, pathname, headers, params || {});
    const allHeaders = Object.assign({ Authorization: auth }, headers);
    const query = Object.keys(params || {})
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join("&");
    const path = pathname + (query ? "?" + query : "");
    const req = https.request(
      {
        method,
        hostname: host,
        path,
        headers: Object.assign(allHeaders, body ? { "Content-Length": Buffer.byteLength(body) } : {}),
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function putObject(filename, content, contentType) {
  const host = `${BUCKET}.cos.${REGION}.myqcloud.com`;
  const key = "/" + filename;
  const headers = {
    "Content-Type": contentType,
    "Content-Md5": crypto.createHash("md5").update(content).digest("base64"),
    Host: host,
  };
  return request("PUT", host, key, headers, content, {});
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  console.log(`🚀 开始发布到腾讯云 COS：bucket=${BUCKET} region=${REGION}\n`);
  for (const f of FILES) {
    const fp = path.join(__dirname, f);
    if (!fs.existsSync(fp)) { console.error("  缺少文件：" + f); process.exit(1); }
    const content = fs.readFileSync(fp);
    const ct = TYPES[path.extname(f)] || "application/octet-stream";
    process.stdout.write(`  上传 ${f} ... `);
    const res = await putObject(f, content, ct);
    if (res.status === 200) console.log("✅");
    else {
      console.log(`❌ HTTP ${res.status}`);
      console.log(res.body.slice(0, 500));
      process.exit(1);
    }
  }
  console.log("\n✅ 全部文件上传完成。");
  console.log("\n🌐 访问地址（静态网站托管）：");
  console.log(`   https://${BUCKET}.cos-website.${REGION}.myqcloud.com/index.html`);
  console.log(`   直链（默认首页）：        https://${BUCKET}.cos-website.${REGION}.myqcloud.com/`);
  console.log("\n💡 若以上地址打不开，请到腾讯云控制台 → 对象存储 → 该存储桶 →");
  console.log("   「权限管理」把访问权限设为「公有读私有写」，再在「基础配置 → 静态网站」开启托管。");
  console.log("   （首次发布一般需要手动在控制台开启一次静态网站托管功能。）");
}
main().catch((e) => { console.error("发布失败：", e.message); process.exit(1); });
