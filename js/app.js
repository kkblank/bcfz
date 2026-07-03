import { loadAll } from './data.js';
import { initAppearance, getFontScale, setFontScale, isDarkMode, toggleDarkMode } from './store.js';
import { render as renderHome } from './views/home.js';
import { render as renderCategory } from './views/category.js';
import { render as renderList } from './views/list.js';
import { render as renderDetail } from './views/detail.js';
import { render as renderSearch } from './views/search.js';
import { render as renderFavorites } from './views/favorites.js';
import { render as renderRecent } from './views/recent.js';

const routes = {
  '': renderHome,
  'home': renderHome,
  'category': renderCategory,
  'list': renderList,
  'detail': renderDetail,
  'search': renderSearch,
  'favorites': renderFavorites,
  'recent': renderRecent,
};

function parseHash() {
  const hash = location.hash.replace('#', '') || '';
  const parts = hash.split('?');
  const view = parts[0] || 'home';
  const params = {};
  if (parts[1]) {
    parts[1].split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }
  return { view, params };
}

function navigateTo(path) {
  location.hash = '#' + path;
}

window.navigateTo = navigateTo;

function getHeaderTitle(view, params) {
  if (view === 'favorites') return '收藏夹';
  if (view === 'recent') return '最近浏览';
  if (view === 'search') return '搜索';
  if (view === 'category') {
    if (params.catName) return decodeURIComponent(params.catName);
    return params.type === 'formula' ? '方剂分类' : '草药分类';
  }
  if (view === 'list') {
    return params.subName ? decodeURIComponent(params.subName) : '条目列表';
  }
  if (view === 'detail') {
    return params.name ? decodeURIComponent(params.name) : '详情';
  }
  return '本草方知';
}

function renderBreadcrumb(view, params) {
  const el = document.getElementById('breadcrumb');

  if (view === '' || view === 'home') {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }
  el.style.display = '';

  const typeName = params.type === 'formula' ? '方剂学' : '中药学';
  const parts = ['<a href="#/">首页</a>'];

  if (view === 'category') {
    if (params.catId) {
      parts.push(`<span class="sep">›</span> <a href="#category?type=${params.type}">${typeName}</a>`);
      parts.push(`<span class="sep">›</span> <span class="current">${escapeHtml(params.catName || '')}</span>`);
    } else {
      parts.push(`<span class="sep">›</span> <span class="current">${typeName}</span>`);
    }
  } else if (view === 'list') {
    parts.push(`<span class="sep">›</span> <a href="#category?type=${params.type}">${typeName}</a>`);
    if (params.catName) {
      parts.push(`<span class="sep">›</span> <a href="#category?type=${params.type}&catId=${params.catId}&catName=${encodeURIComponent(params.catName)}">${escapeHtml(params.catName)}</a>`);
    }
    parts.push(`<span class="sep">›</span> <span class="current">${escapeHtml(params.subName || '')}</span>`);
  } else if (view === 'detail') {
    parts.push(`<span class="sep">›</span> <a href="#category?type=${params.type}">${typeName}</a>`);
    if (params.catName) {
      parts.push(`<span class="sep">›</span> <a href="#category?type=${params.type}&catId=${params.catId}&catName=${encodeURIComponent(params.catName)}">${escapeHtml(params.catName)}</a>`);
    }
    if (params.subName) {
      parts.push(`<span class="sep">›</span> <a href="#list?type=${params.type}&subId=${params.subId}&subName=${encodeURIComponent(params.subName)}&catId=${params.catId}&catName=${encodeURIComponent(params.catName || '')}">${escapeHtml(params.subName)}</a>`);
    }
    parts.push(`<span class="sep">›</span> <span class="current">${escapeHtml(params.name || '')}</span>`);
  } else if (view === 'search') {
    parts.push(`<span class="sep">›</span> <span class="current">搜索</span>`);
  } else if (view === 'favorites') {
    parts.push(`<span class="sep">›</span> <span class="current">收藏夹</span>`);
  } else if (view === 'recent') {
    parts.push(`<span class="sep">›</span> <span class="current">最近浏览</span>`);
  }

  el.innerHTML = parts.join(' ');
}

async function route() {
  const { view, params } = parseHash();
  const renderFn = routes[view];
  if (!renderFn) {
    navigateTo('');
    return;
  }

  const title = getHeaderTitle(view, params);
  document.getElementById('app-title').textContent = title;

  const backBtn = document.getElementById('back-btn');
  backBtn.style.display = (view === '' || view === 'home') ? 'none' : '';

  const fontCtrls = document.getElementById('font-controls');
  fontCtrls.classList.toggle('hidden', view === '' || view === 'home');

  try { renderBreadcrumb(view, params); } catch (e) { console.error('Breadcrumb error:', e); }

  const container = document.getElementById('app-content');
  try {
    await renderFn(container, params);
  } catch (e) {
    console.error('Render error:', e);
    container.innerHTML = '<p class="error-msg">页面渲染失败，请刷新重试</p><p style="color:#999;font-size:13px;word-break:break-all">' + e.message + '</p>';
  }
}

function initFontControls() {
  const display = document.getElementById('font-display');
  const btnPlus = document.getElementById('font-plus');
  const btnMinus = document.getElementById('font-minus');

  function updateDisplay(val) {
    display.textContent = Math.round(val * 100) + '%';
  }

  updateDisplay(getFontScale());

  btnPlus.addEventListener('click', () => {
    const s = setFontScale(getFontScale() + 0.1);
    updateDisplay(s);
  });

  btnMinus.addEventListener('click', () => {
    const s = setFontScale(getFontScale() - 0.1);
    updateDisplay(s);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initAppearance();
  initFontControls();

  try {
    await loadAll();
  } catch (e) {
    document.getElementById('app-content').innerHTML =
      '<p class="error-msg">数据加载失败，请刷新重试</p>';
    return;
  }
  route();
  window.addEventListener('hashchange', route);
  document.getElementById('back-btn').addEventListener('click', () => history.back());
});

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}
