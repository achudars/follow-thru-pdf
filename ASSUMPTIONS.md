# Assumptions & Design Decisions

## Backend Language

- **Chosen: Rust** (per user preference: Rust > Java > Python)
- HTTP framework: **Axum** (most modern async Rust web framework)
- PDF parsing: **`pdf-extract`** crate (pure Rust, no native system library dependencies — compiles cleanly on Fly.io)
- **Fallback note**: If Rust PDF parsing proves insufficient for a new template variant, Python with `pdfplumber` is the recommended alternative (it handles positional table extraction natively)

## PDF Template

- The app is designed for the **Banking Contact Authorization Form** template (JPMorgan-style)
- The parser is tuned to this specific form structure
- Extending to other templates requires additional parser rules in `backend/src/parser.rs`

## PDF Parsing Strategy

- PDFs are assumed to be **text-based / selectable** (not scanned images — OCR is not implemented)
- The sample PDF includes an embedded machine-readable data section (`===CONTACT_DATA_BEGIN===` / `===CONTACT_DATA_END===`) so parsing is deterministic
- For real-world arbitrary PDFs, the parser falls back to heuristic text analysis on the visible form content
- In production, replacing `pdf-extract` with `pdfium-render` (Google PDFium) would give character-level positional data for robust arbitrary table extraction

## Contact Data Model

- Contacts are grouped by form type (e.g., "Banking Contact Authorization", "Signer Authorization")
- Each contact has: `action`, `fullLegalName`, `primaryPhone`, `email`, `corporateTitle`, `alternatePhone`, `countryOfResidence`, and `authorities`
- **Authorities**: Payment Requests, Callbacks, Communications and Notices (matching the form's checkbox columns)
- Contact `action` values: `Add`, `Edit`, `Delete`, `No Change`

## UI Behavior

- App starts on an **Upload** screen (drag-and-drop or click to select PDF)
- After successful parse, transitions to the **Dashboard** (3-panel layout)
- Left panel: Contact groups as collapsible accordion with individual contact names
- Middle panel: Editable contact details + action selection (matches the "Contact Ingestion Review" mockup)
- Right panel: Full PDF preview of the uploaded document using `react-pdf` (PDF.js)
- Contacts can be navigated sequentially (Contact N of M) with ← → arrows at the top
- The **"Ingest"** button is a UI stub in v1 — in production it would call a downstream CRM or database API
- PDF highlighting (highlighting the current contact's row in the PDF preview) is deferred to v2

## Authentication

- **No authentication** — designed as a local/internal banking operations tool
- For production: add JWT-based auth or integrate with SSO before exposing externally

## Deployment Architecture

```
┌─────────────────┐         ┌────────────────────┐
│  Netlify        │         │  Fly.io             │
│  (Frontend)     │──HTTP──▶│  (Rust Backend)     │
│  Vite build     │         │  Axum + pdf-extract │
│  Static files   │         │  Port 8080          │
└─────────────────┘         └────────────────────┘
```

- `netlify.toml` proxies `/api/*` → Fly.io backend URL via `_redirects`
- CORS is configured on the Rust backend to allow the Netlify domain
- Set `VITE_API_BASE_URL` in Netlify environment variables to point at the Fly.io backend URL

## Sample PDF

- Generated with **Node.js + `pdfkit`** (script in `sample/generate_pdf.js`)
- Produces a realistic Banking Contact Authorization Form with 7 Banking Contacts + 2 Signer Authorizations
- Embeds a machine-readable data block at the end of the document for reliable parsing
- Run with: `cd sample && npm install && node generate_pdf.js`
- Output: `sample/banking_contact_authorization.pdf`

## What is NOT in scope (v1)

- Per-contact row highlighting in the PDF preview
- Saving/exporting edited contact data
- Multi-page PDF navigation in the preview
- Multiple PDF uploads in one session
- Undo/redo for contact edits
