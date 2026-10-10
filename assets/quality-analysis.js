(() => {
  const files=document.querySelector("#quality-files"),status=document.querySelector("#quality-status"),settings=document.querySelector("#quality-settings"),preview=document.querySelector("#quality-preview"),exportButton=document.querySelector("#quality-export"),copyButton=document.querySelector("#quality-copy");
  let groups=[],revision=0,busy=false;
  const escape=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  const value=v=>v===null?"":escape(v);
  const display=v=>v===null?"":typeof v==="number"&&!Number.isInteger(v)?v.toFixed(2):escape(v);
  function message(text,error=false){status.textContent=text;status.classList.toggle("is-error",error);}
  function applyThresholds(){
    groups.forEach(g=>{["excellent","good","pass"].forEach((key,i)=>{const input=document.querySelector(`[data-threshold="${i}"]`);g.options[key]=input.value===""?null:Number(input.value);g.options.operators[i]=document.querySelector(`[data-threshold-operator="${i}"]`).value;});});
  }
  function renderStudents(){
    settings.innerHTML=groups.map((g,i)=>`<details class="quality-class"><summary>${escape(g.subject)} · ${escape(g.className)} · ${g.students.length}名学生</summary><table class="quality-student-table"><thead><tr><th>学号</th><th>中文名</th><th>英文名</th><th>原学期成绩</th><th>最终成绩（可修改）</th></tr></thead><tbody>${g.students.map((s,j)=>`<tr><td>${escape(s.id)}</td><td>${escape(s.name)}</td><td>${escape(s.english)}</td><td>${display(s.originalSemester)}</td><td><input type="number" min="0" max="100" step="0.01" data-class="${i}" data-student="${j}" aria-label="${escape(s.name)}最终成绩" value="${value(s.semester)}"></td></tr>`).join("")}</tbody></table></details>`).join("");
    settings.querySelectorAll("input").forEach(input=>input.addEventListener("input",()=>{groups[Number(input.dataset.class)].students[Number(input.dataset.student)].semester=input.value===""?null:Number(input.value);updatePreview(false);}));
  }
  function inputCell(field,v,index,type="number"){return `<td class="quality-editable"><input data-index="${index}" data-field="${field}" aria-label="第${index+1}行${field==="previous"?"上期均分":field.startsWith("target")?"目标人数":field==="subject"?"学科":"教师"}" type="${type}" ${type==="number"?`min="0" ${field==="previous"?'max="100" step="0.01"':'step="1"'}`:""} value="${value(v)}" placeholder="${type==="number"?"待填":""}"></td>`;}
  function updatePreview(rebuild=true){
    exportButton.disabled=true;copyButton.disabled=true;
    try{
      applyThresholds();const results=groups.map(QualityAnalysis.analyze);
      if(results.some(a=>a.invalid))throw new Error("最终成绩需为0～100分，请修正学生成绩后继续。");
      if(rebuild){
        preview.innerHTML=groups.map((g,i)=>{const a=results[i];return `<tr>${inputCell("subject",g.subject,i,"text")}${inputCell("teacher",g.teacher,i,"text")}${[a.count,a.taken,100,a.max,a.min,a.mean].map(v=>`<td>${display(v)}</td>`).join("")}${inputCell("previous",g.options.previous,i)}<td>${display(a.change)}</td>${a.counts.map((v,j)=>`<td>${display(v)}</td>${inputCell(`target${j}`,g.options.targets[j],i)}<td>${a.completion[j]===null?"":(a.completion[j]*100).toFixed(1)+"%"}</td>`).join("")}</tr>`;}).join("");
        preview.querySelectorAll("input").forEach(input=>input.addEventListener("input",()=>{const g=groups[Number(input.dataset.index)],f=input.dataset.field,v=input.type==="number"?(input.value===""?null:Number(input.value)):input.value;if(f.startsWith("target"))g.options.targets[Number(f.slice(-1))]=v;else if(f==="previous")g.options.previous=v;else g[f]=v;updatePreview(false);}));
      }
      else {
        [...preview.rows].forEach((row,i)=>{const a=results[i];for(const [c,v] of [[2,a.count],[3,a.taken],[4,100],[5,a.max],[6,a.min],[7,a.mean],[9,a.change],[10,a.counts[0]],[12,a.completion[0]],[13,a.counts[1]],[15,a.completion[1]],[16,a.counts[2]],[18,a.completion[2]]])row.cells[c].textContent=[12,15,18].includes(c)?v===null?"":(v*100).toFixed(1)+"%":display(v);});
      }
      document.querySelector("#quality-notes").textContent=groups.map((g,i)=>`${g.className}：${results[i].taken}/${results[i].count}人有有效最终成绩`).join("；")+"。优秀、良好、合格按各自分数线累计统计，三项人数不能相加。";
      exportButton.disabled=!groups.length||busy;copyButton.disabled=exportButton.disabled;
      message(`已读取${groups.length}个班级。表头设置分数线，黄色格填写上期均分和目标人数，结果即时更新。`);
    }catch(error){
      [...preview.rows].forEach(row=>[5,6,7,9,10,12,13,15,16,18].forEach(c=>row.cells[c].textContent=""));
      message(error.message,true);
    }
  }
  async function load(selected){
    if(busy)return;
    const token=++revision;groups=[];busy=true;exportButton.disabled=true;copyButton.disabled=true;
    document.querySelector("#quality-settings-panel").hidden=true;document.querySelector("#quality-preview-panel").hidden=true;
    if(!selected.length){busy=false;message("等待班级数据。");return;}
    message("正在读取班级数据…");
    try{
      const loaded=[];
      for(const f of selected){if(!/\.xlsx$/i.test(f.name))throw new Error(`${f.name}：仅支持 XLSX 文件。`);loaded.push(await QualityAnalysis.parse(await f.arrayBuffer(),f.name));}
      if(token!==revision)return;
      const keys=new Set();for(const g of loaded){const key=JSON.stringify([g.semester,g.subject,g.className,g.teacher]);if(keys.has(key))throw new Error(`${g.className}：重复上传同一班级，每个班级请保留一份数据。`);keys.add(key);}
      groups=loaded;busy=false;renderStudents();document.querySelector("#quality-settings-panel").hidden=false;document.querySelector("#quality-preview-panel").hidden=false;updatePreview();
    }catch(error){if(token===revision){busy=false;message(error.message,true);}}
  }
  files.addEventListener("change",()=>load([...files.files]));
  document.querySelectorAll("[data-threshold],[data-threshold-operator]").forEach(input=>input.addEventListener("input",()=>updatePreview(false)));
  const upload=document.querySelector(".quality-upload");upload.addEventListener("dragover",e=>e.preventDefault());upload.addEventListener("drop",e=>{e.preventDefault();load([...e.dataTransfer.files]);});
  function copiedTable(){
    const original=document.querySelector("#quality-report"),table=original.cloneNode(true);
    const originals=[...original.querySelectorAll("input,select")];
    [...table.querySelectorAll("input,select")].forEach((control,i)=>control.value=originals[i].value);
    table.style.cssText="border-collapse:collapse;font-family:Arial,'Microsoft YaHei',sans-serif;font-size:11pt;";
    [...table.querySelectorAll("input,select")].forEach(control=>{const text=control.tagName==="SELECT"?control.selectedOptions[0].textContent:control.value;control.replaceWith(document.createTextNode(text));});
    table.querySelectorAll("th,td").forEach(cell=>{const secondary=cell.tagName==="TH"&&cell.closest("tr").rowIndex>=2;cell.style.cssText=`border:1px solid #222;padding:8px;text-align:center;vertical-align:middle;background:${cell.tagName==="TH"?secondary?"#fbe8e2":"#9f2633":"#ffffff"};color:${cell.tagName==="TH"&&!secondary?"#ffffff":"#222222"};`;});
    const matrix=[],occupied=[];
    [...table.rows].forEach((row,r)=>{matrix[r]||=[];occupied[r]||=[];let c=0;[...row.cells].forEach(cell=>{while(occupied[r][c])c++;const text=cell.textContent.trim();for(let rr=r;rr<r+cell.rowSpan;rr++){matrix[rr]||=[];occupied[rr]||=[];for(let cc=c;cc<c+cell.colSpan;cc++){occupied[rr][cc]=true;matrix[rr][cc]=rr===r&&cc===c?text:"";}}c+=cell.colSpan;});});
    return {html:table.outerHTML,text:matrix.map(row=>Array.from({length:19},(_,i)=>String(row[i]??"").replace(/[\t\r\n]+/g," ")).join("\t")).join("\n")};
  }
  copyButton.addEventListener("click",async()=>{
    const data=copiedTable();
    try{
      if(navigator.clipboard?.write&&typeof ClipboardItem!=="undefined")await navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([data.html],{type:"text/html"}),"text/plain":new Blob([data.text],{type:"text/plain"})})]);
      else {const handler=e=>{e.clipboardData.setData("text/html",data.html);e.clipboardData.setData("text/plain",data.text);e.preventDefault();};document.addEventListener("copy",handler);let success;try{success=document.execCommand("copy");}finally{document.removeEventListener("copy",handler);}if(!success)throw new Error("浏览器未允许复制，请使用下载Excel。");}
      message("表格已复制，可粘贴到 Excel 或 Word；支持带格式及纯文本粘贴。");
    }catch(error){message(`复制失败：${error.message}。可使用下载Excel。`,true);}
  });
  exportButton.addEventListener("click",async()=>{
    if(busy)return;busy=true;exportButton.disabled=true;copyButton.disabled=true;files.disabled=true;
    const controls=[...document.querySelectorAll("#quality-settings input,#quality-report input,#quality-report select")];controls.forEach(e=>e.disabled=true);
    try{
      const month=document.querySelector("#quality-month").value;
      const blob=await QualityAnalysis.exportWorkbook(groups,month),url=URL.createObjectURL(blob),link=document.createElement("a");
      link.href=url;link.download=`${month?month+"-":""}学科质量分析表.xlsx`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
      message("Excel 已生成，包含质量分析表、统计口径和学生明细，保留模板样式与计算公式。");
    }catch(error){message(error.message,true);}
    finally{busy=false;exportButton.disabled=!groups.length;copyButton.disabled=exportButton.disabled;files.disabled=false;controls.forEach(e=>e.disabled=false);}
  });
})();
