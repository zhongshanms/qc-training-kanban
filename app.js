/* app.js — 质检基础流程看板前端逻辑（纯客户端 SPA） */
(function () {
  "use strict";
  const D = window.QC_DATA;
  const view = document.getElementById("view");
  const verEl = document.getElementById("ver");

  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // 把单元格文本（含 \n）渲染为 <pre>；支持搜索高亮
  function cell(text, q) {
    let t = esc(text);
    if (q) {
      const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      t = t.replace(re, "<mark>$1</mark>");
    }
    return '<pre class="cell">' + t.replace(/\n/g, "<br>") + "</pre>";
  }

  function src(tag) {
    return tag ? '<span class="src">' + esc(tag) + "</span>" : "";
  }

  // ---- 渲染各 section 类型 ----
  function renderTable(s, q) {
    let rows = s.rows
      .map((r, i) => {
        const tds = r
          .map((c, ci) => "<td" + (ci === 0 ? ' class="num"' : "") + ">" + cell(c, q) + "</td>")
          .join("");
        return "<tr>" + tds + "</tr>";
      })
      .join("");
    const ths = s.headers
      .map((h, i) => "<th" + (i === 0 ? ' class="num"' : "") + ">" + esc(h) + "</th>")
      .join("");
    const cls = s.headers.length === 2 ? ' class="col2"' : "";
    return (
      '<section class="card"><div class="card-title"><h3>' +
      esc(s.title) + "</h3>" + src(s.source) +
      '</div>' + (s.note ? '<p class="note">' + esc(s.note) + "</p>" : "") +
      '<div class="table-wrap"><table' + cls + '><thead><tr>' + ths +
      '</tr></thead><tbody>' + rows + "</tbody></table></div></section>"
    );
  }

  function renderLogic(s, q) {
    const cards = s.examples
      .map((e) => {
        const isMaster = /通开/.test(e.label);
        const skus = e.vals
          .map((v) => '<span class="sku">' + cell(v, q) + "</span>")
          .join("");
        return (
          '<div class="logic-card ' + (isMaster ? "master" : "single") + '"><div class="lbl">' +
          esc(e.label) + '</div><div class="skus">' + skus + "</div></div>"
        );
      })
      .join("");
    const rules = s.rules
      .map((r) => "<li>" + cell(r, q) + "</li>")
      .join("");
    return (
      '<section class="card"><div class="card-title"><h3>' + esc(s.title) +
      "</h3>" + src(s.source) + '</div><div class="logic-grid">' + cards +
      '</div><div class="rules"><ol>' + rules + "</ol></div></section>"
    );
  }

  function renderCompare(s, q) {
    const rows = s.pairs
      .map((p) => {
        return (
          '<div class="row" style="display:contents">' +
          '<div class="item">' + esc(p.item) + "</div>" +
          '<div class="cell us">' + cell(p.us, q) + "</div>" +
          '<div class="cell eu">' + cell(p.eu, q) + "</div>" +
          "</div>"
        );
      })
      .join("");
    return (
      '<section class="card"><div class="card-title"><h3>' + esc(s.title) +
      "</h3>" + src(s.source) + '</div>' + (s.note ? '<p class="note">' + esc(s.note) + "</p>" : "") +
      '<div class="cmp"><div class="h"></div>' +
      '<div class="h"><span class="cmp-flag flag-us">🇺🇸 美国标准</span></div>' +
      '<div class="h"><span class="cmp-flag flag-eu">🇪🇺 欧洲标准</span></div>' +
      rows + "</div>" +
      (s.footer ? '<div class="footer-note">⚙️ ' + esc(s.footer) + "</div>" : "") +
      "</section>"
    );
  }

  function renderGrade(s) {
    const colors = { "关键缺陷": "", "主要缺陷": "main", "次要缺陷": "min" };
    const badges = { "关键缺陷": "b-crit", "主要缺陷": "b-main", "次要缺陷": "b-min" };
    const blocks = s.grades
      .map((g) => {
        const cls = colors[g.level] || "";
        return (
          '<div class="grade ' + cls + '"><h4><span class="badge ' +
          badges[g.level] + '">' + esc(g.level) + "</span></h4>" +
          '<div class="rate">📊 ' + esc(g.rate) + "</div>" +
          "<dl><dt>定义</dt><dd>" + esc(g.define) + "</dd>" +
          "<dt>快速判断</dt><dd>" + esc(g.quick) + "</dd>" +
          "<dt>具体表现</dt><dd>" + esc(g.detail) + "</dd></dl></div>"
        );
      })
      .join("");
    return (
      '<section class="card"><div class="card-title"><h3>' + esc(s.title) +
      "</h3>" + src(s.source) + "</div>" + blocks + "</section>"
    );
  }

  function renderDoc(s) {
    const blocks = s.doc
      .map((b) => {
        let inner = "";
        if (b.p) inner += "<p>" + esc(b.p) + "</p>";
        if (b.kv) {
          inner += '<div class="kv">' + b.kv.map((k) =>
            '<div class="k">' + esc(k[0]) + "</div><div>" + esc(k[1]) + "</div>").join("") + "</div>";
        }
        if (b.list) {
          inner += "<ul>" + b.list.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>";
        }
        if (b.table) {
          const cls = b.table.headers.length === 2 ? ' class="col2"' : "";
          const ths = b.table.headers.map((h) => "<th>" + esc(h) + "</th>").join("");
          const trs = b.table.rows.map((r) =>
            "<tr>" + r.map((c) => "<td>" + esc(c) + "</td>").join("") + "</tr>").join("");
          inner += '<div class="table-wrap"><table' + cls + '><thead><tr>' + ths +
            '</tr></thead><tbody>' + trs + "</tbody></table></div>";
        }
        const head = b.h
          ? '<h4>' + esc(b.h) + "</h4>"
          : b.sub ? '<h5>' + esc(b.sub) + "</h5>" : "";
        return '<div class="doc-block">' + head + inner + "</div>";
      })
      .join("");
    return (
      '<section class="card"><div class="card-title"><h3>' + esc(s.title) +
      "</h3>" + src(s.source) + "</div>" + blocks + "</section>"
    );
  }

  function renderSection(s, q) {
    switch (s.type) {
      case "table": return renderTable(s, q);
      case "logic": return renderLogic(s, q);
      case "compare": return renderCompare(s, q);
      case "grade": return renderGrade(s);
      case "doc": return renderDoc(s);
      default: return "";
    }
  }

  // ---- 页面 ----
  function categoryPage(key) {
    const cat = D[key];
    const html =
      '<div class="crumbs"><a href="#/home">首页</a> / ' + esc(cat.title) + "</div>" +
      '<div class="page-head"><h2>🛠️ ' + esc(cat.title) +
      '</h2><p>共 ' + cat.sections.length + " 个板块 · 内容依据内部 SOP 整理</p></div>" +
      cat.sections.map((s) => renderSection(s)).join("");
    view.innerHTML = html;
    document.title = cat.title + " · 质检基础流程看板";
  }

  function standardPage() { categoryPage("standard"); }

  function homePage() {
    const cats = [
      { key: "lock", ic: "🔒", desc: "基础质检8项 · 单开/通开识别" },
      { key: "light", ic: "💡", desc: "基础质检7项 · 欧美规区别 · 摔箱测试SOP" },
      { key: "track", ic: "🛤️", desc: "外观/尺寸/包装/功能/配件" },
      { key: "standard", ic: "📋", desc: "缺陷分级 · 异常处理 · 拍照标准" }
    ];
    const cards = cats
      .map((c) => {
        const cat = D[c.key];
        return (
          '<a class="cat-card" href="#/' + c.key + '"><span class="tag" style="background:' +
          cat.color + '"></span><span class="ic">' + c.ic + "</span><h3>" +
          esc(cat.title) + "</h3><p>" + esc(c.desc) + "</p></a>"
        );
      })
      .join("");
    const stats =
      '<div class="stat"><div class="n">8</div><div class="l">门锁质检项</div></div>' +
      '<div class="stat"><div class="n">7</div><div class="l">灯饰质检项</div></div>' +
      '<div class="stat"><div class="n">7</div><div class="l">欧美规对比项</div></div>' +
      '<div class="stat"><div class="n">9</div><div class="l">摔箱测试章节</div></div>' +
      '<div class="stat"><div class="n">5</div><div class="l">导轨质检项</div></div>' +
      '<div class="stat"><div class="n">3</div><div class="l">缺陷分级</div></div>';
    view.innerHTML =
      '<div class="hero"><p class="big">质检员培训学习看板</p><p class="lead">' +
      "按 <b>门锁 · 灯饰 · 导轨</b> 三大品类分类，附通用判定标准。所有内容直接来自内部 SOP，" +
      "可随时检索查阅，建议生产/质检现场参考使用。</p></div>" +
      '<div class="cat-grid">' + cards + "</div>" +
      '<div class="stat-row">' + stats + "</div>";
    document.title = "质检基础流程看板 · 门锁 / 灯饰 / 导轨";
  }

  // ---- 搜索（跨全部品类） ----
  function searchPage(q) {
    const ql = q.toLowerCase();
    const cats = [
      { key: "lock", ic: "🔒" },
      { key: "light", ic: "💡" },
      { key: "track", ic: "🛤️" },
      { key: "standard", ic: "📋" }
    ];
    let hits = [];
    cats.forEach((c) => {
      D[c.key].sections.forEach((s) => {
        const collect = (text, ctx) => {
          if (text && String(text).toLowerCase().includes(ql)) {
            hits.push({ cat: c, sec: s, ctx: ctx || s.title, text: String(text) });
          }
        };
        if (s.rows) s.rows.forEach((r) => r.forEach((x) => collect(x, s.title)));
        if (s.pairs) s.pairs.forEach((p) => { collect(p.us, p.item + "（美国）"); collect(p.eu, p.item + "（欧洲）"); collect(p.item, "对比项"); });
        if (s.examples) s.examples.forEach((e) => { e.vals.forEach((v) => collect(v, e.label)); collect(e.label, "标签"); });
        if (s.rules) s.rules.forEach((r) => collect(r, s.title + " 规则"));
        if (s.grades) s.grades.forEach((g) => { collect(g.define, g.level); collect(g.quick, g.level); collect(g.detail, g.level); collect(g.rate, g.level); });
        if (s.doc) s.doc.forEach((b) => { collect(b.p, b.h || b.sub); if (b.list) b.list.forEach((x) => collect(x, b.h || b.sub)); if (b.kv) b.kv.forEach((k) => { collect(k[1], k[0]); }); });
      });
    });
    let body;
    if (!hits.length) {
      body = '<div class="hero"><p class="big">🔍 没有找到 “' + esc(q) + '”</p><p class="lead">试试：单开、通开、摔箱、关键缺陷、CE、UL、卡顿、电镀 ……</p></div>';
    } else {
      body =
        '<div class="crumbs"><a href="#/home">首页</a> / 搜索结果</div>' +
        '<div class="page-head"><h2>🔍 “' + esc(q) + '” 的搜索结果</h2><p>共 ' + hits.length + " 条命中，已跨全部品类检索</p></div>" +
        hits.slice(0, 80)
          .map((h) => {
            const t = esc(h.text).replace(/\n/g, "<br>");
            const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
            const hi = t.replace(re, "<mark>$1</mark>");
            return (
              '<a class="cat-card" href="#/' + h.cat.key + '" style="margin-bottom:14px"><span class="ic" style="font-size:22px">' +
              h.cat.ic + "</span><h3 style=\"font-size:14px\">" + esc(h.ctx) + "</h3><p>" +
              hi + "</p></a>"
            );
          })
          .join("");
    }
    view.innerHTML = body;
    document.title = "搜索：" + q + " · 质检基础流程看板";
  }

  // ---- 路由 ----
  const routes = { home: homePage, lock: categoryPage, light: categoryPage, track: categoryPage, standard: standardPage };
  function router() {
    const hash = location.hash.replace(/^#\/?/, "");
    const q = document.getElementById("searchBox").value.trim();
    // 高亮 tab
    document.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.route === hash));
    if (q && hash !== "search") {
      // 保留搜索框内容但不强制搜索页
    }
    if (hash === "search") {
      searchPage(q);
      return;
    }
    const fn = routes[hash];
    if (fn) {
      if (hash === "home") fn();
      else fn(hash);
    } else {
      location.hash = "#/home";
    }
    window.scrollTo(0, 0);
  }

  // 搜索框：回车跳转搜索页，清空回首页
  const box = document.getElementById("searchBox");
  box.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = box.value.trim();
      if (v) { location.hash = "#/search"; router(); }
    }
  });
  box.addEventListener("input", () => {
    if (!box.value.trim() && location.hash.replace(/^#\/?/, "") === "search") {
      location.hash = "#/home";
    }
  });

  if (verEl) verEl.textContent = "· " + D.meta.version;
  window.addEventListener("hashchange", router);
  if (!location.hash) location.hash = "#/home";
  router();
})();
