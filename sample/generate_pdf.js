/**
 * Banking Contact Authorization Form — sample PDF generator
 *
 * Produces a realistic-looking form PDF and embeds a machine-readable
 * data block on the last page so the Netlify Function parser can extract
 * contacts deterministically (no OCR or positional heuristics needed).
 *
 * Each contact line in the machine-readable block includes:
 *   contact:<action>|<name>|<phone>|<email>|<title>|<altPhone>|<country>|<pr>|<cb>|<cn>|<page>|<Y>|<rowHeight>
 *
 * The Y coordinate is in PDF points from the TOP of the page (pdfkit
 * coordinate space), matching the overlay logic in PdfPreview.tsx.
 *
 * Usage:  npm install && node generate_pdf.js
 * Output: banking_contact_authorization.pdf
 */

"use strict";

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// ── Layout ────────────────────────────────────────────────────────────────────

const ML = 50; // margin left
const MR = 545.28; // margin right  (A4 width 595.28 − 50)
const CW = MR - ML; // content width = 495.28 pt

// Table column X positions
const COL_ACTION = ML; // width ~55
const COL_NAME = ML + 58; // width ~130
const COL_PHONE = ML + 188; // width ~100
const COL_EMAIL = ML + 288; // width ~115
const COL_PR = ML + 403; // width ~20
const COL_CB = ML + 423; // width ~20
const COL_CN = ML + 443; // width ~52  (to right margin)

const ROW_H = 30; // height of each 2-row contact block (pt)
const COL_HDR_H = 22; // column header row height (pt)

// ── Contact data ─────────────────────────────────────────────────────────────

const BANKING_CONTACTS = [
  {
    action: "Add",
    name: "Name Lastname 1",
    phone: "4324324324321",
    email: "contact1@example.com",
    title: "Managing Director",
    alt: "",
    country: "USA",
    pr: false,
    cb: false,
    cn: false,
  },
  {
    action: "Add",
    name: "Name Lastname 2",
    phone: "432432432432",
    email: "jdoe@jonnyd.com",
    title: "CEO",
    alt: "",
    country: "USA",
    pr: false,
    cb: false,
    cn: false,
  },
  {
    action: "Edit",
    name: "Name Lastname 3",
    phone: "4324324324323",
    email: "contact3@example.com",
    title: "VP Finance",
    alt: "4320000001",
    country: "United Kingdom",
    pr: true,
    cb: false,
    cn: true,
  },
  {
    action: "No Change",
    name: "Name Lastname 4",
    phone: "4324324324324",
    email: "contact4@example.com",
    title: "Director",
    alt: "",
    country: "USA",
    pr: false,
    cb: true,
    cn: false,
  },
  {
    action: "Add",
    name: "Name Lastname 5",
    phone: "4324324324325",
    email: "contact5@example.com",
    title: "CFO",
    alt: "",
    country: "Germany",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Delete",
    name: "Name Lastname 6",
    phone: "4324324324326",
    email: "contact6@example.com",
    title: "Treasurer",
    alt: "4320000002",
    country: "USA",
    pr: false,
    cb: false,
    cn: true,
  },
  {
    action: "Add",
    name: "Name Lastname 7",
    phone: "4324324324327",
    email: "contact7@example.com",
    title: "Controller",
    alt: "",
    country: "France",
    pr: true,
    cb: false,
    cn: false,
  },
];

const SIGNER_CONTACTS = [
  {
    action: "Add",
    name: "Name Lastname 1",
    phone: "5555555551",
    email: "signer1@example.com",
    title: "President",
    alt: "",
    country: "USA",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Name Lastname 2",
    phone: "5555555552",
    email: "signer2@example.com",
    title: "SVP Operations",
    alt: "5555555562",
    country: "USA",
    pr: true,
    cb: true,
    cn: true,
  },
];

const CHK = (v) => (v ? "\u2612" : "\u2610"); // ☒ ☐

// ── Drawing helpers ───────────────────────────────────────────────────────────

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

/**
 * Draw one contact block (two text rows) at Y position `y`.
 * Returns the Y position of the NEXT row (y + ROW_H).
 */
function contactRow(doc, contact, y) {
  // Row background (alternating white / very light gray)
  doc.rect(ML, y, CW, ROW_H).fill("#FFFFFF");

  // Row 1 — action, name, phone, email, authority checkboxes
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

  // Row 2 — corporate title, alt phone, country (sub-row in gray)
  const r2 = y + 18;
  doc.fillColor("#6b7280").fontSize(8).font("Helvetica");
  doc.text(contact.title, COL_NAME, r2, { width: 130, lineBreak: false });
  doc.text(contact.alt || "\u2014", COL_PHONE, r2, {
    width: 100,
    lineBreak: false,
  });
  doc.text(contact.country, COL_EMAIL, r2, { width: 115, lineBreak: false });

  hLine(doc, y + ROW_H);
  return y + ROW_H;
}

// ── Main generator ────────────────────────────────────────────────────────────

