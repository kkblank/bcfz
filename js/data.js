let herbsData = null;
let formulasData = null;
let internalData = null;
let acupointData = null;
let acupunctureData = null;

async function loadAll() {
  const [herbs, formulas, internal, acupoints, acupuncture] = await Promise.all([
    fetch('./data/herbs.json').then(r => r.json()),
    fetch('./data/formulas.json').then(r => r.json()),
    fetch('./data/internal_medicine.json').then(r => r.json()),
    fetch('./data/acupoints.json').then(r => r.json()),
    fetch('./data/acupuncture.json').then(r => r.json())
  ]);
  herbsData = herbs;
  formulasData = formulas;
  internalData = internal;
  acupointData = acupoints;
  acupunctureData = acupuncture;
}

function getAllData(type) {
  if (type === 'formula') return formulasData;
  if (type === 'internal') return internalData;
  if (type === 'acupoint') return acupointData;
  if (type === 'acupuncture') return acupunctureData;
  return herbsData;
}

function getCategories(type) {
  const data = getAllData(type);
  return data ? data.categories : [];
}

function getSubCategories(categoryId, type) {
  const data = getAllData(type);
  if (!data) return [];
  return data.subCategories.filter(s => s.categoryId === categoryId);
}

function getItemsBySubCategory(subCategoryId, type) {
  const data = getAllData(type);
  if (!data) return [];
  const sub = data.subCategories.find(s => s.id === subCategoryId);
  if (!sub) return [];
  return sub.herbIds.map(id => data.herbs.find(h => h.id === id)).filter(Boolean);
}

function getItemById(itemId, type) {
  const data = getAllData(type);
  if (!data) return null;
  return data.herbs.find(h => h.id === itemId) || null;
}

function search(keyword) {
  if (!keyword || !keyword.trim()) return [];
  const kw = keyword.toLowerCase();
  const results = [];
  const seenIds = new Set();

  for (const type of ['herb', 'formula', 'internal', 'acupoint', 'acupuncture']) {
    const data = getAllData(type);
    if (!data) continue;
    for (const item of data.searchIndex) {
      if (item.text.toLowerCase().includes(kw)) {
        const dedupKey = `${type}:${item.itemId}`;
        if (!seenIds.has(dedupKey)) {
          const herb = data.herbs.find(h => h.id === item.itemId);
          if (herb) {
            results.push({ ...herb, matchType: item.type, dataType: type });
            seenIds.add(dedupKey);
          }
        }
      }
    }
  }
  return results;
}

function getCategoryById(categoryId, type) {
  const data = getAllData(type);
  return data ? data.categories.find(c => c.id === categoryId) : null;
}

function getSubCategoryById(subCategoryId, type) {
  const data = getAllData(type);
  return data ? data.subCategories.find(s => s.id === subCategoryId) : null;
}

export { loadAll, getAllData, getCategories, getSubCategories, getItemsBySubCategory, getItemById, search, getCategoryById, getSubCategoryById };
