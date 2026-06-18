const shell = document.querySelector("#detail-shell");
const toast = document.querySelector("#toast");
let currentItem = null;

function initDetail() {
  const params = new URLSearchParams(window.location.search);
  const viewId = params.get("view") || "templates";
  const sectionId = params.get("section") || "";
  const itemId = params.get("id") || "";
  const view = VIEWS[viewId];
  const section = view?.sections.find((part) => part.id === sectionId);
  const entry = section?.items.find((itemEntry) => itemEntry.id === itemId);

  if (!view || !section || !entry) {
    shell.innerHTML = `
      <section class="detail-card-page">
        <a class="back-link" href="index.html">← 返回首页</a>
        <h1>未找到条目</h1>
        <p class="detail-page-desc">这个详情链接缺少有效参数，或条目已经被移动。</p>
      </section>
    `;
    return;
  }

  currentItem = entry;
  document.title = `${entry.name} - 工具详情`;
  shell.innerHTML = renderDetail(view, section, entry);

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });
}

function renderDetail(view, section, entry) {
  return `
    <section class="detail-card-page">
      <a class="back-link" href="index.html">← 返回首页</a>
      <div class="detail-hero">
        <span class="detail-page-icon ${entry.color}" aria-hidden="true">${escapeHtml(entry.icon)}</span>
        <div>
          <p class="detail-breadcrumb">${escapeHtml(view.label)} / ${escapeHtml(section.title)}</p>
          <h1>${escapeHtml(entry.name)}</h1>
          <p class="detail-page-desc">${escapeHtml(entry.description)}</p>
          <div class="detail-tags">
            ${entry.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      </div>

      <div class="detail-layout">
        <div class="detail-main">
          <h2>使用信息</h2>
          <dl class="detail-meta-grid">
            ${renderMeta(entry)}
          </dl>

          ${entry.prompt ? `
            <section class="prompt-preview detail-prompt">
              <div class="prompt-head">
                <strong>Prompt</strong>
                <button type="button" data-action="copy-prompt">复制</button>
              </div>
              <pre>${escapeHtml(entry.prompt)}</pre>
            </section>
          ` : ""}
        </div>

        <aside class="detail-side">
          <h2>操作</h2>
          <div class="detail-actions">
            ${renderActions(entry)}
          </div>
          <p class="drawer-note">${escapeHtml(entry.note)}</p>
        </aside>
      </div>
    </section>
  `;
}

function renderMeta(entry) {
  const rows = [
    ["类型", entry.type],
    ["输入", entry.input],
    ["输出", entry.output]
  ];
  if (entry.url) rows.push(["链接", entry.url]);
  if (entry.path) rows.push([entry.macPath ? "Win 路径" : "文件路径", entry.path]);
  if (entry.macPath) rows.push(["Mac 路径", entry.macPath]);
  return rows.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join("");
}

function renderActions(entry) {
  const actions = [];
  if (entry.fillTemplate) actions.push(`<button class="action" type="button" data-action="fill-template">进入填充</button>`);
  if (entry.prompt) actions.push(`<button class="action" type="button" data-action="copy-prompt">复制 Prompt</button>`);
  if (entry.url) actions.push(`<button class="action secondary" type="button" data-action="open-url">打开链接</button>`);
  if (entry.path || entry.macPath) actions.push(`<button class="action secondary" type="button" data-action="open-file">打开文件</button>`);
  if (!actions.length) actions.push(`<button class="action secondary" type="button" data-action="noop">查看说明</button>`);
  return actions.join("");
}

async function handleAction(action) {
  if (action === "fill-template" && currentItem.fillTemplate) {
    window.location.href = `fill.html?template=${encodeURIComponent(currentItem.fillTemplate)}`;
    return;
  }

  if (action === "copy-prompt") {
    if (!currentItem.prompt) return;
    try {
      await navigator.clipboard.writeText(currentItem.prompt);
      showToast("Prompt 已复制");
    } catch (_error) {
      showToast("当前浏览器限制剪贴板，请手动选中复制");
    }
    return;
  }

  if (action === "open-url" && currentItem.url) {
    window.open(currentItem.url, "_blank", "noopener,noreferrer");
    return;
  }

  if (action === "open-file") {
    showToast("本地路径可在后续补充安装包后启用");
    return;
  }

  showToast("暂无额外操作");
}

function showToast(message) {
  toast.textContent = message || "已完成";
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

initDetail();