function generate(outputPath) {
  const doc = new PDFDocument({ margin: 0, size: "A4" });
  doc.pipe(fs.createWriteStream(outputPath));

  // ── PAGE 1: the visible form ──────────────────────────────────────────────

  // Header banner
  doc.rect(0, 0, 595.28, 44).fill("#1a3c5e");
  doc.fillColor("#FFFFFF").fontSize(15).font("Helvetica-Bold");
  doc.text("Banking Contact Authorization Form", ML, 13, { width: CW });

  // Sub-header: office names
  doc.fillColor("#93c5fd").fontSize(7.5).font("Helvetica");
  doc.text("New York and London Bank Offices", ML, 32, {
    width: 180,
    lineBreak: false,
  });

  // Intro paragraph
  doc.fillColor("#374151").fontSize(7.5).font("Helvetica");
  doc.text(
    "This Form allows the Client\u2019s Authorized Signer(s) or Delegate Authorized Signer(s) to " +
      "designate Banking Contacts with specific authorities and provide contact details. " +
      "This Form applies to all Accounts and Services listed herein. Capitalized terms have the " +
      "meanings in the Master or Global Transaction Banking Agreement (\u201cAccount Terms\u201d).",
    ML,
    56,
    { width: CW, lineBreak: true },
  );

  // CLIENT ENTITY
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

  // BANKING CONTACT AUTHORITIES
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
    doc.text(`\u2022  ${b}`, ML + 6, 158 + i * 19, { width: CW - 6 });
  });

  // BANKING CONTACT DETAILS banner
  hLine(doc, 220);
  sectionBanner(doc, 226, "BANKING CONTACT DETAILS");

  // Instruction text
  doc.fillColor("#374151").fontSize(7).font("Helvetica");
  doc.text(
    "Please provide current information for your Banking Contacts. " +
      "If adding or modifying a Contact, complete all required* fields. " +
      'If removing, complete \u201cFull Legal Name\u201d only. *Fields not marked "optional" are required.',
    ML,
    252,
    { width: CW },
  );

  // Column headers
  const colHdrY = 268;
  colHeader(doc, colHdrY);
  hLine(doc, colHdrY + COL_HDR_H);

  // ── Banking contact rows ── record Y as we go
  const bankingRowsStartY = colHdrY + COL_HDR_H; // 290
  let curY = bankingRowsStartY;

  const bankingPositions = [];
  for (const contact of BANKING_CONTACTS) {
    bankingPositions.push({ y: curY, h: ROW_H });
    curY = contactRow(doc, contact, curY);
  }

  // SIGNER AUTHORIZATION section
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

  const signerRowsStartY = signerColHdrY + COL_HDR_H;
  curY = signerRowsStartY;

  const signerPositions = [];
  for (const contact of SIGNER_CONTACTS) {
    signerPositions.push({ y: curY, h: ROW_H });
    curY = contactRow(doc, contact, curY);
  }

  // Footer line
  hLine(doc, curY + 6);
  doc.fillColor("#9ca3af").fontSize(6.5).font("Helvetica");
  doc.text(
    "Page 1 of 2  \u2022  Confidential \u2014 For authorized use only",
    ML,
    curY + 10,
    { width: CW, align: "center" },
  );

  // ── PAGE 2: machine-readable data ────────────────────────────────────────

  doc.addPage();

  doc.fillColor("#d1d5db").fontSize(5.5).font("Helvetica");
  doc.text("MACHINE-READABLE CONTACT DATA \u2014 DO NOT MODIFY", ML, 50);
  doc.moveDown(0.4);

  const mr = (s) => doc.text(s);

  mr("===CONTACT_DATA_BEGIN===");
  mr("group:Banking Contact Authorization");
  BANKING_CONTACTS.forEach((c, i) => {
    const pos = bankingPositions[i];
    mr(
      `contact:${c.action}|${c.name}|${c.phone}|${c.email}|` +
        `${c.title}|${c.alt}|${c.country}|` +
        `${c.pr}|${c.cb}|${c.cn}|1|${pos.y}|${pos.h}`,
    );
  });
  mr("group:Signer Authorization");
  SIGNER_CONTACTS.forEach((c, i) => {
    const pos = signerPositions[i];
    mr(
      `contact:${c.action}|${c.name}|${c.phone}|${c.email}|` +
        `${c.title}|${c.alt}|${c.country}|` +
        `${c.pr}|${c.cb}|${c.cn}|1|${pos.y}|${pos.h}`,
    );
  });
  mr("===CONTACT_DATA_END===");

  doc.end();

  console.log(`\nGenerated: ${path.resolve(outputPath)}`);
  console.log(`  Banking contacts : ${BANKING_CONTACTS.length}`);
  console.log(`  Signer contacts  : ${SIGNER_CONTACTS.length}`);
  console.log(`  Banking rows start at Y=${bankingRowsStartY}pt (page 1)`);
  console.log(`  Signer rows start at Y=${signerRowsStartY}pt (page 1)\n`);
}

generate(path.join(__dirname, "banking_contact_authorization.pdf"));
