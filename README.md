# TeacHub

TeacHub is a static, offline-friendly teacher work toolkit. It collects template automation, teaching tools, office utilities, and common software links in one browser-based workspace.

## Features

- Template filling for existing Word, Excel, and weekly briefing templates.
- Prompt-first workflow for AI tools such as ChatGPT, DeepSeek, and Gemini.
- Local file generation in the browser using front-end JavaScript.
- Teaching, office, and software tool directories with external links.
- No backend service is required.
- Monthly summaries with subject quality analysis from school grade-export XLSX files.

## Usage

Open `index.html` directly in a browser, or publish this folder with GitHub Pages.

For template automation:

1. Open a template entry.
2. Copy the prompt into an AI tool.
3. Paste the returned JSON into TeacHub.
4. Add images when the template requires them.
5. Generate and download the local output file.

## GitHub Pages

For subject quality analysis, open **月度总结 → 学科质量分析** and drag school grade-export XLSX files into the upload area. Final scores come from the 100-point `学期成绩` column. Edit student scores, prior averages, and target counts directly on the page. Set the excellent/good/pass cutoffs and `>` or `≥` operators in the template's headers; counts, average changes, and completion rates update immediately. Thresholds start blank and attainment counts remain blank until set. Completion is attained students divided by target students, and is blank for missing or zero targets. **复制数据** copies only the subject data rows, without headers, in HTML table and tab-separated text formats. Downloaded XLSX files preserve the template, calculation formulas, scoring settings, original scores, and edited final scores. Uploaded student data stays in the browser and is not saved by the site.

This project is designed to run as a static site. All template and image generation happens in the user's browser.
