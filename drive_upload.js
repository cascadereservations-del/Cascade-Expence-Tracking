/* Simple Drive upload using an OAuth token (drive.file scope is enough) */
(function(){
  async function uploadString(accessToken, filename, mimeType, content, folderId){
    const metadata = {
      name: filename,
      mimeType: mimeType || 'application/octet-stream'
    };
    if (folderId) metadata.parents = [folderId];

    const boundary = '-------cascade-boundary-' + Math.random().toString(16).slice(2);
    const delimiter = '--' + boundary + '\r\n';
    const closeDelim = '--' + boundary + '--';
    const body =
      delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      delimiter + 'Content-Type: ' + (mimeType || 'application/octet-stream') + '\r\n\r\n' +
      content + '\r\n' +
      closeDelim;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'multipart/related; boundary=' + boundary
      },
      body
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Drive upload failed: ' + res.status + ' ' + txt);
    }
    return await res.json();
  }

  async function uploadBlob(accessToken, filename, mimeType, blob, folderId){
    const text = await blob.text();
    return uploadString(accessToken, filename, mimeType, text, folderId);
  }

  window.DriveUpload = { uploadString, uploadBlob };
})();