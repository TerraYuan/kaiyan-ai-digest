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

function qsWeek() {
  const u = new URL(location.href);
  return u.searchParams.get("w") || "";
}

function setQsDate(date) {
  const u = new URL(location.href);
  u.searchParams.delete("w");
  u.searchParams.set("d", date);
  history.replaceState(null, "", u.toString());
}

function setQsWeek(week) {
  const u = new URL(location.href);
  u.searchParams.delete("d");
  u.searchParams.delete("date");
  u.searchParams.set("w", week);
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

async function loadWeek(endDate) {
  const res = await fetch(`data/week-${endDate}.json?_=${Date.now()}`);
  if (!res.ok) throw new Error(`没有截至 ${endDate} 的周报`);
  return res.json();
}

function renderDigest(doc) {
  const sections = (doc.sections || [])
    .filter((sec) => (sec.items || []).length)
    .map((sec) => {
      const items = sec.items || [];
      const body = items.length
        ? items
            .map((it) => {
              const mark = it.linkNo != null ? `<span class="mark"> [${it.linkNo}]</span>` : "";
              const when = it.date ? `<span class="when">${esc(String(it.date).slice(5))}</span>` : "";
              const title = it.url
                ? `<a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.n)}. ${esc(it.headline)}</a>${when}${mark}`
                : `<strong>${esc(it.n)}. ${esc(it.headline)}</strong>${when}`;
              const so = it.soWhat ? `<p class="so">${esc(it.soWhat)}</p>` : "";
              return `<article class="item">${title}${so}</article>`;
            })
            .join("")
        : `<p class="empty">${doc.kind === "week" ? "本周无条目" : "本日无条目"}</p>`;
      return `<section class="section"><div class="section-h">${esc(sec.label)}</div>${body}</section>`;
    })
    .join("");

  $("content").innerHTML = sections || `<p class="empty">这一天没有条目</p>`;
  const titleEl = $("hero-title");
  const sub = $("hero-sub");
  if (doc.kind === "week") {
    document.title = `AI产业要闻周报｜${doc.startDate || ""}–${doc.endDate || ""}`;
    if (titleEl) titleEl.textContent = "AI产业要闻周报";
    const eyebrow = $("eyebrow");
    if (eyebrow) eyebrow.hidden = true;
    if (sub) {
      sub.textContent = doc.source === "search"
        ? `${doc.startDate}–${doc.endDate} · 自动检索近 7 日 · 精选 ${doc.itemCount || 0} 条。标题可打开原文。`
        : `${doc.startDate}–${doc.endDate} · 精选 ${doc.itemCount || 0} 条 · 存档 ${doc.archiveDays || 0} 天。标题可打开原文。`;
    }
    return;
  }
  document.title = `要闻速递｜${doc.date || ""}`;
  if (titleEl) titleEl.textContent = "要闻速递";
  const eyebrowDaily = $("eyebrow");
  if (eyebrowDaily) eyebrowDaily.hidden = false;
  const until = doc.searchedUntil || "";
  if (sub) {
    sub.textContent = until
      ? `要闻检索截至 ${until} · 按日期查阅 AI 产业精选；公众号文末「阅读原文」可直达当日链接。`
      : "按日期查阅 AI 产业精选；公众号文末「阅读原文」可直达当日链接。";
  }
}

function fillWeekList(weeks, current) {
  const sel = $("week-list");
  if (!sel) return;
  sel.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = weeks.length ? "选择周报" : "暂无周报";
  sel.appendChild(placeholder);
  for (const w of weeks) {
    const opt = document.createElement("option");
    opt.value = w;
    opt.textContent = `截至 ${w}`;
    if (w === current) opt.selected = true;
    sel.appendChild(opt);
  }
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
  const status = $("status");
  status.hidden = true;
  status.textContent = "";
  $("date-pick").value = date;
  if ($("week-list")) $("week-list").value = "";
  fillDateList(dates, date);
  setQsDate(date);
  try {
    const doc = await loadDigest(date);
    renderDigest(doc);
  } catch (e) {
    $("content").innerHTML = `<p class="empty">${esc(e.message || e)}</p>`;
  }
}

async function showWeek(week, weeks) {
  const status = $("status");
  status.hidden = true;
  status.textContent = "";
  fillWeekList(weeks, week);
  if ($("date-pick")) $("date-pick").value = "";
  setQsWeek(week);
  try {
    const doc = await loadWeek(week);
    renderDigest(doc);
  } catch (e) {
    $("content").innerHTML = `<p class="empty">${esc(e.message || e)}</p>`;
  }
}

async function boot() {
  let index = { dates: [], latest: "", weeks: [] };
  try {
    index = await loadIndex();
  } catch (_) {
    $("status").textContent = "尚未有存档，请先上传或由管道发布。";
  }
  const dates = index.dates || [];
  const weeks = index.weeks || [];
  const weekWanted = qsWeek();
  fillWeekList(weeks, weekWanted);
  fillDateList(dates, "");
  $("week-list").addEventListener("change", () => {
    const w = $("week-list").value;
    if (w) showWeek(w, weeks);
  });
  $("date-pick").addEventListener("change", () => {
    const d = $("date-pick").value;
    if (d) showDate(d, dates.includes(d) ? dates : [d, ...dates].filter(Boolean));
  });
  $("date-list").addEventListener("change", () => {
    const d = $("date-list").value;
    if (d) showDate(d, dates);
  });
  if (weekWanted) {
    await showWeek(weekWanted, weeks);
    return;
  }
  if (!qsDate() && (index.latestWeek || weeks[0])) {
    await showWeek(index.latestWeek || weeks[0], weeks);
    return;
  }
  const wanted = qsDate() || index.latest || dates[0] || "";
  if (wanted) await showDate(wanted, dates);
  else $("content").innerHTML = `<p class="empty">暂无速递。请打开「上传 / 更新某日速递」。</p>`;
}

boot();
