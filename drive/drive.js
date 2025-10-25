function makeMultipart(metadata, fileBlob) {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close = `\r\n--${boundary}--`;
  const multipartBody = new Blob(
    [
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      delimiter,
      (fileBlob.type ? `Content-Type: ${fileBlob.type}\r\n\r\n` : 'Content-Type: application/json\r\n\r\n'),
      fileBlob,
      close,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );
  return { body: multipartBody, boundary };
}

export async function uploadDatasetToDrive(records, opts) {
  const { accessToken, folderId } = opts;
  const jsonStr = JSON.stringify(records, null, 2);
  const csvStr = toCSV(records);

  const uploaded = [];
  for (const file of [
    { name: `expenses_${Date.now()}.json`, mime: 'application/json', content: new Blob([jsonStr], { type: 'application/json' }) },
    { name: `expenses_${Date.now()}.csv`, mime: 'text/csv', content: new Blob([csvStr], { type: 'text/csv' }) },
  ]) {
    const meta = { name: file.name, mimeType: file.mime, ...(folderId ? { parents: [folderId] } : {}) };
    const { body } = makeMultipart(meta, file.content);
    const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body,
    });
    if (!resp.ok) throw new Error('Drive upload failed: ' + resp.status);
    const data = await resp.json();
    uploaded.push({ id: data.id, name: data.name });
  }
  return { mainFileId: uploaded[0].id, mainFileName: uploaded[0].name };
}

function toCSV(records) {
  const cols = [
    'date','vendor','description','category','subcategory','amount','currency','payment_method','invoice_number','reference_id','tax_amount','tip_amount','location','notes','source_type','source_filename','attachment_drive_file_id','created_at','processed_at','validated'
  ];
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const rows = [cols.join(',')];
  for (const r of records) { rows.push(cols.map((c) => escape(r[c])).join(',')); }
  return rows.join('\n');
}
