import { createWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  name?: string;
  document?: string;
  documentType?: 'CPF' | 'RG' | 'CNH';
  birthDate?: string;
}

// Format document helper
export function formatDocument(val: string): string {
  const digits = val.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 9) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})([\dX])/, '$1.$2.$3-$4');
  }
  return val;
}

// Clean document to numbers only
export function cleanDocument(val: string): string {
  return val.replace(/[^\dXx]/g, '').toUpperCase();
}

/**
 * Extract Name, CPF and RG from recognized Brazilian document text
 */
export function extractDataFromText(rawText: string): Partial<OCRResult> {
  const result: Partial<OCRResult> = {};
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Search for CPF
  // Pattern with punctuation: 000.000.000-00 or without: 11 consecutive digits
  const cpfRegex = /\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/;
  const cpfMatch = rawText.match(cpfRegex);
  if (cpfMatch) {
    result.document = formatDocument(cpfMatch[1]);
    result.documentType = 'CPF';
  }

  // 2. Search for RG if CPF not found
  if (!result.document) {
    const rgRegex = /\b(\d{1,2}\.?\d{3}\.?\d{3}-?[\dX])\b/i;
    const rgMatch = rawText.match(rgRegex);
    if (rgMatch) {
      result.document = rgMatch[1].toUpperCase();
      result.documentType = 'RG';
    }
  }

  // 3. Search for Birth Date (DD/MM/AAAA)
  const dateRegex = /\b(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19\d{2}|20[0-2]\d)\b/;
  const dateMatch = rawText.match(dateRegex);
  if (dateMatch) {
    const [day, month, year] = dateMatch[0].split('/');
    result.birthDate = `${year}-${month}-${day}`;
  }

  // 4. Search for Name
  // Common keywords on Brazilian IDs: "NOME", "NOME/NAME", or 2-4 uppercase capitalized words
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();

    if (upper.includes('NOME') && !upper.includes('FILIAÇÃO') && !upper.includes('MAE') && !upper.includes('PAI')) {
      // Check if the name is on the same line or next line
      const cleanLine = line.replace(/NOME(\s+DO\s+PORTADOR|\s+CIVIL|:)?/i, '').trim();
      if (cleanLine.length > 5 && !/\d/.test(cleanLine)) {
        result.name = cleanName(cleanLine);
        break;
      } else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.length > 5 && !/\d/.test(nextLine)) {
          result.name = cleanName(nextLine);
          break;
        }
      }
    }
  }

  // Fallback: If name not found by keyword, look for lines with 2-4 capitalized words
  if (!result.name) {
    for (const line of lines) {
      const clean = line.replace(/[^A-Za-zÀ-ÿ\s]/g, '').trim();
      const words = clean.split(/\s+/);
      if (
        words.length >= 2 &&
        words.length <= 5 &&
        clean.length >= 8 &&
        !line.toLowerCase().includes('brasil') &&
        !line.toLowerCase().includes('republica') &&
        !line.toLowerCase().includes('instituto') &&
        !line.toLowerCase().includes('seguranca') &&
        !line.toLowerCase().includes('registro') &&
        !line.toLowerCase().includes('secretaria')
      ) {
        result.name = cleanName(clean);
        break;
      }
    }
  }

  return result;
}

function cleanName(str: string): string {
  return str
    .replace(/[^A-Za-zÀ-ÿ\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Run OCR on an image (Base64 data URL, Blob or URL)
 */
export async function recognizeDocumentPhoto(
  imageData: string | Blob,
  onProgress?: (progress: number, status: string) => void
): Promise<OCRResult> {
  try {
    onProgress?.(10, 'Iniciando módulo de leitura ótica...');
    const worker = await createWorker('por'); // Portuguese model

    onProgress?.(30, 'Reconhecendo dados do documento...');
    const ret = await worker.recognize(imageData);
    const rawText = ret.data.text;

    onProgress?.(80, 'Filtrando dados (Nome, CPF e RG)...');
    const parsed = extractDataFromText(rawText);

    await worker.terminate();
    onProgress?.(100, 'Leitura concluída com sucesso!');

    return {
      text: rawText,
      name: parsed.name,
      document: parsed.document,
      documentType: parsed.documentType || 'CPF',
      birthDate: parsed.birthDate,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    // Graceful fallback
    return {
      text: '',
    };
  }
}
