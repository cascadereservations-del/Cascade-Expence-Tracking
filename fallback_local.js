/* Fallback "no Google" mode: download files locally */
(function(){
  function downloadString(filename, mimeType, content){
    const blob = new Blob([content], {type: mimeType || 'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download.bin';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  function downloadJSON(filename, obj){
    downloadString(filename || 'data.json', 'application/json', JSON.stringify(obj, null, 2));
  }

  window.FallbackLocal = { downloadString, downloadJSON };
})();