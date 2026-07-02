"use strict";
/**
 * Generates 5 demo Banking Contact Authorization PDFs, each covering a
 * different scenario so the app can be demoed without a real document.
 *
 * Every PDF embeds a ===CONTACT_DATA_BEGIN=== block on the last page so the
 * Netlify Function parser can extract contacts deterministically. Each
 * contact: line ends with |page|Y|height so the frontend can highlight
 * the correct row in the PDF preview.
 *
 * Usage:  npm install && node generate_pdf.js
 * Output: ../frontend/public/sample-*.pdf
 */

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "../frontend/public");

// ── Layout ────────────────────────────────────────────────────────────────────
const ML = 50,
  MR = 545.28,
  CW = MR - ML;
const COL_ACTION = ML;
const COL_NAME = ML + 58;
const COL_PHONE = ML + 188;
const COL_EMAIL = ML + 288;
const COL_PR = ML + 403;
const COL_CB = ML + 423;
const COL_CN = ML + 443;
const ROW_H = 30;
const COL_HDR_H = 22;
const PAGE_BOTTOM = 800; // max Y before we start a new page
const PAGE_TOP = 50; // top margin on continuation pages

const CHK = (v) => (v ? "\u2612" : "\u2610");

// ── Contact master lists ──────────────────────────────────────────────────────
const ALL_BANKING = [
  {
    action: "Add",
    name: "Reginald Pompington III",
    phone: "4320001001",
    email: "reggie@pompington.co.uk",
    title: "Chief Pomposity Officer",
    alt: "",
    country: "United Kingdom",
    pr: false,
    cb: false,
    cn: false,
  },
  {
    action: "Add",
    name: "Chad Thunderstone",
    phone: "4320001002",
    email: "chad@thunderstone.com",
    title: "VP of Crushing It",
    alt: "4320001012",
    country: "USA",
    pr: true,
    cb: false,
    cn: true,
  },
  {
    action: "Edit",
    name: "Patricia McPatface",
    phone: "4320001003",
    email: "pat@mcpatface.org",
    title: "Chief Pattern Maker",
    alt: "",
    country: "Ireland",
    pr: false,
    cb: true,
    cn: false,
  },
  {
    action: "No Change",
    name: "Bob Loblaw Jr.",
    phone: "4320001004",
    email: "bob@loblawlaw.com",
    title: "Legal Eagle Esq.",
    alt: "4320001014",
    country: "USA",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Edit",
    name: "Karen Overreaction",
    phone: "4320001005",
    email: "karen@overreaction.net",
    title: "Head of Complaints",
    alt: "",
    country: "Canada",
    pr: false,
    cb: false,
    cn: true,
  },
  {
    action: "Add",
    name: "Ferdinand von Fancypants",
    phone: "4320001006",
    email: "ferd@fancypants.eu",
    title: "Duke of Finance",
    alt: "",
    country: "Germany",
    pr: true,
    cb: false,
    cn: false,
  },
  {
    action: "Add",
    name: "Maximilian Von Bureaucrat",
    phone: "4320001007",
    email: "max@vonbureaucrat.gov",
    title: "Minister of Forms",
    alt: "4320001017",
    country: "Austria",
    pr: false,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Archibald Tweedledum",
    phone: "4320001008",
    email: "arch@tweedledum.com",
    title: "Senior Twiddler",
    alt: "",
    country: "Australia",
    pr: true,
    cb: false,
    cn: true,
  },
  {
    action: "Add",
    name: "Gertrude Snarksworth",
    phone: "4320001009",
    email: "gertie@snarksworth.biz",
    title: "Director of Eyerolls",
    alt: "",
    country: "USA",
    pr: false,
    cb: false,
    cn: false,
  },
  {
    action: "Edit",
    name: "Cornelius Blunderbus",
    phone: "4320001010",
    email: "cornelius@blunderbus.com",
    title: "Head of Mishaps",
    alt: "4320001020",
    country: "United Kingdom",
    pr: true,
    cb: true,
    cn: false,
  },
  {
    action: "Add",
    name: "Ophelia Giddyup",
    phone: "4320001011",
    email: "ophelia@giddyup.horse",
    title: "Chief Excitement Officer",
    alt: "",
    country: "USA",
    pr: false,
    cb: false,
    cn: true,
  },
  {
    action: "No Change",
    name: "Wellington Bootsworthy",
    phone: "4320001012",
    email: "boots@wellington.uk",
    title: "VP of Footwear",
    alt: "",
    country: "United Kingdom",
    pr: true,
    cb: false,
    cn: false,
  },
  {
    action: "Add",
    name: "Barnaby Fudgefactor",
    phone: "4320001013",
    email: "barnaby@fudgefactor.co",
    title: "Senior Fudge Expert",
    alt: "4320001023",
    country: "Australia",
    pr: false,
    cb: true,
    cn: true,
  },
  {
    action: "Edit",
    name: "Constance Headshaker",
    phone: "4320001014",
    email: "constance@headshaker.org",
    title: "Head of Disapproval",
    alt: "",
    country: "Canada",
    pr: true,
    cb: false,
    cn: false,
  },
  {
    action: "Add",
    name: "Sir Pompous McBluster",
    phone: "4320001015",
    email: "sir@pompousmcbluster.uk",
    title: "Lord of Bluster",
    alt: "",
    country: "United Kingdom",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Penelope Crumplehorn",
    phone: "4320001016",
    email: "penny@crumplehorn.co",
    title: "VP of Fancy Things",
    alt: "",
    country: "USA",
    pr: false,
    cb: false,
    cn: false,
  },
  {
    action: "Add",
    name: "Theodore Ramshackle",
    phone: "4320001017",
    email: "theo@ramshackle.biz",
    title: "Chief Rambler",
    alt: "4320001027",
    country: "Ireland",
    pr: true,
    cb: false,
    cn: true,
  },
  {
    action: "Edit",
    name: "Beatrice Snortington",
    phone: "4320001018",
    email: "bea@snortington.co.uk",
    title: "Head of Snorting",
    alt: "",
    country: "United Kingdom",
    pr: false,
    cb: true,
    cn: false,
  },
  {
    action: "Add",
    name: "Ignatius Bumblebottom",
    phone: "4320001019",
    email: "ign@bumblebottom.com",
    title: "VP of Bottom Lines",
    alt: "4320001029",
    country: "USA",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Lavinia Overwrought",
    phone: "4320001020",
    email: "lavinia@overwrought.net",
    title: "Director of Drama",
    alt: "",
    country: "France",
    pr: false,
    cb: false,
    cn: true,
  },
];

