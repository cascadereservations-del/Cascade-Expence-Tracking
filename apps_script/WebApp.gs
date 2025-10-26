/** Apps Script Web App (Proxy) for Cascade Expense Capture - WORKING VERSION */

function doGet(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify({
    status: 'ok',
    message: 'Cascade Expense Proxy is running. Use POST requests.',
    version: '6.5.2',
    timestamp: new Date().toISOString()
  }));
  return output;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    var action = (data.action || '').toLowerCase();
    var sheetId = data.sheetId;
    var sheetName = data.sheetName || 'Sheet1';
    var folderId = data.folderId || '';
    var taxonomy = data.taxonomy || [];
    var payload = data.payload || {};

    if (action === 'ping') {
      return createJsonResponse({
        ok: true,
        time: new Date().toISOString(),
        version: '6.5.2'
      });
    }

    if (!sheetId) {
      return createJsonResponse({
        ok: false,
        error: 'Missing sheetId parameter'
      });
    }

    if (action === 'setupsheet') {
      var sh = openOrCreate_(sheetId, sheetName);
      var meta = openOrCreate_(sheetId, 'Meta');
      
      var HEADERS = [
        "date", "property", "vendor", "description", "category", "subcategory",
        "amount", "currency", "payment_method", "invoice_number", "reference_id",
        "tax_amount", "tip_amount", "location", "notes", "validated",
        "validation_errors", "source_type", "source_filename",
        "attachment_drive_file_id", "record_drive_file_id", "uploaded_at",
        "sheet_appended_at", "created_at", "processed_at"
      ];
      
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sh.setFrozenRows(1);
      sh.autoResizeColumns(1, HEADERS.length);
      
      sh.getRange(2, 1, sh.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd');
      sh.getRange(2, 7, sh.getMaxRows() - 1, 1).setNumberFormat('#,##0.00');
      sh.getRange(2, 12, sh.getMaxRows() - 1, 2).setNumberFormat('#,##0.00');
      
      if (taxonomy && taxonomy.length) {
        meta.clear();
        meta.getRange(1, 1, taxonomy.length, 1).setValues(taxonomy.map(function(c) { return [c]; }));
      }
      
      var rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(taxonomy, true)
        .setAllowInvalid(false)
        .build();
      var lastRow = Math.max(sh.getMaxRows(), 2000);
      sh.getRange(2, 5, lastRow - 1, 1).setDataValidation(rule);
      
      return createJsonResponse({
        ok: true,
        message: 'Sheet setup completed successfully'
      });
    }

    if (action === 'appendrecord') {
      var sh = openOrCreate_(sheetId, sheetName);
      var HEADERS = [
        "date", "property", "vendor", "description", "category", "subcategory",
        "amount", "currency", "payment_method", "invoice_number", "reference_id",
        "tax_amount", "tip_amount", "location", "notes", "validated",
        "validation_errors", "source_type", "source_filename",
        "attachment_drive_file_id", "record_drive_file_id", "uploaded_at",
        "sheet_appended_at", "created_at", "processed_at"
      ];
      
      var r = payload.rec || {};
      var row = HEADERS.map(function(k) { return r[k] || ''; });
      sh.appendRow(row);
      
      return createJsonResponse({
        ok: true,
        message: 'Record appended successfully'
      });
    }

    if (action === 'uploaddataset') {
      if (!folderId) {
        return createJsonResponse({
          ok: false,
          error: 'Missing folderId parameter'
        });
      }
      
      var folder = DriveApp.getFolderById(folderId);
      var ts = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
      
      var jsonBlob = Utilities.newBlob(
        JSON.stringify(payload.records || [], null, 2),
        'application/json',
        'expenses_' + ts + '.json'
      );
      
      var csvBlob = Utilities.newBlob(
        toCsv_(payload.records || []),
        'text/csv',
        'expenses_' + ts + '.csv'
      );
      
      var jf = folder.createFile(jsonBlob);
      folder.createFile(csvBlob);
      
      return createJsonResponse({
        ok: true,
        fileId: jf.getId(),
        fileName: jf.getName(),
        message: 'Dataset uploaded successfully'
      });
    }

    if (action === 'uploadattachment') {
      if (!folderId) {
        return createJsonResponse({
          ok: false,
          error: 'Missing folderId parameter'
        });
      }
      
      var bytes = Utilities.base64Decode(payload.base64 || '');
      var blob = Utilities.newBlob(
        bytes,
        payload.mime || 'application/octet-stream',
        payload.name || 'upload.bin'
      );
      
      var file = DriveApp.getFolderById(folderId).createFile(blob);
      
      return createJsonResponse({
        ok: true,
        fileId: file.getId(),
        fileName: file.getName(),
        message: 'Attachment uploaded successfully'
      });
    }

    if (action === 'aicategorize') {
      var r = payload.record || {};
      var text = ((r.vendor || '') + ' ' + (r.description || '')).toLowerCase();
      
      var rules = [
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
      
      var category = r.category || "";
      for (var i = 0; i < rules.length; i++) {
        if (rules[i][0].test(text)) {
          category = rules[i][1];
          break;
        }
      }
      
      if (!category) category = 'Other';
      
      return createJsonResponse({
        ok: true,
        category: category,
        message: 'Category suggested successfully'
      });
    }

    return createJsonResponse({
      ok: false,
      error: 'Unknown action: ' + action
    });
    
  } catch (err) {
    return createJsonResponse({
      ok: false,
      error: 'Server error: ' + err.toString()
    });
  }
}

function createJsonResponse(obj) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(obj));
  return output;
}

function openOrCreate_(sheetId, title) {
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName(title);
  if (!sheet) {
    sheet = ss.insertSheet(title);
  }
  return sheet;
}

function toCsv_(records) {
  var cols = [
    'date', 'property', 'vendor', 'description', 'category', 'subcategory',
    'amount', 'currency', 'payment_method', 'invoice_number', 'reference_id',
    'tax_amount', 'tip_amount', 'location', 'notes', 'validated',
    'validation_errors', 'source_type', 'source_filename',
    'attachment_drive_file_id', 'record_drive_file_id', 'uploaded_at',
    'sheet_appended_at', 'created_at', 'processed_at'
  ];
  
  var esc = function(s) {
    return /["\n,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  
  var rows = [cols.join(',')];
  
  (records || []).forEach(function(r) {
    rows.push(cols.map(function(k) { return esc(String(r[k] != null ? r[k] : '')); }).join(','));
  });
  
  return rows.join('\n');
}
