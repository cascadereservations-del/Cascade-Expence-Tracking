export async function loadAliases() {
  try {
    const res = await fetch('./config/aliases.json');
    return await res.json();
  } catch { return {}; }
}

export function suggestCategory(vendor='', description='') {
  const text = `${vendor} ${description}`.toLowerCase();
  const aliases = window.__aliases_cache || {};
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (text.includes(alias)) return { category: canonical, score: 0.9, rationale: `Matched '${alias}'` };
  }
  return { category: '', score: 0.2, rationale: 'No alias hit' };
}
