function heuristicParse(text) {
  const out = {};
  const iso = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  const slashed = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  let date = '';
  if (iso) {
    date = `${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}`;
  } else if (slashed) {
    const m = Number(slashed[1]), d = Number(slashed[2]), y = slashed[3];
    if (m > 12 && d <= 12) date = `${y}-${String(d).padStart(2,'0')}-${String(m).padStart(2,'0')}`;
    else date = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  out.date = date || new Date().toISOString().slice(0,10);

  const amounts = [...text.matchAll(/(?:₱|PHP|USD|\$)?\s?(-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+\.\d{2})/gi)].map(m => m[0]);
  const last = amounts.pop() || '';
  const cleaned = last.replace(/[^\d.,-]/g,'').replace(/,/g,'');
  out.amount = cleaned ? Number(cleaned) : 0;

  const vend = text.match(/\b([A-Z][A-Z &\-]{2,})\b/);
  out.vendor = vend ? vend[1].trim() : '';

  const inv = text.match(/\b(?:INV|Invoice|Ref|Receipt)\s*[:#]?\s*([A-Za-z0-9\-]{4,})/i);
  out.invoice_number = inv ? inv[1] : null;

  out.description = '';
  out.category = '';
  out.currency = text.includes('USD') || text.includes('$') ? 'USD' : 'PHP';
  return out;
}

async function geminiParse(text, apiKey) {
  const prompt = `
You are a parser that returns ONLY strict JSON matching this TypeScript type:

type Expense = { date: string, vendor: string, description: string, category: string, subcategory: string | null, amount: number, currency: string, payment_method: string | null, invoice_number: string | null, reference_id: string | null, tax_amount: number, tip_amount: number, location: string | null, notes: string | null };

Rules:
- Never invent totals; if absent, amount=0.
- Prefer explicit invoice/ref ids if present.
- Philippines context defaults currency=PHP.
Return ONLY JSON.
Text:
"""${text.slice(0, 4000)}"""`.trim();

  const resp = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, topP: 0.1 },
      }),
    }
  );
  const data = await resp.json();
  const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  try { return JSON.parse(textOut); } catch { return {}; }
}

export async function parseFromText(text, opts = { allowLLM: false }) {
  const base = heuristicParse(text || '');
  if (!opts.allowLLM || !opts.geminiKey) return base;
  try {
    const llm = await geminiParse(text, opts.geminiKey);
    return { ...base, ...llm };
  } catch { return base; }
}

export { heuristicParse };
