const $ = (id) => document.getElementById(id);

function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function setMsg(text, ok) {
  const el = $("up-msg");
  el.textContent = text;
  el.className = `msg ${ok ? "ok" : "err"}`;
}

function normalizeDoc(raw, dateFallback) {
  if (!raw || typeof raw !== "object") throw new Error("不是有效 JSON 对象");

  // 已是站点格式
  if (Array.isArray(raw.sections)) {
    const date = raw.date || dateFallback;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("缺少合法 date 字段");
    return {
      date,
      title: raw.title || "AI产业信息简报",
      disclaimer: raw.disclaimer || "研究备忘，不是投资建议。",
      updatedAt: new Date().toISOString(),
      sections: raw.sections,
    };
  }

  // 雷达 brief → 站点格式
  if (Array.isArray(raw.items)) {
    const DIMS = [
      ["tech", "技术"],
      ["product", "产品"],
      ["company-dynamics", "公司动态"],
      ["policy", "政策"],
    ];
    const date = raw.date || dateFallback;
    const per = 8;
    let linkNo = 0;
    const sections = DIMS.map(([id, label]) => {
      const items = raw.items
        .filter((i) => i.dimension === id)
        .slice(0, per)
        .map((item, idx) => {
          const hasLink = Boolean(item.sourceUrl);
          if (hasLink) linkNo += 1;
          return {
            n: idx + 1,
            linkNo: hasLink ? linkNo : null,
            headline: item.headline || item.sourceTitle || "",
            soWhat: item.soWhat || "",
            url: item.sourceUrl || "",
          };
        });
      return { id, label, items };
    });
    return {
      date,
      title: raw.title || "AI产业信息简报",
      disclaimer: raw.disclaimer || "研究备忘，不是投资建议。",
      updatedAt: new Date().toISOString(),
      sections,
    };
  }

  throw new Error("无法识别：需要含 sections 的速递 JSON，或雷达 daily-brief.json");
}

function readPayload() {
  const date = $("up-date").value || today();
  const text = $("up-json").value.trim();
  if (!text) throw new Error("请粘贴 JSON 或选择文件");
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (_) {
    throw new Error("JSON 解析失败");
  }
  return normalizeDoc(raw, date);
}

$("up-date").value = today();
$("sample-url").textContent = `${location.origin}${location.pathname.replace(/upload\.html$/, "index.html")}?d=${today()}`;

$("up-file").addEventListener("change", async () => {
  const f = $("up-file").files?.[0];
  if (!f) return;
  $("up-json").value = await f.text();
  const m = f.name.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) $("up-date").value = m[1];
});

$("btn-preview").addEventListener("click", () => {
  try {
    const doc = readPayload();
    setMsg(`校验通过：${doc.date}，四栏共 ${doc.sections.reduce((n, s) => n + s.items.length, 0)} 条`, true);
  } catch (e) {
    setMsg(String(e.message || e), false);
  }
});

$("btn-download").addEventListener("click", () => {
  try {
    const doc = readPayload();
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.date}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg(`已下载 ${doc.date}.json，可放进 digest-site/data/ 后部署`, true);
  } catch (e) {
    setMsg(String(e.message || e), false);
  }
});

$("btn-upload").addEventListener("click", async () => {
  try {
    const doc = readPayload();
    const token = $("up-token").value.trim();
    const res = await fetch("/api/digest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Digest-Token": token } : {}),
      },
      body: JSON.stringify(doc),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `上传失败（${res.status}）`);
    setMsg(`已保存 ${doc.date}。阅读原文可用：?d=${doc.date}`, true);
  } catch (e) {
    const msg = String(e.message || e);
    if (/Failed to fetch|NetworkError/i.test(msg)) {
      setMsg("当前不是可写入服务。请运行 node digest-site/server.js，或点「下载 JSON」后放入 data/ 再部署。", false);
      return;
    }
    setMsg(msg, false);
  }
});
