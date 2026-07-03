import { loadAll } from './data.js';
import { render as renderHome } from './views/home.js';
import { render as renderCategory } from './views/category.js';
import { render as renderList } from './views/list.js';
import { render as renderDetail } from './views/detail.js';
import { render as renderSearch } from './views/search.js';

const routes = {
  '': renderHome,
  'home': renderHome,
  'category': renderCategory,
  'list': renderList,
  'detail': renderDetail,
  'search': renderSearch,
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

function getHeaderTitle(view, params) {
  const map = {
    '': '本草方知',
    'home': '本草方知',
    'search': '搜索',
  };
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
  return map[view] || '本草方知';
}

function route() {
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

  const container = document.getElementById('app-content');
  renderFn(container, params);
}

window.navigateTo = navigateTo;

document.addEventListener('DOMContentLoaded', async () => {
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
