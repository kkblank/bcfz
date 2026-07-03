import { getItemsBySubCategory } from '../data.js';

export function render(container, params) {
  const type = params.type || 'herb';
  const subId = params.subId;
  if (!subId) {
    container.innerHTML = '<div class="empty-state">参数错误</div>';
    return;
  }

  const items = getItemsBySubCategory(subId, type);
  const label = type === 'formula' ? '方剂' : '草药';

  container.innerHTML = `
    <div class="item-list">
      ${items.map((item, i) => `
        <div class="item-card ${type}" data-id="${item.id}" data-name="${item.name}">
          <div class="number">${i + 1}</div>
          <div class="info">
            <div class="name">${escapeHtml(item.name)}</div>
            <div class="summary">${escapeHtml(item.properties['功效'] || item.properties['功用'] || '')}</div>
          </div>
          <div class="arrow">›</div>
        </div>
      `).join('')}
    </div>
    ${items.length === 0 ? '<div class="empty-state"><div class="empty-icon">🌿</div><div class="empty-text">暂无' + label + '</div></div>' : ''}
  `;

  container.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const name = card.dataset.name;
      location.hash = `#detail?type=${type}&id=${id}&name=${encodeURIComponent(name)}&catId=${params.catId || ''}&catName=${encodeURIComponent(params.catName || '')}&subId=${params.subId}&subName=${encodeURIComponent(params.subName || '')}`;
    });
  });
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}
