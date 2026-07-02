import { useState } from 'react'
import type { Contact, ParsedDocument } from '../types'

interface Props {
    groups: ParsedDocument['groups']
    editedContacts: Record<string, Contact>
    selectedContactId: string | null
    onSelectContact: (id: string) => void
}

export default function ContactList({
    groups,
    editedContacts,
    selectedContactId,
    onSelectContact,
}: Props) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

    const toggle = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))

    return (
        <nav className="py-2">
            {groups.map((group) => {
                const isCollapsed = !!collapsed[group.id]
                return (
                    <div key={group.id}>
                        {/* Group header */}
                        <button
                            onClick={() => toggle(group.id)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-xs font-semibold text-gray-700 leading-tight">
                                {group.formType}
                                <span className="ml-1.5 font-normal text-gray-400">({group.contacts.length})</span>
                            </span>
                            <svg
                                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>

                        {/* Contact items */}
                        {!isCollapsed && (
                            <ul>
                                {group.contacts.length === 0 ? (
                                    <li className="px-5 py-3 text-xs text-gray-400 italic">
                                        No contacts in this group
                                    </li>
                                ) : (
                                    group.contacts.map((contact) => {
                                        const isSelected = contact.id === selectedContactId
                                        const displayed = editedContacts[contact.id] ?? contact
                                        return (
                                            <li key={contact.id}>
                                                <button
                                                    onClick={() => onSelectContact(contact.id)}
                                                    className={[
                                                        'w-full flex items-center gap-2.5 px-5 py-2 text-left transition-colors',
                                                        isSelected
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'text-gray-600 hover:bg-gray-50',
                                                    ].join(' ')}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-blue-600' : 'bg-gray-300'
                                                            }`}
                                                    />
                                                    <span
                                                        className={`text-xs truncate ${isSelected ? 'font-semibold' : 'font-medium'}`}
                                                    >
                                                        {displayed.fullLegalName}
                                                    </span>
                                                </button>
                                            </li>
                                        )
                                    })
                                )}
                            </ul>
                        )}
                    </div>
                )
            })}
        </nav>
    )
}
