/**
 * Cascade Tools — optional helpers inside the spreadsheet.
 * Add this file to Apps Script attached to the Sheet (Extensions → Apps Script).
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Cascade Tools')
    .addItem('Normalize New Rows', 'normalizeNewRows')
    .addItem('Recompute Categories', 'recomputeCategories')
    .addToUi();
}

function getMainSheet_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  return sheet;
}

function normalizeNewRows() {
  const sh = getMainSheet_();
  const last = sh.getLastRow();
  if (last < 2) return;
  const range = sh.getRange(2, 1, last - 1, 26);
  const values = range.getValues();
  values.forEach(r => {
    // date normalize (col 1)
    if (typeof r[0] === 'string') {
      const d = new Date(r[0]);
      if (!isNaN(d)) r[0] = d;
    }
    // currency normalize
    [6, 11, 12].forEach(idx => {
      const v = r[idx];
      if (typeof v === 'string') {
        const num = parseFloat(String(v).replace(/[^\d.]/g, ''));
        if (!isNaN(num)) r[idx] = num;
      }
    });
    // property default
    if (!r[1]) r[1] = 'Cascade Hideaway_BRIA';
  });
  range.setValues(values);
  SpreadsheetApp.getActive().toast('Normalized rows ✓');
}

function recomputeCategories() {
  const sh = getMainSheet_();
  const last = sh.getLastRow();
  if (last < 2) return;
  const range = sh.getRange(2, 1, last - 1, 26);
  const values = range.getValues();
  const cats = new Set(['Utilities','Subscriptions','Services','Maintenance','Repairs','Supplies','Cleaning','Internet','Electricity','Water','Gas','Waste','Landscaping','Security','Insurance','Taxes','Fees','Professional Services','Software','Travel','Meals','Office','Shipping','Medical','Equipment','Other']);
  values.forEach(r => {
    // if empty category, try keyword-based fallback
    if (!r[4]) {
      const hay = (r[2] || '') + ' ' + (r[3] || '');
      const map = [
        [/electric|kwh|power|energy|electricity/i,"Electricity"],
        [/water|maynilad|manila water/i,"Water"],
        [/internet|wifi|broadband|fiber|converge|pldt/i,"Internet"],
        [/subscription|saas|netflix|spotify|adobe/i,"Subscriptions"],
        [/repair|maintenance/i,"Repairs"],
        [/clean/i,"Cleaning"],
        [/shipping|delivery|courier|logistics/i,"Shipping"],
        [/tax|withholding|bir|vat/i,"Taxes"],
        [/travel|flight|hotel|uber|grab/i,"Travel"],
        [/meal|restaurant|coffee|snack/i,"Meals"],
        [/office|paper|ink/i,"Office"],
        [/supply|supplies/i,"Supplies"],
      ];
      for (var i=0;i<map.length;i++){
        if (map[i][0].test(hay)) { r[4] = map[i][1]; break; }
      }
      if (!r[4]) r[4] = 'Other';
    }
    if (!cats.has(r[4])) r[4] = 'Other';
  });
  range.setValues(values);
  SpreadsheetApp.getActive().toast('Categories recomputed ✓');
}
