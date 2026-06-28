// upload-sdk.js — 使用官方 COS SDK 上传看板文件
"use strict";
const fs = require("fs");
const path = require("path");
const COS = require("cos-nodejs-sdk-v5");

// 读取 .env
const args = {};
const envFile = path.join(__dirname, ".env");
fs.readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) args[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });

const SECRET_ID = args.COS_SECRET_ID;
const SECRET_KEY = args.COS_SECRET_KEY;
const BUCKET = args.COS_BUCKET;
const REGION = args.COS_REGION || "ap-guangzhou";

if (!SECRET_ID || !SECRET_KEY || !BUCKET) {
  console.error("缺少配置");
  process.exit(1);
}

const cos = new COS({ SecretId: SECRET_ID, SecretKey: SECRET_KEY });

const FILES = ["index.html", "app.js", "data.js", "style.css"];
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

async function uploadFile(f) {
  const fp = path.join(__dirname, f);
  if (!fs.existsSync(fp)) throw new Error("missing: " + f);
  const content = fs.readFileSync(fp);
  const ct = TYPES[path.extname(f)] || "application/octet-stream";
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key: f,
        Body: content,
        ContentType: ct,
      },
      (err, data) => {
        if (err) reject(err);
        else resolve(data);
      }
    );
  });
}

async function main() {
  console.log(`部署到 COS: ${BUCKET} (${REGION})\n`);
  for (const f of FILES) {
    process.stdout.write(`  上传 ${f} ... `);
    try {
      await uploadFile(f);
      console.log("OK");
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
      if (e.statusCode) console.log(`  HTTP ${e.statusCode}: ${e.error?.Message || ""}`);
    }
  }
  console.log(`\n访问: https://${BUCKET}.cos-website.${REGION}.myqcloud.com/`);
}
main().catch((e) => console.error(e));
