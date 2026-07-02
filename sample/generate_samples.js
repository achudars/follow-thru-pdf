/**
 * generate_samples.js — creates 5 scenario-specific sample PDFs
 *
 * Scenario 1: scenario1_existing.pdf       — standard file (banking + signers, 2 pages)
 * Scenario 2: scenario2_authorised_only.pdf — only authorised signer contacts
 * Scenario 3: scenario3_banking_only.pdf    — only banking contacts
 * Scenario 4: scenario4_both_10pages.pdf    — both sections, 10 pages
 * Scenario 5: scenario5_empty.pdf          — markers present but zero contacts
 *
 * Usage: node generate_samples.js
 */

"use strict";

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// ── Layout constants ─────────────────────────────────────────────────────────

const ML = 50;
const MR = 545.28;
const CW = MR - ML;
const COL_ACTION = ML;
const COL_NAME = ML + 58;
const COL_PHONE = ML + 188;
const COL_EMAIL = ML + 288;
const COL_PR = ML + 403;
const COL_CB = ML + 423;
const COL_CN = ML + 443;
const ROW_H = 30;
const COL_HDR_H = 22;

const CHK = (v) => (v ? "\u2612" : "\u2610");

// ── Contact data pools ───────────────────────────────────────────────────────

const BANKING = [
  {
    action: "Add",
    name: "Alice Hartwell",
    phone: "4100000001",
    email: "a.hartwell@corp.com",
    title: "Managing Director",
    alt: "",
    country: "USA",
    pr: false,
    cb: false,
    cn: false,
  },
  {
    action: "Add",
    name: "Bernard Liu",
    phone: "4100000002",
    email: "b.liu@corp.com",
    title: "CEO",
    alt: "",
    country: "USA",
    pr: false,
    cb: false,
    cn: false,
  },
  {
    action: "Edit",
    name: "Carla Rossi",
    phone: "4100000003",
    email: "c.rossi@corp.com",
    title: "VP Finance",
    alt: "4100000031",
    country: "United Kingdom",
    pr: true,
    cb: false,
    cn: true,
  },
  {
    action: "No Change",
    name: "David Okonkwo",
    phone: "4100000004",
    email: "d.okonkwo@corp.com",
    title: "Director",
    alt: "",
    country: "USA",
    pr: false,
    cb: true,
    cn: false,
  },
  {
    action: "Add",
    name: "Elena Vasquez",
    phone: "4100000005",
    email: "e.vasquez@corp.com",
    title: "CFO",
    alt: "",
    country: "Germany",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Delete",
    name: "Frank Müller",
    phone: "4100000006",
    email: "f.muller@corp.com",
    title: "Treasurer",
    alt: "4100000061",
    country: "USA",
    pr: false,
    cb: false,
    cn: true,
  },
  {
    action: "Add",
    name: "Grace Tanaka",
    phone: "4100000007",
    email: "g.tanaka@corp.com",
    title: "Controller",
    alt: "",
    country: "France",
    pr: true,
    cb: false,
    cn: false,
  },
  {
    action: "Edit",
    name: "Henry Osei",
    phone: "4100000008",
    email: "h.osei@corp.com",
    title: "Head of Treasury",
    alt: "4100000081",
    country: "Ghana",
    pr: false,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Isabelle Moreau",
    phone: "4100000009",
    email: "i.moreau@corp.com",
    title: "Senior Analyst",
    alt: "",
    country: "France",
    pr: true,
    cb: false,
    cn: false,
  },
  {
    action: "No Change",
    name: "James Caldwell",
    phone: "4100000010",
    email: "j.caldwell@corp.com",
    title: "Associate Director",
    alt: "",
    country: "Canada",
    pr: false,
    cb: false,
    cn: true,
  },
];

