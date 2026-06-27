export type ContactAction = 'Add' | 'Edit' | 'Delete' | 'No Change'

export interface ContactAuthority {
  paymentRequests: boolean
  callbacks: boolean
  communicationsAndNotices: boolean
}

export interface PdfPosition {
  /** 1-indexed page number within the PDF */
  page: number
  /** Distance from the top of the page in PDF points (pdfkit coordinate space) */
  y: number
  /** Height of the highlighted block in PDF points */
  height: number
}

export interface Contact {
  id: string
  action: ContactAction
  fullLegalName: string
  primaryPhone: string
  email: string
  corporateTitle: string
  alternatePhone: string
  countryOfResidence: string
  authorities: ContactAuthority
  /** Row position in the source PDF — used to drive the yellow highlight overlay */
  pdfPosition?: PdfPosition
}

export interface ContactGroup {
  id: string
  formType: string
  contacts: Contact[]
}

export interface ParsedDocument {
  fileName: string
  groups: ContactGroup[]
}
