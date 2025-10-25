export function exportJSON(records) {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `expenses_${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
}
export function exportCSV(records) {
  const cols = [
    'date','vendor','description','category','subcategory','amount','currency','payment_method','invoice_number','reference_id','tax_amount','tip_amount','location','notes','source_type','source_filename','attachment_drive_file_id','created_at','processed_at','validated'
  ];
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const rows = [cols.join(',')];
  for (const r of records) rows.push(cols.map((c) => escape(r[c])).join(','));
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `expenses_${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}
