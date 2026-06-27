import type { Contact, ContactAction } from '../types'

interface Props {
    contact: Contact
    onChange: (updated: Contact) => void
}

const ACTIONS: ContactAction[] = ['Add', 'Edit', 'Delete', 'No Change']

const INPUT =
    'w-full border-0 border-b border-gray-200 bg-transparent pb-1 text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition-colors'

function initials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0] ?? '')
        .join('')
        .toUpperCase()
}

function Field({
    label,
    optional,
    children,
}: Readonly<{
    label: string
    optional?: boolean
    children: React.ReactNode
}>) {
    return (
        <div className="space-y-1">
            <label className="block text-xs text-blue-600 font-medium">
                {label}
                {optional && <span className="ml-1 text-gray-400 font-normal">(Optional)</span>}
            </label>
            {children}
        </div>
    )
}

export default function ContactDetails({ contact, onChange }: Readonly<Props>) {
    const set = <K extends keyof Contact>(key: K, value: Contact[K]) =>
        onChange({ ...contact, [key]: value })

    return (
        <div className="p-5 space-y-5">
            {/* ── Contact Action ── */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Contact Action
                        </p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                            {ACTIONS.map((action) => (
                                <label key={action} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`action-${contact.id}`}
                                        value={action}
                                        checked={contact.action === action}
                                        onChange={() => set('action', action)}
                                        className="accent-blue-600"
                                    />
                                    <span className="text-xs text-gray-700">{action}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                        {initials(contact.fullLegalName)}
                    </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-200 pt-3">
                    Please review the ingested contact details. Ensure all fields from the original contact
                    form match the processed data. If you find any discrepancies or missing information, edit
                    the fields directly before finalizing the import.
                </p>
            </div>

            {/* ── Contact Details ── */}
            <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Contact Details
                </p>

                <Field label="Full Legal Name">
                    <input
                        type="text"
                        value={contact.fullLegalName}
                        onChange={(e) => set('fullLegalName', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field label="Primary Phone Number">
                    <input
                        type="tel"
                        value={contact.primaryPhone}
                        onChange={(e) => set('primaryPhone', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field label="Email Address">
                    <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => set('email', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field label="Corporate Title">
                    <input
                        type="text"
                        value={contact.corporateTitle}
                        onChange={(e) => set('corporateTitle', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field label="Alternate Phone Number" optional>
                    <input
                        type="tel"
                        value={contact.alternatePhone}
                        onChange={(e) => set('alternatePhone', e.target.value)}
                        className={INPUT}
                        placeholder="—"
                    />
                </Field>

                <Field label="Country of Residence">
                    <input
                        type="text"
                        value={contact.countryOfResidence}
                        onChange={(e) => set('countryOfResidence', e.target.value)}
                        className={INPUT}
                    />
                </Field>
            </div>

            {/* ── Contact Authorities ── */}
            <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Contact Authorities
                </p>

                {(
                    [
                        ['paymentRequests', 'Payment Requests'],
                        ['callbacks', 'Callbacks'],
                        ['communicationsAndNotices', 'Communications and Notices'],
                    ] as const
                ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={contact.authorities[key]}
                            onChange={(e) =>
                                onChange({
                                    ...contact,
                                    authorities: { ...contact.authorities, [key]: e.target.checked },
                                })
                            }
                            className="w-4 h-4 rounded accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}
