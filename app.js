import { initUI } from './ui/ui.js';
import { loadAliases } from './categorize/categorize.js';
import { exportJSON, exportCSV } from './export/export.js';
import { uploadDatasetToDrive } from './drive/drive.js';
import { schema, validateRecord } from './validate/validate.js';
import { ocrProvider } from './ocr/ocr.js';
import { parseFromText } from './parser/parser.js';

const state = {
  settings: {
    driveFolderId: '',
    googleClientId: '',
    geminiKey: '',
    highContrast: false,
    useTesseract: true,
    allowLLM: false,
  },
  oauth: { accessToken: null, expiresAt: 0, email: '' },
  records: [],
  aliases: {},
};

const formatCurrency = (n, ccy = 'PHP') =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: ccy }).format(Number(n || 0));

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('exp_settings') || '{}');
    Object.assign(state.settings, saved);
  } catch {}
}
function saveSettings() {
  localStorage.setItem('exp_settings', JSON.stringify(state.settings));
}

function newBlankRecord() {
  const now = new Date().toISOString();
  return {
    date: new Date().toISOString().slice(0,10),
    vendor: '',
    description: '',
    category: '',
    subcategory: null,
    amount: 0.0,
    currency: 'PHP',
    payment_method: null,
    invoice_number: null,
    reference_id: null,
    tax_amount: 0.0,
    tip_amount: 0.0,
    location: null,
    notes: null,
    source_type: 'manual',
    source_filename: null,
    attachment_drive_file_id: null,
    created_at: now,
    processed_at: now,
    validated: false,
    validation_errors: [],
  };
}

function formToRecord(formEl) {
  const fd = new FormData(formEl);
  const r = Object.fromEntries([...fd.entries()]);
  const rec = {
    ...newBlankRecord(),
    ...r,
    amount: Number(r.amount || 0),
    tax_amount: Number(r.tax_amount || 0),
    tip_amount: Number(r.tip_amount || 0),
    subcategory: r.subcategory || null,
    payment_method: r.payment_method || null,
    invoice_number: r.invoice_number || null,
    reference_id: r.reference_id || null,
    location: r.location || null,
    notes: r.notes || null,
    validated: false,
    validation_errors: [],
  };
  return rec;
}

