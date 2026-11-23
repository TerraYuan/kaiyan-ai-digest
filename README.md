# 开眼AI观 · 要闻速递站

单页按日期存档 AI 产业要闻；供公众号文末「阅读原文」跳转，标题可点开原文。

## 线上地址（GitHub Pages）

- 站点：https://terrayuan.github.io/kaiyan-ai-digest/
- 指定日期：https://terrayuan.github.io/kaiyan-ai-digest/?d=2026-11-12
- 每周要闻：https://terrayuan.github.io/kaiyan-ai-digest/?w=2026-11-23（`w` 为窗口截止日，含当天共 7 个自然日）
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

**默认流程**：本地 `publish-digest` 写入 `data/` 后，在本目录 `git commit` + `git push origin main`，由 GitHub Pages 对外提供。  
本地 `E:\AI公号\*_阅读原文.html` 只作备份，**不能**代替公网链接。

日更阅读原文填 `?d=`，每周要闻填 `?w=`（截止日）：

```text
https://terrayuan.github.io/kaiyan-ai-digest/?d=2026-11-17
https://terrayuan.github.io/kaiyan-ai-digest/?w=2026-11-23
```

不写参数则打开最新一天。周报由侧栏「每周要闻」或 `node pipeline/weekly.js` 写入 `data/week-YYYY-MM-DD.json`。

> 静态托管上的「上传页」只能校验/下载 JSON；真正写入需本地 `server.js`，或把 JSON 放进 `data/` 后重新部署。

## 数据格式

`data/index.json`：日期列表  
`data/YYYY-MM-DD.json`：当日四栏条目（含可点击 `url`）