const ALL_SIGNERS = [
  {
    action: "Add",
    name: "Barry Bigglesworth",
    phone: "5550001001",
    email: "barry@bigglesworth.org",
    title: "Chairman of Everything",
    alt: "",
    country: "USA",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Svetlana Von Hunksworth",
    phone: "5550001002",
    email: "svetlana@vonhunksworth.com",
    title: "SVP of All Things",
    alt: "5550001012",
    country: "Germany",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Leopold De Overpriced",
    phone: "5550001003",
    email: "leo@deoverpriced.fr",
    title: "Lord of Premium Services",
    alt: "",
    country: "France",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Contessa Moneybags",
    phone: "5550001004",
    email: "contessa@moneybags.it",
    title: "Countess of Cashflow",
    alt: "5550001014",
    country: "Italy",
    pr: true,
    cb: true,
    cn: true,
  },
  {
    action: "Add",
    name: "Humphrey Balderdash",
    phone: "5550001005",
    email: "humphrey@balderdash.uk",
    title: "President of Nonsense",
    alt: "",
    country: "United Kingdom",
    pr: true,
    cb: true,
    cn: true,
  },
];

// ── Scenarios ─────────────────────────────────────────────────────────────────
const SCENARIOS = [
  {
    filename: "sample-full.pdf",
    label: "Full Banking Contact Authorization Form",
    subtitle: "7 Banking Contacts + 2 Signer Authorizations",
    banking: ALL_BANKING.slice(0, 7),
    signers: ALL_SIGNERS.slice(0, 2),
    appendixPages: 0,
  },
  {
    filename: "sample-banking-only.pdf",
    label: "Banking Contact Authorization Form",
    subtitle: "5 Banking Contacts — No Signer Authorizations",
    banking: ALL_BANKING.slice(0, 5),
    signers: [],
    appendixPages: 0,
  },
  {
    filename: "sample-signers-only.pdf",
    label: "Banking Contact Authorization Form",
    subtitle: "Signer Authorization Only — No Banking Contacts",
    banking: [],
    signers: ALL_SIGNERS.slice(0, 3),
    appendixPages: 0,
  },
  {
    filename: "sample-large.pdf",
    label: "Banking Contact Authorization Form",
    subtitle: "20 Banking Contacts + 5 Signer Authorizations (Multi-Page)",
    banking: ALL_BANKING,
    signers: ALL_SIGNERS,
    appendixPages: 6, // regulatory appendix pushes total to ~10 pages
  },
  {
    filename: "sample-empty.pdf",
    label: "Banking Contact Authorization Form",
    subtitle: "No Contacts Submitted This Cycle",
    banking: [],
    signers: [],
    appendixPages: 0,
  },
];

