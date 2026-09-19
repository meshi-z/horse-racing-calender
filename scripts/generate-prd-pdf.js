import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const prdPath = path.join(rootDir, 'docs', 'PRD.md');
const iconPath = path.join(rootDir, 'docs', 'assets', 'new_icon_master.png');
const outputPdfPath = path.join(rootDir, 'docs', 'Horse_Racing_Calendar_PRD.pdf');
const tempHtmlPath = path.join(rootDir, 'docs', '_temp_prd.html');

console.log('Reading PRD.md...');
const markdown = fs.readFileSync(prdPath, 'utf8');

// Extract Version dynamically from PRD.md
const versionMatch = markdown.match(/\|\s*\*\*バージョン\*\*\s*\|\s*([^|\s]+)\s*\|/);
const currentVersion = versionMatch ? versionMatch[1].trim() : 'v1.16.0';
console.log(`Detected PRD version: ${currentVersion}`);

console.log('Reading icon asset...');
const iconBase64 = fs.readFileSync(iconPath).toString('base64');
const iconDataUri = `data:image/png;base64,${iconBase64}`;

// Extract headings for Table of Contents
function extractToc(md) {
  const lines = md.split(/\r?\n/);
  const toc = [];
  let h2Count = 0;

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.*)$/);
    if (h2Match) {
      h2Count++;
      const title = h2Match[1].trim();
      toc.push({ level: 2, title, id: `section-${h2Count}` });
    }
  }
  return toc;
}

const tocList = extractToc(markdown);

