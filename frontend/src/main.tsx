import React from 'react'
import ReactDOM from 'react-dom/client'
import { pdfjs } from 'react-pdf'
import App from './App.tsx'
import './index.css'

// Configure PDF.js worker — uses unpkg CDN so no Vite worker config needed
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
