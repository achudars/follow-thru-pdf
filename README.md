# follow-thru-pdf

Dashboard for uploading a Banking Contact Authorization PDF, reviewing the extracted contacts, and ingesting them.

[![Netlify Status](https://api.netlify.com/api/v1/badges/3dd36273-0ca1-473e-8b83-a18c03fe367f/deploy-status)](https://app.netlify.com/projects/follow-thru-pdf/deploys)
[![CI](https://github.com/achudars/follow-thru-pdf/actions/workflows/ci.yml/badge.svg)](https://github.com/achudars/follow-thru-pdf/actions/workflows/ci.yml)

---

## Screenshots

### Upload screen

### Dashboard — 3-panel review

---

## Architecture

```
Browser (React)
    |  POST /api/parse  (base64 PDF)
    v
Netlify Function  <-- pdf-parse extracts text
    |  returns JSON contacts
    v
Browser renders 3-panel dashboard
```

Everything deploys to **Netlify** as a single repo. No separate backend service needed.

---

## How it works

1. **Upload** — drag & drop a PDF, or choose from **5 demo scenarios**:
   - Full Form (7 banking + 2 signer contacts)
   - Banking Only (5 contacts)
   - Signers Only (3 contacts)
   - Large Multi-Page Form (20 banking + 5 signers)
   - Empty Form (zero contacts)
2. **Parse** — base64-encoded and sent to `/api/parse`. The function uses `pdf-parse` to extract text, finds the `===CONTACT_DATA_BEGIN===` block, reads one `contact:` line per person
3. **Dashboard** — three panels:
   - **Left** — collapsible contact groups
   - **Middle** — editable form (action, fields, authority checkboxes)
   - **Right** — PDF preview with yellow row highlight on the selected contact
4. **Navigate** — click a name or use the arrows; highlight and form update together
5. **Ingest** — stub button; wire to your CRM or database API

---

## Design decisions

| Decision                                  | Reason                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Netlify Functions (TypeScript)            | No separate server; same language as the frontend                                                |
| Machine-readable block in PDF             | Deterministic parsing — no OCR or positional heuristics                                          |
| Base64 JSON body                          | Simpler than multipart in a serverless function                                                  |
| Percentage-based highlight overlay        | Scale-independent at any zoom level                                                              |
| `useFsAccessApi: false` in react-dropzone | File System Access API is blocked in many contexts                                               |
| Fixture-based round-trip test             | pdf-parse bundles webpack which conflicts with vite; pre-extracted .txt fixture avoids the clash |

---

## Local development

```bash
npm install
cd frontend && npm install && cd ..
cd sample && npm install && node generate_pdf.js && cd ..
npm test
npm run dev
```

Open **http://localhost:8888** and choose any of the 5 demo scenarios or upload your own PDF.

---

## Deploy

Push to GitHub and connect the repo in Netlify. The `netlify.toml` configures everything automatically.
