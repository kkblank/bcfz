import { search } from '../data.js';
import { getRecentSearches, saveRecentSearch, clearRecentSearches } from '../store.js';

const TYPE_ORDER = ['herb', 'formula', 'internal', 'acupoint', 'acupuncture'];
const TYPE_LABEL = {
  herb: '草药',
  formula: '方剂',
  internal: '内科',
  acupoint: '穴位',
  acupuncture: '针灸'
};

export function render(container, params) {
  container.innerHTML = `
    <div class="search-box">
      <div class="search-input-wrap">
        <span>🔍</span>
        <input type="text" id="search-input" placeholder="可空格分隔多个关键词，如：头痛 甘草" autocomplete="off">
        <button class="clear-btn" id="clear-input-btn" style="display:none">✕</button>
      </div>
      <button class="search-btn" id="search-btn">搜索</button>
    </div>
    <div id="search-results"></div>
    <div id="search-recent"></div>
  `;

  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-input-btn');
  const searchBtn = document.getElementById('search-btn');
  const resultsEl = document.getElementById('search-results');
  const recentEl = document.getElementById('search-recent');

  let currentResults = [];
  let activeTab = 'all';

  function groupByType(results) {
    const grouped = {};
    for (const type of TYPE_ORDER) grouped[type] = [];
    for (const r of results) {
      if (grouped[r.dataType]) grouped[r.dataType].push(r);
    }
    return grouped;
  }

  function renderTabs(grouped) {
    const tabs = [{ type: 'all', label: '全部', count: currentResults.length }];
    for (const type of TYPE_ORDER) {
      if (grouped[type].length) {
        tabs.push({ type, label: TYPE_LABEL[type], count: grouped[type].length });
      }
    }
    return tabs.map(t => `
      <div class="result-tab ${t.type}${t.type === activeTab ? ' active' : ''}" data-type="${t.type}">
        ${t.label} <span class="tab-count">${t.count}</span>
      </div>
    `).join('');
  }

  function renderCards(grouped) {
    const list = activeTab === 'all' ? currentResults : (grouped[activeTab] || []);
    return list.map(r => `
      <div class="result-card ${r.dataType}" data-id="${r.id}" data-name="${r.name}" data-type="${r.dataType}">
        <div class="r-badge">${TYPE_LABEL[r.dataType] || '草药'}</div>
        <div class="r-name">${escapeHtml(r.name)}</div>
        <div class="r-desc">${escapeHtml(r.properties['功效'] || r.properties['功用'] || r.properties['主治'] || '')}</div>
        <div class="r-match">匹配：${r.matchType}</div>
      </div>
    `).join('');
  }

  function bindCards() {
    resultsEl.querySelectorAll('.result-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const name = card.dataset.name;
        const dtype = card.dataset.type;
        location.hash = `#detail?type=${dtype}&id=${id}&name=${encodeURIComponent(name)}`;
      });
    });
  }

  function bindTabs() {
    resultsEl.querySelectorAll('.result-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.type;
        const grouped = groupByType(currentResults);
        resultsEl.querySelector('.result-tabs').innerHTML = renderTabs(grouped);
        resultsEl.querySelector('#card-list').innerHTML = renderCards(grouped);
        bindTabs();
        bindCards();
      });
    });
  }

  function doSearch() {
    const kw = input.value.trim();
    if (!kw) return;
    currentResults = search(kw);
    activeTab = 'all';
    saveRecentSearch(kw);
    renderRecent();

    const grouped = groupByType(currentResults);

    if (currentResults.length === 0) {
      resultsEl.innerHTML = `
        <div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">未找到相关结果</div><div class="empty-hint">试试其他关键词吧</div></div>
      `;
      return;
    }

    resultsEl.innerHTML = `
      <div class="result-count">找到 ${currentResults.length} 条结果</div>
      <div class="result-tabs">${renderTabs(grouped)}</div>
      <div id="card-list">${renderCards(grouped)}</div>
    `;

    bindTabs();
    bindCards();
  }

  function renderRecent() {
    const list = getRecentSearches();
    if (list.length === 0) { recentEl.innerHTML = ''; return; }
    recentEl.innerHTML = `
      <div class="recent-header">
        <span>最近搜索</span>
        <button class="clear-all" id="clear-recent">清空</button>
      </div>
      <div class="recent-tags">
        ${list.map(k => `<span class="recent-tag" data-kw="${escapeHtml(k)}">${escapeHtml(k)}</span>`).join('')}
      </div>
    `;

    recentEl.querySelectorAll('.recent-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        input.value = tag.dataset.kw;
        doSearch();
      });
    });

    const clearBtn = document.getElementById('clear-recent');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clearRecentSearches();
        renderRecent();
      });
    }
  }

  input.addEventListener('input', () => {
    clearBtn.style.display = input.value ? '' : 'none';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });

  searchBtn.addEventListener('click', doSearch);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    input.focus();
    resultsEl.innerHTML = '';
  });

  renderRecent();

  if (params.q) {
    input.value = params.q;
    doSearch();
  }
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}
