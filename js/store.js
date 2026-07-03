const KEYS = {
  FAVORITES: 'bcfz_favorites',
  FONT_SCALE: 'bcfz_font_scale',
  DARK_MODE: 'bcfz_dark_mode',
};

/* ─── Favorites ─── */

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(KEYS.FAVORITES) || '[]'); }
  catch { return []; }
}

function isFavorite(id) {
  return getFavorites().some(f => f.id === id);
}

function toggleFavorite(item) {
  const list = getFavorites();
  const idx = list.findIndex(f => f.id === item.id);
  if (idx > -1) {
    list.splice(idx, 1);
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(list));
    return false;
  }
  list.push({ id: item.id, name: item.name, type: item.type });
  localStorage.setItem(KEYS.FAVORITES, JSON.stringify(list));
  return true;
}

/* ─── Font Scale ─── */

const SCALE_MIN = 0.8;
const SCALE_MAX = 1.6;
const SCALE_STEP = 0.1;

function getFontScale() {
  return parseFloat(localStorage.getItem(KEYS.FONT_SCALE) || '1.0');
}

function setFontScale(value) {
  const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, value));
  localStorage.setItem(KEYS.FONT_SCALE, String(s));
  applyFontScale(s);
  return s;
}

function applyFontScale(s) {
  document.documentElement.style.setProperty('--font-scale', s);
}

/* ─── Dark Mode ─── */

function isDarkMode() {
  return localStorage.getItem(KEYS.DARK_MODE) === 'true';
}

function setDarkMode(enabled) {
  localStorage.setItem(KEYS.DARK_MODE, String(enabled));
  applyDarkMode(enabled);
}

function toggleDarkMode() {
  const next = !isDarkMode();
  setDarkMode(next);
  return next;
}

function applyDarkMode(enabled) {
  document.documentElement.classList.toggle('dark', enabled);
}

/* ─── Search History ─── */

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem('bcfz_recent_searches') || '[]').slice(0, 10); }
  catch { return []; }
}

function saveRecentSearch(keyword) {
  let list = getRecentSearches();
  const idx = list.indexOf(keyword);
  if (idx > -1) list.splice(idx, 1);
  list.unshift(keyword);
  localStorage.setItem('bcfz_recent_searches', JSON.stringify(list.slice(0, 10)));
}

function clearRecentSearches() {
  localStorage.removeItem('bcfz_recent_searches');
}

/* ─── Recent Views ─── */

function getRecentViews() {
  try { return JSON.parse(localStorage.getItem('bcfz_recent_views') || '[]').slice(0, 10); }
  catch { return []; }
}

function addRecentView(item) {
  let list = getRecentViews();
  const idx = list.findIndex(v => v.id === item.id);
  if (idx > -1) list.splice(idx, 1);
  list.unshift({ id: item.id, name: item.name, type: item.type });
  localStorage.setItem('bcfz_recent_views', JSON.stringify(list.slice(0, 10)));
}

/* ─── Init ─── */

function initAppearance() {
  applyFontScale(getFontScale());
  applyDarkMode(isDarkMode());
}

export {
  getFavorites, isFavorite, toggleFavorite,
  getFontScale, setFontScale,
  isDarkMode, setDarkMode, toggleDarkMode,
  initAppearance, SCALE_MIN, SCALE_MAX, SCALE_STEP,
  getRecentViews, addRecentView,
  getRecentSearches, saveRecentSearch, clearRecentSearches,
};
