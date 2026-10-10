function item(id, name, description, icon, color, tags, extra = {}) {
  return {
    id,
    name,
    description,
    icon,
    color,
    tags: tags.slice(0, 2),
    type: extra.type || "工具条目",
    path: extra.path || "",
    macPath: extra.macPath || "",
    url: extra.url || "",
    fillTemplate: extra.fillTemplate || "",
    input: extra.input || "按条目说明准备",
    output: extra.output || "按需打开或复制",
    prompt: extra.prompt || "",
    note: extra.note || "请优先使用官网入口；如需离线安装包，后续可补充本地路径。"
  };
}

const VIEWS = {
  monthly: {
    label: "月度总结",
    sections: [{
      id: "subject-quality",
      title: "学科质量分析",
      items: [item("subject-quality-analysis", "学科质量分析", "导入成绩，编辑分析表，复制数据或下载 Excel。", "析", "red", ["Excel", "本地"], {
        type: "成绩分析",
        path: "quality-analysis.html",
        input: "班级成绩 XLSX",
        output: "Excel 质量分析表"
      })]
    }]
  },
  templates: {
    label: "模板填充",
    sections: [
      {
        id: "teaching-templates",
        title: "教学模板",
        items: [
          item("lesson-plan-fill", "Lesson Plan", "粘贴 AI JSON 后生成教案 Word 文件。", "LP", "blue", ["Prompt", "本地"], {
            type: "模板填充",
            path: "templates/lesson-plan.docx",
            input: "Lesson Plan JSON",
            output: "DOCX 教案文件",
            fillTemplate: "lesson-plan",
            note: "基于 Auto Fill Template 项目的 Lesson Plan 字段合同迁移。"
          }),
          item("course-syllabus-fill", "Course Syllabus", "粘贴 AI JSON 后生成课程大纲 Excel 文件。", "XL", "green", ["Prompt", "本地"], {
            type: "模板填充",
            path: "templates/course-syllabus.xlsx",
            input: "Course Syllabus JSON",
            output: "XLSX 课程大纲文件",
            fillTemplate: "course-syllabus",
            note: "基于 Auto Fill Template 项目的 Course Syllabus 字段合同迁移。"
          })
        ]
      },
      {
        id: "club-templates",
        title: "社团模板",
        items: [
          item("club-work-plan-fill", "社团工作计划", "说明社团名称、内容和安排后生成工作计划。", "计", "purple", ["Prompt", "本地"], {
            type: "模板填充",
            path: "templates/club-work-plan.docx",
            input: "社团工作计划 JSON",
            output: "DOCX 工作计划",
            fillTemplate: "club-work-plan",
            note: "适合从社团名称、课程内容、学期安排等基础信息生成正式工作计划。"
          }),
          item("club-work-summary-fill", "社团工作总结", "上传活动图片并粘贴 AI JSON，生成图文总结。", "总", "orange", ["图片", "本地"], {
            type: "图文生成",
            path: "templates/club-work-summary-reference.docx",
            input: "社团总结 JSON + 活动图片",
            output: "DOCX 图文总结",
            fillTemplate: "club-work-summary",
            note: "适合把 AI 总结文字和本地活动照片自动排版为 Word 文档。"
          })
        ]
      },
      {
        id: "weekly-templates",
        title: "周报模板",
        items: [
          item("weekly-brief-fill", "国际部周工作简报", "上传图片并粘贴 AI JSON，生成竖版简报图片。", "报", "red", ["图片", "本地"], {
            type: "图片生成",
            path: "templates/weekly-brief-reference.pptx",
            input: "周简报 JSON + 活动图片",
            output: "PNG 简报图片",
            fillTemplate: "weekly-brief",
            note: "适合生成可直接发送或粘贴到文档中的周工作简报图片。"
          })
        ]
      }
    ]
  },
  teaching: {
    label: "教学工具",
    sections: [
      {
        id: "interaction",
        title: "课堂互动",
        items: [
          item("kahoot", "Kahoot!", "制作课堂抢答、测验和游戏化复习活动。", "K!", "purple", ["在线", "互动"], {
            type: "在线工具",
            url: "https://kahoot.com/",
            input: "题目、选项、课堂活动主题",
            output: "互动测验或课堂游戏"
          }),
          item("wayground", "Wayground / Quizizz", "生成测验、练习和学生自 paced 任务。", "QZ", "green", ["在线", "互动"], {
            type: "在线工具",
            url: "https://wayground.com/",
            input: "题目、知识点或课堂材料",
            output: "在线测验、练习或作业"
          }),
          item("wordwall", "Wordwall", "快速制作配对、转盘、闪卡和可打印练习。", "W", "orange", ["在线", "活动"], {
            type: "在线工具",
            url: "https://wordwall.net/",
            input: "词汇、概念、题干和答案",
            output: "互动活动或纸质练习"
          })
        ]
      },
      {
        id: "science-math",
        title: "科学数学",
        items: [
          item("phet", "PhET 模拟实验", "展示物理、化学、生物和数学现象。", "⚗", "green", ["在线", "常用"], {
            type: "在线工具",
            url: "https://phet.colorado.edu/zh_CN/",
            input: "课程主题或实验现象",
            output: "可交互模拟实验"
          }),
          item("geogebra", "GeoGebra", "几何、函数、统计和 3D 可视化演示。", "G", "blue", ["在线", "数学"], {
            type: "在线工具",
            url: "https://www.geogebra.org/",
            input: "函数、几何结构或数据",
            output: "交互图形、课堂活动或计算器"
          }),
          item("desmos", "Desmos", "函数图像、活动课堂和数学可视化。", "D", "green", ["在线", "数学"], {
            type: "在线工具",
            url: "https://www.desmos.com/",
            input: "函数、表格或课堂活动",
            output: "动态图像或课堂活动"
          }),
          item("canva-education", "Canva 教育版", "制作课堂海报、简报、信息图和学生作品。", "C", "pink", ["在线", "设计"], {
            type: "在线工具",
            url: "https://www.canva.com/education/",
            input: "课程主题、图片和文字",
            output: "海报、演示文稿、视频或信息图"
          }),
          item("canvas-lms", "Canvas LMS", "课程资料、作业、测验和班级管理平台入口。", "CV", "slate", ["在线", "平台"], {
            type: "在线平台",
            url: "https://www.instructure.com/canvas",
            input: "课程资料、作业和学生名单",
            output: "在线课程空间"
          })
        ]
      }
    ]
  },
  office: {
    label: "办公工具",
    sections: [
      {
        id: "pdf",
        title: "PDF 工具",
        items: [
          item("ilovepdf", "I Love PDF", "处理 PDF 合并、拆分、压缩和转换。", "PDF", "red", ["在线", "常用"], {
            type: "在线工具",
            url: "https://www.ilovepdf.com/",
            input: "PDF 文件",
            output: "处理后的 PDF 或 Office 文件"
          }),
          item("smallpdf", "Smallpdf", "PDF 压缩、转换、签名和常用处理入口。", "S", "blue", ["在线", "PDF"], {
            type: "在线工具",
            url: "https://smallpdf.com/",
            input: "PDF 或 Office 文件",
            output: "处理后的 PDF 或 Office 文件"
          }),
          item("pdf24", "PDF24 Tools", "PDF OCR、网页转 PDF、压缩和离线工具入口。", "24", "orange", ["在线", "PDF"], {
            type: "在线工具",
            url: "https://tools.pdf24.org/",
            input: "PDF、图片或网页",
            output: "PDF、图片或可编辑文件"
          }),
          item("adobe-acrobat-online", "Adobe Acrobat Online", "PDF 转换、压缩、签名和基础编辑。", "A", "red", ["在线", "PDF"], {
            type: "在线工具",
            url: "https://www.adobe.com/acrobat/online.html",
            input: "PDF 或 Office 文件",
            output: "转换、压缩、签名或编辑后的 PDF"
          })
        ]
      },
      {
        id: "word-tools",
        title: "Word 工具",
        items: [
          item("aspose-words", "Aspose.Words", "Word 合并、拆分、压缩、转 PDF 和提取图片。", "W", "blue", ["在线", "Word"], {
            type: "在线工具",
            url: "https://products.aspose.app/words/family",
            input: "DOC、DOCX、RTF 或文本文件",
            output: "合并、拆分、转换或处理后的文档"
          }),
          item("groupdocs-word-merge", "GroupDocs Word Merger", "多个 Word 文件合并为一个 DOCX 或 PDF。", "WM", "green", ["在线", "合并"], {
            type: "在线工具",
            url: "https://products.groupdocs.app/merger/word",
            input: "多个 Word 文件",
            output: "合并后的 Word 或 PDF"
          }),
          item("word-to-pdf", "Word 转 PDF", "将 Word 文档快速转换为 PDF。", "2P", "orange", ["在线", "转换"], {
            type: "在线工具",
            url: "https://products.groupdocs.app/conversion/word-to-pdf",
            input: "DOC 或 DOCX 文件",
            output: "PDF 文件"
          })
        ]
      },
      {
        id: "ppt-tools",
        title: "PPT 工具",
        items: [
          item("aspose-slides", "Aspose.Slides", "PPT 合并、拆分、转 PDF、转图片、加水印和编辑。", "PPT", "orange", ["在线", "PPT"], {
            type: "在线工具",
            url: "https://products.aspose.app/slides/family/",
            input: "PPT、PPTX 或 ODP 文件",
            output: "合并、拆分、转换或处理后的演示文件"
          }),
          item("groupdocs-ppt-merge", "GroupDocs PPT Merger", "多个 PPT 文件在线合并为一个演示文稿。", "PM", "purple", ["在线", "合并"], {
            type: "在线工具",
            url: "https://products.groupdocs.app/merger/powerpoint",
            input: "多个 PPT 或 PPTX 文件",
            output: "合并后的演示文稿"
          }),
          item("word-to-ppt", "Word 转 PPT", "把 Word 文档或图片转换为 PowerPoint 文件。", "WP", "red", ["在线", "转换"], {
            type: "在线工具",
            url: "https://products.aspose.app/slides/conversion/word-to-pptx",
            input: "Word 文档",
            output: "PPTX 演示文稿"
          })
        ]
      },
      {
        id: "graphics",
        title: "图形图片",
        items: [
          item("tinypng", "TinyPNG", "压缩 PNG、JPG 和 WebP，适合处理活动照片。", "PNG", "green", ["在线", "图片"], {
            type: "在线工具",
            url: "https://tinypng.com/",
            input: "PNG、JPG、WebP 图片",
            output: "压缩后的图片"
          }),
          item("remove-bg", "remove.bg", "快速去除人物、器材和活动图片背景。", "BG", "pink", ["在线", "图片"], {
            type: "在线工具",
            url: "https://www.remove.bg/",
            input: "人物或物体图片",
            output: "透明背景图片"
          }),
          item("photopea", "Photopea", "浏览器内编辑图片、PSD、海报和简单设计稿。", "P", "purple", ["在线", "编辑"], {
            type: "在线工具",
            url: "https://www.photopea.com/",
            input: "图片、PSD、PDF 或设计素材",
            output: "编辑后的图片或设计文件"
          })
        ]
      },
      {
        id: "text-ocr",
        title: "文字 OCR",
        items: [
          item("online-ocr", "OnlineOCR", "从图片和扫描件中提取可复制文字。", "OCR", "cyan", ["在线", "识别"], {
            type: "在线工具",
            url: "https://www.onlineocr.net/",
            input: "图片或扫描 PDF",
            output: "可复制文本或 Word"
          }),
          item("pdf24-ocr", "PDF24 OCR", "识别扫描 PDF，并生成可搜索或可复制文本。", "24", "orange", ["在线", "OCR"], {
            type: "在线工具",
            url: "https://tools.pdf24.org/en/ocr-pdf",
            input: "扫描 PDF 或图片 PDF",
            output: "可搜索 PDF 或识别文本"
          })
        ]
      },
      {
        id: "format",
        title: "文件格式",
        items: [
          item("cloudconvert", "CloudConvert", "转换文档、图片、音视频、压缩包等格式。", "↔", "orange", ["在线", "转换"], {
            type: "在线工具",
            url: "https://cloudconvert.com/",
            input: "文档、图片、音视频或压缩包",
            output: "目标格式文件"
          })
        ]
      }
    ]
  },
  software: {
    label: "常用软件",
    sections: [
      {
        id: "pdf-doc-software",
        title: "PDF 文档",
        items: [
          item("adobe-acrobat-reader", "Adobe Acrobat Reader", "查看、批注、签名和打印 PDF 文件。", "A", "red", ["Win", "Mac"], {
            type: "安装入口",
            url: "https://get.adobe.com/reader/",
            input: "PDF 文件",
            output: "阅读、批注或签名"
          }),
          item("pdfgear", "PDFGear", "本地 PDF 阅读、编辑和基础转换。", "PDF", "purple", ["Win", "PDF"], {
            type: "安装入口",
            url: "https://www.pdfgear.com/",
            input: "PDF 文件",
            output: "编辑或转换后的 PDF"
          }),
          item("pdf24-creator", "PDF24 Creator", "Windows 本地 PDF 创建、转换、压缩和 OCR。", "24", "orange", ["Win", "PDF"], {
            type: "安装入口",
            url: "https://tools.pdf24.org/en/creator",
            input: "PDF、图片或 Office 文件",
            output: "本地 PDF 处理结果"
          })
        ]
      },
      {
        id: "capture-software",
        title: "截图演示",
        items: [
          item("zoomit", "ZoomIt", "屏幕放大、标注、计时和演示录制工具。", "ZI", "blue", ["Win", "演示"], {
            type: "安装入口",
            url: "https://learn.microsoft.com/en-us/sysinternals/downloads/zoomit",
            input: "屏幕展示或课堂演示",
            output: "放大、标注、计时或录屏"
          }),
          item("faststone-capture", "FastStone Capture", "截图、滚动截屏、标注、OCR 和录屏。", "FS", "red", ["Win", "截图"], {
            type: "安装入口",
            url: "https://www.faststone.org/FSCaptureDetail.htm",
            input: "屏幕、窗口、滚动页面",
            output: "截图、标注图或录屏"
          }),
          item("snipaste", "Snipaste", "截图、贴图和临时标注素材。", "SP", "green", ["Win", "Mac"], {
            type: "安装入口",
            url: "https://www.snipaste.com/",
            input: "屏幕区域或参考资料",
            output: "截图、贴图或标注"
          }),
          item("screentogif", "ScreenToGif", "录制屏幕区域并导出 GIF、视频或帧图。", "GIF", "purple", ["Win", "录屏"], {
            type: "安装入口",
            url: "https://www.screentogif.com/",
            input: "屏幕区域、摄像头或画板",
            output: "GIF、视频或图片序列"
          }),
          item("sharex", "ShareX", "截图、录屏、OCR、自动上传和工作流工具。", "SX", "cyan", ["Win", "截图"], {
            type: "安装入口",
            url: "https://getsharex.com/",
            input: "屏幕区域、窗口或文件",
            output: "截图、录屏或自动化上传"
          })
        ]
      },
      {
        id: "system-software",
        title: "系统效率",
        items: [
          item("powertoys", "Microsoft PowerToys", "窗口布局、批量重命名、OCR、取色等效率工具。", "PT", "blue", ["Win", "效率"], {
            type: "安装入口",
            url: "https://learn.microsoft.com/en-us/windows/powertoys/",
            input: "Windows 系统操作",
            output: "效率工具集合"
          }),
          item("everything", "Everything", "快速搜索 Windows 本地文件和文件夹。", "EV", "slate", ["Win", "搜索"], {
            type: "安装入口",
            url: "https://www.voidtools.com/",
            input: "文件名或路径关键词",
            output: "本地文件搜索结果"
          }),
          item("7zip", "7-Zip", "免费解压缩工具，处理 zip、rar、7z 等资料包。", "7Z", "orange", ["Win", "压缩"], {
            type: "安装入口",
            url: "https://www.7-zip.org/",
            input: "压缩包或文件夹",
            output: "解压文件或压缩包"
          }),
          item("localsend", "LocalSend", "无账号跨平台局域网传输文件。", "LS", "cyan", ["Win", "Mac"], {
            type: "安装入口",
            url: "https://localsend.org/",
            input: "文件、图片、文本",
            output: "局域网传输"
          })
        ]
      },
      {
        id: "mac-tools",
        title: "Mac 工具",
        items: [
          item("raycast", "Raycast", "快速启动应用、搜索文件、调用快捷命令。", "R", "purple", ["Mac", "效率"], {
            type: "安装入口",
            url: "https://www.raycast.com/",
            input: "应用、文件、剪贴板和快捷命令",
            output: "快速启动和系统级效率操作"
          }),
          item("rectangle", "Rectangle", "用快捷键或吸附区域管理 Mac 窗口。", "▣", "blue", ["Mac", "窗口"], {
            type: "安装入口",
            url: "https://rectangleapp.com/",
            input: "Mac 窗口",
            output: "快速分屏和窗口排列"
          }),
          item("appcleaner", "AppCleaner", "卸载应用并清理关联文件。", "AC", "green", ["Mac", "清理"], {
            type: "安装入口",
            url: "https://freemacsoft.net/appcleaner/",
            input: "Mac 应用",
            output: "卸载并清理相关文件"
          }),
          item("keka", "Keka", "Mac 压缩与解压缩工具。", "K", "orange", ["Mac", "压缩"], {
            type: "安装入口",
            url: "https://www.keka.io/",
            input: "压缩包或文件夹",
            output: "解压文件或压缩包"
          })
        ]
      }
    ]
  }
};