const SIGNERS = [
  {
    action: "Add",
    name: "Katherine Brennan",
    phone: "5200000001",
    email: "k.brennan@corp.com",
    title: "President",
    alt: "",
    country: "USA",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Luca Ferrari",
    phone: "5200000002",
    email: "l.ferrari@corp.com",
    title: "SVP Operations",
    alt: "5200000021",
    country: "USA",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Maya Patel",
    phone: "5200000003",
    email: "m.patel@corp.com",
    title: "Chief Risk Officer",
    alt: "",
    country: "India",
    pr: true,
    cb: false,
    cn: true,
  },
  {
    action: "Add",
    name: "Nathan Brooks",
    phone: "5200000004",
    email: "n.brooks@corp.com",
    title: "COO",
    alt: "5200000041",
    country: "USA",
    pr: true,
    cb: true,
    cn: false,
  },
  {
    action: "Add",
    name: "Olivia Standish",
    phone: "5200000005",
    email: "o.standish@corp.com",
    title: "Deputy President",
    alt: "",
    country: "UK",
    pr: true,
    cb: true,
    cn: true,
  },
];

// ── Drawing helpers ──────────────────────────────────────────────────────────

function hLine(doc, y, color = "#CCCCCC") {
  doc.moveTo(ML, y).lineTo(MR, y).strokeColor(color).lineWidth(0.5).stroke();
}

function sectionBanner(doc, y, label, color = "#1a3c5e") {
  doc.rect(ML, y, CW, COL_HDR_H).fill(color);
  doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold");
  doc.text(label, ML + 4, y + 6);
  doc.fillColor("#FFFFFF").fontSize(7).font("Helvetica");
  doc.text("AUTHORITIES", COL_PR - 2, y + 4, { width: 100 });
}

function colHeader(doc, y) {
  doc.rect(ML, y, CW, COL_HDR_H).fill("#E8F0FE");
  doc.fillColor("#1a3c5e").fontSize(7.5).font("Helvetica-Bold");
  doc.text("Action", COL_ACTION, y + 7, { width: 55, lineBreak: false });
  doc.text("Full Legal Name", COL_NAME, y + 7, {
    width: 130,
    lineBreak: false,
  });
  doc.text("Primary Phone", COL_PHONE, y + 7, { width: 100, lineBreak: false });
  doc.text("Email Address", COL_EMAIL, y + 7, { width: 115, lineBreak: false });
  doc.text("PR", COL_PR, y + 7, {
    width: 20,
    lineBreak: false,
    align: "center",
  });
  doc.text("CB", COL_CB, y + 7, {
    width: 20,
    lineBreak: false,
    align: "center",
  });
  doc.text("CN", COL_CN, y + 7, {
    width: 52,
    lineBreak: false,
    align: "center",
  });
}

function contactRow(doc, contact, y) {
  doc.rect(ML, y, CW, ROW_H).fill("#FFFFFF");
  const r1 = y + 6;
  doc.fillColor("#111827").fontSize(9).font("Helvetica");
  doc.text(contact.action, COL_ACTION, r1, { width: 55, lineBreak: false });
  doc.text(contact.name, COL_NAME, r1, { width: 130, lineBreak: false });
  doc.text(contact.phone, COL_PHONE, r1, { width: 100, lineBreak: false });
  doc.text(contact.email, COL_EMAIL, r1, { width: 115, lineBreak: false });
  doc.fontSize(10);
  doc.text(CHK(contact.pr), COL_PR, r1, {
    width: 20,
    lineBreak: false,
    align: "center",
  });
  doc.text(CHK(contact.cb), COL_CB, r1, {
    width: 20,
    lineBreak: false,
    align: "center",
  });
  doc.text(CHK(contact.cn), COL_CN, r1, {
    width: 52,
    lineBreak: false,
    align: "center",
  });
  const r2 = y + 18;
  doc.fillColor("#6b7280").fontSize(8).font("Helvetica");
  doc.text(contact.title, COL_NAME, r2, { width: 130, lineBreak: false });
  doc.text(contact.alt || "—", COL_PHONE, r2, { width: 100, lineBreak: false });
  doc.text(contact.country, COL_EMAIL, r2, { width: 115, lineBreak: false });
  hLine(doc, y + ROW_H);
  return y + ROW_H;
}

function pageHeader(doc, title = "Banking Contact Authorization Form") {
  doc.rect(0, 0, 595.28, 44).fill("#1a3c5e");
  doc.fillColor("#FFFFFF").fontSize(15).font("Helvetica-Bold");
  doc.text(title, ML, 13, { width: CW });
  doc.fillColor("#93c5fd").fontSize(7.5).font("Helvetica");
  doc.text("New York and London Bank Offices", ML, 32, {
    width: 180,
    lineBreak: false,
  });
}

