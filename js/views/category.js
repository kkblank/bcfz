import { getCategories, getSubCategories, getCategoryById, getItemsBySubCategory } from '../data.js';

export function render(container, params) {
  const type = params.type || 'herb';
  const catId = params.catId;

  if (!catId) {
    const cats = getCategories(type);
    const label = type === 'formula' ? '方剂' : type === 'internal' ? '病症' : type === 'acupoint' ? '经脉' : type === 'acupuncture' ? '病证' : '草药';
    container.innerHTML = `
      <div class="category-list">
        ${cats.map(c => `
          <div class="category-card" data-id="${c.id}" data-name="${c.name}">
            <div class="icon">📂</div>
          <div class="info">
            <div class="name">${escapeHtml(c.name)}</div>
            <div class="count">${(type === 'acupoint' || type === 'acupuncture') && c.subCategoryIds.length === 1 ? getItemCount(c.id, type) + (type === 'acupoint' ? ' 个穴位' : ' 个病证') : c.subCategoryIds.length + ' 个子类'}</div>
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
        // Auto-skip to list view if category has only 1 subcategory
        const cat = getCategoryById(id, type);
        if ((type === 'acupoint' || type === 'acupuncture') && cat && cat.subCategoryIds.length === 1) {
          const subName = type === 'acupoint' ? '本经腧穴' : '病症列表';
          location.hash = `#list?type=${type}&subId=${cat.subCategoryIds[0]}&subName=${encodeURIComponent(subName)}&catId=${id}&catName=${encodeURIComponent(name)}`;
          return;
        }
        location.hash = `#category?type=${type}&catId=${id}&catName=${encodeURIComponent(name)}`;
      });
    });
  } else {
    const subCats = getSubCategories(catId, type);
    // Auto-skip to list view for single subCategory
    if ((type === 'acupoint' || type === 'acupuncture') && subCats.length === 1) {
      const subName = type === 'acupoint' ? '本经腧穴' : '病症列表';
      location.hash = `#list?type=${type}&subId=${subCats[0].id}&subName=${encodeURIComponent(subName)}&catId=${catId}&catName=${encodeURIComponent(params.catName || '')}`;
      return;
    }
    const label = type === 'formula' ? '个方剂' : type === 'internal' ? '个证型' : type === 'acupoint' ? '个穴位' : type === 'acupuncture' ? '个病证' : '种草药';
    container.innerHTML = `
      <div class="category-list">
        ${subCats.map(s => `
          <div class="category-card" data-id="${s.id}" data-name="${s.name}">
            <div class="icon">${type === 'formula' ? '📜' : '🍃'}</div>
          <div class="info">
            <div class="name">${escapeHtml(s.name)}</div>
            <div class="count">${(s.herbIds || []).length} ${label}</div>
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

export function getItemCount(catId, type) {
  const subs = getSubCategories(catId, type);
  let total = 0;
  for (const sub of subs) {
    const items = getItemsBySubCategory(sub.id, type);
    total += items.length;
  }
  return total;
}
