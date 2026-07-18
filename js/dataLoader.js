// Loads the sentence dataset from data/sentences.json (currently the full
// 1010-sentence set). Regenerate it with scripts/convert_sentences.py from
// the source spreadsheet, then check it with scripts/validate-sentences.mjs.

export async function loadSentences(url = 'data/sentences.json') {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`${url} did not contain a non-empty array of sentences`);
  }
  for (const s of data) {
    if (typeof s.e !== 'string' || typeof s.t !== 'string' || !Array.isArray(s.k) || s.k.length === 0) {
      throw new Error(`Malformed sentence entry: ${JSON.stringify(s)}`);
    }
  }
  return data;
}
