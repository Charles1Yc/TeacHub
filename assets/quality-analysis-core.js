/* School grade-export parsing and local quality-analysis workbook generation. */
const QualityAnalysis = (() => {
  const NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const tags = (node, name) => Array.from(node.getElementsByTagNameNS("*", name));
  const xml = (text) => {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (tags(doc, "parsererror").length) throw new Error("Excel XML 无法读取。");
    return doc;
  };
  const serialize = (doc) => new XMLSerializer().serializeToString(doc);
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const column = (n) => { let s = ""; for (; n; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
  const number = (v) => v === null || v === undefined || String(v).trim() === "" || typeof v === "boolean" ? null : Number.isFinite(Number(v)) ? Number(v) : null;
  async function parse(buffer, filename) {
    const zip = await JSZip.loadAsync(buffer);
    const read = async (p) => { if (!zip.file(p)) throw new Error(`${filename}：缺少 Excel 文件结构 ${p}`); return xml(await zip.file(p).async("string")); };
    const book = await read("xl/workbook.xml"), rels = await read("xl/_rels/workbook.xml.rels");
    const sheet = tags(book, "sheet").find(s => s.getAttribute("name") === "成绩详情");
    if (!sheet) throw new Error(`${filename}：未找到“成绩详情”工作表，请上传学校导出的班级成绩 XLSX。`);
    const id = sheet.getAttributeNS(REL, "id");
    const target = tags(rels, "Relationship").find(r => r.getAttribute("Id") === id)?.getAttribute("Target");
    if (!target) throw new Error(`${filename}：成绩详情工作表引用无效。`);
    const path = new URL(target, "https://xlsx.local/xl/").pathname.slice(1);
    const strings = zip.file("xl/sharedStrings.xml") ? tags(await read("xl/sharedStrings.xml"), "si").map(s => tags(s, "t").map(t => t.textContent).join("")) : [];
    const doc = await read(path), cells = new Map();
    for (const c of tags(doc, "c")) {
      const t = c.getAttribute("t"), raw = tags(c, "v")[0]?.textContent;
      const value = t === "s" ? strings[Number(raw)] : t === "inlineStr" ? tags(c, "t").map(t => t.textContent).join("") : t === "e" ? null : t === "str" ? raw : raw === undefined ? null : number(raw);
      cells.set(c.getAttribute("r"), value);
    }
    const get = (ref) => cells.get(ref) ?? null;
    const metadata = {};
    for (let r = 1; r <= 7; r++) if (get(`A${r}`)) metadata[get(`A${r}`)] = get(`B${r}`);
    if (!metadata["课程"] || !metadata["班级"] || !metadata["任课老师"] || !(number(metadata["课程满分"]) > 0)) throw new Error(`${filename}：课程、班级、教师或课程满分缺失。`);
    const idRef = [...cells].find(([ref, v]) => v === "学号" && Number(ref.match(/\d+$/)[0]) <= 10)?.[0];
    if (!idRef) throw new Error(`${filename}：未找到学号表头。`);
    const hr = Number(idRef.match(/\d+$/)[0]);
    const merges = tags(doc, "mergeCell").map(m => m.getAttribute("ref"));
    const idMerge = merges.find(m => m.split(":")[0] === idRef);
    const headerEnd = idMerge ? Number(idMerge.split(":").at(-1).match(/\d+$/)[0]) : hr;
    const headerCol = (name) => [...cells].find(([ref, v]) => v === name && Number(ref.match(/\d+$/)[0]) === hr)?.[0].replace(/\d+$/, "");
    const required = ["学号", "学生中文名", "学生英文名", "学期成绩"].map(headerCol);
    if (required.some(c => !c)) throw new Error(`${filename}：学生信息或学期成绩表头不完整。`);
    const exams = [];
    for (const [ref, value] of cells) {
      if (value !== "得分") continue;
      const rr = Number(ref.match(/\d+$/)[0]), col = ref.replace(/\d+$/, "");
      if (rr > headerEnd) continue;
      let idx = 0; for (const char of col) idx = idx * 26 + char.charCodeAt(0) - 64;
      const maxCol = column(idx + 1);
      if (get(`${maxCol}${rr}`) !== "总分") continue;
      const name = get(`${col}${rr - 1}`) || get(`${col}${rr - 2}`);
      if (name) exams.push({ id: col, label: String(name), scoreCol: col, maxCol });
    }
    const students = [], warnings = [], ids = new Set();
    const rows = tags(doc, "row").map(r => Number(r.getAttribute("r"))).filter(r => r > headerEnd);
    for (const r of rows) {
      const studentId = get(`${required[0]}${r}`); if (studentId === null || studentId === "") continue;
      if (ids.has(String(studentId))) throw new Error(`${filename}：学号 ${studentId} 重复，请核对源表。`);
      ids.add(String(studentId));
      const s = { id: String(studentId), name: get(`${required[1]}${r}`), english: get(`${required[2]}${r}`), semester: number(get(`${required[3]}${r}`)), originalSemester: number(get(`${required[3]}${r}`)), attendance: number(get(`${headerCol("考勤(5%)")}${r}`)), exams: {}, sourceRow: r };
      for (const exam of exams) s.exams[exam.id] = { score: number(get(`${exam.scoreCol}${r}`)), max: number(get(`${exam.maxCol}${r}`)) };
      students.push(s);
    }
    if (!students.length) throw new Error(`${filename}：没有学生记录。`);
    return { filename, subject: String(metadata["课程"]), className: String(metadata["班级"]), teacher: String(metadata["任课老师"]), semester: String(metadata["学期"] || ""), max: number(metadata["课程满分"]), exams, students, warnings, options: { mode: "semester", excellent: null, good: null, pass: null, operators: [">=", ">=", ">="], previous: null, targets: [null, null, null] } };
  }
  function analyze(group) {
    const o = group.options;
    const thresholds=[o.excellent,o.good,o.pass];
    if (!thresholds.every(v => v === null || Number.isFinite(v) && v >= 0 && v <= 100) || thresholds.some((v,i) => v !== null && thresholds.slice(i+1).some(w => w !== null && v < w))) throw new Error(`${group.className}：分数线需满足100≥优秀≥良好≥合格≥0，可以暂不填写。`);
    if (!(o.operators || [">=", ">=", ">="]).every(v => [">", ">="].includes(v))) throw new Error("分数线比较条件无效。");
    if (o.previous !== null && (!Number.isFinite(o.previous) || o.previous < 0 || o.previous > 100)) throw new Error(`${group.className}：上期均分需在0～100之间。`);
    if (o.targets.some(v => v !== null && (!Number.isInteger(v) || v < 0))) throw new Error(`${group.className}：目标人数需为非负整数。`);
    const records = group.students.map(s => {
      const input = o.mode === "semester" ? { score: s.semester, max: 100 } : s.exams[o.mode] || { score: null, max: null };
      const valid = input.score !== null && input.max !== null && input.max > 0 && input.score >= 0 && input.score <= input.max;
      return { ...s, score: valid ? input.score / input.max * 100 : null, selectedScore: input.score, selectedMax: input.max, invalid: input.score !== null && !valid };
    });
    const scores = records.map(r => r.score).filter(s => s !== null);
    const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const counts = thresholds.map((t,i) => scores.length && t !== null ? scores.filter(s => (o.operators?.[i] || ">=") === ">" ? s > t : s >= t).length : null);
    return { records, count: group.students.length, taken: scores.length, max: scores.length ? Math.max(...scores) : null, min: scores.length ? Math.min(...scores) : null, mean, change: mean !== null && o.previous !== null ? mean - o.previous : null, counts, completion: counts.map((v, i) => v !== null && o.targets[i] > 0 ? v / o.targets[i] : null), invalid: records.filter(r => r.invalid).length };
  }
  function cellXML(ref, value, style = 0, formula = null) {
    const attrs = `r="${ref}" s="${style}"`;
    if (formula !== null) return `<c ${attrs}${value === null ? ' t="str"' : ""}><f>${escape(formula.replace(/^=/, ""))}</f><v>${value === null ? "" : escape(value)}</v></c>`;
    if (value === null || value === undefined) return `<c ${attrs}/>`;
    if (typeof value === "number") return `<c ${attrs}><v>${value}</v></c>`;
    return `<c ${attrs} t="inlineStr"><is><t xml:space="preserve">${escape(value)}</t></is></c>`;
  }
  function supportSheet(rows, widths, headerRow, styles, formulas = {}) {
    const merges=rows.flatMap((values,r)=>values.length===1?[`A${r+1}:${column(widths.length)}${r+1}`]:r+1>headerRow&&values.length===2&&String(values[1]).length>25?[`B${r+1}:${column(widths.length)}${r+1}`]:[]);
    return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${NS}"><dimension ref="A1:${column(widths.length)}${rows.length}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="24"/><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${rows.map((values, r) => `<row r="${r + 1}" ht="${r + 1 === headerRow ? 38 : 28}" customHeight="1">${values.map((v, c) => {const ref=`${column(c+1)}${r+1}`;return cellXML(ref,v,r+1===headerRow?styles.header:styles.body,formulas[ref]??null);}).join("")}</row>`).join("")}</sheetData>${merges.length?`<mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`:""}</worksheet>`;
  }
  async function exportWorkbook(groups, month = "") {
    if (!groups.length) throw new Error("请先上传班级数据。");
    const results = groups.map(analyze);
    const zip = await JSZip.loadAsync(QUALITY_TEMPLATE_BASE64, { base64: true });
    const doc = xml(await zip.file("xl/worksheets/sheet1.xml").async("string"));
    const styles = xml(await zip.file("xl/styles.xml").async("string"));
    const xfs = tags(styles, "cellXfs")[0];
    const fonts=tags(styles,"fonts")[0],font=fonts.children[Number(xfs.children[3].getAttribute("fontId"))].cloneNode(true);
    tags(font,"sz")[0].setAttribute("val","11");const bodyFont=fonts.children.length;fonts.appendChild(font);fonts.setAttribute("count",String(fonts.children.length));
    function addStyle(source, numFmt) { const xf = xfs.children[source].cloneNode(true); xf.setAttribute("numFmtId", String(numFmt)); xf.setAttribute("applyNumberFormat", "1"); const index=xfs.children.length; xfs.appendChild(xf); xfs.setAttribute("count",String(xfs.children.length)); return index; }
    const dataStyle=addStyle(3,0),decimalStyle=addStyle(3,2), percentageStyle=addStyle(3,10);
    [dataStyle,decimalStyle,percentageStyle].forEach(i=>xfs.children[i].setAttribute("fontId",String(bodyFont)));
    const base = xfs.children[0].cloneNode(true); base.setAttribute("fontId", "0"); base.setAttribute("fillId", "0"); base.setAttribute("borderId", "0"); base.setAttribute("numFmtId", "0");
    tags(base,"alignment").forEach(a=>a.remove());
    const alignment=styles.createElementNS(NS,"alignment"); alignment.setAttribute("horizontal","left");alignment.setAttribute("vertical","center");alignment.setAttribute("wrapText","1");base.appendChild(alignment);
    const bodyStyle=xfs.children.length;xfs.appendChild(base);xfs.setAttribute("count",String(xfs.children.length));
    const supportStyles={header:1,body:bodyStyle};
    zip.file("xl/styles.xml",serialize(styles));
    const sheetData=tags(doc,"sheetData")[0], sourceRow=tags(sheetData,"row").find(r=>r.getAttribute("r")==="5");
    for (const row of tags(sheetData,"row")) if(Number(row.getAttribute("r"))>=5) row.remove();
    const detailRows=[["学生成绩明细"],[],[],["学科","班级","教师","学号","中文名","英文名","原学期成绩","考勤","最终成绩","满分","分析得分","来源文件","来源行","有效成绩"]];
    const detailFormulas={}, settingsRows=[["统计口径"],["考试月份",month||"未提供"],[],["学科","班级","教师","所选成绩","课程满分","分析满分","优秀分数线","良好分数线","合格分数线","上期均分","优秀目标人数","良好目标人数","合格目标人数","来源文件","优秀条件","良好条件","合格条件"]];
    groups.forEach((g,i)=>{
      const result=results[i],o=g.options,p=5+i,r=5+i,start=detailRows.length+1;
      const mode=o.mode==="semester"?"最终学期成绩（100分制）":g.exams.find(e=>e.id===o.mode)?.label||"未提供月考";
      settingsRows.push([g.subject,g.className,g.teacher,mode,g.max,100,o.excellent,o.good,o.pass,o.previous,...o.targets,g.filename,...(o.operators||[">=",">=",">="])]);
      result.records.forEach(s=>{
        const rr=detailRows.length+1;
        detailRows.push([g.subject,g.className,g.teacher,s.id,s.name,s.english,s.originalSemester,s.attendance,s.selectedScore,s.selectedMax,s.score,g.filename,s.sourceRow,s.score===null?0:1]);
        detailFormulas[`K${rr}`]=`IF(AND(ISNUMBER(I${rr}),ISNUMBER(J${rr}),J${rr}>0,I${rr}>=0,I${rr}<=J${rr}),I${rr}/J${rr}*'统计口径'!F${p},"")`;
        detailFormulas[`N${rr}`]=`IF(ISNUMBER(K${rr}),1,0)`;
      });
      const end=detailRows.length,scores=`'学生明细'!K${start}:K${end}`;
      const values=[g.subject,g.teacher,result.count,result.taken,100,result.max,result.min,result.mean,o.previous,result.change];
      const formulas=[null,null,`COUNTA('学生明细'!D${start}:D${end})`,`COUNT(${scores})`,`'统计口径'!F${p}`,`IF(D${r}=0,"",MAX(${scores}))`,`IF(D${r}=0,"",MIN(${scores}))`,`IF(D${r}=0,"",AVERAGE(${scores}))`,`IF(ISNUMBER('统计口径'!J${p}),'统计口径'!J${p},"")`,`IF(AND(ISNUMBER(H${r}),ISNUMBER(I${r})),H${r}-I${r},"")`];
      [ ["G","K","K","L","O"], ["H","L","N","O","P"], ["I","M","Q","R","Q"] ].forEach(([threshold,target,countCol,targetCol,operator],j)=>{
        values.push(result.counts[j],o.targets[j],result.completion[j]);
        formulas.push(`IF(OR(D${r}=0,NOT(ISNUMBER('统计口径'!${threshold}${p}))),"",COUNTIFS(${scores},'统计口径'!${operator}${p}&'统计口径'!${threshold}${p},'学生明细'!N${start}:N${end},1))`,`IF(ISNUMBER('统计口径'!${target}${p}),'统计口径'!${target}${p},"")`,`IF(AND(ISNUMBER(${countCol}${r}),ISNUMBER(${targetCol}${r}),${targetCol}${r}>0),${countCol}${r}/${targetCol}${r},"")`);
      });
      const row=sourceRow.cloneNode(false);row.setAttribute("r",String(r));row.setAttribute("ht","38");
      const cells=values.map((v,c)=>cellXML(`${column(c+1)}${r}`,v,[12,15,18].includes(c)?percentageStyle:c>=5&&c<=9?decimalStyle:dataStyle,formulas[c])).join("");
      const parsed=xml(`<row xmlns="${NS}">${cells}</row>`);for(const child of [...parsed.documentElement.children])row.appendChild(doc.importNode(child,true));sheetData.appendChild(row);
    });
    const mergeCells=tags(doc,"mergeCells")[0];
    ["K2","N2","Q2"].forEach((ref,j)=>{
      const target=tags(doc,"c").find(c=>c.getAttribute("r")===ref);const o=groups[0].options,t=[o.excellent,o.good,o.pass][j],name=["优秀","良好","合格"][j];
      while(target.firstChild)target.removeChild(target.firstChild);target.setAttribute("t","str");
      const f=doc.createElementNS(NS,"f");f.textContent=`"${name}"&IF(ISNUMBER('统计口径'!${["G","H","I"][j]}5),'统计口径'!${["O","P","Q"][j]}5&'统计口径'!${["G","H","I"][j]}5,"（未设）")`;target.appendChild(f);
      const v=doc.createElementNS(NS,"v");v.textContent=name+(t===null?"（未设）":(o.operators?.[j]||">=")+t);target.appendChild(v);
    });
    mergeCells.setAttribute("count",String(mergeCells.children.length));
    tags(doc,"dimension")[0].setAttribute("ref",`A1:S${groups.length+4}`);
    let cols=tags(doc,"cols")[0];if(!cols){cols=doc.createElementNS(NS,"cols");sheetData.parentNode.insertBefore(cols,sheetData);}while(cols.firstChild)cols.removeChild(cols.firstChild);
    [24,14,11,11,...Array(15).fill(12)].forEach((width,i)=>{const c=doc.createElementNS(NS,"col");c.setAttribute("min",String(i+1));c.setAttribute("max",String(i+1));c.setAttribute("width",String(width));c.setAttribute("customWidth","1");cols.appendChild(c);});
    zip.file("xl/worksheets/sheet1.xml",serialize(doc));
    settingsRows.push([], ["学期",...new Set(groups.map(g=>g.semester))]);
    zip.file("xl/worksheets/sheet2.xml",supportSheet(settingsRows,[24,26,14,42,14,14,14,14,14,14,16,16,16,24,14,14,14],4,supportStyles));
    zip.file("xl/worksheets/sheet3.xml",supportSheet(detailRows,[24,26,14,14,14,14,14,14,14,14,14,24,12,12],4,supportStyles,detailFormulas));
    const workbook=xml(await zip.file("xl/workbook.xml").async("string")),rels=xml(await zip.file("xl/_rels/workbook.xml.rels").async("string")),types=xml(await zip.file("[Content_Types].xml").async("string"));
    ["统计口径","学生明细"].forEach((name,i)=>{
      const n=i+2,rid=`qualitySheet${n}`,s=workbook.createElementNS(NS,"sheet");s.setAttribute("name",name);s.setAttribute("sheetId",String(n));s.setAttributeNS(REL,"r:id",rid);tags(workbook,"sheets")[0].appendChild(s);
      const rel=rels.createElementNS(rels.documentElement.namespaceURI,"Relationship");rel.setAttribute("Id",rid);rel.setAttribute("Type",REL+"/worksheet");rel.setAttribute("Target",`worksheets/sheet${n}.xml`);rels.documentElement.appendChild(rel);
      const type=types.createElementNS(types.documentElement.namespaceURI,"Override");type.setAttribute("PartName",`/xl/worksheets/sheet${n}.xml`);type.setAttribute("ContentType","application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml");types.documentElement.appendChild(type);
    });
    const calc=tags(workbook,"calcPr")[0];if(calc){calc.setAttribute("fullCalcOnLoad","1");calc.setAttribute("forceFullCalc","1");}
    zip.file("xl/workbook.xml",serialize(workbook));zip.file("xl/_rels/workbook.xml.rels",serialize(rels));zip.file("[Content_Types].xml",serialize(types));
    return zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  }
  return { parse, analyze, exportWorkbook };
})();