// Markdown to HTML converter tailored for PRD.md
function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  let html = '';
  let inCodeBlock = false;
  let codeBlockContent = '';
  let inTable = false;
  let tableHeaderParsed = false;
  let inList = false;
  let listType = 'ul'; // 'ul' or 'ol'
  let h2Index = 0;

  function closeList() {
    if (inList) {
      html += `</${listType}>\n`;
      inList = false;
    }
  }

  function closeTable() {
    if (inTable) {
      html += '</tbody>\n</table>\n</div>\n';
      inTable = false;
      tableHeaderParsed = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html += `<pre><code>${escapeHtml(codeBlockContent)}</code></pre>\n`;
        codeBlockContent = '';
        inCodeBlock = false;
      } else {
        closeList();
        closeTable();
        inCodeBlock = true;
        codeBlockContent = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += (codeBlockContent ? '\n' : '') + line;
      continue;
    }

    // Horizontal Rule
    if (/^---+\s*$/.test(line.trim())) {
      closeList();
      closeTable();
      html += '<hr />\n';
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      closeList();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        tableHeaderParsed = true;
        continue;
      }

      if (!inTable) {
        html += '<div class="table-container">\n<table>\n';
        html += '<thead>\n<tr>\n';
        for (const cell of cells) {
          html += `  <th>${formatInline(cell)}</th>\n`;
        }
        html += '</tr>\n</thead>\n<tbody>\n';
        inTable = true;
      } else {
        html += '<tr>\n';
        for (const cell of cells) {
          html += `  <td>${formatInline(cell)}</td>\n`;
        }
        html += '</tr>\n';
      }
      continue;
    } else {
      closeTable();
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      
      if (level === 2) {
        h2Index++;
        html += `<h2 id="section-${h2Index}">${formatInline(text)}</h2>\n`;
      } else {
        html += `<h${level}>${formatInline(text)}</h${level}>\n`;
      }
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      closeList();
      const content = line.trim().replace(/^>\s*/, '');
      html += `<blockquote>${formatInline(content)}</blockquote>\n`;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        html += '<ol>\n';
        inList = true;
        listType = 'ol';
      }
      const itemText = olMatch[3];
      html += `  <li>${formatInline(itemText)}</li>\n`;
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (ulMatch) {
      const indent = ulMatch[1].length;
      if (!inList || listType !== 'ul') {
        closeList();
        html += '<ul>\n';
        inList = true;
        listType = 'ul';
      }
      const itemText = ulMatch[2];
      const subClass = indent >= 2 ? ' class="nested"' : '';
      html += `  <li${subClass}>${formatInline(itemText)}</li>\n`;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      closeList();
      continue;
    }

    // Paragraph
    closeList();
    html += `<p>${formatInline(line.trim())}</p>\n`;
  }

  closeList();
  closeTable();
  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInline(text) {
  let res = escapeHtml(text);

  // LaTeX arrows and math
  res = res.replace(/\$\\rightarrow\$/g, '→');
  res = res.replace(/\$\\leftrightarrow\$/g, '↔');
  res = res.replace(/\$([^\$]+)\$/g, '<em>$1</em>');

  // Bold
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Inline code
  res = res.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links: [label](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Line breaks in table cells
  res = res.replace(/&lt;br\s*\/?&gt;/gi, '<br>');

  // Highlight status tags
  res = res.replace(/\[完了\]/g, '<span class="badge-done">完了</span>');
  res = res.replace(/\[現在着手\]/g, '<span class="badge-current">現在着手</span>');
  res = res.replace(/\[開発着手 \/ Current\]/g, '<span class="badge-current">開発着手 / Current</span>');
  res = res.replace(/\[次のステップ\]/g, '<span class="badge-next">次のステップ</span>');

  return res;
}

const bodyContent = markdownToHtml(markdown);

// Generate TOC HTML
const tocHtml = `
  <div class="toc-card">
    <div class="toc-header">
      <span class="toc-title">目次 / Table of Contents</span>
    </div>
    <div class="toc-grid">
      ${tocList.map(item => `
        <a href="#${item.id}" class="toc-item">
          <span class="toc-num">${item.title.split('.')[0] || ''}</span>
          <span class="toc-text">${formatInline(item.title.replace(/^[0-9]+\.\s*/, ''))}</span>
        </a>
      `).join('')}
    </div>
  </div>
`;

// HTML Template with Brand Color Styling (#047B5F)
const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Horse Racing Calendar PRD ${currentVersion}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 15mm 14mm;
      @top-left {
        content: "重賞カレンダー プロダクト要求仕様書 (PRD)";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", Meiryo, sans-serif;
        font-size: 8pt;
        color: #64748b;
        font-weight: 500;
        border-bottom: 0.75px solid #e2e8f0;
        padding-bottom: 4px;
        margin-bottom: 8px;
      }
      @top-right {
        content: "${currentVersion} | 公式テーマカラー #047B5F";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", Meiryo, sans-serif;
        font-size: 8pt;
        color: #047b5f;
        font-weight: 600;
        border-bottom: 0.75px solid #e2e8f0;
        padding-bottom: 4px;
        margin-bottom: 8px;
      }
      @bottom-left {
        content: "Confidential - horse-racing-calendar Project";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", Meiryo, sans-serif;
        font-size: 7.5pt;
        color: #94a3b8;
        border-top: 0.75px solid #e2e8f0;
        padding-top: 4px;
      }
      @bottom-right {
        content: "Page " counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", Meiryo, sans-serif;
        font-size: 8pt;
        color: #047b5f;
        font-weight: 700;
        border-top: 0.75px solid #e2e8f0;
        padding-top: 4px;
      }
    }

    :root {
      --primary: #047b5f;
      --primary-dark: #035e49;
      --primary-light: #f0fdf8;
      --primary-tint: #e6f7f2;
      --primary-border: #a7f3d0;
      --border-color: #cbd5e1;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --code-bg: #0f172a;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "BIZ UDPGothic", Meiryo, sans-serif;
      font-size: 9.05pt;
      line-height: 1.55;
      color: var(--text-main);
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Cover / Header section */
    .doc-header {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 14px 18px;
      background: linear-gradient(135deg, #f0fdf8 0%, #e6f7f2 100%);
      border: 1.5px solid var(--primary-border);
      border-radius: 12px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .doc-icon {
      width: 72px;
      height: 72px;
      border-radius: 15px;
      box-shadow: 0 4px 12px rgba(4, 123, 95, 0.22);
      object-fit: cover;
      flex-shrink: 0;
      background-color: #047b5f;
      border: 2px solid #ffffff;
    }

    .doc-title-group {
      flex: 1;
    }

    .doc-badge-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      flex-wrap: wrap;
    }

    .doc-badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 9999px;
      background-color: var(--primary);
      color: #ffffff;
      letter-spacing: 0.03em;
    }

    .doc-badge-secondary {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 600;
      padding: 1.5px 7px;
      border-radius: 9999px;
      background-color: #ffffff;
      color: var(--primary-dark);
      border: 1px solid var(--primary);
    }

    .doc-badge-accent {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 1.5px 7px;
      border-radius: 9999px;
      background-color: #0284c7;
      color: #ffffff;
    }

    .doc-title {
      margin: 0 0 3px 0;
      font-size: 16pt;
      font-weight: 800;
      color: var(--primary-dark);
      letter-spacing: -0.02em;
      line-height: 1.25;
    }

    .doc-subtitle {
      margin: 0;
      font-size: 9.2pt;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Table of Contents */
    .toc-card {
      background-color: #f8faf9;
      border: 1px solid var(--primary-border);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .toc-header {
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
    }

    .toc-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: var(--primary-dark);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 14px;
    }

    .toc-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 8.5pt;
      color: #334155;
      text-decoration: none;
      padding: 2px 0;
    }

    .toc-num {
      display: inline-block;
      min-width: 18px;
      font-weight: 700;
      color: var(--primary);
    }

    .toc-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Headings */
    h1 {
      display: none;
    }

    h2 {
      font-size: 12pt;
      font-weight: 700;
      color: var(--primary-dark);
      border-left: 5px solid var(--primary);
      background: linear-gradient(to right, var(--primary-light), transparent);
      padding: 5px 10px;
      margin-top: 20px;
      margin-bottom: 10px;
      border-radius: 0 4px 4px 0;
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 700;
      color: var(--primary-dark);
      margin-top: 15px;
      margin-bottom: 6px;
      padding-bottom: 3px;
      border-bottom: 1.5px solid var(--primary-tint);
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    h4 {
      font-size: 9.6pt;
      font-weight: 700;
      color: #334155;
      margin-top: 11px;
      margin-bottom: 4px;
      page-break-after: avoid;
    }

    p {
      margin: 0 0 8px 0;
      text-align: justify;
    }

    strong {
      color: #0f172a;
      font-weight: 700;
    }

    /* Lists */
    ul, ol {
      margin: 0 0 8px 0;
      padding-left: 20px;
    }

    li {
      margin-bottom: 2px;
      line-height: 1.52;
    }

    li.nested {
      list-style-type: circle;
      margin-left: 6px;
    }

    /* Tables */
    .table-container {
      margin: 10px 0 13px 0;
      page-break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.4pt;
      line-height: 1.46;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    th {
      background-color: var(--primary);
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 6px 9px;
      border: 1px solid #035e49;
      white-space: nowrap;
    }

    td {
      padding: 5px 9px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background-color: #f8faf9;
    }

    /* Code Blocks & Inline Code */
    code {
      font-family: "Cascadia Code", Consolas, Menlo, Monaco, monospace;
      font-size: 8.1pt;
      background-color: #edf4f1;
      color: var(--primary-dark);
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #d1e5dc;
      word-break: break-word;
    }

    pre {
      background-color: var(--code-bg);
      color: #f8fafc;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 7.9pt;
      line-height: 1.42;
      overflow-x: auto;
      margin: 8px 0 12px 0;
      page-break-inside: avoid;
      border: 1px solid #334155;
    }

    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: inherit;
    }

    /* Blockquote */
    blockquote {
      margin: 8px 0 10px 0;
      padding: 6px 12px;
      background-color: var(--primary-light);
      border-left: 3.5px solid var(--primary);
      border-radius: 0 4px 4px 0;
      font-size: 8.8pt;
      color: #334155;
      page-break-inside: avoid;
    }

    blockquote p {
      margin: 0;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 14px 0;
    }

    a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
    }

    /* Status Badges */
    .badge-done {
      display: inline-block;
      font-size: 7.2pt;
      font-weight: 700;
      color: #047b5f;
      background-color: #e6f7f2;
      border: 1px solid #a7f3d0;
      padding: 0.5px 5px;
      border-radius: 3px;
      margin-left: 4px;
      vertical-align: middle;
      white-space: nowrap;
    }

    .badge-current {
      display: inline-block;
      font-size: 7.2pt;
      font-weight: 700;
      color: #0369a1;
      background-color: #e0f2fe;
      border: 1px solid #7dd3fc;
      padding: 0.5px 5px;
      border-radius: 3px;
      margin-left: 4px;
      vertical-align: middle;
      white-space: nowrap;
    }

    .badge-next {
      display: inline-block;
      font-size: 7.2pt;
      font-weight: 700;
      color: #b45309;
      background-color: #fef3c7;
      border: 1px solid #fde68a;
      padding: 0.5px 5px;
      border-radius: 3px;
      margin-left: 4px;
      vertical-align: middle;
      white-space: nowrap;
    }
  </style>
</head>
<body>

  <!-- Top Hero Header with Brand Icon -->
  <div class="doc-header">
    <img src="${iconDataUri}" alt="App Icon" class="doc-icon" />
    <div class="doc-title-group">
      <div class="doc-badge-row">
        <span class="doc-badge">PRD (プロダクト要求仕様書)</span>
        <span class="doc-badge-secondary">${currentVersion}</span>
        <span class="doc-badge-secondary">SPA / PWA</span>
        <span class="doc-badge-secondary">公式テーマ: #047B5F</span>
        <span class="doc-badge-accent">i18n (日/英対応)</span>
      </div>
      <h1 class="doc-title">重賞カレンダーサービス 要求仕様書</h1>
      <p class="doc-subtitle">JRA Graded Races Calendar Web Application Specifications</p>
    </div>
  </div>

  ${tocHtml}

  ${bodyContent}

</body>
</html>
`;

console.log('Writing temporary HTML...');
fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

console.log('Generating PDF via Headless Chrome...');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const cmd = `"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('PDF successfully generated at:', outputPdfPath);
} catch (err) {
  console.error('Failed to run chrome:', err);
  process.exit(1);
} finally {
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
}
