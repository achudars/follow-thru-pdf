import { useEffect, useRef, useState } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import type { PdfPosition } from '../types'

interface Props {
    pdfUrl: string
    fileName: string
    highlight?: PdfPosition
}

/**
 * Height of an A4 page in PDF points (72 DPI).
 * Used to convert the pdfkit-recorded Y coordinates into percentage-based
 * overlay positions that remain correct at any zoom level.
 *
 * pdfkit uses a top-left origin (Y increases downward), which matches
 * the CSS coordinate system, so no axis flip is needed.
 */
const A4_HEIGHT_PT = 841.89

export default function PdfPreview({ pdfUrl, fileName, highlight }: Props) {
    const [numPages, setNumPages] = useState(0)
    const [pageNumber, setPageNumber] = useState(1)
    // Actual rendered height of the page canvas (CSS pixels) — used for smooth scrolling
    const [pageHeight, setPageHeight] = useState(0)
    const pageWrapRef = useRef<HTMLDivElement>(null)

    // Auto-jump to the correct page whenever the selected contact changes
    useEffect(() => {
        if (highlight && highlight.page !== pageNumber) {
            setPageNumber(highlight.page)
        }
    }, [highlight]) // eslint-disable-line react-hooks/exhaustive-deps

    // When highlight changes (same page), scroll so the highlighted row is visible
    useEffect(() => {
        if (!highlight || !pageWrapRef.current || pageHeight === 0) return
        const topPx = (highlight.y / A4_HEIGHT_PT) * pageHeight
        pageWrapRef.current.scrollTo({ top: topPx - 80, behavior: 'smooth' })
    }, [highlight, pageHeight])

    const canGoBack = pageNumber > 1
    const canGoForward = pageNumber < numPages

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 h-10 bg-gray-100 border-b border-gray-300 text-xs text-gray-600 shrink-0 select-none">
                <span className="truncate max-w-xs font-medium text-gray-700">{fileName}</span>
                <div className="flex items-center gap-1.5">
                    <button
                        disabled={!canGoBack}
                        onClick={() => setPageNumber((p) => p - 1)}
                        className="px-1.5 py-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base leading-none"
                    >
                        ‹
                    </button>
                    <span className="tabular-nums">
                        {pageNumber} / {numPages || '—'}
                    </span>
                    <button
                        disabled={!canGoForward}
                        onClick={() => setPageNumber((p) => p + 1)}
                        className="px-1.5 py-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base leading-none"
                    >
                        ›
                    </button>
                </div>
            </div>

            {/* Scrollable page area */}
            <div ref={pageWrapRef} className="flex-1 overflow-auto flex justify-center py-4 px-2">
                <Document
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={
                        <div className="flex items-center justify-center w-full min-h-[200px] text-sm text-gray-400">
                            Loading PDF…
                        </div>
                    }
                    error={
                        <div className="flex items-center justify-center w-full min-h-[200px] text-sm text-red-500">
                            Failed to load PDF.
                        </div>
                    }
                >
                    {/* Wrapper gives us a relative stacking context for the overlay */}
                    <div
                        className="relative inline-block shadow-lg"
                        onLoad={() => {
                            // Capture the rendered canvas height after the page paints
                            const canvas = pageWrapRef.current?.querySelector('canvas')
                            if (canvas) setPageHeight(canvas.clientHeight)
                        }}
                    >
                        <Page
                            pageNumber={pageNumber}
                            renderTextLayer
                            renderAnnotationLayer
                            onRenderSuccess={() => {
                                const canvas = pageWrapRef.current?.querySelector('canvas')
                                if (canvas) setPageHeight(canvas.clientHeight)
                            }}
                        />

                        {/* ── Yellow highlight overlay ── */}
                        {highlight && highlight.page === pageNumber && (
                            <div
                                className="absolute left-0 right-0 pointer-events-none"
                                style={{
                                    top: `${(highlight.y / A4_HEIGHT_PT) * 100}%`,
                                    height: `${(highlight.height / A4_HEIGHT_PT) * 100}%`,
                                    backgroundColor: 'rgba(253, 224, 71, 0.45)',  /* yellow-300 @ 45% */
                                    borderTop: '1.5px solid rgba(202, 138, 4, 0.65)',
                                    borderBottom: '1.5px solid rgba(202, 138, 4, 0.65)',
                                    mixBlendMode: 'multiply',
                                }}
                            />
                        )}
                    </div>
                </Document>
            </div>
        </div>
    )
}
