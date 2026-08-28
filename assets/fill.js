const state = {
  templateId: new URLSearchParams(window.location.search).get("template") || "lesson-plan",
  parsedItems: [],
  selectedImages: []
};

const els = {
  select: document.querySelector("#template-select"),
  title: document.querySelector("#template-title"),
  type: document.querySelector("#template-type"),
  icon: document.querySelector("#template-icon"),
  prompt: document.querySelector("#prompt-text"),
  jsonInput: document.querySelector("#json-input"),
  imagePanel: document.querySelector("#image-panel"),
  imageInput: document.querySelector("#image-input"),
  imageList: document.querySelector("#image-list"),
  log: document.querySelector("#log-box"),
  toast: document.querySelector("#toast")
};

const WEEKLY_BRIEF_BASE_IMAGE = "assets/generated/weekly-brief-reference.pptx.png";

function initFill() {
  els.select.innerHTML = Object.values(TEMPLATE_REGISTRY)
    .map((cfg) => `<option value="${cfg.id}">${escapeHtml(cfg.name)}</option>`)
    .join("");
  if (!TEMPLATE_REGISTRY[state.templateId]) state.templateId = "lesson-plan";
  els.select.value = state.templateId;
  els.select.addEventListener("change", () => {
    state.templateId = els.select.value;
    window.history.replaceState(null, "", `fill.html?template=${encodeURIComponent(state.templateId)}`);
    renderTemplate();
  });

  document.querySelector("#copy-prompt").addEventListener("click", copyPrompt);
  document.querySelector("#load-sample").addEventListener("click", loadSample);
  document.querySelector("#validate-json").addEventListener("click", validateJson);
  document.querySelector("#clear-json").addEventListener("click", clearJsonInput);
  document.querySelector("#generate-file").addEventListener("click", generateFile);
  els.imageInput.addEventListener("change", () => {
    addImageFiles(els.imageInput.files);
    els.imageInput.value = "";
  });
  els.imageList.addEventListener("click", handleImageListClick);
  els.imagePanel.addEventListener("dragover", handleImageDragOver);
  els.imagePanel.addEventListener("dragleave", handleImageDragLeave);
  els.imagePanel.addEventListener("drop", handleImageDrop);
  renderTemplate();
}

function getConfig() {
  return TEMPLATE_REGISTRY[state.templateId];
}

function getAsset() {
  return TEMPLATE_ASSETS[getConfig().assetKey];
}

function renderTemplate() {
  const cfg = getConfig();
  const asset = getAsset();
  els.title.textContent = cfg.name;
  els.type.textContent = `${cfg.templateType} 模板`;
  els.icon.textContent = cfg.ext === "xlsx" ? "XL" : "LP";
  els.icon.className = `tool-icon ${cfg.ext === "xlsx" ? "green" : "blue"}`;
  if (cfg.mode === "summary-docx") {
    els.icon.textContent = "总";
    els.icon.className = "tool-icon orange";
  } else if (cfg.mode === "brief-png") {
    els.icon.textContent = "报";
    els.icon.className = "tool-icon red";
  }
  els.prompt.textContent = asset.prompt;
  els.jsonInput.value = "";
  els.imageInput.value = "";
  state.selectedImages = [];
  els.imagePanel.hidden = !cfg.requiresImages;
  updateImageList();
  state.parsedItems = [];
  log(`复制 Prompt，打开 AI 工具生成 JSON，再粘贴到右侧生成文件。`);
}

function addImageFiles(fileList) {
  const incoming = Array.from(fileList || []).filter((file) => {
    return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name || "");
  });
  if (!incoming.length) {
    updateImageList();
    return;
  }

  const cfg = getConfig();
  const maxImages = cfg.mode === "brief-png" ? 6 : Number.POSITIVE_INFINITY;
  const available = maxImages - state.selectedImages.length;
  state.selectedImages.push(...incoming.slice(0, available));
  if (incoming.length > available) showToast("周工作简报最多添加 6 张图片");
  updateImageList();
}

function updateImageList() {
  const files = state.selectedImages;
  if (!files.length) {
    const hint = getConfig().mode === "brief-png" ? "周工作简报需添加 2-6 张图片。" : "尚未选择图片。";
    els.imageList.innerHTML = `<span class="muted-text">${hint}</span>`;
    return;
  }
  els.imageList.innerHTML = `
    <div class="image-list-head">
      <span>已添加 ${files.length} 张图片</span>
      <button type="button" data-image-action="clear">清空</button>
    </div>
    <div class="image-chip-grid">
      ${files.map((file, index) => `
        <span class="image-chip">
          <span>${index + 1}. ${escapeHtml(file.name)}</span>
          <button type="button" aria-label="移除 ${escapeHtml(file.name)}" data-image-action="remove" data-image-index="${index}">×</button>
        </span>
      `).join("")}
    </div>
  `;
}

