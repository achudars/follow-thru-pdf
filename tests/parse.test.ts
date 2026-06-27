import { describe, it, expect } from 'vitest'
import { parseSection } from '../netlify/functions/parse'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBlock(groups: { type: string; contacts: string[] }[]) {
  const lines = ['===CONTACT_DATA_BEGIN===']
  for (const g of groups) {
    lines.push(`group:${g.type}`)
    for (const c of g.contacts) lines.push(`contact:${c}`)
  }
  lines.push('===CONTACT_DATA_END===')
  return lines.join('\n')
}

const FULL_CONTACT =
  'Add|Jane Smith|555-0100|jane@example.com|VP Finance|555-0101|USA|true|false|true|1|320|30'

// ── parseSection ─────────────────────────────────────────────────────────────

describe('parseSection', () => {
  it('parses group names and contact counts', () => {
    const text = makeBlock([
      { type: 'Banking Contact Authorization', contacts: [FULL_CONTACT] },
      { type: 'Signer Authorization', contacts: [FULL_CONTACT, FULL_CONTACT] },
    ])
    const doc = parseSection(text, 'test.pdf')
    expect(doc.fileName).toBe('test.pdf')
    expect(doc.groups).toHaveLength(2)
    expect(doc.groups[0].formType).toBe('Banking Contact Authorization')
    expect(doc.groups[0].contacts).toHaveLength(1)
    expect(doc.groups[1].contacts).toHaveLength(2)
  })

  it('parses all contact fields correctly', () => {
    const text = makeBlock([{ type: 'Test Group', contacts: [FULL_CONTACT] }])
    const c = parseSection(text, 'f.pdf').groups[0].contacts[0]
    expect(c.action).toBe('Add')
    expect(c.fullLegalName).toBe('Jane Smith')
    expect(c.primaryPhone).toBe('555-0100')
    expect(c.email).toBe('jane@example.com')
    expect(c.corporateTitle).toBe('VP Finance')
    expect(c.alternatePhone).toBe('555-0101')
    expect(c.countryOfResidence).toBe('USA')
    expect(c.authorities.paymentRequests).toBe(true)
    expect(c.authorities.callbacks).toBe(false)
    expect(c.authorities.communicationsAndNotices).toBe(true)
  })

  it('attaches pdfPosition when coordinates are present', () => {
    const text = makeBlock([{ type: 'G', contacts: [FULL_CONTACT] }])
    const pos = parseSection(text, 'f.pdf').groups[0].contacts[0].pdfPosition
    expect(pos).toEqual({ page: 1, y: 320, height: 30 })
  })

  it('omits pdfPosition when y is 0', () => {
    const noPos = 'Add|Jane Smith|555|jane@x.com|Title||USA|false|false|false|1|0|30'
    const text = makeBlock([{ type: 'G', contacts: [noPos] }])
    const pos = parseSection(text, 'f.pdf').groups[0].contacts[0].pdfPosition
    expect(pos).toBeUndefined()
  })

  it('sanitises unknown action to "No Change"', () => {
    const bad = 'UNKNOWN|Jane|555|j@x.com|T||USA|false|false|false|1|320|30'
    const text = makeBlock([{ type: 'G', contacts: [bad] }])
    expect(parseSection(text, 'f.pdf').groups[0].contacts[0].action).toBe('No Change')
  })

  it('accepts all four valid action values', () => {
    for (const action of ['Add', 'Edit', 'Delete', 'No Change']) {
      const line = `${action}|Jane|555|j@x.com|T||USA|false|false|false|1|320|30`
      const text = makeBlock([{ type: 'G', contacts: [line] }])
      expect(parseSection(text, 'f.pdf').groups[0].contacts[0].action).toBe(action)
    }
  })

  it('throws when markers are missing', () => {
    expect(() => parseSection('no markers here', 'f.pdf')).toThrow(
      'No machine-readable contact data found',
    )
  })

  it('handles multiple groups in order', () => {
    const text = makeBlock([
      { type: 'Group A', contacts: [FULL_CONTACT] },
      { type: 'Group B', contacts: [FULL_CONTACT] },
      { type: 'Group C', contacts: [FULL_CONTACT] },
    ])
    const groups = parseSection(text, 'f.pdf').groups
    expect(groups.map((g) => g.formType)).toEqual(['Group A', 'Group B', 'Group C'])
  })

  it('assigns unique ids to every contact', () => {
    const text = makeBlock([
      { type: 'G', contacts: [FULL_CONTACT, FULL_CONTACT, FULL_CONTACT] },
    ])
    const ids = parseSection(text, 'f.pdf').groups[0].contacts.map((c) => c.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('round-trips the real sample PDF', () => {
    // Uses a pre-extracted text fixture so this test never needs to invoke
    // pdf-parse (which bundles webpack and conflicts with vite's module system).
    // Regenerate the fixture: cd sample && node generate_pdf.js && node ../scripts/gen-fixture.js
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const text = fs.readFileSync(
      path.resolve(process.cwd(), 'tests/fixtures/sample-pdf-text.txt'),
      'utf8',
    )
    const doc = parseSection(text, 'banking_contact_authorization.pdf')
    expect(doc.groups).toHaveLength(2)
    expect(doc.groups[0].contacts).toHaveLength(7)
    expect(doc.groups[1].contacts).toHaveLength(2)
    // All banking contacts have valid pdfPositions on page 1
    for (const c of doc.groups[0].contacts) {
      expect(c.pdfPosition?.page).toBe(1)
      expect(c.pdfPosition?.y).toBeGreaterThan(0)
    }
  })
})
