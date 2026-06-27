# follow-thru-pdf

Dashboard for uploading a Banking Contact Authorization PDF, reviewing the extracted contacts, and ingesting them.

---

## Architecture

```
Browser (React)
    │  POST /api/parse  (base64 PDF)
    ▼
Netlify Function  ←── pdf-parse extracts text
    │  returns JSON contacts
    ▼
Browser renders 3-panel dashboard
```

Everything deploys to **Netlify** as a single repo — the React frontend as static files and the parser as a serverless function. No separate backend service needed.

---

## How it works

1. **Upload** — user drops a PDF onto the landing screen
2. **Parse** — the file is base64-encoded and sent to `/api/parse` (a Netlify Function). The function uses `pdf-parse` to extract all text, then finds the `===CONTACT_DATA_BEGIN===` block embedded in the PDF and reads one `contact:` line per person
3. **Dashboard** — three panels appear:
   - **Left** — collapsible list of contact groups with each person's name
   - **Middle** — editable form for the selected contact (action, fields, authority checkboxes)
   - **Right** — full PDF preview; the selected contact's row is highlighted in yellow
4. **Navigate** — click any name in the left panel, or use the ← → arrows in the header, to move between contacts. The yellow highlight and the form update together
5. **Ingest** — the Ingest button is a stub; wire it to your CRM or database API

---

## Design decisions

| Decision | Reason |
|---|---|
| Netlify Functions (TypeScript) over Rust/Java | Runs on Netlify with no separate server; same language as the frontend |
| PDF embeds a machine-readable block | Reliable, deterministic parsing — no positional heuristics or OCR needed |
| Base64 JSON body instead of multipart | Simpler to handle in a serverless function |
| Percentage-based highlight overlay | Scale-independent — correct at any PDF zoom level |
| `useFsAccessApi: false` in react-dropzone | The File System Access API is blocked in many browser contexts; the classic input fallback always works |
| pdfkit for sample PDF | Full control over layout means the recorded row positions exactly match what's drawn |

---

## Local development

```bash
# Install all deps
npm install
cd frontend && npm install && cd ..

# Generate the sample PDF
cd sample && npm install && node generate_pdf.js && cd ..

# Start (Vite + Netlify Functions on port 8888)
npm run dev
```

Open **http://localhost:8888** and upload `sample/banking_contact_authorization.pdf`.

---

## Deploy

Push to GitHub and connect the repo in Netlify. The `netlify.toml` configures everything automatically.
