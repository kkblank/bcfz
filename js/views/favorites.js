import { getFavorites } from '../store.js';

export function render(container) {
  const list = getFavorites();

  if (list.length === 0) {
    container.innerHTML = '<div class="fav-empty"><div class="fav-empty-icon">⭐</div><div class="fav-empty-text">还没有收藏任何条目</div><div class="empty-hint">在详情页点击收藏按钮即可添加</div></div>';
    return;
  }

  const label = t => t === 'formula' ? '方剂' : t === 'internal' ? '病症' : t === 'acupoint' ? '穴位' : t === 'acupuncture' ? '病症' : '草药';

  container.innerHTML = `
    <div class="item-list">
      ${list.map((item, i) => `
        <div class="item-card ${item.type}" data-id="${item.id}" data-name="${item.name}" data-type="${item.type}">
          <div class="number">${i + 1}</div>
          <div class="info">
            <div class="name">${escapeHtml(item.name)}</div>
            <div class="summary">${label(item.type)}</div>
          </div>
          <div class="arrow">›</div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const name = card.dataset.name;
      const dtype = card.dataset.type;
      location.hash = `#detail?type=${dtype}&id=${id}&name=${encodeURIComponent(name)}`;
    });
  });
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}
