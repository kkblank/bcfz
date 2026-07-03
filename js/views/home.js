export function render(container) {
  container.innerHTML = `
    <section class="hero">
      <h2>中医典籍查询工具</h2>
      <p class="desc">基于全国高等中医药院校规划教材，收录中药学与方剂学核心内容</p>
      <p class="disclaimer">仅供参考学习，不构成医疗建议</p>
    </section>
    <div class="type-cards">
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
      <div class="type-card search-card" data-action="search">
        <div class="type-icon">🔍</div>
        <div class="type-name">搜索全部</div>
        <div class="type-desc">跨数据源搜索名称、功效、功用、主治等内容</div>
      </div>
    </div>
  `;

  container.querySelectorAll('.type-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.dataset.action === 'search') {
        location.hash = '#search';
      } else {
        location.hash = '#category?type=' + card.dataset.type;
      }
    });
  });
}
