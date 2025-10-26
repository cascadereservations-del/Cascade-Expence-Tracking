/** Apps Script Web App (Proxy) for Cascade Expense Capture - CORS Fixed */

// Handle OPTIONS preflight for CORS
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT)
    .setContent('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Cascade Expense Proxy is running. Use POST requests.',
    version: '6.5.1',
    timestamp: new Date().toISOString()
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  });
}

function doPost(e) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const action = (data.action || '').toLowerCase();
    const sheetId = data.sheetId;
    const sheetName = data.sheetName || 'Sheet1';
    const folderId = data.folderId || '';
    const taxonomy = data.taxonomy || [];
    const payload = data.payload || {};

    if (action === 'ping') {
      return ok_({ ok: true, time: new Date().toISOString(), version: '6.5.1' }, cors);
    }

    if (!sheetId) {
      return fail_("Missing sheetId parameter", cors);
    }

    if (action === 'setupsheet') {
      const sh = openOrCreate_(sheetId, sheetName);
      const meta = openOrCreate_(sheetId, 'Meta');
      
      const HEADERS = [
        "date", "property", "vendor", "description", "category", "subcategory",
        "amount", "currency", "payment_method", "invoice_number", "reference_id",
        "tax_amount", "tip_amount", "location", "notes", "validated",
        "validation_errors", "source_type", "source_filename",
        "attachment_drive_file_id", "record_drive_file_id", "uploaded_at",
        "sheet_appended_at", "created_at", "processed_at"
      ];
      
      // Set headers
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sh.setFrozenRows(1);
      sh.autoResizeColumns(1, HEADERS.length);
      
      // Format date column
      sh.getRange(2, 1, sh.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd');
      
      // Format currency columns (amount, tax_amount, tip_amount)
      sh.getRange(2, 7, sh.getMaxRows() - 1, 1).setNumberFormat('#,##0.00');
      sh.getRange(2, 12, sh.getMaxRows() - 1, 2).setNumberFormat('#,##0.00');
      
      // Store taxonomy in Meta sheet
      if (taxonomy && taxonomy.length) {
        meta.clear();
        meta.getRange(1, 1, taxonomy.length, 1).setValues(taxonomy.map(c => [c]));
      }
      
      // Set data validation for category column (E)
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(taxonomy, true)
        .setAllowInvalid(false)
        .build();
      const lastRow = Math.max(sh.getMaxRows(), 2000);
      sh.getRange(2, 5, lastRow - 1, 1).setDataValidation(rule);
      
      return ok_({ ok: true, message: 'Sheet setup completed successfully' }, cors);
    }

    if (action === 'appendrecord') {
      const sh = openOrCreate_(sheetId, sheetName);
      const HEADERS = [
        "date", "property", "vendor", "description", "category", "subcategory",
        "amount", "currency", "payment_method", "invoice_number", "reference_id",
        "tax_amount", "tip_amount", "location", "notes", "validated",
        "validation_errors", "source_type", "source_filename",
        "attachment_drive_file_id", "record_drive_file_id", "uploaded_at",
        "sheet_appended_at", "created_at", "processed_at"
      ];
      
      const r = payload.rec || {};
      const row = HEADERS.map(k => r[k] || '');
      sh.appendRow(row);
      
      return ok_({ ok: true, message: 'Record appended successfully' }, cors);
    }

    if (action === 'uploaddataset') {
      if (!folderId) {
        return fail_("Missing folderId parameter", cors);
      }
      
      const folder = DriveApp.getFolderById(folderId);
      const ts = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
      
      const jsonBlob = Utilities.newBlob(
        JSON.stringify(payload.records || [], null, 2),
        'application/json',
        `expenses_${ts}.json`
      );
      
      const csvBlob = Utilities.newBlob(
        toCsv_(payload.records || []),
        'text/csv',
        `expenses_${ts}.csv`
      );
      
      const jf = folder.createFile(jsonBlob);
      folder.createFile(csvBlob);
      
      return ok_({
        ok: true,
        fileId: jf.getId(),
        fileName: jf.getName(),
        message: 'Dataset uploaded successfully'
      }, cors);
    }

    if (action === 'uploadattachment') {
      if (!folderId) {
        return fail_("Missing folderId parameter", cors);
      }
      
      const bytes = Utilities.base64Decode(payload.base64 || '');
      const blob = Utilities.newBlob(
        bytes,
        payload.mime || 'application/octet-stream',
        payload.name || 'upload.bin'
      );
      
      const file = DriveApp.getFolderById(folderId).createFile(blob);
      
      return ok_({
        ok: true,
        fileId: file.getId(),
        fileName: file.getName(),
        message: 'Attachment uploaded successfully'
      }, cors);
    }

    if (action === 'aicategorize') {
      const r = payload.record || {};
      const text = ((r.vendor || '') + ' ' + (r.description || '')).toLowerCase();
      
      const rules = [
        [/electric|kwh|power|energy|electricity|meralco/i, "Electricity"],
        [/water|maynilad|manila water/i, "Water"],
        [/internet|wifi|fiber|converge|pldt/i, "Internet"],
        [/subscription|saas|netflix|spotify|adobe/i, "Subscriptions"],
        [/repair|maintenance|fix/i, "Repairs"],
        [/clean|housekeep|laundry/i, "Cleaning"],
        [/security|guard/i, "Security"],
        [/insurance/i, "Insurance"],
        [/tax|permit|license/i, "Taxes"],
        [/landscap|garden/i, "Landscaping"],
        [/supply|supplies/i, "Supplies"]
      ];
      
      let category = r.category || "";
      for (let i = 0; i < rules.length; i++) {
        if (rules[i][0].test(text)) {
          category = rules[i][1];
          break;
        }
      }
      
      if (!category) category = 'Other';
      
      return ok_({
        ok: true,
        category: category,
        message: 'Category suggested successfully'
      }, cors);
    }

    return fail_("Unknown action: " + action, cors);
    
  } catch (e) {
    return fail_("Server error: " + e.toString(), cors);
  }
}

function openOrCreate_(sheetId, title) {
  const ss = SpreadsheetApp.openById(sheetId);
  let sheet = ss.getSheetByName(title);
  if (!sheet) {
    sheet = ss.insertSheet(title);
  }
  return sheet;
}

function ok_(obj, corsHeaders) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(corsHeaders)
    .setResponseCode(200);
}

function fail_(msg, corsHeaders) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: false,
    error: msg,
    message: msg
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeaders(corsHeaders)
  .setResponseCode(400);
}

function toCsv_(records) {
  const cols = [
    'date', 'property', 'vendor', 'description', 'category', 'subcategory',
    'amount', 'currency', 'payment_method', 'invoice_number', 'reference_id',
    'tax_amount', 'tip_amount', 'location', 'notes', 'validated',
    'validation_errors', 'source_type', 'source_filename',
    'attachment_drive_file_id', 'record_drive_file_id', 'uploaded_at',
    'sheet_appended_at', 'created_at', 'processed_at'
  ];
  
  const esc = s => /["\n,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  const rows = [cols.join(',')];
  
  (records || []).forEach(r => {
    rows.push(cols.map(k => esc(String(r[k] ?? ''))).join(','));
  });
  
  return rows.join('\n');
}
