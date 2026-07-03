export async function render(container) {
  container.innerHTML = `
    <section class="hero">
      <h2>本草方知</h2>
      <p class="desc">基于全国高等中医药院校规划教材，收录中药学与方剂学核心内容</p>
      <p class="disclaimer">仅供参考学习，不构成医疗建议</p>
    </section>

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
    </div>

    <div class="section-label">功能模块</div>
    <div class="card-grid two-col">
      <div class="type-card search-card" data-action="search">
        <div class="type-icon">🔍</div>
        <div class="type-name">搜索全部</div>
        <div class="type-desc">跨数据源搜索名称、功效、功用、主治等内容</div>
      </div>
      <div class="type-card complaint-card" data-action="complaint">
        <div class="type-icon">📩</div>
        <div class="type-name">一键投诉</div>
        <div class="type-desc">联系作者，反馈页面bug，但请提供详细操作步骤方便定位</div>
      </div>
      <div class="type-card fav-card" data-action="favorites">
        <div class="type-icon">⭐</div>
        <div class="type-name">收藏夹</div>
        <div class="type-desc">查看收藏的中药和方剂</div>
      </div>
    </div>

    <div class="dark-toggle-wrap">
      <button class="dark-toggle-btn" id="dark-toggle-btn">
        <span id="dark-toggle-icon">${document.documentElement.classList.contains('dark') ? '☀️' : '🌙'}</span>
        <span id="dark-toggle-text">${document.documentElement.classList.contains('dark') ? '浅色模式' : '深色模式'}</span>
      </button>
    </div>
  `;

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
      if (card.dataset.action === 'search') {
        location.hash = '#search';
      } else if (card.dataset.action === 'complaint') {
        window.open('https://space.bilibili.com/2805045', '_blank');
      } else if (card.dataset.action === 'favorites') {
        location.hash = '#favorites';
      } else {
        location.hash = '#category?type=' + card.dataset.type;
      }
    });
  });
}
