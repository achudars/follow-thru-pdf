/**
 * take_screenshots.js — uses Playwright to capture screenshots of each scenario
 *
 * Prerequisites: dev server running on http://localhost:8888
 * Usage: node take_screenshots.js
 */

"use strict";

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:8888";
const DOCS = path.join(__dirname, "..", "docs");

const SCENARIOS = [
  {
    file: "scenario1_existing.pdf",
    slug: "scenario1-existing",
    label: "Scenario 1 — Existing file (7 banking + 2 signers)",
  },
  {
    file: "scenario2_authorised_only.pdf",
    slug: "scenario2-authorised-only",
    label: "Scenario 2 — Authorised signers only",
  },
  {
    file: "scenario3_banking_only.pdf",
    slug: "scenario3-banking-only",
    label: "Scenario 3 — Banking contacts only",
  },
  {
    file: "scenario4_both_10pages.pdf",
    slug: "scenario4-both-10pages",
    label: "Scenario 4 — Both sections, 10 pages",
  },
  {
    file: "scenario5_empty.pdf",
    slug: "scenario5-empty",
    label: "Scenario 5 — Empty form (no contacts)",
  },
];

async function loadPdfOnDashboard(page, pdfFile) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // Fetch the PDF via the page's fetch so cookies/CORS are in scope
  await page.evaluate(async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], url.split("/").pop(), { type: "application/pdf" });
    // Dispatch a synthetic drop onto the dropzone
    const dt = new DataTransfer();
    dt.items.add(file);
    const zone = document.querySelector("input[type=file]");
    const event = new Event("change", { bubbles: true });
    Object.defineProperty(event, "target", { value: { files: dt.files } });
    zone.dispatchEvent(event);
  }, `${BASE_URL}/${pdfFile}`);

  // Wait for the dashboard to appear (header text)
  try {
    await page.waitForSelector("text=Contact Ingestion Review", { timeout: 12000 });
    // Give PDF preview a moment to render
    await page.waitForTimeout(1500);
  } catch {
    // If dashboard didn't appear, we're still on the upload screen — that's fine for empty
    await page.waitForTimeout(500);
  }
}

(async () => {
  if (!fs.existsSync(DOCS)) fs.mkdirSync(DOCS, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ── Upload screen ──────────────────────────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const uploadShot = path.join(DOCS, "screenshot-upload.png");
  await page.screenshot({ path: uploadShot, fullPage: false });
  console.log(`Saved: ${uploadShot}`);

  // ── Dashboard per scenario ─────────────────────────────────────────────────
  for (const s of SCENARIOS) {
    console.log(`\nLoading ${s.file} …`);

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Use the "Use sample file" button equivalent: POST to the parse endpoint
    // directly via page.evaluate so we stay in the browser context
    const parseResult = await page.evaluate(async (fileUrl) => {
      const res = await fetch(fileUrl);
      const arrayBuf = await res.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));
      const fileName = fileUrl.split("/").pop();
      const parseRes = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, fileData: base64 }),
      });
      return parseRes.ok ? parseRes.json() : null;
    }, `${BASE_URL}/${s.file}`);

    if (!parseResult) {
      console.warn(`  ⚠ parse returned null — taking upload-screen screenshot instead`);
      const shotPath = path.join(DOCS, `screenshot-${s.slug}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`Saved: ${shotPath}`);
      continue;
    }

    // Inject the parsed data into the React app by simulating the full file flow
    // The simplest approach: use the dropzone input
    const pdfResponse = await page.evaluate(async (fileUrl) => {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      return { size: blob.size, type: blob.type };
    }, `${BASE_URL}/${s.file}`);

    // We use a JS injection to trigger the React file-accepted callback
    // by evaluating a function that creates a File and dispatches it
    await page.evaluate(async (fileUrl) => {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const file = new File([blob], fileUrl.split("/").pop(), { type: "application/pdf" });
      const input = document.querySelector("input[accept='application/pdf,.pdf']");
      if (!input) return;
      // Create a DataTransfer and assign files
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      Object.defineProperty(input, "files", { value: dataTransfer.files, configurable: true });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, `${BASE_URL}/${s.file}`);

    try {
      await page.waitForSelector("text=Contact Ingestion Review", { timeout: 15000 });
      // Let PDF preview iframe render
      await page.waitForTimeout(2000);
    } catch {
      console.warn(`  ⚠ dashboard did not load — capturing current state`);
      await page.waitForTimeout(500);
    }

    const shotPath = path.join(DOCS, `screenshot-${s.slug}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Saved: ${shotPath}`);
  }

  await browser.close();
  console.log("\nAll screenshots captured.");
})();