function handleImageListClick(event) {
  const button = event.target.closest("button[data-image-action]");
  if (!button) return;
  if (button.dataset.imageAction === "clear") {
    state.selectedImages = [];
  } else if (button.dataset.imageAction === "remove") {
    state.selectedImages.splice(Number(button.dataset.imageIndex), 1);
  }
  updateImageList();
}

function handleImageDragOver(event) {
  if (!getConfig().requiresImages) return;
  event.preventDefault();
  els.imagePanel.classList.add("is-dragging");
}

function handleImageDragLeave() {
  els.imagePanel.classList.remove("is-dragging");
}

function handleImageDrop(event) {
  if (!getConfig().requiresImages) return;
  event.preventDefault();
  els.imagePanel.classList.remove("is-dragging");
  addImageFiles(event.dataTransfer?.files);
}

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(getAsset().prompt);
    showToast("Prompt 已复制");
  } catch (_error) {
    showToast("当前浏览器限制剪贴板，请手动选中复制");
  }
}

function loadSample() {
  els.jsonInput.value = JSON.stringify(getConfig().sample, null, 2);
  validateJson();
}

function clearJsonInput() {
  els.jsonInput.value = "";
  state.parsedItems = [];
  log("JSON 内容已清空。");
  showToast("JSON 已清空");
  els.jsonInput.focus();
}

function validateJson() {
  try {
    state.parsedItems = parseInputJson();
    const first = state.parsedItems[0] || {};
    const missing = getMissingKeys(first);
    const lines = [
      `JSON 有效：${state.parsedItems.length} 条记录。`,
      missing.length ? `首条记录缺少字段，将自动补空：${missing.join(", ")}` : "首条记录字段完整。"
    ];
    log(lines.join("\n"));
    return true;
  } catch (error) {
    state.parsedItems = [];
    log(`JSON 错误：${error.message}`, true);
    return false;
  }
}

function parseInputJson() {
  const raw = els.jsonInput.value.trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!raw) throw new Error("请输入 JSON。");
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : [parsed];
  if (!items.length) throw new Error("数组不能为空。");
  if (items.some((item) => !item || typeof item !== "object" || Array.isArray(item))) {
    throw new Error("JSON 必须是对象，或对象数组。");
  }
  const normalised = items.map((item) => normaliseItem(item, getConfig()));
  if (getConfig().id === "course-syllabus" && normalised.some((item) => !item.teaching_plan.length)) {
    throw new Error("课程大纲至少需要提供 1 条 teaching_plan。");
  }
  return normalised;
}

function normaliseItem(item, cfg) {
  const output = { ...item };
  cfg.stringKeys.forEach((key) => {
    if (output[key] === undefined || output[key] === null) output[key] = " ";
    if (Array.isArray(output[key])) output[key] = output[key].join("\n");
    output[key] = String(output[key]);
  });
  cfg.listKeys.forEach((key) => {
    if (!Array.isArray(output[key])) output[key] = [];
    output[key] = output[key].map((value) => String(value));
  });
  Object.entries(cfg.dictListKeys || {}).forEach(([key, subKeys]) => {
    if (!Array.isArray(output[key])) output[key] = [];
    output[key] = output[key].map((entry) => {
      const safeEntry = entry && typeof entry === "object" && !Array.isArray(entry) ? { ...entry } : {};
      subKeys.forEach((subKey) => {
        if (safeEntry[subKey] === undefined || safeEntry[subKey] === null) safeEntry[subKey] = " ";
        safeEntry[subKey] = String(safeEntry[subKey]);
      });
      return safeEntry;
    });
  });
  if (cfg.id === "course-syllabus" && !output.teaching_plan.length) {
    output.teaching_plan = getLegacyTeachingPlan(output);
  }
  if (!Array.isArray(output.selected_6cs_indices)) output.selected_6cs_indices = [];
  output.cs_display = buildCsDisplay(output.selected_6cs_indices);
  return output;
}

function getLegacyTeachingPlan(data) {
  const plan = [];
  for (let week = 1; week <= 20; week += 1) {
    const topic = data[`topic${week}`];
    const keyContent = data[`key_content${week}`];
    const keyObjectives = data[`key_objectives${week}`];
    if ([topic, keyContent, keyObjectives].some((value) => String(value || "").trim())) {
      plan.push({
        topic: String(topic || " "),
        key_content: String(keyContent || " "),
        key_objectives: String(keyObjectives || " ")
      });
    }
  }
  return plan;
}

