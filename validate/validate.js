const z = window.zod;

export const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vendor: z.string().optional().default(''),
  description: z.string().optional().default(''),
  category: z.string().optional().default(''),
  subcategory: z.string().nullable().optional(),
  amount: z.number().finite(),
  currency: z.string().min(3).max(3),
  payment_method: z.string().nullable().optional(),
  invoice_number: z.string().nullable().optional(),
  reference_id: z.string().nullable().optional(),
  tax_amount: z.number().finite().optional().default(0),
  tip_amount: z.number().finite().optional().default(0),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  source_type: z.enum(['manual','ocr','pdf','paste']).optional().default('manual'),
  source_filename: z.string().nullable().optional(),
  attachment_drive_file_id: z.string().nullable().optional(),
  created_at: z.string(),
  processed_at: z.string(),
  validated: z.boolean(),
  validation_errors: z.array(z.string()),
});

export function validateRecord(rec) {
  const errs = [];
  ['amount','tax_amount','tip_amount'].forEach(k => rec[k] = Number(rec[k] ?? 0));
  if (rec.amount < 0 && !String(rec.notes||'').toLowerCase().includes('refund')) {
    errs.push('Negative amount without refund note');
  }
  try { schema.parse(rec); }
  catch (e) { for (const issue of e.issues || []) errs.push(`${issue.path.join('.')} : ${issue.message}`); }
  if (!rec.category) errs.push('Missing category');
  return { valid: errs.length === 0, errors: errs };
}
