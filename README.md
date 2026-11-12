# 开眼AI观 · 要闻速递站

单页按日期存档 AI 产业要闻；供公众号文末「阅读原文」跳转，标题可点开原文。

## 线上地址（GitHub Pages）

- 站点：https://terrayuan.github.io/kaiyan-ai-digest/
- 指定日期：https://terrayuan.github.io/kaiyan-ai-digest/?d=2026-11-12
- 仓库：https://github.com/TerraYuan/kaiyan-ai-digest

公众号文末「原文链接」填当日地址即可。

## 本地预览 / 上传

```bash
cd digest-site
node server.js
```

- 速递页：http://127.0.0.1:8790/
- 上传页：http://127.0.0.1:8790/upload.html
- 默认口令：`yuan-digest`（可用环境变量 `DIGEST_TOKEN` 修改）

## 自动发布

雷达检索跑完后，管道会写入：

- `digest-site/data/YYYY-MM-DD.json`
- `digest-site/data/index.json`

也可手动：

```bash
node pipeline/publish-digest.js pipeline/last-brief.json
```

## 公网部署（订阅号「阅读原文」必需）

把整个 `digest-site` 目录发布到任意静态托管，例如：

1. GitHub Pages / Cloudflare Pages / Netlify
2. 对象存储静态网站

阅读原文填：

```text
https://你的域名/?d=2026-11-12
```

不写日期则打开最新一天。

> 静态托管上的「上传页」只能校验/下载 JSON；真正写入需本地 `server.js`，或把 JSON 放进 `data/` 后重新部署。

## 数据格式

`data/index.json`：日期列表  
`data/YYYY-MM-DD.json`：当日四栏条目（含可点击 `url`）
