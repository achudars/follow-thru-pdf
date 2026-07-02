import { useMemo } from 'react'
import type { Contact, ParsedDocument, PdfPosition } from '../types'
import ContactList from './ContactList'
import ContactDetails from './ContactDetails'
import PdfPreview from './PdfPreview'

interface Props {
    document: ParsedDocument
    pdfUrl: string
    editedContacts: Record<string, Contact>
    selectedContactId: string | null
    onSelectContact: (id: string) => void
    onContactChange: (id: string, updated: Contact) => void
    onIngest: () => void
}

export default function Dashboard({
    document,
    pdfUrl,
    editedContacts,
    selectedContactId,
    onSelectContact,
    onContactChange,
    onIngest,
}: Props) {
    const allContacts = useMemo(
        () => document.groups.flatMap((g) => g.contacts),
        [document],
    )

    const currentIndex = useMemo(
        () => allContacts.findIndex((c) => c.id === selectedContactId),
        [allContacts, selectedContactId],
    )

    const selectedContact = selectedContactId ? editedContacts[selectedContactId] : null
    const total = allContacts.length

    const highlight: PdfPosition | undefined = selectedContact?.pdfPosition

    const navigate = (delta: number) => {
        const next = currentIndex + delta
        if (next >= 0 && next < total) onSelectContact(allContacts[next].id)
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            {/* ── Top bar ── */}
            <header className="flex items-center justify-between px-5 h-14 bg-white border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                        onClick={() => window.location.reload()}
                        title="Back to upload"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <span className="text-sm font-semibold text-gray-800">Contact Ingestion Review</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Contact navigator */}
                    {total > 0 ? (
                        <div className="flex items-center gap-1 text-gray-600">
                            <button
                                disabled={currentIndex <= 0}
                                onClick={() => navigate(-1)}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Previous contact"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-xs min-w-[90px] text-center select-none">
                                Contact {currentIndex + 1} of {total}
                            </span>
                            <button
                                disabled={currentIndex >= total - 1}
                                onClick={() => navigate(1)}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Next contact"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-500">
                            No contacts in this form
                        </span>
                    )}

                    <button
                        onClick={onIngest}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        Ingest
                    </button>
                </div>
            </header>

            {/* ── 3-panel body ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left — contact list */}
                <aside className="w-56 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
                    <ContactList
                        groups={document.groups}
                        editedContacts={editedContacts}
                        selectedContactId={selectedContactId}
                        onSelectContact={onSelectContact}
                    />
                </aside>

                {/* Middle — contact details */}
                <main className="w-80 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
                    {total === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <svg
                                className="w-12 h-12 text-gray-300 mb-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <p className="text-sm font-medium text-gray-700">No Contacts Found</p>
                            <p className="text-xs text-gray-400 mt-1">
                                This form does not contain any<br />banking or signer authorizations
                            </p>
                        </div>
                    ) : selectedContact ? (
                        <ContactDetails
                            contact={selectedContact}
                            onChange={(updated) => onContactChange(selectedContact.id, updated)}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-gray-400">
                            Select a contact
                        </div>
                    )}
                </main>

                {/* Right — PDF preview with highlight overlay */}
                <section className="flex-1 overflow-hidden bg-gray-200">
                    <PdfPreview pdfUrl={pdfUrl} fileName={document.fileName} highlight={highlight} />
                </section>
            </div>
        </div>
    )
}