function introParagraph(doc) {
  doc.fillColor("#374151").fontSize(7.5).font("Helvetica");
  doc.text(
    "This Form allows the Client's Authorized Signer(s) or Delegate Authorized Signer(s) to " +
      "designate Banking Contacts with specific authorities and provide contact details. " +
      "This Form applies to all Accounts and Services listed herein. Capitalized terms have the " +
      'meanings in the Master or Global Transaction Banking Agreement ("Account Terms").',
    ML,
    56,
    { width: CW },
  );
}

function authoritiesSection(doc) {
  hLine(doc, 100);
  doc
    .fillColor("#1a3c5e")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("CLIENT ENTITY", ML, 108);
  doc.fillColor("#6b7280").fontSize(7.5).font("Helvetica");
  doc.text(
    "(If you need to add more entities, refer to the last page of this Form)",
    ML + 105,
    109,
    { width: 340 },
  );
  hLine(doc, 130);
  doc.fillColor("#1a3c5e").fontSize(10).font("Helvetica-Bold");
  doc.text("BANKING CONTACT AUTHORITIES", ML, 138);
  doc.fillColor("#374151").fontSize(7.5).font("Helvetica");
  const bullets = [
    "Payment Requests: An individual with authority to initiate payments via emails, modify (amend, recall, reject, return) and void transactions on behalf of the Client, and inquire about transaction details.",
    "Callbacks: An individual with authority to receive callbacks to confirm the validity of payment instructions and other requests on behalf of the Client.",
    "Communications and Notices: An individual with authority to receive bank communications, rate changes, product/service enhancements, and account/transaction status inquiries.",
  ];
  bullets.forEach((b, i) => {
    doc.text(`•  ${b}`, ML + 6, 158 + i * 19, { width: CW - 6 });
  });
}

function addFillerPage(doc, pageNum, totalPages) {
  doc.addPage();
  pageHeader(doc, "Banking Contact Authorization Form — Additional Entities");
  doc.fillColor("#374151").fontSize(9).font("Helvetica-Bold");
  doc.text(`Additional Entity Page ${pageNum - 1}`, ML, 60, { width: CW });
  doc.fillColor("#9ca3af").fontSize(8).font("Helvetica");
  doc.text(
    "Complete this section if you need to list contacts for additional client entities beyond those on page 1.",
    ML,
    76,
    { width: CW },
  );
  hLine(doc, 100);
  doc
    .fillColor("#1a3c5e")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("CLIENT ENTITY NAME", ML, 108);
  doc.rect(ML, 120, CW, 20).strokeColor("#CCCCCC").lineWidth(0.5).stroke();
  doc
    .fillColor("#1a3c5e")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("ADDITIONAL BANKING CONTACTS", ML, 150);
  colHeader(doc, 165);
  hLine(doc, 165 + COL_HDR_H);
  // Empty rows for manual entry
  for (let i = 0; i < 4; i++) {
    const rowY = 165 + COL_HDR_H + i * ROW_H;
    doc.rect(ML, rowY, CW, ROW_H).fill("#FAFAFA");
    hLine(doc, rowY + ROW_H);
  }
  hLine(doc, 760);
  doc.fillColor("#9ca3af").fontSize(6.5).font("Helvetica");
  doc.text(
    `Page ${pageNum} of ${totalPages}  •  Confidential — For authorized use only`,
    ML,
    764,
    { width: CW, align: "center" },
  );
}

function machineReadablePage(doc, groups) {
  doc.addPage();
  doc.fillColor("#d1d5db").fontSize(5.5).font("Helvetica");
  doc.text("MACHINE-READABLE CONTACT DATA — DO NOT MODIFY", ML, 50);
  doc.moveDown(0.4);
  const mr = (s) => doc.text(s);
  mr("===CONTACT_DATA_BEGIN===");
  for (const { label, contacts, positions } of groups) {
    mr(`group:${label}`);
    contacts.forEach((c, i) => {
      const pos = positions[i];
      mr(
        `contact:${c.action}|${c.name}|${c.phone}|${c.email}|` +
          `${c.title}|${c.alt}|${c.country}|` +
          `${c.pr}|${c.cb}|${c.cn}|1|${pos.y}|${pos.h}`,
      );
    });
  }
  mr("===CONTACT_DATA_END===");
}

