import axios from 'axios'
import type { ParsedDocument } from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function parsePdf(file: File): Promise<ParsedDocument> {
  // Encode as base64 so we can send plain JSON — avoids multipart complexity in Netlify Functions
  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const { data } = await axios.post<ParsedDocument>(`${BASE_URL}/api/parse`, {
    fileName: file.name,
    fileData,
  })

  return data
}
