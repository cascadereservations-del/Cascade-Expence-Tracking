/**
 * Apps Script Web App — Proxy for Cascade Expense Capture
 * Deploy: Extensions → Apps Script → New project → paste this file → Deploy → New Deployment → type: Web app
 * Execute as: Me, Who has access: Anyone with the link (or your domain)
 * Then paste the Web App URL into the app's Settings → Proxy URL.
 */

function doPost(e) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  try {
    const data = JSON.parse(e.postData.contents);
    const action = (data.action||'').toLowerCase();
    const sheetId = data.sheetId;
    const sheetName = data.sheetName || 'Sheet1';
    const folderId = data.folderId || '';
    const taxonomy = data.taxonomy || [];
    const payload = data.payload || {};

    if (action === 'ping') return make_(200, { ok: true, time: new Date().toISOString() }, cors);

    if (!sheetId) return make_(400, { ok:false, message:'Missing sheetId' }, cors);

    if (action === 'setupSheet') {
      const sh = openOrCreateSheet_(sheetId, sheetName);
      const meta = openOrCreateSheet_(sheetId, 'Meta');
      const HEADERS = ["date","property","vendor","description","category","subcategory","amount","currency","payment_method","invoice_number","reference_id","tax_amount","tip_amount","location","notes","validated","validation_errors","source_type","source_filename","attachment_drive_file_id","record_drive_file_id","uploaded_at","sheet_appended_at","created_at","processed_at"];
      sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
      sh.setFrozenRows(1);
      sh.autoResizeColumns(1, HEADERS.length);
      sh.getRange(1,1,1,1).setNumberFormat('yyyy-mm-dd');
      sh.getRange(1,7,1,1).setNumberFormat('#,##0.00');
      sh.getRange(1,12,1,2).setNumberFormat('#,##0.00');

      // Meta categories
      if (taxonomy && taxonomy.length) {
        meta.clear();
        meta.getRange(1,1,taxonomy.length,1).setValues(taxonomy.map(c=>[c]));
      }

      // Data validation on Category col (E)
      const rule = SpreadsheetApp.newDataValidation().requireValueInList(taxonomy, true).setAllowInvalid(false).build();
      const last = Math.max(sh.getMaxRows(), 2000);
      sh.getRange(2,5,last-1,1).setDataValidation(rule);

      return make_(200, { ok: true }, cors);
    }

    if (action === 'appendRecord') {
      const sh = openOrCreateSheet_(sheetId, sheetName);
      const HEADERS = ["date","property","vendor","description","category","subcategory","amount","currency","payment_method","invoice_number","reference_id","tax_amount","tip_amount","location","notes","validated","validation_errors","source_type","source_filename","attachment_drive_file_id","record_drive_file_id","uploaded_at","sheet_appended_at","created_at","processed_at"];
      const rec = payload.rec || {};
      const row = HEADERS.map(k => rec[k] || '');
      sh.appendRow(row);
      return make_(200, { ok: true }, cors);
    }

    if (action === 'uploadDataset') {
      if (!folderId) return make_(400, { ok:false, message:'Missing folderId' }, cors);
      const folder = DriveApp.getFolderById(folderId);
      const ts = new Date().toISOString().replace(/:/g,'-').slice(0,19);
      const jsonBlob = Utilities.newBlob(JSON.stringify(payload.records||[], null, 2), 'application/json', `expenses_${ts}.json`);
      const csvBlob  = Utilities.newBlob(toCsv_(payload.records||[]), 'text/csv', `expenses_${ts}.csv`);
      const jFile = folder.createFile(jsonBlob);
      const cFile = folder.createFile(csvBlob);
      return make_(200, { ok:true, fileId: jFile.getId(), fileName: jFile.getName() }, cors);
    }

    if (action === 'uploadAttachment') {
      if (!folderId) return make_(400, { ok:false, message:'Missing folderId' }, cors);
      const folder = DriveApp.getFolderById(folderId);
      const bytes = Utilities.base64Decode(payload.base64||'');
      const blob = Utilities.newBlob(bytes, payload.mime || 'application/octet-stream', payload.name || 'upload.bin');
      const file = folder.createFile(blob);
      return make_(200, { ok:true, fileId: file.getId(), fileName: file.getName() }, cors);
    }

    return make_(400, { ok:false, message:'Unknown action' }, cors);
  } catch (e) {
    return make_(500, { ok:false, message:String(e) }, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
  }
}

function openOrCreateSheet_(spreadsheetId, title) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  let sh = ss.getSheetByName(title);
  if (!sh) sh = ss.insertSheet(title);
  return sh;
}

function toCsv_(records) {
  const cols = ['date','property','vendor','description','category','subcategory','amount','currency','payment_method','invoice_number','reference_id','tax_amount','tip_amount','location','notes','validated','validation_errors','source_type','source_filename','attachment_drive_file_id','record_drive_file_id','uploaded_at','sheet_appended_at','created_at','processed_at'];
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const rows = [cols.join(',')];
  (records||[]).forEach(r => rows.push(cols.map(k=>esc(r[k])).join(',')));
  return rows.join('\n');
}

function make_(code, obj, headers) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON).setHeaders(headers).setResponseCode(code);
}
