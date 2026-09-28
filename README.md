# Excel Compare & Audit | نظام تدقيق ومطابقة كشوفات Excel

A complete professional web application for comparing and auditing two Excel/CSV files in the browser. No backend, no upload of file contents, no cloud storage — everything runs locally in your browser.

تطبيق ويب احترافي كامل لمقارنة وتدقيق ملفين من ملفات Excel أو CSV داخل المتصفح. لا توجد خوادم خلفية، ولا يتم رفع محتوى الملفات، ولا تخزين سحابي — كل المعالجة تتم محليًا داخل المتصفح.

---

## ✨ Features | المزايا

- **Universal file support**: `.xlsx`, `.xls`, `.csv` (different filenames, sheet names, column names, orders, counts).
- **Independent upload panels** with drag-and-drop, browse, replace, remove, validation.
- **Per-file worksheet and header-row selection** with live preview.
- **Dynamic column mapping** with Arabic + English synonym auto-suggestions.
- **National ID matching key** by default; any other unique identifier supported.
- **Identifier integrity**: leading zeros preserved, no fuzzy matching, duplicates flagged, blank IDs marked invalid.
- **Configurable comparison settings**: case sensitivity, whitespace, numeric precision, date handling.
- **Detailed dashboard**: matched, modified, missing, extra, duplicate, invalid, structural, percentage.
- **Searchable, sortable, paginated results table** with status filters.
- **Side-by-side differences panel** for every record.
- **Rich XLSX export**: full audit report (11 sheets), per-status exports, CSV.
- **Arabic RTL + English LTR** with toggle (default: Arabic RTL).
- **Light + Dark theme** toggle.
- **Privacy-by-design**: nothing leaves your browser.
- **Help drawer**, **demo data**, **sample file downloads**, **print-friendly** view.

---

## 🚀 Quick Start | تشغيل سريع

```bash
npm install
npm run dev       # local development
npm run build     # production build → dist/
```

Open `http://localhost:5173` after `npm run dev`.

---

## 📂 Project Structure | بنية المشروع

```
.
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types.ts
│   ├── context/
│   │   └── AppContext.tsx        # global state, theme, language, files, audit
│   ├── lib/
│   │   ├── excelReader.ts        # XLSX/XLS/CSV reading via SheetJS
│   │   ├── columnMapper.ts       # Arabic/English header synonym detection
│   │   ├── comparisonEngine.ts   # identifier-based audit logic
│   │   ├── reportExporter.ts     # XLSX/CSV report generation
│   │   ├── sampleData.ts         # demo dataset
│   │   ├── translations.ts       # AR + EN copy
│   │   └── utils.ts              # helpers
│   └── components/
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── Stepper.tsx
│       ├── UploadSection.tsx
│       ├── UploadPanel.tsx
│       ├── SheetsSection.tsx
│       ├── MappingSection.tsx
│       ├── SettingsSection.tsx
│       ├── AuditSection.tsx
│       ├── DashboardCards.tsx
│       ├── ResultsTable.tsx
│       ├── DetailsPanel.tsx
│       ├── ExportSection.tsx
│       ├── StatusBadge.tsx
│       ├── ToastTray.tsx
│       ├── HelpDrawer.tsx
│       └── LogoMark.tsx
└── public/
    ├── favicon.svg
    └── samples/
        ├── original-sample.csv
        └── comparison-sample.csv
```

---

## 📋 Workflow | خطوات العمل

1. **Upload Files** — drag-and-drop or browse; supports XLSX/XLS/CSV.
2. **Select Sheets & Headers** — independent worksheet and header-row selection per file.
3. **Map Columns** — auto-suggested mappings; confirm or edit; pick matching key (National ID by default).
4. **Audit Settings** — case, whitespace, numeric precision, date comparison, identifier length validation.
5. **Start Audit** — comparison runs locally; results appear on dashboard.
6. **Review Results** — sortable/filterable/paginated table; click any row for side-by-side differences.
7. **Export** — full XLSX report (Summary, Matched, Modified, Missing, Extra, Duplicate, Invalid, Detailed Differences, Mapping, Structural Differences, Settings), per-status XLSX exports, or CSV.

---

## 🔐 Privacy | الخصوصية

**EN**: Excel files are processed locally in your browser. File contents are not transmitted to external servers.

**AR**: تتم معالجة ملفات Excel محليًا داخل متصفحك، ولا يتم إرسال محتويات الملفات إلى خادم خارجي.

- No records or IDs are stored in `localStorage`.
- Source files are never modified.
- No external API calls are made for file processing.
- Only UI preferences (theme + language) are saved locally.

---

## ⚖️ Matching Rules | قواعد المطابقة

- Comparison is **identifier-based**, never row-based (sorting both files is safe).
- Identifiers are normalized with optional trim + case folding.
- Leading zeros are preserved (identifiers are treated as text).
- No partial or fuzzy matching of identifiers.
- Duplicate / blank / length-invalid identifiers are flagged, never silently matched.
- Field comparison supports numeric precision, date-aware comparison, and empty/blank equivalence.

---

## 📊 Output Statuses | حالات النتائج

| Status | Color | Meaning |
| --- | --- | --- |
| Matched | 🟢 Green | Record exists in both files; all enabled fields equal. |
| Modified | 🟠 Orange | Record exists in both; one or more fields differ. |
| Missing | 🔴 Red | Record exists in original only. |
| Extra | 🔵 Blue | Record exists in comparison only. |
| Duplicate | 🟣 Purple | Identifier appears multiple times. |
| Invalid | ⚪ Gray | Blank identifier, ambiguous match, or length-validation failure. |
| Structural | 🟣 Violet | Unmapped columns on either side. |

**Matching Percentage** = `matched / (originalCount − duplicates − invalid) × 100`. Ambiguous records are excluded from the reliable base.

---

## 🌐 Deployment | النشر

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Static Hosting
```bash
npm run build
# Upload contents of dist/ to any static host (Netlify, GitHub Pages, S3, etc.)
```

---

## ⚠️ Limitations | القيود

- Maximum file size: **50 MB** per file (browser memory bound).
- Very large sheets (>100k rows) may slow down — consider splitting into chunks.
- Macros, pivot tables, charts, and complex formatting are not preserved in exports (exported reports are *new* files; your originals are untouched).
- Numbers formatted as text with leading zeros rely on how your spreadsheet software stored them.

---

## 📦 Dependencies

- [SheetJS / xlsx](https://github.com/SheetJS/sheetjs) — Excel parsing & writing
- [React 19](https://react.dev) — UI
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [framer-motion](https://www.framer.com/motion/) — animations
- [lucide-react](https://lucide.dev) — icons

---

## 📜 License & Credits

© 2026 **WTDOsama** | **WTD Web Development**

Crafted for accurate, private, in-browser spreadsheet auditing.