// ── Drawing helpers ───────────────────────────────────────────────────────────
function hLine(doc, y, color = "#CCCCCC") {
  doc.moveTo(ML, y).lineTo(MR, y).strokeColor(color).lineWidth(0.5).stroke();
}

function sectionBanner(doc, y, label, color = "#1a3c5e") {
  doc.rect(ML, y, CW, COL_HDR_H).fill(color);
  doc
    .fillColor("#FFFFFF")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(label, ML + 4, y + 6);
  doc
    .fillColor("#FFFFFF")
    .fontSize(7)
    .font("Helvetica")
    .text("AUTHORITIES", COL_PR - 2, y + 4, { width: 100 });
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
  doc.text(contact.alt || "\u2014", COL_PHONE, r2, {
    width: 100,
    lineBreak: false,
  });
  doc.text(contact.country, COL_EMAIL, r2, { width: 115, lineBreak: false });
  hLine(doc, y + ROW_H);
  return y + ROW_H;
}

/** Draw a block of contacts, starting new pages when needed. */
function drawContacts(doc, contacts, startY, startPage) {
  let y = startY,
    page = startPage;
  const positions = [];
  for (const c of contacts) {
    if (y + ROW_H > PAGE_BOTTOM) {
      doc.addPage();
      page++;
      y = PAGE_TOP;
      colHeader(doc, y);
      hLine(doc, y + COL_HDR_H);
      y += COL_HDR_H;
    }
    positions.push({ y, h: ROW_H, page });
    y = contactRow(doc, c, y);
  }
  return { positions, y, page };
}

/** Ensure at least `needed` pt remain before the next section; add page if not. */
function ensureSpace(doc, y, page, needed) {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage();
    return { y: PAGE_TOP, page: page + 1 };
  }
  return { y, page };
}

