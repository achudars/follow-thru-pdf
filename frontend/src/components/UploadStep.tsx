import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props {
    loading: boolean
    error: string | null
    onFileAccepted: (file: File) => void
}

export default function UploadStep({ loading, error, onFileAccepted }: Props) {
    const onDrop = useCallback(
        (accepted: File[]) => {
            if (accepted[0]) onFileAccepted(accepted[0])
        },
        [onFileAccepted],
    )

    const [sampleLoading, setSampleLoading] = useState<string | null>(null)

    const handleUseSample = useCallback(
        async (filename: string) => {
            setSampleLoading(filename)
            try {
                const res = await fetch(`/${filename}`)
                const blob = await res.blob()
                const file = new File([blob], filename, {
                    type: 'application/pdf',
                })
                onFileAccepted(file)
            } finally {
                setSampleLoading(null)
            }
        },
        [onFileAccepted],
    )

    const samples = [
        { filename: 'sample-full.pdf', label: 'Full Form (7+2)', desc: 'Banking + Signers' },
        { filename: 'sample-banking-only.pdf', label: 'Banking Only (5)', desc: '5 banking contacts' },
        { filename: 'sample-signers-only.pdf', label: 'Signers Only (3)', desc: '3 signer authorizations' },
        { filename: 'sample-large.pdf', label: 'Large Form (20+5)', desc: 'Multi-page, 25 contacts' },
        { filename: 'sample-empty.pdf', label: 'Empty Form (0)', desc: 'No contacts submitted' },
    ]

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
        disabled: loading,
        // Disable the File System Access API — it is blocked in many browser
        // contexts (VS Code browser, some Chromium security policies) and causes
        // a silent NotAllowedError that prevents the drop from being handled.
        useFsAccessApi: false,
    })

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="w-full max-w-lg px-6">
                {/* Logo / title */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-md">
                        <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900">Contact Ingestion Review</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Upload a Banking Contact Authorization PDF to begin
                    </p>
                </div>

                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={[
                        'relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
                        isDragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50',
                        loading ? 'opacity-60 cursor-not-allowed' : '',
                    ].join(' ')}
                >
                    <input {...getInputProps()} />

                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <svg
                                className="animate-spin w-8 h-8 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                />
                            </svg>
                            <p className="text-sm font-medium text-gray-700">Parsing PDF…</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <svg
                                className="w-10 h-10 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    {isDragActive ? 'Drop the PDF here' : 'Drag & drop your PDF here'}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">or click to browse — PDF files only</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Demo shortcuts */}
                {!loading && (
                    <>
                        <div className="mt-5 flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400">or try a demo scenario</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {samples.map((s) => {
                                const isLoading = sampleLoading === s.filename
                                return (
                                    <button
                                        key={s.filename}
                                        onClick={() => handleUseSample(s.filename)}
                                        disabled={!!sampleLoading}
                                        className="flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-1.5 w-full">
                                            {isLoading ? (
                                                <svg
                                                    className="animate-spin w-3.5 h-3.5 text-blue-600 shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8v8H4z"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="w-3.5 h-3.5 text-gray-400 shrink-0"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                </svg>
                                            )}
                                            <span className="text-xs font-semibold text-gray-700 truncate">
                                                {s.label}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-gray-500 leading-tight ml-5">
                                            {s.desc}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm.75 7a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {error}
                    </div>
                )}
            </div>
        </div>
    )
}
