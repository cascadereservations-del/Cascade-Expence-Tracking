/** Apps Script Web App (Proxy) for Cascade Expense Capture */
function doPost(e){
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  try{
    const data = JSON.parse(e.postData.contents || '{}');
    const action = (data.action||'').toLowerCase();
    const sheetId = data.sheetId; const sheetName = data.sheetName || 'Sheet1';
    const folderId = data.folderId || ''; const taxonomy = data.taxonomy || [];
    const payload = data.payload || {};

    if(action==='ping'){ return ok_({ ok:true, time: new Date().toISOString() }, cors); }

    if(!sheetId) return fail_("Missing sheetId", cors);

    if(action==='setupSheet'){
      const sh = openOrCreate_(sheetId, sheetName);
      const meta = openOrCreate_(sheetId, 'Meta');
      const HEADERS = ["date","property","vendor","description","category","subcategory","amount","currency","payment_method","invoice_number","reference_id","tax_amount","tip_amount","location","notes","validated","validation_errors","source_type","source_filename","attachment_drive_file_id","record_drive_file_id","uploaded_at","sheet_appended_at","created_at","processed_at"];
      sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
      sh.setFrozenRows(1); sh.autoResizeColumns(1, HEADERS.length);
      // formats
      sh.getRange(2,1,sh.getMaxRows()-1,1).setNumberFormat('yyyy-mm-dd');
      sh.getRange(2,7,sh.getMaxRows()-1,1).setNumberFormat('#,##0.00');
      sh.getRange(2,12,sh.getMaxRows()-1,2).setNumberFormat('#,##0.00');
      // taxonomy
      if(taxonomy && taxonomy.length){ meta.clear(); meta.getRange(1,1,taxonomy.length,1).setValues(taxonomy.map(c=>[c])); }
      // validation (E column)
      const rule = SpreadsheetApp.newDataValidation().requireValueInList(taxonomy, true).setAllowInvalid(false).build();
      const last = Math.max(sh.getMaxRows(), 2000);
      sh.getRange(2,5,last-1,1).setDataValidation(rule);
      return ok_({ ok:true }, cors);
    }

    if(action==='appendRecord'){
      const sh = openOrCreate_(sheetId, sheetName);
      const HEADERS = ["date","property","vendor","description","category","subcategory","amount","currency","payment_method","invoice_number","reference_id","tax_amount","tip_amount","location","notes","validated","validation_errors","source_type","source_filename","attachment_drive_file_id","record_drive_file_id","uploaded_at","sheet_appended_at","created_at","processed_at"];
      const r = payload.rec||{};
      sh.appendRow(HEADERS.map(k=>r[k]||''));
      return ok_({ ok:true }, cors);
    }

    if(action==='uploadDataset'){
      if(!folderId) return fail_("Missing folderId", cors);
      const folder = DriveApp.getFolderById(folderId);
      const ts = new Date().toISOString().replace(/:/g,'-').slice(0,19);
      const jsonBlob = Utilities.newBlob(JSON.stringify(payload.records||[],null,2), 'application/json', `expenses_${ts}.json`);
      const csvBlob = Utilities.newBlob(toCsv_(payload.records||[]), 'text/csv', `expenses_${ts}.csv`);
      const jf = folder.createFile(jsonBlob); folder.createFile(csvBlob);
      return ok_({ ok:true, fileId:jf.getId(), fileName:jf.getName() }, cors);
    }

    if(action==='uploadAttachment'){
      if(!folderId) return fail_("Missing folderId", cors);
      const bytes = Utilities.base64Decode(payload.base64||''); const blob = Utilities.newBlob(bytes, payload.mime||'application/octet-stream', payload.name||'upload.bin');
      const file = DriveApp.getFolderById(folderId).createFile(blob);
      return ok_({ ok:true, fileId:file.getId(), fileName:file.getName() }, cors);
    }

    if(action==='aiCategorize'){
      // Simple heuristic AI proxy; you can replace with Vertex/Gemini if desired.
      const r = payload.record||{}; const hay=((r.vendor||'')+' '+(r.description||'')).toLowerCase();
      const map=[[/electric|kwh|power|energy|electric/i,"Electricity"],[/water|maynilad|manila water/i,"Water"],[/internet|wifi|fiber|converge|pldt/i,"Internet"],[/subscription|saas|netflix|spotify|adobe/i,"Subscriptions"]];
      let cat = r.category || ""; for (var i=0;i<map.length;i++){ if(map[i][0].test(hay)){ cat = map[i][1]; break; } }
      if(!cat) cat = 'Other';
      return ok_({ ok:true, category: cat }, cors);
    }

    return fail_("Unknown action", cors);
  }catch(e){ return fail_(String(e), cors); }
}
function openOrCreate_(sheetId, title){ const ss=SpreadsheetApp.openById(sheetId); return ss.getSheetByName(title) || ss.insertSheet(title); }
function ok_(obj,c){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON).setHeaders(c).setResponseCode(200); }
function fail_(msg,c){ return ContentService.createTextOutput(JSON.stringify({ ok:false, message:msg })).setMimeType(ContentService.MimeType.JSON).setHeaders(c).setResponseCode(400); }
function toCsv_(records){ const cols=['date','property','vendor','description','category','subcategory','amount','currency','payment_method','invoice_number','reference_id','tax_amount','tip_amount','location','notes','validated','validation_errors','source_type','source_filename','attachment_drive_file_id','record_drive_file_id','uploaded_at','sheet_appended_at','created_at','processed_at']; const esc=s=>/["\n,]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; const rows=[cols.join(',')]; (records||[]).forEach(r=>rows.push(cols.map(k=>esc(String(r[k]??''))).join(','))); return rows.join('\n'); }