// ── Appendix page content (for large form) ────────────────────────────────────
const APPENDIX_CONTENT = [
  {
    title: "APPENDIX A — CLIENT AUTHORIZATION AGREEMENT",
    body: "By executing this Form, the Client confirms that each individual listed herein as a Banking Contact is authorized to perform the designated activities on behalf of the Client. The Bank shall be entitled to rely on the authorities granted until written notice of any change is received, in accordance with the notification procedures set forth in the Account Terms.\n\n1. SCOPE OF AUTHORITY\nThe banking authorities designated apply to all Accounts and Services maintained by the Client at the Bank unless specifically limited herein. Authorized Banking Contacts may exercise designated authorities without further approval from the Client's Authorized Signers, subject to applicable transaction limits.\n\n2. INDEMNIFICATION\nThe Client agrees to indemnify and hold harmless the Bank from any loss, claim, damage, or expense arising from the Bank's reliance on the authorities and contact information provided in this Form, provided the Bank acts in good faith and in accordance with its standard operating procedures.",
  },
  {
    title: "APPENDIX A — CLIENT AUTHORIZATION AGREEMENT (CONTINUED)",
    body: "3. NOTIFICATION REQUIREMENTS\nThe Client is responsible for promptly notifying the Bank of any changes to the individuals authorized herein, including but not limited to: (a) revocation of authority, (b) changes to contact information, (c) changes in role or title, and (d) termination of employment or engagement. Notifications must be submitted using the amendment procedures described in Appendix E.\n\n4. DUAL CONTROL REQUIREMENTS\nFor payment requests above the designated threshold, the Bank may require confirmation from a second Authorized Banking Contact. The Client acknowledges that such dual-control requirements are implemented for security purposes and agrees to maintain a minimum of two individuals with Payment Request authority at all times.",
  },
  {
    title: "APPENDIX B — ACCOUNT MAINTENANCE PROCEDURES",
    body: "Banking Contacts designated with Payment Request authority may submit payment instructions via the Bank's approved secure channels. All payment requests are subject to the Bank's standard verification procedures, including but not limited to: callback verification, multi-factor authentication, and transaction limit controls.\n\nRECORD KEEPING\nThe Bank maintains records of all instructions received from Authorized Banking Contacts for a minimum period of seven (7) years. The Client acknowledges that such records constitute prima facie evidence of the instructions provided and the authorities relied upon.\n\nCALLBACK PROCEDURES\nBanking Contacts designated with Callback authority may be contacted by the Bank to verify payment instructions. The Client agrees to ensure that designated Callback contacts are available during business hours and reachable at the telephone numbers provided herein.",
  },
  {
    title: "APPENDIX C — COMPLIANCE AND REGULATORY REQUIREMENTS",
    body: "All Banking Contacts are subject to the Bank's Know Your Customer (KYC) and Anti-Money Laundering (AML) verification requirements. The Client represents and warrants that all individuals listed herein are duly authorized representatives of the Client and that the Client has conducted appropriate due diligence with respect to each such individual.\n\nDATA PROTECTION\nPersonal data submitted in this Form is processed in accordance with the Bank's Privacy Policy and applicable data protection legislation including, where applicable, the General Data Protection Regulation (GDPR) and equivalent national legislation. The Client confirms it has obtained all necessary consents from the individuals listed herein for the processing of their personal data by the Bank.",
  },
  {
    title: "APPENDIX D — DISPUTE RESOLUTION",
    body: "Any dispute arising from or in connection with this Form, or the breach, termination, or validity thereof, shall first be subject to good-faith negotiation between the parties. If such negotiation fails to resolve the dispute within thirty (30) days, the parties agree to submit the dispute to mediation administered by a mutually agreed mediator.\n\nGOVERNING LAW\nThis Form and any dispute or claim arising out of or in connection with it shall be governed by and construed in accordance with the laws specified in the Master or Global Transaction Banking Agreement between the Client and the Bank. The parties submit to the exclusive jurisdiction of the courts specified therein.",
  },
  {
    title: "APPENDIX E — AMENDMENT PROCEDURES AND SIGNATURE BLOCK",
    body: "AMENDMENTS\nThis Form may be amended by the Client at any time by completing a new Banking Contact Authorization Form and submitting it to the Bank through the Client's designated relationship manager or through the Bank's secure online portal. Amendments become effective upon the Bank's written confirmation of receipt and processing.\n\nAUTHORIZED SIGNATORIES\nBy signing below, the authorized signatory/signatories confirm that the information provided in this Form is complete and accurate, and that all individuals listed have been properly authorized pursuant to the Client's internal governance procedures.\n\n_______________________________          _______________________________\nAuthorized Signatory                      Authorized Signatory\n\nTitle: ________________________          Title: ________________________\n\nDate:  ________________________          Date:  ________________________",
  },
];

