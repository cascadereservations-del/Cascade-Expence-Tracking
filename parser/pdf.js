export async function getPdfTextOrImages(file) {
  const buf = await file.arrayBuffer();
  const pdfModule = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs');
  const pdfjsLib = pdfModule.default;
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  let collected = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((it) => it.str).join(' ');
    collected += '\n' + text;
  }
  const hasText = collected.trim().length > 10;
  if (hasText) return { type: 'text', text: collected.trim() };

  const images = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL('image/png'));
  }
  return { type: 'images', images };
}
