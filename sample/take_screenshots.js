/**
 * take_screenshots.js — uses Playwright to capture screenshots of each scenario
 *
 * Uses page.setInputFiles() so React's file-accepted callback fires naturally.
 * Prerequisites: dev server running on http://localhost:8888
 * Usage: node take_screenshots.js
 */

"use strict";

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:8888";
const DOCS = path.join(__dirname, "..", "docs");
const PDF_DIR = path.join(__dirname, "..", "frontend", "public");

const SCENARIOS = [
  { file: "scenario1_existing.pdf", slug: "scenario1-existing" },
  { file: "scenario2_authorised_only.pdf", slug: "scenario2-authorised-only" },
  { file: "scenario3_banking_only.pdf", slug: "scenario3-banking-only" },
  { file: "scenario4_both_10pages.pdf", slug: "scenario4-both-10pages" },
  { file: "scenario5_empty.pdf", slug: "scenario5-empty" },
];

(async () => {
  if (!fs.existsSync(DOCS)) fs.mkdirSync(DOCS, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // ── Upload screen ──────────────────────────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(DOCS, "screenshot-upload.png") });
  console.log("Saved: screenshot-upload.png");

  // ── Dashboard per scenario ─────────────────────────────────────────────────
  for (const s of SCENARIOS) {
    console.log(`\nCapturing ${s.file} ...`);

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    // Playwright's setInputFiles triggers React dropzone's onChange natively
    const inputSelector = "input[type=file]";
    await page.waitForSelector(inputSelector);
    await page.setInputFiles(inputSelector, path.join(PDF_DIR, s.file));

    // Wait for the dashboard header to appear (parse + render)
    try {
      await page.waitForSelector("text=Contact Ingestion Review", {
        timeout: 20000,
      });
      await page.waitForTimeout(2000);
    } catch {
      console.warn(`  ⚠  Dashboard did not appear — capturing current state`);
      await page.waitForTimeout(800);
    }

    await page.screenshot({
      path: path.join(DOCS, `screenshot-${s.slug}.png`),
    });
    console.log(`  Saved: screenshot-${s.slug}.png`);
  }

  await browser.close();
  console.log("\nAll screenshots captured.");
})();
