import { search } from '../data.js';
import { getRecentSearches, saveRecentSearch, clearRecentSearches } from '../store.js';

export function render(container, params) {
  container.innerHTML = `
    <div class="search-box">
      <div class="search-input-wrap">
        <span>🔍</span>
        <input type="text" id="search-input" placeholder="搜索名称、功效、功用、主治..." autocomplete="off">
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

  function doSearch() {
    const kw = input.value.trim();
    if (!kw) return;
    const results = search(kw);
    saveRecentSearch(kw);
    renderRecent();

    resultsEl.innerHTML = `
      <div class="result-count">找到 ${results.length} 条结果</div>
      ${results.map(r => `
        <div class="result-card ${r.dataType}" data-id="${r.id}" data-name="${r.name}" data-type="${r.dataType}">
            <div class="r-badge">${r.dataType === 'formula' ? '方剂' : r.dataType === 'internal' ? '内科' : r.dataType === 'acupoint' ? '穴位' : '草药'}</div>
          <div class="r-name">${escapeHtml(r.name)}</div>
          <div class="r-desc">${escapeHtml(r.properties['功效'] || r.properties['功用'] || r.properties['主治'] || '')}</div>
          <div class="r-match">匹配：${r.matchType}</div>
        </div>
      `).join('')}
      ${results.length === 0 ? '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">未找到相关结果</div><div class="empty-hint">试试其他关键词吧</div></div>' : ''}
    `;

    resultsEl.querySelectorAll('.result-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const name = card.dataset.name;
        const dtype = card.dataset.type;
        location.hash = `#detail?type=${dtype}&id=${id}&name=${encodeURIComponent(name)}`;
      });
    });
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
