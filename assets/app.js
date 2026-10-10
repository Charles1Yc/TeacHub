const requestedView = new URLSearchParams(window.location.search).get("view");
let activeView = Object.hasOwn(VIEWS, requestedView) ? requestedView : "templates";
let searchText = "";

const content = document.querySelector("#content");
const anchorList = document.querySelector("#anchor-list");
const anchorTitle = document.querySelector("#anchor-title");
const searchInput = document.querySelector("#search-input");

function render() {
  const view = VIEWS[activeView];
  anchorTitle.textContent = view.label;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === activeView);
  });

  const sections = getFilteredSections(view.sections);
  renderAnchors(sections);
  renderSections(sections);
}

function getFilteredSections(sections) {
  if (!searchText) return sections;
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((entry) => {
        const text = [entry.name, entry.description, section.title, ...entry.tags].join(" ").toLowerCase();
        return text.includes(searchText);
      })
    }))
    .filter((section) => section.items.length);
}

function renderAnchors(sections) {
  anchorList.innerHTML = [
    `<a class="anchor-link is-active" href="#top" data-anchor="top">全部</a>`,
    ...sections.map((section) => (
      `<a class="anchor-link" href="#${section.id}" data-anchor="${section.id}">${escapeHtml(section.title)}</a>`
    ))
  ].join("");

  anchorList.querySelectorAll(".anchor-link").forEach((link) => {
    link.addEventListener("click", () => setActiveAnchor(link.dataset.anchor));
  });
}

function renderSections(sections) {
  if (!sections.length) {
    content.innerHTML = `<div class="empty-state">没有匹配的工具或模板</div>`;
    return;
  }

  content.innerHTML = `<span id="top"></span>` + sections.map((section) => `
    <section class="section" id="${section.id}">
      <div class="section-head">
        <h2 class="section-title">${escapeHtml(section.title)}</h2>
        <span class="section-count">${section.items.length} 项</span>
      </div>
      <div class="tool-grid">
        ${section.items.map((entry) => renderCard(entry, section.id)).join("")}
      </div>
    </section>
  `).join("");

  content.querySelectorAll(".tool-card").forEach((card) => {
    card.addEventListener("click", () => handleCardClick(card.dataset.section, card.dataset.id));
  });
}

function renderCard(entry, sectionId) {
  return `
    <button class="tool-card" type="button" data-id="${entry.id}" data-section="${sectionId}">
      <span class="tool-icon ${entry.color}" aria-hidden="true">${escapeHtml(entry.icon)}</span>
      <h3 class="tool-name">${escapeHtml(entry.name)}</h3>
      <p class="tool-desc">${escapeHtml(entry.description)}</p>
      <span class="tool-tags">
        ${entry.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </span>
    </button>
  `;
}

function handleCardClick(sectionId, itemId) {
  const section = VIEWS[activeView].sections.find((part) => part.id === sectionId);
  const entry = section.items.find((itemEntry) => itemEntry.id === itemId);
  if (isExternalUrl(entry.url)) {
    window.open(entry.url, "_blank", "noopener,noreferrer");
    return;
  }

  if (entry.fillTemplate) {
    window.location.href = `fill.html?template=${encodeURIComponent(entry.fillTemplate)}`;
    return;
  }

  if (entry.id === "subject-quality-analysis") {
    window.location.href = entry.path;
    return;
  }

  const params = new URLSearchParams({
    view: activeView,
    section: sectionId,
    id: itemId
  });
  window.location.href = `detail.html?${params.toString()}`;
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

function updateActiveAnchor() {
  const sections = Array.from(document.querySelectorAll(".section"));
  if (!sections.length) {
    setActiveAnchor("top");
    return;
  }

  if (window.scrollY < 24) {
    setActiveAnchor("top");
    return;
  }

  const targetLine = window.innerHeight * 0.42;
  let active = sections[0].id;
  let smallestDistance = Number.POSITIVE_INFINITY;

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const sectionMid = rect.top + rect.height / 2;
    const distance = Math.abs(sectionMid - targetLine);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      active = section.id;
    }
  });

  setActiveAnchor(active);
}

function setActiveAnchor(active) {
  anchorList.querySelectorAll(".anchor-link").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.anchor === active);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeView = tab.dataset.view;
    const url = new URL(window.location.href);
    url.searchParams.set("view", activeView);
    window.history.replaceState(null, "", url);
    searchInput.value = "";
    searchText = "";
    render();
    content.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

searchInput.addEventListener("input", (event) => {
  searchText = event.target.value.trim().toLowerCase();
  render();
});

window.addEventListener("scroll", updateActiveAnchor, { passive: true });

render();
