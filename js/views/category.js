import { getCategories, getSubCategories, getCategoryById } from '../data.js';

export function render(container, params) {
  const type = params.type || 'herb';
  const catId = params.catId;

  if (!catId) {
    const cats = getCategories(type);
    const label = type === 'formula' ? '方剂' : type === 'internal' ? '病症' : '草药';
    container.innerHTML = `
      <div class="category-list">
        ${cats.map(c => `
          <div class="category-card" data-id="${c.id}" data-name="${c.name}">
            <div class="icon">📂</div>
            <div class="info">
              <div class="name">${escapeHtml(c.name)}</div>
              <div class="count">${c.subCategoryIds.length} 个子类</div>
            </div>
            <div class="arrow">›</div>
          </div>
        `).join('')}
      </div>
      ${cats.length === 0 ? '<div class="empty-state"><div class="empty-icon">🌱</div><div class="empty-text">暂无${label}分类</div></div>' : ''}
    `;

    container.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const name = card.dataset.name;
        location.hash = `#category?type=${type}&catId=${id}&catName=${encodeURIComponent(name)}`;
      });
    });
  } else {
    const subCats = getSubCategories(catId, type);
    const label = type === 'formula' ? '个方剂' : type === 'internal' ? '个证型' : '种草药';
    container.innerHTML = `
      <div class="category-list">
        ${subCats.map(s => `
          <div class="category-card" data-id="${s.id}" data-name="${s.name}">
            <div class="icon">${type === 'formula' ? '📜' : '🍃'}</div>
            <div class="info">
              <div class="name">${escapeHtml(s.name)}</div>
              <div class="count">${s.herbIds.length} ${label}</div>
            </div>
            <div class="arrow">›</div>
          </div>
        `).join('')}
      </div>
      ${subCats.length === 0 ? '<div class="empty-state"><div class="empty-icon">🌱</div><div class="empty-text">暂无内容</div></div>' : ''}
    `;

    const catName = params.catName || '';
    container.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const name = card.dataset.name;
        location.hash = `#list?type=${type}&subId=${id}&subName=${encodeURIComponent(name)}&catId=${catId}&catName=${encodeURIComponent(catName)}`;
      });
    });
  }
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}