function getMissingKeys(item) {
  const cfg = getConfig();
  return [...cfg.stringKeys, ...cfg.listKeys, ...Object.keys(cfg.dictListKeys || {})].filter((key) => item[key] === undefined);
}

function buildCsDisplay(indices) {
  const selected = new Set(indices.map((value) => Number(value)));
  return SIX_CS.map((label, index) => selected.has(index + 1) ? `* ${label}` : label).join("\n");
}

async function generateFile() {
  if (!validateJson()) return;
  const cfg = getConfig();
  const images = await readSelectedImages();
  if (cfg.requiresImages && !images.length) {
    log("请先添加至少一张图片。", true);
    return;
  }
  if (cfg.mode === "brief-png" && (images.length < 2 || images.length > 6)) {
    log("周工作简报需要添加 2-6 张图片。", true);
    return;
  }
  log(`正在生成 ${state.parsedItems.length} 个文件...`);

  try {
    const rendered = [];
    for (let index = 0; index < state.parsedItems.length; index += 1) {
      const data = state.parsedItems[index];
      let blob;
      if (cfg.mode === "summary-docx") {
        blob = await renderClubSummaryDocx(data, images);
      } else if (cfg.mode === "brief-png") {
        blob = await renderWeeklyBriefPng(data, images);
      } else if (cfg.ext === "docx") {
        blob = await renderDocx(data);
      } else {
        blob = await renderXlsx(data);
      }
      rendered.push({
        blob,
        name: buildFileName(cfg, data, index + 1)
      });
    }

    if (rendered.length === 1) {
      downloadBlob(rendered[0].blob, rendered[0].name);
      log(`已生成：${rendered[0].name}`);
      return;
    }

    const zip = new JSZip();
    rendered.forEach((file) => zip.file(file.name, file.blob));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipName = `${sanitizeFileName(cfg.defaultPrefix)}-${dateStamp()}.zip`;
    downloadBlob(zipBlob, zipName);
    log(`已生成批量压缩包：${zipName}`);
  } catch (error) {
    log(`生成失败：${error.message}`, true);
  }
}

async function renderDocx(data) {
  const zip = await JSZip.loadAsync(base64ToUint8Array(getAsset().templateBase64));
  const xmlPaths = Object.keys(zip.files)
    .filter((path) => path.startsWith("word/") && path.endsWith(".xml"));

  for (const path of xmlPaths) {
    const xml = await zip.file(path).async("string");
    zip.file(path, renderWordXml(xml, data));
  }

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });
}

async function renderXlsx(data) {
  const zip = await JSZip.loadAsync(base64ToUint8Array(getAsset().templateBase64));
  const path = "xl/sharedStrings.xml";
  const xml = await zip.file(path).async("string");
  zip.file(path, renderSharedStringsXml(xml, data));

  if (getConfig().id === "course-syllabus") {
    const sheetPath = "xl/worksheets/sheet1.xml";
    const sheetXml = await zip.file(sheetPath).async("string");
    zip.file(sheetPath, renderCourseSyllabusSheetXml(sheetXml, data));
  }

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

function renderCourseSyllabusSheetXml(xml, data) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) return xml;

  const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const sheetData = doc.getElementsByTagName("sheetData")[0];
  const rows = Array.from(sheetData.getElementsByTagName("row"));
  const formatSource = rows.find((row) => Number(row.getAttribute("r")) === 18);
  if (!formatSource) return xml;

  rows
    .filter((row) => Number(row.getAttribute("r")) >= 18)
    .forEach((row) => row.remove());

  data.teaching_plan.forEach((entry, index) => {
    const rowNumber = 18 + index;
    sheetData.appendChild(createCoursePlanRow(doc, ns, formatSource, rowNumber, index + 1, entry));
  });

  const lastRow = 17 + data.teaching_plan.length;
  const dimension = doc.getElementsByTagName("dimension")[0];
  if (dimension) dimension.setAttribute("ref", `A1:F${lastRow}`);
  updateCoursePlanMerges(doc, ns, lastRow);

  return new XMLSerializer().serializeToString(doc);
}

