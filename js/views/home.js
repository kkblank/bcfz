import { getRecentSearches } from '../store.js';

export async function render(container) {
  const recentSearches = getRecentSearches().slice(0, 5);

  container.innerHTML = `
    <div class="section-label">免责声明</div>
    <div class="disclaimer-section">
      <p>基于全国高等中医药院校规划教材，收录中药学与方剂学核心内容。仅供参考学习，不构成医疗建议。</p>
    </div>

    <div class="section-label">搜索全部</div>
    <div class="home-search-section">
      <div class="search-box">
        <div class="search-input-wrap">
          <span>🔍</span>
          <input type="text" id="home-search-input" placeholder="搜索名称、功效、功用、主治..." autocomplete="off">
        </div>
        <button class="search-btn" id="home-search-btn">搜索</button>
      </div>
      ${recentSearches.length > 0 ? `
      <div class="recent-tags" style="margin-top:10px">
        ${recentSearches.map(k => `<span class="recent-tag" data-kw="${escapeHtml(k)}">${escapeHtml(k)}</span>`).join('')}
      </div>
      ` : ''}
    </div>

    <div class="section-label">功能模块</div>
    <div class="card-grid two-col">
      <div class="type-card recent-card" data-action="recent">
        <div class="type-icon">🕐</div>
        <div class="type-name">最近浏览</div>
        <div class="type-desc">查看最近浏览的中药和方剂</div>
      </div>
      <div class="type-card fav-card" data-action="favorites">
        <div class="type-icon">⭐</div>
        <div class="type-name">收藏夹</div>
        <div class="type-desc">查看收藏的中药和方剂</div>
      </div>
    </div>

    <div class="section-label">知识库</div>
    <div class="card-grid two-col">
      <div class="type-card herb" data-type="herb">
        <div class="type-icon">🌿</div>
        <div class="type-name">中药学</div>
        <div class="type-desc">查询中草药的性味、归经、功效、主治等信息</div>
      </div>
      <div class="type-card formula" data-type="formula">
        <div class="type-icon">📜</div>
        <div class="type-name">方剂学</div>
       <div class="type-desc">查询方剂的组成、功用、主治、用法等信息</div>
     </div>
      <div class="type-card acupoint" data-type="acupoint">
        <div class="type-icon">🧍</div>
        <div class="type-name">人体穴位</div>
        <div class="type-desc">查看正面、背面、侧面穴位分布图</div>
      </div>
    </div>

    <div class="dark-toggle-wrap">
      <div class="bottom-action">
        <button class="dark-toggle-btn" id="complaint-btn">
          <span>📩</span>
          <span>问题反馈</span>
        </button>
        <p class="bottom-desc">联系作者，反馈页面bug，但请提供详细操作步骤方便定位</p>
      </div>
      <div class="bottom-action">
        <button class="dark-toggle-btn" id="dark-toggle-btn">
          <span id="dark-toggle-icon">${document.documentElement.classList.contains('dark') ? '☀️' : '🌙'}</span>
          <span id="dark-toggle-text">${document.documentElement.classList.contains('dark') ? '浅色模式' : '深色模式'}</span>
        </button>
        <p class="bottom-desc">一键切换深/浅颜色模式，保护你的眼睛</p>
      </div>
    </div>
  `;

  function doSearch() {
    const input = document.getElementById('home-search-input');
    const kw = input.value.trim();
    if (!kw) return;
    location.hash = '#search?q=' + encodeURIComponent(kw);
  }

  document.getElementById('home-search-btn').addEventListener('click', doSearch);
  document.getElementById('home-search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });

  container.querySelectorAll('.recent-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      location.hash = '#search?q=' + encodeURIComponent(tag.dataset.kw);
    });
  });

  document.getElementById('complaint-btn').addEventListener('click', () => {
    window.open('https://space.bilibili.com/2805045', '_blank');
  });

  const darkBtn = container.querySelector('#dark-toggle-btn');
  if (darkBtn) {
    darkBtn.addEventListener('click', async () => {
      const { toggleDarkMode } = await import('../store.js');
      const isDark = toggleDarkMode();
      document.getElementById('dark-toggle-icon').textContent = isDark ? '☀️' : '🌙';
      document.getElementById('dark-toggle-text').textContent = isDark ? '浅色模式' : '深色模式';
    });
  }

  container.querySelectorAll('.type-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.dataset.action === 'favorites') {
        location.hash = '#favorites';
      } else if (card.dataset.action === 'recent') {
        location.hash = '#recent';
      } else if (card.dataset.type === 'acupoint') {
        location.hash = '#acupoint';
      } else {
        location.hash = '#category?type=' + card.dataset.type;
      }
    });
  });
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}
