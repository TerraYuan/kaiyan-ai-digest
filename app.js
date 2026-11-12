const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function qsDate() {
  const u = new URL(location.href);
  return u.searchParams.get("d") || u.searchParams.get("date") || "";
}

function setQsDate(date) {
  const u = new URL(location.href);
  u.searchParams.set("d", date);
  history.replaceState(null, "", u.toString());
}

async function loadIndex() {
  const res = await fetch(`data/index.json?_=${Date.now()}`);
  if (!res.ok) throw new Error("无法读取日期目录");
  return res.json();
}

async function loadDigest(date) {
  const res = await fetch(`data/${date}.json?_=${Date.now()}`);
  if (!res.ok) throw new Error(`没有 ${date} 的速递`);
  return res.json();
}

function renderDigest(doc) {
  const sections = (doc.sections || [])
    .map((sec) => {
      const items = sec.items || [];
      const body = items.length
        ? items
            .map((it) => {
              const mark = it.linkNo != null ? `<span class="mark"> [${it.linkNo}]</span>` : "";
              const title = it.url
                ? `<a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.n)}. ${esc(it.headline)}</a>${mark}`
                : `<strong>${esc(it.n)}. ${esc(it.headline)}</strong>`;
              const so = it.soWhat ? `<p class="so">${esc(it.soWhat)}</p>` : "";
              return `<article class="item">${title}${so}</article>`;
            })
            .join("")
        : `<p class="empty">本日无条目</p>`;
      return `<section class="section"><div class="section-h">${esc(sec.label)}</div>${body}</section>`;
    })
    .join("");

  $("content").innerHTML = sections;
  document.title = `要闻速递｜${doc.date || ""}`;
}

function fillDateList(dates, current) {
  const sel = $("date-list");
  sel.innerHTML = "";
  const opts = dates.length ? dates : current ? [current] : [];
  for (const d of opts) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    if (d === current) opt.selected = true;
    sel.appendChild(opt);
  }
}

async function showDate(date, dates) {
  $("status").textContent = "加载中…";
  $("date-pick").value = date;
  fillDateList(dates, date);
  setQsDate(date);
  try {
    const doc = await loadDigest(date);
    renderDigest(doc);
    $("status").textContent = doc.updatedAt
      ? `更新于 ${new Date(doc.updatedAt).toLocaleString("zh-CN")}`
      : "";
  } catch (e) {
    $("content").innerHTML = `<p class="empty">${esc(e.message || e)}</p>`;
    $("status").textContent = "";
  }
}

async function boot() {
  let index = { dates: [], latest: "" };
  try {
    index = await loadIndex();
  } catch (_) {
    $("status").textContent = "尚未有存档，请先上传或由管道发布。";
  }
  const dates = index.dates || [];
  const wanted = qsDate() || index.latest || dates[0] || "";
  $("date-pick").addEventListener("change", () => {
    const d = $("date-pick").value;
    if (d) showDate(d, dates.includes(d) ? dates : [d, ...dates].filter(Boolean));
  });
  $("date-list").addEventListener("change", () => {
    const d = $("date-list").value;
    if (d) showDate(d, dates);
  });
  if (wanted) await showDate(wanted, dates);
  else $("content").innerHTML = `<p class="empty">暂无速递。请打开「上传 / 更新某日速递」。</p>`;
}

boot();