function createCoursePlanRow(doc, ns, formatSource, rowNumber, weekNumber, entry) {
  const row = formatSource.cloneNode(false);
  row.setAttribute("r", String(rowNumber));
  row.setAttribute("spans", "1:6");

  row.appendChild(createCoursePlanCell(doc, ns, `A${rowNumber}`, "5", weekNumber));
  row.appendChild(createCoursePlanCell(doc, ns, `B${rowNumber}`, "6", entry.topic));
  row.appendChild(createCoursePlanCell(doc, ns, `C${rowNumber}`, "6", entry.key_content));
  row.appendChild(createCoursePlanCell(doc, ns, `D${rowNumber}`, "21", entry.key_objectives));
  row.appendChild(createCoursePlanCell(doc, ns, `E${rowNumber}`, "21"));
  row.appendChild(createCoursePlanCell(doc, ns, `F${rowNumber}`, "21"));
  return row;
}

function createCoursePlanCell(doc, ns, reference, style, value) {
  const cell = doc.createElementNS(ns, "c");
  cell.setAttribute("r", reference);
  cell.setAttribute("s", style);
  if (value === undefined) return cell;

  if (typeof value === "number") {
    const number = doc.createElementNS(ns, "v");
    number.textContent = String(value);
    cell.appendChild(number);
    return cell;
  }

  cell.setAttribute("t", "inlineStr");
  const inline = doc.createElementNS(ns, "is");
  const text = doc.createElementNS(ns, "t");
  text.setAttribute("xml:space", "preserve");
  text.textContent = String(value || " ");
  inline.appendChild(text);
  cell.appendChild(inline);
  return cell;
}

function updateCoursePlanMerges(doc, ns, lastRow) {
  const mergeCells = doc.getElementsByTagName("mergeCells")[0];
  if (!mergeCells) return;

  Array.from(mergeCells.getElementsByTagName("mergeCell"))
    .filter((merge) => /^D(?:1[89]|[2-9][0-9]):F(?:1[89]|[2-9][0-9])$/.test(merge.getAttribute("ref") || ""))
    .forEach((merge) => merge.remove());

  for (let row = 18; row <= lastRow; row += 1) {
    const merge = doc.createElementNS(ns, "mergeCell");
    merge.setAttribute("ref", `D${row}:F${row}`);
    mergeCells.appendChild(merge);
  }
  mergeCells.setAttribute("count", String(mergeCells.getElementsByTagName("mergeCell").length));
}

function renderWordXml(xml, data) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) return xml;
  renderWordTableRows(doc, data);
  renderWordPlaceholdersInNode(doc, doc, data);

  return new XMLSerializer().serializeToString(doc);
}

function renderWordTableRows(doc, data) {
  const markerRows = Array.from(doc.getElementsByTagName("w:tr"))
    .map((row) => {
      const match = getNodeText(row).match(/{%tr for ([a-zA-Z]+) in ([a-zA-Z0-9_]+) %}/);
      return match ? { row, alias: match[1], key: match[2] } : null;
    })
    .filter(Boolean);

  markerRows.forEach(({ row, alias, key }) => {
    if (!row.parentNode) return;
    const table = row.parentNode;
    const templateRows = [];
    let endRow = null;
    let current = row.nextSibling;

    while (current) {
      const next = current.nextSibling;
      if (current.nodeType === Node.ELEMENT_NODE && current.nodeName === "w:tr") {
        if (getNodeText(current).includes("{%tr endfor %}")) {
          endRow = current;
          break;
        }
        templateRows.push(current);
      }
      current = next;
    }

    if (!endRow) return;
    const rows = Array.isArray(data[key]) ? data[key] : [];
    rows.forEach((entry) => {
      templateRows.forEach((templateRow) => {
        const clone = templateRow.cloneNode(true);
        renderWordPlaceholdersInNode(doc, clone, { ...data, [alias]: entry });
        table.insertBefore(clone, row);
      });
    });

    let removable = row;
    while (removable) {
      const next = removable.nextSibling;
      table.removeChild(removable);
      if (removable === endRow) break;
      removable = next;
    }
  });
}

function renderWordPlaceholdersInNode(doc, node, data) {
  const paragraphs = Array.from(node.getElementsByTagName("w:p"));
  paragraphs.forEach((paragraph) => {
    const textNodes = Array.from(paragraph.getElementsByTagName("w:t"));
    if (!textNodes.length) return;
    const raw = textNodes.map((textNode) => textNode.textContent).join("");
    if (!raw.includes("{{") && !raw.includes("{%")) return;
    replaceParagraphText(doc, paragraph, renderTemplateText(raw, data));
  });
}

function getNodeText(node) {
  return Array.from(node.getElementsByTagName("w:t"))
    .map((textNode) => textNode.textContent)
    .join("");
}