// ── Main generator ────────────────────────────────────────────────────────────
function generatePdf(scenario, outputPath) {
  const doc = new PDFDocument({ margin: 0, size: "A4" });
  doc.pipe(fs.createWriteStream(outputPath));

  let curPage = 1;

  // ── Header banner ──────────────────────────────────────────────────────────
  doc.rect(0, 0, 595.28, 44).fill("#1a3c5e");
  doc
    .fillColor("#FFFFFF")
    .fontSize(13)
    .font("Helvetica-Bold")
    .text(scenario.label, ML, 10, { width: 380 });
  doc
    .fillColor("#93c5fd")
    .fontSize(7.5)
    .font("Helvetica")
    .text("New York and London Bank Offices", ML, 30, { lineBreak: false });
  doc
    .fillColor("#93c5fd")
    .text(scenario.subtitle, ML + 195, 30, {
      width: 305,
      align: "right",
      lineBreak: false,
    });

  // ── Intro ──────────────────────────────────────────────────────────────────
  doc.fillColor("#374151").fontSize(7.5).font("Helvetica");
  doc.text(
    "This Form allows the Client's Authorized Signer(s) to designate Banking Contacts with specific authorities. " +
      "Applies to all Accounts and Services. Capitalized terms have the meanings in the Master Transaction Banking Agreement (\u201cAccount Terms\u201d).",
    ML,
    56,
    { width: CW },
  );

  // ── CLIENT ENTITY ──────────────────────────────────────────────────────────
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

  // ── BANKING CONTACT AUTHORITIES ────────────────────────────────────────────
  hLine(doc, 130);
  doc
    .fillColor("#1a3c5e")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("BANKING CONTACT AUTHORITIES", ML, 138);
  doc.fillColor("#374151").fontSize(7.5).font("Helvetica");
  const bullets = [
    "Payment Requests (PR): Authority to initiate, modify, and void payment transactions on behalf of the Client.",
    "Callbacks (CB): Authority to receive verification callbacks to confirm validity of payment instructions.",
    "Communications and Notices (CN): Authority to receive bank communications, rate changes, and account status information.",
  ];
  bullets.forEach((b, i) =>
    doc.text(`\u2022  ${b}`, ML + 6, 158 + i * 18, { width: CW - 6 }),
  );

  // ── BANKING CONTACT DETAILS ────────────────────────────────────────────────
  hLine(doc, 220);
  sectionBanner(doc, 226, "BANKING CONTACT DETAILS");
  doc.fillColor("#374151").fontSize(7).font("Helvetica");
  doc.text(
    "Complete all required* fields when adding or modifying a contact. For removal, provide Full Legal Name only. *Optional fields are marked.",
    ML,
    252,
    { width: CW },
  );

  const colHdrY = 268;
  colHeader(doc, colHdrY);
  hLine(doc, colHdrY + COL_HDR_H);

  const bankTableStartY = colHdrY + COL_HDR_H; // 290
  let bankingPositions, signerPositions;

  if (scenario.banking.length === 0) {
    // Empty banking contacts — show placeholder row
    doc.rect(ML, bankTableStartY, CW, 24).fill("#FAFAFA");
    doc.fillColor("#9ca3af").fontSize(8).font("Helvetica-BoldOblique");
    doc.text(
      "No Banking Contacts submitted for this cycle.",
      ML,
      bankTableStartY + 8,
      { width: CW, align: "center" },
    );
    hLine(doc, bankTableStartY + 24);
    bankingPositions = [];
    var bankEnd = { positions: [], y: bankTableStartY + 24, page: curPage };
  } else {
    const result = drawContacts(
      doc,
      scenario.banking,
      bankTableStartY,
      curPage,
    );
    bankingPositions = result.positions;
    var bankEnd = result;
  }

  // ── SIGNER AUTHORIZATION ───────────────────────────────────────────────────
  const postBank = ensureSpace(doc, bankEnd.y + 10, bankEnd.page, 100);
  curPage = postBank.page;

  hLine(doc, postBank.y);
  const signerBannerY = postBank.y + 6;
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

  const signerTableStartY = signerColHdrY + COL_HDR_H;

  if (scenario.signers.length === 0) {
    doc.rect(ML, signerTableStartY, CW, 24).fill("#FAFAFA");
    doc.fillColor("#9ca3af").fontSize(8).font("Helvetica-BoldOblique");
    doc.text(
      "No Signer Authorizations submitted for this cycle.",
      ML,
      signerTableStartY + 8,
      { width: CW, align: "center" },
    );
    hLine(doc, signerTableStartY + 24);
    signerPositions = [];
    var signerEnd = { y: signerTableStartY + 24, page: curPage };
  } else {
    const result = drawContacts(
      doc,
      scenario.signers,
      signerTableStartY,
      curPage,
    );
    signerPositions = result.positions;
    var signerEnd = result;
  }

  curPage = signerEnd.page;

  // ── Footer on last form page ───────────────────────────────────────────────
  hLine(doc, signerEnd.y + 6);
  doc.fillColor("#9ca3af").fontSize(6.5).font("Helvetica");
  doc.text(
    `Page 1 of ${1 + scenario.appendixPages + 1}  \u2022  Confidential \u2014 For authorized use only`,
    ML,
    signerEnd.y + 10,
    { width: CW, align: "center" },
  );

  // ── Regulatory appendix pages ──────────────────────────────────────────────
  for (let i = 0; i < scenario.appendixPages; i++) {
    doc.addPage();
    curPage++;
    const ap = APPENDIX_CONTENT[i % APPENDIX_CONTENT.length];
    doc.rect(0, 0, 595.28, 30).fill("#374151");
    doc
      .fillColor("#FFFFFF")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(ap.title, ML, 10);
    hLine(doc, 34, "#999999");
    doc
      .fillColor("#374151")
      .fontSize(7.5)
      .font("Helvetica")
      .text(ap.body, ML, 44, { width: CW, lineBreak: true });
    doc.fillColor("#9ca3af").fontSize(6.5);
    doc.text(
      `Page ${curPage} of ${1 + scenario.appendixPages + 1}  \u2022  Confidential`,
      ML,
      790,
      { width: CW, align: "center" },
    );
  }

  // ── Machine-readable page ─────────────────────────────────────────────────
  doc.addPage();
  doc.fillColor("#d1d5db").fontSize(5.5).font("Helvetica");
  doc.text("MACHINE-READABLE CONTACT DATA \u2014 DO NOT MODIFY", ML, 50);
  doc.moveDown(0.4);

  const mr = (s) => doc.text(s);
  mr("===CONTACT_DATA_BEGIN===");
  mr("group:Banking Contact Authorization");
  scenario.banking.forEach((c, i) => {
    const pos = bankingPositions[i] || { page: 1, y: 0, h: ROW_H };
    mr(
      `contact:${c.action}|${c.name}|${c.phone}|${c.email}|${c.title}|${c.alt}|${c.country}|${c.pr}|${c.cb}|${c.cn}|${pos.page}|${pos.y}|${pos.h}`,
    );
  });
  mr("group:Signer Authorization");
  scenario.signers.forEach((c, i) => {
    const pos = signerPositions[i] || { page: 1, y: 0, h: ROW_H };
    mr(
      `contact:${c.action}|${c.name}|${c.phone}|${c.email}|${c.title}|${c.alt}|${c.country}|${c.pr}|${c.cb}|${c.cn}|${pos.page}|${pos.y}|${pos.h}`,
    );
  });
  mr("===CONTACT_DATA_END===");

  doc.end();
}

// ── Run ───────────────────────────────────────────────────────────────────────
for (const s of SCENARIOS) {
  const outPath = path.join(OUT_DIR, s.filename);
  generatePdf(s, outPath);
  const total = s.banking.length + s.signers.length;
  console.log(`  ${s.filename.padEnd(30)} ${total} contacts`);
}
console.log(`\nAll ${SCENARIOS.length} PDFs written to ${OUT_DIR}\n`);
