import { useState, useCallback } from 'react'
import type { Contact, ParsedDocument } from './types'
import UploadStep from './components/UploadStep'
import Dashboard from './components/Dashboard'
import { parsePdf } from './api/client'

type AppStep = 'upload' | 'parsing' | 'dashboard'

function App() {
    const [step, setStep] = useState<AppStep>('upload')
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [document, setDocument] = useState<ParsedDocument | null>(null)
    const [editedContacts, setEditedContacts] = useState<Record<string, Contact>>({})
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileAccepted = useCallback(async (file: File) => {
        setError(null)
        setStep('parsing')
        const url = URL.createObjectURL(file)
        setPdfUrl(url)

        try {
            const parsed = await parsePdf(file)
            setDocument(parsed)

            const initial: Record<string, Contact> = {}
            parsed.groups.forEach((g) => g.contacts.forEach((c) => (initial[c.id] = c)))
            setEditedContacts(initial)

            const first = parsed.groups[0]?.contacts[0]
            if (first) setSelectedContactId(first.id)

            setStep('dashboard')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse PDF')
            setStep('upload')
            URL.revokeObjectURL(url)
            setPdfUrl(null)
        }
    }, [])

    const handleContactChange = useCallback((id: string, updated: Contact) => {
        setEditedContacts((prev) => ({ ...prev, [id]: updated }))
    }, [])

    const handleIngest = useCallback(() => {
        // Stub: wire up your downstream CRM / database API here
        alert('Ingested! (stub — wire up your downstream API here)')
    }, [])

    if (step === 'upload' || step === 'parsing') {
        return (
            <UploadStep loading={step === 'parsing'} error={error} onFileAccepted={handleFileAccepted} />
        )
    }

    return (
        <Dashboard
            document={document!}
            pdfUrl={pdfUrl!}
            editedContacts={editedContacts}
            selectedContactId={selectedContactId}
            onSelectContact={setSelectedContactId}
            onContactChange={handleContactChange}
            onIngest={handleIngest}
        />
    )
}

export default App