function replaceParagraphText(doc, paragraph, text) {
  const wNs = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const firstRunPr = paragraph.getElementsByTagName("w:rPr")[0]?.cloneNode(true);
  Array.from(paragraph.childNodes).forEach((child) => {
    if (child.nodeName !== "w:pPr") paragraph.removeChild(child);
  });

  const run = doc.createElementNS(wNs, "w:r");
  if (firstRunPr) run.appendChild(firstRunPr);
  String(text || " ").split(/\n/).forEach((line, index) => {
    if (index > 0) run.appendChild(doc.createElementNS(wNs, "w:br"));
    const t = doc.createElementNS(wNs, "w:t");
    t.setAttribute("xml:space", "preserve");
    t.textContent = line || "";
    run.appendChild(t);
  });
  paragraph.appendChild(run);
}

function renderSharedStringsXml(xml, data) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) return xml;
  const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const strings = Array.from(doc.getElementsByTagName("si"));

  strings.forEach((si) => {
    const textNodes = Array.from(si.getElementsByTagName("t"));
    if (!textNodes.length) return;
    const raw = textNodes.map((node) => node.textContent).join("");
    if (!raw.includes("{{") && !raw.includes("{%")) return;
    while (si.firstChild) si.removeChild(si.firstChild);
    const t = doc.createElementNS(ns, "t");
    t.setAttribute("xml:space", "preserve");
    t.textContent = renderTemplateText(raw, data);
    si.appendChild(t);
  });

  return new XMLSerializer().serializeToString(doc);
}

