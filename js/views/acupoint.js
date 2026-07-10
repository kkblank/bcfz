import { getAllData } from '../data.js';

export async function render(container, params) {
  const part = params.part || '';
  const partKeys = { front: '正面穴位', back: '背面穴位', side: '侧面穴位' };
  const partMap = { '正面穴位': 'front', '背面穴位': 'back', '侧面穴位': 'side' };
  const parts = ['正面穴位', '背面穴位', '侧面穴位'];
  const imagePath = './data/';

  const data = getAllData('acupoint');
  const categories = data ? data.categories : [];

  function getAcupointCount(catId) {
    const data = getAllData('acupoint');
    if (!data) return 0;
    const cat = data.categories.find(c => c.id === catId);
    if (!cat) return 0;
    const subs = data.subCategories.filter(s => cat.subCategoryIds.includes(s.id));
    return subs.reduce((sum, s) => sum + s.herbIds.length, 0);
  }

  const catListHtml = categories.map(c => `
    <div class="category-card acupoint" data-id="${c.id}" data-name="${c.name}">
      <div class="info">
        <div class="name">${escapeHtml(c.name)}</div>
        <div class="count">${c.subCategoryIds.length > 1 ? c.subCategoryIds.length + ' 个子类' : getAcupointCount(c.id) + ' 个穴位'}</div>
      </div>
      <div class="arrow">›</div>
    </div>
  `).join('');

  if (part && partKeys[part]) {
    const name = partKeys[part];
    container.innerHTML = `
      <div class="acupoint-layout">
        <div class="acupoint-map-section">
          <div class="acupoint-options">
            ${parts.map(p => `<button class="acupoint-btn${p === name ? ' active' : ''}" data-part="${partMap[p]}">${p}</button>`).join('')}
          </div>
          <div class="acupoint-image-wrap">
            <img class="acupoint-img" src="${imagePath}${name}.jpg" alt="${name}" draggable="false" loading="lazy">
          </div>
          <p class="acupoint-hint">双指缩放查看细节</p>
        </div>
        <div class="acupoint-cat-section">
          <h3 class="section-label">经脉分类</h3>
          <div class="category-list">${catListHtml}</div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="acupoint-layout">
        <div class="acupoint-map-section">
          <div class="acupoint-options">
            ${parts.map(p => `<button class="acupoint-btn" data-part="${partMap[p]}">${p}</button>`).join('')}
          </div>
          <p class="acupoint-prompt">选择视图查看对应穴位图</p>
        </div>
        <div class="acupoint-cat-section">
          <h3 class="section-label">经脉分类</h3>
          <div class="category-list">${catListHtml}</div>
        </div>
      </div>
    `;
  }

  container.querySelectorAll('.acupoint-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.navigateTo('acupoint?part=' + btn.dataset.part);
    });
  });

  container.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const name = card.dataset.name;
      window.navigateTo('category?type=acupoint&catId=' + id + '&catName=' + encodeURIComponent(name));
    });
  });
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}