function refreshPreview() {
  const tbody = document.getElementById('previewTable');
  tbody.innerHTML = '';
  let total = 0;
  state.records.forEach((rec, idx) => {
    total += Number(rec.amount || 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td">${rec.date || ''}</td>
      <td class="td">${rec.vendor || ''}</td>
      <td class="td">${rec.category || ''}</td>
      <td class="td">${formatCurrency(rec.amount, rec.currency)}</td>
      <td class="td">
        ${rec.validated
          ? '<span class="badge badge-ok">valid</span>'
          : rec.validation_errors?.length
            ? '<span class="badge badge-err">errors</span>'
            : '<span class="badge badge-warn">pending</span>'}
      </td>
      <td class="td">
        <button data-edit="${idx}" class="text-blue-600 underline text-xs">edit</button>
        <button data-del="${idx}" class="text-red-600 underline text-xs ml-2">remove</button>
      </td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('recordCount').textContent = String(state.records.length);
  document.getElementById('recordTotal').textContent = formatCurrency(total);
}

function addRecord(rec) {
  const result = validateRecord(rec);
  rec.validated = result.valid;
  rec.validation_errors = result.errors;
  state.records.push(rec);
  refreshPreview();
}

async function boot() {
  loadSettings();
  applyTheme();
  initForm(newBlankRecord());
  await loadAliases().then((aliases) => {
    state.aliases = aliases;
    window.__aliases_cache = aliases;
    const list = document.getElementById('categoryList');
    list.innerHTML = '';
    const seen = new Set();
    Object.values(aliases).forEach((c) => seen.add(c));
    [...seen].sort().forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c; list.appendChild(opt);
    });
  });
  initUI();
  document.getElementById('driveFolderId').value = state.settings.driveFolderId || '';
  document.getElementById('googleClientId').value = state.settings.googleClientId || '';
  document.getElementById('geminiKey').value = state.settings.geminiKey || '';
  document.getElementById('toggleTesseract').checked = !!state.settings.useTesseract;
  document.getElementById('toggleLLM').checked = !!state.settings.allowLLM;
  document.getElementById('toggleHighContrast').checked = !!state.settings.highContrast;
  wireTopLevelUI();
}

function populateCategoryList() {}

function wireTopLevelUI() {
  const form = document.getElementById('expenseForm');

  document.getElementById('newEntryBtn').addEventListener('click', () => {
    initForm(newBlankRecord());
  });

  document.getElementById('validateBtn').addEventListener('click', () => {
    const rec = formToRecord(form);
    const res = validateRecord(rec);
    document.getElementById('formErrors').textContent = res.valid ? 'OK' : res.errors.join(' · ');
  });

  document.getElementById('addToListBtn').addEventListener('click', () => {
    const rec = formToRecord(form);
    addRecord(rec);
  });

  document.getElementById('exportJsonBtn').addEventListener('click', () => {
    exportJSON(state.records);
  });
  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    exportCSV(state.records);
  });
  document.getElementById('uploadDriveBtn').addEventListener('click', async () => {
    try {
      const token = await ensureDriveToken();
      const folderId = state.settings.driveFolderId?.trim() || null;
      const result = await uploadDatasetToDrive(state.records, { accessToken: token, folderId });
      alert(`Uploaded: ${result.mainFileName}`);
    } catch (e) {
      alert('Drive upload failed: ' + (e?.message || String(e)));
    }
  });

  document.getElementById('fileInput').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      setStatus(`Processing ${file.name} …`);
      const ocrRes = await ocrProvider.extract(file, {
        useTesseract: state.settings.useTesseract,
      });
      const parsed = await parseFromText(ocrRes.text, {
        allowLLM: state.settings.allowLLM,
        geminiKey: state.settings.geminiKey,
      });
      const rec = { ...newBlankRecord(), ...parsed, source_type: file.type.includes('pdf') ? 'pdf' : 'ocr', source_filename: file.name };
      addRecord(rec);
      setStatus('');
    }
    e.target.value = '';
  });

  document.getElementById('parsePasteBtn').addEventListener('click', async () => {
    const text = document.getElementById('pasteBox').value || '';
    if (!text.trim()) return;
    setStatus('Parsing pasted text …');
    const parsed = await parseFromText(text, {
      allowLLM: state.settings.allowLLM,
      geminiKey: state.settings.geminiKey,
    });
    const rec = { ...newBlankRecord(), ...parsed, source_type: 'paste' };
    addRecord(rec);
    setStatus('');
  });

  document.getElementById('validateAllBtn').addEventListener('click', () => {
    state.records = state.records.map((r) => {
      const v = validateRecord(r);
      return { ...r, validated: v.valid, validation_errors: v.errors };
    });
    refreshPreview();
  });

  document.getElementById('dedupeBtn').addEventListener('click', () => {
    const seen = new Set();
    const filtered = [];
    for (const r of state.records) {
      const key = `${r.date}|${(r.vendor||'').toLowerCase().trim()}|${Number(r.amount).toFixed(2)}|${r.invoice_number||''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      filtered.push(r);
    }
    state.records = filtered;
    refreshPreview();
  });

  document.getElementById('saveSettings').addEventListener('click', () => {
    state.settings.driveFolderId = document.getElementById('driveFolderId').value.trim();
    state.settings.googleClientId = document.getElementById('googleClientId').value.trim();
    state.settings.geminiKey = document.getElementById('geminiKey').value.trim();
    state.settings.useTesseract = document.getElementById('toggleTesseract').checked;
    state.settings.allowLLM = document.getElementById('toggleLLM').checked;
    state.settings.highContrast = document.getElementById('toggleHighContrast').checked;
    saveSettings();
    applyTheme();
    alert('Settings saved.');
  });

  document.getElementById('googleSignIn').addEventListener('click', () => ensureDriveToken());

  document.getElementById('themeToggle').addEventListener('click', () => {
    state.settings.highContrast = !state.settings.highContrast;
    applyTheme();
    saveSettings();
  });

  document.getElementById('previewTable').addEventListener('click', (e) => {
    const editIdx = e.target.getAttribute('data-edit');
    const delIdx = e.target.getAttribute('data-del');
    if (editIdx !== null) {
      initForm(state.records[Number(editIdx)]);
    } else if (delIdx !== null) {
      state.records.splice(Number(delIdx), 1);
      refreshPreview();
    }
  });
}

function initForm(rec) {
  const form = document.getElementById('expenseForm');
  for (const [k, v] of Object.entries(rec)) {
    const el = form.elements.namedItem(k);
    if (el) el.value = v ?? '';
  }
  document.getElementById('formErrors').textContent = '';
}

function setStatus(msg) {
  document.getElementById('appStatus').textContent = msg || '';
}

function applyTheme() {
  document.body.classList.toggle('dark', !!state.settings.highContrast);
}

async function ensureDriveToken() {
  const now = Date.now();
  if (state.oauth.accessToken && now < state.oauth.expiresAt - 60_000) return state.oauth.accessToken;

  const clientId = state.settings.googleClientId?.trim();
  if (!clientId) throw new Error('Google Client ID missing (Settings).');

  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'https://www.googleapis.com/auth/drive.file',
    prompt: '',
    callback: (resp) => {},
  });

  state.oauth.accessToken = await new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) reject(resp);
      else resolve(resp.access_token);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });

  state.oauth.expiresAt = Date.now() + 55 * 60 * 1000;
  document.getElementById('googleUser').textContent = 'Authorized';
  return state.oauth.accessToken;
}

boot();