function renderTemplateText(source, data, options = {}) {
  const formatValue = (value) => {
    if (Array.isArray(value)) {
      const text = value.join("\n");
      return options.escapeValues ? escapeXml(text) : text;
    }
    if (value === undefined || value === null) return " ";
    const text = String(value);
    return options.escapeValues ? escapeXml(text) : text;
  };
  let out = source;
  out = out.replace(/{%\s*if\s+school_type\s*==\s*['"]([^'"]+)['"]\s*%}([\s\S]*?)(?:{%\s*else\s*%}([\s\S]*?))?{%\s*endif\s*%}/g, (_match, expected, yesBlock, noBlock = "") => {
    return String(data.school_type || "") === expected ? yesBlock : noBlock;
  });

  out = out.replace(/{%\s*for\s+([A-Za-z0-9_]+)\s+in\s+([A-Za-z0-9_]+)\s*%}([\s\S]*?){%\s*endfor\s*%}/g, (_match, alias, key, block) => {
    const list = Array.isArray(data[key]) ? data[key] : [];
    return list.map((value, index) => {
      return block
        .replace(/{{\s*loop\.index\s*}}/g, String(index + 1))
        .replace(new RegExp(`{{\\s*${alias}\\s*}}`, "g"), formatValue(value))
        .replace(/{{\s*['"]\\n['"]\s*}}/g, "\n");
    }).join("").trimEnd();
  });

  out = out.replace(/{{\s*['"]\\n['"]\s*}}/g, "\n");
  out = out.replace(/{{\s*([A-Za-z0-9_.]+)\s*}}/g, (_match, key) => {
    const value = getPath(data, key);
    return formatValue(value);
  });
  return out;
}

function getPath(data, key) {
  return key.split(".").reduce((current, part) => current == null ? undefined : current[part], data);
}

async function readSelectedImages() {
  const files = state.selectedImages;
  const images = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    let arrayBuffer = await file.arrayBuffer();
    let dataUrl = await fileToDataUrl(file);
    let imageElement = await loadImageElement(dataUrl);
    let ext = imageExtension(file);
    let type = imageMimeType(ext, file.type);

    if (!["png", "jpg", "jpeg"].includes(ext)) {
      const converted = await imageElementToPng(imageElement);
      arrayBuffer = converted.arrayBuffer;
      dataUrl = converted.dataUrl;
      imageElement = await loadImageElement(dataUrl);
      ext = "png";
      type = "image/png";
    }

    images.push({
      index,
      name: file.name || `image-${index + 1}.${ext}`,
      ext,
      type,
      arrayBuffer,
      dataUrl,
      width: imageElement.naturalWidth || imageElement.width || 1200,
      height: imageElement.naturalHeight || imageElement.height || 800
    });
  }

  return images;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("图片读取失败。"));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片格式无法读取，请换用 PNG 或 JPG。"));
    img.src = src;
  });
}

function imageElementToPng(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width || 1200;
  canvas.height = img.naturalHeight || img.height || 800;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  return fetch(dataUrl)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => ({ dataUrl, arrayBuffer }));
}

function imageExtension(file) {
  const ext = String(file.name || "").split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg"].includes(ext)) return ext;
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  return ext || "png";
}

function imageMimeType(ext, fallback) {
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return fallback || "image/png";
}

async function renderClubSummaryDocx(data, images) {
  const zip = new JSZip();
  const relationships = [];
  const contentTypes = new Map([
    ["rels", "application/vnd.openxmlformats-package.relationships+xml"],
    ["xml", "application/xml"]
  ]);

  images.forEach((image, index) => {
    const ext = image.ext === "jpeg" ? "jpg" : image.ext;
    const mediaPath = `word/media/image${index + 1}.${ext}`;
    const relId = `rId${index + 1}`;
    relationships.push({ relId, mediaPath: `media/image${index + 1}.${ext}` });
    contentTypes.set(ext, imageMimeType(ext, image.type));
    zip.file(mediaPath, image.arrayBuffer);
  });

  zip.file("[Content_Types].xml", buildContentTypesXml(contentTypes));
  zip.folder("_rels").file(".rels", buildRootRelsXml());
  zip.folder("word").file("document.xml", buildSummaryDocumentXml(data, images, relationships));
  zip.folder("word").folder("_rels").file("document.xml.rels", buildDocumentRelsXml(relationships));

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });
}

function buildContentTypesXml(contentTypes) {
  const defaults = Array.from(contentTypes.entries())
    .map(([ext, type]) => `<Default Extension="${escapeXml(ext)}" ContentType="${escapeXml(type)}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${defaults}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
}

function buildRootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
}

function buildDocumentRelsXml(relationships) {
  const rels = relationships
    .map(({ relId, mediaPath }) => `<Relationship Id="${escapeXml(relId)}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${escapeXml(mediaPath)}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}

function buildSummaryDocumentXml(data, images, relationships) {
  const reflection = data.reflection && typeof data.reflection === "object" ? data.reflection : {};
  const captions = Array.isArray(data.photo_captions) ? data.photo_captions : [];
  const body = [
    docxParagraph(data.title || "社团工作总结", { align: "center", bold: true, size: 34, color: "111827", after: 120 }),
    docxParagraph(data.subtitle || "Club Work Summary", { align: "center", size: 20, color: "64748B", after: 220 }),
    docxParagraph(`${data.club_name || "社团"}  |  ${data.semester || "本学期"}`, { align: "center", bold: true, size: 22, color: "374151", after: 260 }),
    docxHeading("一、社团概况"),
    docxParagraph(data.overview),
    docxHeading("二、课程内容回顾"),
    ...docxList(data.course_review),
    docxHeading("三、活动成果"),
    docxParagraph(data.achievements),
    docxHeading("四、经验与反思"),
    docxParagraph(`亮点：${reflection.success || " "}`),
    docxParagraph(`问题：${reflection.problems || " "}`),
    docxParagraph(`改进：${reflection.improvements || " "}`),
    docxHeading("五、后续展望"),
    docxParagraph(data.outlook),
    docxHeading("六、活动照片"),
    docxParagraph(data.photos_intro || "以下为本学期社团活动与成果展示照片。")
  ];

  images.forEach((image, index) => {
    const caption = captions[index] || image.name || `活动照片 ${index + 1}`;
    body.push(docxParagraph(caption, { align: "center", bold: true, size: 20, color: "475569", before: 180, after: 80 }));
    body.push(docxImageParagraph(image, relationships[index].relId, index + 1));
  });

  body.push(`<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>`);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body.join("")}</w:body></w:document>`;
}

function docxHeading(text) {
  return docxParagraph(text, { bold: true, size: 26, color: "B91C1C", before: 260, after: 120 });
}

function docxList(items) {
  const list = Array.isArray(items) && items.length ? items : [" "];
  return list.map((item) => docxParagraph(`· ${item}`, { left: 360, hanging: 220 }));
}

function docxParagraph(text, options = {}) {
  const lines = String(text || " ").split(/\n/);
  const pPr = [
    options.align ? `<w:jc w:val="${escapeXml(options.align)}"/>` : "",
    options.before || options.after ? `<w:spacing w:before="${Number(options.before || 0)}" w:after="${Number(options.after || 120)}" w:line="360" w:lineRule="auto"/>` : `<w:spacing w:after="120" w:line="360" w:lineRule="auto"/>`,
    options.left ? `<w:ind w:left="${Number(options.left)}"${options.hanging ? ` w:hanging="${Number(options.hanging)}"` : ""}/>` : ""
  ].join("");
  const rPr = [
    `<w:rFonts w:ascii="Arial" w:eastAsia="Microsoft YaHei" w:hAnsi="Arial"/>`,
    `<w:sz w:val="${Number(options.size || 22)}"/>`,
    options.bold ? "<w:b/>" : "",
    options.color ? `<w:color w:val="${escapeXml(options.color)}"/>` : ""
  ].join("");
  const runs = lines.map((line, index) => {
    const br = index > 0 ? "<w:br/>" : "";
    return `${br}<w:t xml:space="preserve">${escapeXml(line || " ")}</w:t>`;
  }).join("");
  return `<w:p><w:pPr>${pPr}</w:pPr><w:r><w:rPr>${rPr}</w:rPr>${runs}</w:r></w:p>`;
}

function docxImageParagraph(image, relId, id) {
  const maxWidth = 5.7 * 914400;
  const maxHeight = 3.5 * 914400;
  const ratio = image.width > 0 ? image.height / image.width : 0.62;
  let cx = Math.round(maxWidth);
  let cy = Math.round(cx * ratio);
  if (cy > maxHeight) {
    cy = Math.round(maxHeight);
    cx = Math.round(cy / ratio);
  }

  return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="180"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${escapeXml(image.name)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${escapeXml(image.name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${escapeXml(relId)}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

async function renderWeeklyBriefPng(data, images) {
  const width = 1600;
  const height = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const baseImage = await loadImageElement(getWeeklyBriefBaseSource());
  const loadedImages = await Promise.all(images.slice(0, 6).map((image) => loadImageElement(image.dataUrl)));

  ctx.drawImage(baseImage, 0, 0, width, height);
  drawWeeklyBriefImages(ctx, loadedImages);
  drawWeeklyBriefBody(ctx, data);

  return canvasToBlob(canvas);
}

function getWeeklyBriefBaseSource() {
  const asset = getAsset();
  return asset.slideBase64 ? `data:image/png;base64,${asset.slideBase64}` : WEEKLY_BRIEF_BASE_IMAGE;
}

function drawWeeklyBriefImages(ctx, loadedImages) {
  const count = loadedImages.length;
  if (!count) return;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(132, 452, 1346, 917);

  const slots = getWeeklyBriefImageSlots(count);

  loadedImages.forEach((img, index) => {
    const slot = slots[index];
    if (!slot) return;
    drawCoverImage(ctx, img, slot.x, slot.y, slot.w, slot.h, 0);
  });
}

function getWeeklyBriefImageSlots(count) {
  const area = { x: 132, y: 452, w: 1346, h: 917 };
  const gap = 24;
  const rowH = Math.floor((area.h - gap) / 2);
  const twoColW = Math.floor((area.w - gap) / 2);
  const threeColW = Math.floor((area.w - gap * 2) / 3);

  if (count === 1) return [area];
  if (count === 2) {
    return [
      { x: area.x, y: area.y, w: twoColW, h: area.h },
      { x: area.x + twoColW + gap, y: area.y, w: area.w - twoColW - gap, h: area.h }
    ];
  }
  if (count === 3) {
    return [0, 1, 2].map((index) => ({
      x: area.x + index * (threeColW + gap),
      y: area.y,
      w: index === 2 ? area.w - (threeColW + gap) * 2 : threeColW,
      h: area.h
    }));
  }
  if (count === 4) {
    return [
      { x: 132, y: 452, w: 664, h: 446 },
      { x: 819, y: 452, w: 659, h: 446 },
      { x: 132, y: 924, w: 664, h: 445 },
      { x: 819, y: 924, w: 659, h: 445 }
    ];
  }
  if (count === 5) {
    return [
      { x: area.x, y: area.y, w: twoColW, h: rowH },
      { x: area.x + twoColW + gap, y: area.y, w: area.w - twoColW - gap, h: rowH },
      { x: area.x, y: area.y + rowH + gap, w: threeColW, h: area.h - rowH - gap },
      { x: area.x + threeColW + gap, y: area.y + rowH + gap, w: threeColW, h: area.h - rowH - gap },
      { x: area.x + (threeColW + gap) * 2, y: area.y + rowH + gap, w: area.w - (threeColW + gap) * 2, h: area.h - rowH - gap }
    ];
  }
  return [0, 1, 2, 3, 4, 5].map((index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
      x: area.x + col * (threeColW + gap),
      y: area.y + row * (rowH + gap),
      w: col === 2 ? area.w - (threeColW + gap) * 2 : threeColW,
      h: row === 1 ? area.h - rowH - gap : rowH
    };
  });
}

function drawWeeklyBriefBody(ctx, data) {
  const box = { x: 121, y: 1429, w: 1357, h: 524 };
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(box.x, box.y, box.w, box.h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();

  const zh = String(data.zh_body || "请在 JSON 中提供 80-120 字中文简报正文。").trim();
  const en = String(data.en_body || "Please provide a clear English translation in the JSON.").trim();
  const zhEnd = drawFittedParagraph(ctx, zh, box.x + 24, box.y + 66, box.w - 48, 210, 44, 34, {
    color: "#55585E",
    bold: false,
    mode: "char",
    font: "Microsoft YaHei, Arial, sans-serif"
  });
  drawFittedParagraph(ctx, en, box.x + 24, zhEnd + 22, box.w - 48, box.y + box.h - zhEnd - 38, 34, 26, {
    color: "#33363B",
    bold: false,
    mode: "word",
    font: "Times New Roman, Microsoft YaHei, serif"
  });

  ctx.restore();
}

function drawFittedParagraph(ctx, text, x, y, maxWidth, maxHeight, fontSize, minFontSize, options = {}) {
  let size = fontSize;
  let lines = [];
  let lineHeight = Math.round(size * 1.45);

  while (size >= minFontSize) {
    ctx.font = `${options.bold ? "700" : "400"} ${size}px ${options.font || "Arial, Microsoft YaHei, sans-serif"}`;
    lines = wrapCanvasText(ctx, text, maxWidth, options.mode || "char");
    lineHeight = Math.round(size * 1.45);
    if (lines.length * lineHeight <= maxHeight) break;
    size -= 1;
  }

  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    visible[visible.length - 1] = visible[visible.length - 1].replace(/[，。,. ]*$/, "") + "...";
  }

  ctx.save();
  ctx.font = `${options.bold ? "700" : "400"} ${size}px ${options.font || "Arial, Microsoft YaHei, sans-serif"}`;
  ctx.fillStyle = options.color || "#334155";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  visible.forEach((lineText, index) => ctx.fillText(lineText, x, y + index * lineHeight));
  ctx.restore();
  return y + visible.length * lineHeight;
}

function wrapCanvasText(ctx, text, maxWidth, mode) {
  if (mode === "word") {
    const words = String(text || " ").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(testLine).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  const chars = Array.from(String(text || " "));
  const lines = [];
  let line = "";
  chars.forEach((char) => {
    const testLine = line + char;
    if (line && ctx.measureText(testLine).width > maxWidth) {
      lines.push(line);
      line = char.trimStart();
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawCanvasText(ctx, text, x, y, maxWidth, fontSize, maxLines, options = {}) {
  ctx.save();
  ctx.font = `${options.bold ? "700" : "400"} ${fontSize}px ${options.font || "Arial, Microsoft YaHei, sans-serif"}`;
  ctx.fillStyle = options.color || "#FFFFFF";
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = "alphabetic";

  const chars = Array.from(String(text || " "));
  const lines = [];
  let line = "";
  chars.forEach((char) => {
    const testLine = line + char;
    if (line && ctx.measureText(testLine).width > maxWidth) {
      lines.push(line);
      line = char.trimStart();
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);

  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    visible[visible.length - 1] = visible[visible.length - 1].replace(/[，。,. ]*$/, "") + "...";
  }

  const lineHeight = Math.round(fontSize * 1.45);
  const drawX = options.align === "center" ? x + maxWidth / 2 : x;
  visible.forEach((lineText, index) => ctx.fillText(lineText, drawX, y + index * lineHeight));
  ctx.restore();
  return y + visible.length * lineHeight;
}

function drawCoverImage(ctx, img, x, y, w, h, radius) {
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;
  const scale = Math.max(w / imgWidth, h / imgHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (imgWidth - sw) / 2;
  const sy = (imgHeight - sh) / 2;
  ctx.save();
  roundedPath(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function drawRoundedRect(ctx, x, y, w, h, radius, fillStyle) {
  ctx.save();
  roundedPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
}

function roundedPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("图片生成失败。"));
    }, "image/png", 0.96);
  });
}

function buildFileName(cfg, data, index) {
  const base = data.title || data.course_name || data.club_name || data.headline || data.course || cfg.defaultPrefix;
  const suffix = state.parsedItems.length > 1 ? `-${index}` : "";
  const safeBase = sanitizeFileName(base);
  const safePrefix = sanitizeFileName(cfg.defaultPrefix);
  const name = safeBase === safePrefix ? safePrefix : `${safeBase}-${safePrefix}`;
  return `${name}${suffix}.${cfg.ext}`;
}

function sanitizeFileName(value) {
  return String(value || "Document")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Document";
}

function dateStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function log(message, isError = false) {
  els.log.textContent = message;
  els.log.classList.toggle("is-error", isError);
}

function showToast(message) {
  els.toast.textContent = message || "已完成";
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 1800);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

initFill();