// ── Stream-finish helper ─────────────────────────────────────────────────────

/** Pipe doc to a write stream and return a Promise that resolves when fully flushed. */
function finishOn(doc, outputPath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

// ── SCENARIO 1: Existing (banking + signers, 2 pages) ────────────────────────

async function generateScenario1(outputPath) {
  const bankingContacts = BANKING.slice(0, 7);
  const signerContacts = SIGNERS.slice(0, 2);

  const doc = new PDFDocument({ margin: 0, size: "A4" });
  const done = finishOn(doc, outputPath);

  pageHeader(doc);
  introParagraph(doc);
  authoritiesSection(doc);

  hLine(doc, 220);
  sectionBanner(doc, 226, "BANKING CONTACT DETAILS");
  doc.fillColor("#374151").fontSize(7).font("Helvetica");
  doc.text(
    "Please provide current information for your Banking Contacts. " +
      "If adding or modifying a Contact, complete all required* fields.",
    ML,
    252,
    { width: CW },
  );

  const colHdrY = 268;
  colHeader(doc, colHdrY);
  hLine(doc, colHdrY + COL_HDR_H);

  let curY = colHdrY + COL_HDR_H;
  const bankingPositions = [];
  for (const c of bankingContacts) {
    bankingPositions.push({ y: curY, h: ROW_H });
    curY = contactRow(doc, c, curY);
  }

  hLine(doc, curY + 4);
  const signerBannerY = curY + 10;
  sectionBanner(doc, signerBannerY, "SIGNER AUTHORIZATION", "#374151");
  doc.fillColor("#374151").fontSize(7).font("Helvetica");
  doc.text(
    "Authorized Signers and Delegate Authorized Signers do not need to be listed as Banking Contacts.",
    ML,
    signerBannerY + COL_HDR_H + 2,
    { width: CW },
  );

  const signerColHdrY = signerBannerY + COL_HDR_H + 14;
  colHeader(doc, signerColHdrY);
  hLine(doc, signerColHdrY + COL_HDR_H);

  curY = signerColHdrY + COL_HDR_H;
  const signerPositions = [];
  for (const c of signerContacts) {
    signerPositions.push({ y: curY, h: ROW_H });
    curY = contactRow(doc, c, curY);
  }

  hLine(doc, curY + 6);
  doc.fillColor("#9ca3af").fontSize(6.5).font("Helvetica");
  doc.text(
    "Page 1 of 2  •  Confidential — For authorized use only",
    ML,
    curY + 10,
    { width: CW, align: "center" },
  );

  machineReadablePage(doc, [
    {
      label: "Banking Contact Authorization",
      contacts: bankingContacts,
      positions: bankingPositions,
    },
    {
      label: "Signer Authorization",
      contacts: signerContacts,
      positions: signerPositions,
    },
  ]);

  doc.end();
  await done;
  console.log(
    `Generated: ${path.resolve(outputPath)}  (banking:${bankingContacts.length} signers:${signerContacts.length})`,
  );
}

// ── SCENARIO 2: Authorised signers only ─────────────────────────────────────

async function generateScenario2(outputPath) {
  const signerContacts = SIGNERS.slice(0, 3);

  const doc = new PDFDocument({ margin: 0, size: "A4" });
  const done = finishOn(doc, outputPath);

  pageHeader(doc);
  introParagraph(doc);
  authoritiesSection(doc);

  hLine(doc, 220);
  const signerBannerY = 226;
  sectionBanner(doc, signerBannerY, "SIGNER AUTHORIZATION", "#374151");
  doc.fillColor("#374151").fontSize(7).font("Helvetica");
  doc.text(
    "This form contains Authorized Signers only. No Banking Contact rows are included.",
    ML,
    signerBannerY + COL_HDR_H + 2,
    { width: CW },
  );

  const signerColHdrY = signerBannerY + COL_HDR_H + 14;
  colHeader(doc, signerColHdrY);
  hLine(doc, signerColHdrY + COL_HDR_H);

  let curY = signerColHdrY + COL_HDR_H;
  const signerPositions = [];
  for (const c of signerContacts) {
    signerPositions.push({ y: curY, h: ROW_H });
    curY = contactRow(doc, c, curY);
  }

  hLine(doc, curY + 6);
  doc.fillColor("#9ca3af").fontSize(6.5).font("Helvetica");
  doc.text(
    "Page 1 of 2  •  Confidential — For authorized use only",
    ML,
    curY + 10,
    { width: CW, align: "center" },
  );

  machineReadablePage(doc, [
    {
      label: "Signer Authorization",
      contacts: signerContacts,
      positions: signerPositions,
    },
  ]);

  doc.end();
  await done;
  console.log(
    `Generated: ${path.resolve(outputPath)}  (signers only: ${signerContacts.length})`,
  );
}

// ── SCENARIO 3: Banking contacts only ───────────────────────────────────────

async function generateScenario3(outputPath) {
  const bankingContacts = BANKING.slice(0, 5);

  const doc = new PDFDocument({ margin: 0, size: "A4" });
  const done = finishOn(doc, outputPath);

  pageHeader(doc);
  introParagraph(doc);
  authoritiesSection(doc);

  hLine(doc, 220);
  sectionBanner(doc, 226, "BANKING CONTACT DETAILS");
  doc.fillColor("#374151").fontSize(7).font("Helvetica");
  doc.text(
    "This form contains Banking Contacts only. No Authorized Signer rows are included.",
    ML,
    252,
    { width: CW },
  );

  const colHdrY = 268;
  colHeader(doc, colHdrY);
  hLine(doc, colHdrY + COL_HDR_H);

  let curY = colHdrY + COL_HDR_H;
  const bankingPositions = [];
  for (const c of bankingContacts) {
    bankingPositions.push({ y: curY, h: ROW_H });
    curY = contactRow(doc, c, curY);
  }

  hLine(doc, curY + 6);
  doc.fillColor("#9ca3af").fontSize(6.5).font("Helvetica");
  doc.text(
    "Page 1 of 2  •  Confidential — For authorized use only",
    ML,
    curY + 10,
    { width: CW, align: "center" },
  );

  machineReadablePage(doc, [
    {
      label: "Banking Contact Authorization",
      contacts: bankingContacts,
      positions: bankingPositions,
    },
  ]);

  doc.end();
  await done;
  console.log(
    `Generated: ${path.resolve(outputPath)}  (banking only: ${bankingContacts.length})`,
  );
}

// ── SCENARIO 4: Both sections, 10 pages ─────────────────────────────────────

async function generateScenario4(outputPath) {
  const bankingContacts = BANKING.slice(0, 10);
  const signerContacts = SIGNERS.slice(0, 5);
  const TOTAL_PAGES = 10;

  const doc = new PDFDocument({ margin: 0, size: "A4" });
  const done = finishOn(doc, outputPath);

  // Page 1
  pageHeader(doc);
  introParagraph(doc);
  authoritiesSection(doc);

  hLine(doc, 220);
  sectionBanner(doc, 226, "BANKING CONTACT DETAILS");
  doc.fillColor("#374151").fontSize(7).font("Helvetica");
  doc.text(
    "Please provide current information for your Banking Contacts. " +
      "If adding or modifying a Contact, complete all required* fields.",
    ML,
    252,
    { width: CW },
  );

  const colHdrY = 268;
  colHeader(doc, colHdrY);
  hLine(doc, colHdrY + COL_HDR_H);

  let curY = colHdrY + COL_HDR_H;
  const bankingPositions = [];
  for (const c of bankingContacts) {
    bankingPositions.push({ y: curY, h: ROW_H });
    curY = contactRow(doc, c, curY);
  }

  hLine(doc, curY + 4);
  const signerBannerY = curY + 10;
  sectionBanner(doc, signerBannerY, "SIGNER AUTHORIZATION", "#374151");
  doc.fillColor("#374151").fontSize(7).font("Helvetica");
  doc.text(
    "Authorized Signers and Delegate Authorized Signers do not need to be listed as Banking Contacts.",
    ML,
    signerBannerY + COL_HDR_H + 2,
    { width: CW },
  );

  const signerColHdrY = signerBannerY + COL_HDR_H + 14;
  colHeader(doc, signerColHdrY);
  hLine(doc, signerColHdrY + COL_HDR_H);

  curY = signerColHdrY + COL_HDR_H;
  const signerPositions = [];
  for (const c of signerContacts) {
    signerPositions.push({ y: curY, h: ROW_H });
    curY = contactRow(doc, c, curY);
  }

  hLine(doc, curY + 6);
  doc.fillColor("#9ca3af").fontSize(6.5).font("Helvetica");
  doc.text(
    `Page 1 of ${TOTAL_PAGES}  •  Confidential — For authorized use only`,
    ML,
    curY + 10,
    { width: CW, align: "center" },
  );

  // Pages 2-9: additional entity filler pages
  for (let p = 2; p <= TOTAL_PAGES - 1; p++) {
    addFillerPage(doc, p, TOTAL_PAGES);
  }

  // Page 10: machine-readable data
  machineReadablePage(doc, [
    {
      label: "Banking Contact Authorization",
      contacts: bankingContacts,
      positions: bankingPositions,
    },
    {
      label: "Signer Authorization",
      contacts: signerContacts,
      positions: signerPositions,
    },
  ]);

  doc.end();
  await done;
  console.log(
    `Generated: ${path.resolve(outputPath)}  (${TOTAL_PAGES} pages, banking:${bankingContacts.length} signers:${signerContacts.length})`,
  );
}

// ── SCENARIO 5: Empty (markers present, zero contacts) ──────────────────────

async function generateScenario5(outputPath) {
  const doc = new PDFDocument({ margin: 0, size: "A4" });
  const done = finishOn(doc, outputPath);

  pageHeader(doc);
  introParagraph(doc);
  authoritiesSection(doc);

  hLine(doc, 220);
  sectionBanner(doc, 226, "BANKING CONTACT DETAILS");
  doc.fillColor("#374151").fontSize(7).font("Helvetica");
  doc.text("No contacts have been added to this form.", ML, 252, { width: CW });

  const colHdrY = 268;
  colHeader(doc, colHdrY);
  hLine(doc, colHdrY + COL_HDR_H);

  // Empty rows placeholder
  for (let i = 0; i < 3; i++) {
    const rowY = colHdrY + COL_HDR_H + i * ROW_H;
    doc.rect(ML, rowY, CW, ROW_H).fill("#FAFAFA");
    hLine(doc, rowY + ROW_H);
  }

  const endY = colHdrY + COL_HDR_H + 3 * ROW_H + 10;
  hLine(doc, endY);
  doc.fillColor("#9ca3af").fontSize(6.5).font("Helvetica");
  doc.text(
    "Page 1 of 2  •  Confidential — For authorized use only",
    ML,
    endY + 4,
    { width: CW, align: "center" },
  );

  // Machine-readable page with no contacts — empty groups
  doc.addPage();
  doc.fillColor("#d1d5db").fontSize(5.5).font("Helvetica");
  doc.text("MACHINE-READABLE CONTACT DATA — DO NOT MODIFY", ML, 50);
  doc.moveDown(0.4);
  const mr = (s) => doc.text(s);
  mr("===CONTACT_DATA_BEGIN===");
  mr("group:Banking Contact Authorization");
  // (no contact lines)
  mr("===CONTACT_DATA_END===");

  doc.end();
  await done;
  console.log(`Generated: ${path.resolve(outputPath)}  (empty — 0 contacts)`);
}

// ── Run all sequentially (each file fully flushed before the next starts) ────

const OUT = __dirname;

(async () => {
  await generateScenario1(path.join(OUT, "scenario1_existing.pdf"));
  await generateScenario2(path.join(OUT, "scenario2_authorised_only.pdf"));
  await generateScenario3(path.join(OUT, "scenario3_banking_only.pdf"));
  await generateScenario4(path.join(OUT, "scenario4_both_10pages.pdf"));
  await generateScenario5(path.join(OUT, "scenario5_empty.pdf"));
  console.log(
    "\nDone. Copy the PDFs to frontend/public/ to make them available via the dev server.",
  );
})();
