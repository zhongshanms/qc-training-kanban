# 质检培训看板

面向质检员的培训学习看板，按 **门锁 / 灯饰 / 导轨** 三大品类分页，另含**通用判定标准**页。
内容直接源自 6 份内部资料（保持原始逻辑），可检索、响应式、纯前端。

---

## 📁 文件说明

| 文件 | 作用 |
|------|------|
| `index.html` | 网站入口（首页 / 路由） |
| `app.js` | 前端逻辑（路由、渲染、搜索） |
| `data.js` | 全部看板数据（来自源文件） |
| `style.css` | 样式 |
| `standalone.html` | 单文件版（HTML+CSS+JS 全内联，方便单传） |
| `build-standalone.js` | 重新生成 standalone.html 的脚本（改完数据后跑一次） |
| `preview-local.bat` | 双击即可在本地浏览器预览 |
| `upload-cos.js` | 一键发布到腾讯云 COS |
| `upload-cos.example.env` | COS 配置模板 |

---

## 👀 方式一：本地预览（最快，立即可看）

双击 `preview-local.bat`，浏览器会自动打开 `http://localhost:8765`。
或直接双击 `standalone.html` 用浏览器打开（无需服务器）。

---

## 🌐 方式二：发布到腾讯云 COS（国内稳定公网）

### 第 1 步：登录腾讯云，拿到密钥
1. 打开 https://console.cloud.tencent.com/ ，注册/登录。
2. 右上角头像 → **账号信息**，记下你的 **APPID**（纯数字，如 `1250000000`）。
3. 进入 https://console.cloud.tencent.com/cam/capi ，点"新建密钥"，得到：
   - **SecretId**
   - **SecretKey**

### 第 2 步：创建存储桶
1. 进入 https://console.cloud.tencent.com/cos5/bucket ，点"创建存储桶"。
2. 名称随意（如 `qctraining`），系统会自动拼成 `qctraining-1250000000`。
3. 地域选离你近的（广州 `ap-guangzhou` / 上海 `ap-shanghai` / 北京 `ap-beijing`）。
4. 访问权限选 **公有读私有写**。
5. 其余默认，创建。

### 第 3 步：填写配置
把 `upload-cos.example.env` 复制一份，重命名为 `.env`，填入：
```
COS_SECRET_ID=你的SecretId
COS_SECRET_KEY=你的SecretKey
COS_BUCKET=qctraining-1250000000
COS_REGION=ap-guangzhou
```

### 第 4 步：一键发布
在本目录打开命令行（地址栏输入 `cmd` 回车），执行：
```
node upload-cos.js
```
看到 ✅ 即成功。脚本会打印访问地址，形如：
```
https://qctraining-1250000000.cos-website.ap-guangzhou.myqcloud.com/
```

### 第 5 步（仅首次需要）：开启静态网站托管
若上面地址打不开，到该存储桶 → **基础配置 → 静态网站**，
打开"静态网站"开关，索引文档填 `index.html`，保存即可。

> 之后内容有更新，只需改 `data.js` / `app.js` 等，再跑一次 `node upload-cos.js` 即覆盖。

---

## 📝 数据来源
- 门锁基础质检流程.xlsx / 门锁单开通开逻辑.xlsx
- 欧美规灯饰质检项区别.xlsx / 易碎灯饰摔箱测试SOP.docx
- 导轨基础质检流程.xlsx
- 收发货不良判定标准V1.xlsx

> 注：`收发货不良判定标准V1.xlsx` 中带 `=DISPIMG(...)` 的图片引用在原文件内
> **无实际图片数据**，故仅保留文字判定标准，无法还原图片。
