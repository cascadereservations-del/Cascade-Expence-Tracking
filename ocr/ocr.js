import { getPdfTextOrImages } from '../parser/pdf.js';

export const ocrProvider = {
  async extract(file, opts = { useTesseract: true }) {
    const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const pdfRes = await getPdfTextOrImages(file);
      if (pdfRes.type === 'text') {
        return { text: pdfRes.text, confidence: 0.99 };
      }
      if (!opts.useTesseract) return { text: '', confidence: 0 };
      let fullText = '';
      let pages = 0;
      for (const img of pdfRes.images) {
        const { data: { text } } = await Tesseract.recognize(img, 'eng', { logger: () => {} });
        fullText += '\n' + text;
        pages++;
      }
      return { text: fullText.trim(), confidence: pages ? 0.6 : 0.0 };
    }

    if (!opts.useTesseract) return { text: '', confidence: 0 };
    const imgUrl = URL.createObjectURL(file);
    try {
      const { data } = await Tesseract.recognize(imgUrl, 'eng', { logger: () => {} });
      URL.revokeObjectURL(imgUrl);
      return { text: data.text || '', confidence: data.confidence || 0.6 };
    } catch (e) {
      URL.revokeObjectURL(imgUrl);
      return { text: '', confidence: 0 };
    }
  },
};
