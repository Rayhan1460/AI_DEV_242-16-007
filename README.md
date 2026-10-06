# Tender Document Package Builder

**AI DevFest 2026 — Vibe Coding**

Tender Document Package Builder is a frontend-only web application that transforms multiple tender PDF documents into one complete, validated, correctly ordered, and submission-ready PDF package.

All tender and PDF processing happens locally inside the user's browser. The application does not require a participant-controlled backend, database, cloud storage, or external document-processing service.

---

## 🌐 Live Demo

https://ai-dev-242-16-007.vercel.app/

## 🚀 GitHub Repository

https://github.com/Rayhan1460/AI_DEV_242-16-007

---

## ✨ Core Features

- Load and validate `requirements.json`
- Display tender details dynamically
- Sort requirements according to required order
- Upload multiple PDF documents
- PDF page counting
- Remove uploaded documents
- One-to-one document matching
- Change or undo document matches
- Expiry date validation
- Real-time requirement status calculation
- SHA-256 exact-content duplicate detection
- Detect duplicate PDFs even with different filenames
- English and Bangla interface
- Mandatory and optional requirement handling
- Generate Package blocking when requirements are incomplete
- Browser-side PDF package generation
- English PDF cover page
- Documents merged in requirement order
- Original document page order preservation
- Page numbering on every generated PDF page
- CSV checklist export
- Responsive user interface
- Maximum 30 PDFs / 50 MB total upload limit

---

## 📋 Requirement Status System

Every requirement receives one of five statuses:

- `Missing`
- `Expiry date needed`
- `Expired`
- `Not provided`
- `OK`

### Blocking Statuses

The following statuses prevent package generation:

- `Missing`
- `Expiry date needed`
- `Expired`

### Non-Blocking Statuses

- `Not provided`
- `OK`

An expiry date equal to the tender submission deadline is considered valid and receives `OK`.

---

## 📄 Generated Tender Package

The application generates one combined PDF.

The package contains:

1. English cover page
2. Tender information
3. Included document information
4. Matched documents in requirement order
5. All pages of each included document
6. Page footer on every page

Footer format:

```text
<tender_id> | Page X of Y
```

The generated PDF filename follows:

```text
<tender_id>_Package.pdf
```

Example:

```text
T-2026-0417_Package.pdf
```

---

## 🌐 English + Bangla

The application provides an English/Bangla language switch.

In English mode, requirement names use:

```text
title_en
```

In Bangla mode:

```text
title_bn
```

Dynamic tender information remains unchanged.

The mandatory generated PDF cover remains in English.

---

## 🔒 Privacy & Architecture

The system follows a frontend-only architecture.

PDF documents and tender information are processed locally in browser memory.

The application does not require:

- Participant-controlled backend
- Database
- Online document storage
- External PDF processing service

This architecture helps keep tender documents on the user's device during processing.

---

## 🛠️ Technology Stack

- React
- TypeScript
- Vite
- pdf-lib
- Web Crypto API / SHA-256
- Vitest
- Oxlint
- HTML5
- CSS3

---

## 🚀 Run Locally

Clone the repository:

```bash
git clone https://github.com/Rayhan1460/AI_DEV_242-16-007.git
```

Enter the project directory:

```bash
cd AI_DEV_242-16-007
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run automated tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

---

## ✅ Verification

Final verification results:

```text
Test Files: 6 passed
Tests: 33 passed
Oxlint: 0 warnings and 0 errors
Production Build: Passed
```

Browser-side PDF package generation was also verified.

---

## 📦 Sample Output

A generated sample tender package is included in:

```text
output/T-2026-0417_Package.pdf
```

---

## 🤖 AI-Assisted Development

The project was developed through staged AI-assisted development.

### Stage 1 — Core Foundation

Implemented the core architecture, JSON validation, PDF upload processing, matching model, status engine, duplicate detection, and automated tests.

### Stage 2 — Mandatory Features

Completed bilingual support, final status handling, browser-side PDF compilation, English cover generation, ordered PDF merging, page numbering, and package download.

### Stage 3 — UI Polish & Submission

Improved the user workflow, responsive interface, workflow stepper, checklist functionality, final sample output, and submission readiness.

Final AI-assisted development commit:

```text
a5fc243
```

---

## ⚛️ React + TypeScript + Vite

This project uses React, TypeScript, and Vite.

Vite provides a fast development environment with Hot Module Replacement (HMR), while Oxlint is used for source-code linting.

Two official React plugins commonly available for Vite are:

- `@vitejs/plugin-react` — uses Oxc
- `@vitejs/plugin-react-swc` — uses SWC

---

## ⚙️ React Compiler

The React Compiler is not enabled in this project because enabling it can affect development and build performance.

It can be added later if required by following the official React Compiler documentation.

---

## 🔍 Oxlint Configuration

The project uses Oxlint for code-quality checks.

For production applications, type-aware lint rules can additionally be enabled using `oxlint-tsgolint`.

Example configuration:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": [
      "warn",
      {
        "allowConstantExport": true
      }
    ]
  }
}
```

---

## 📁 Project Structure

```text
AI_DEV_242-16-007/
├── output/
├── public/
├── scripts/
├── src/
│   ├── assets/
│   ├── components/
│   ├── core/
│   ├── data/
│   ├── i18n/
│   ├── test/
│   └── types/
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📜 License

This project is licensed under the MIT License.

See the `LICENSE` file for details.

---

## 👨‍💻 Developer

**Rayhan Parvaz**

AI DevFest 2026 — Vibe Coding
