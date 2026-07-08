import { getItemById } from '../data.js';
import { isFavorite, toggleFavorite, addRecentView } from '../store.js';

const HERB_PROP_ORDER = ['药性', '归经', '功效', '应用', '用法用量', '使用注意', '现代研究'];
const FORMULA_PROP_ORDER = ['组成', '用法', '功用', '主治', '证治机理', '方解', '运用', '附方', '鉴别', '方论选录', '医案举例', '方歌'];
const INTERNAL_PROP_ORDER = ['临床表现', '证机概要', '治法', '代表方', '常用药'];

export function render(container, params) {
  const type = params.type || 'herb';
  const id = params.id;

  if (!id) {
    container.innerHTML = '<div class="empty-state">参数错误</div>';
    return;
  }

  const item = getItemById(id, type);
  if (!item) {
    container.innerHTML = '<div class="empty-state">未找到信息</div>';
    return;
  }

  addRecentView({ id: item.id, name: item.name, type });

  const order = type === 'formula' ? FORMULA_PROP_ORDER : type === 'internal' ? INTERNAL_PROP_ORDER : HERB_PROP_ORDER;
  const propKeys = order.filter(k => item.properties[k]);
  const extraKeys = Object.keys(item.properties).filter(k => !order.includes(k));
  const fav = isFavorite(id);

  container.innerHTML = `
    <div class="detail-header ${type}">
      <div class="name">${escapeHtml(item.name)}</div>
      <div class="header-actions">
        <span id="copy-btn">📋 复制名称</span>
        <span id="fav-btn">${fav ? '⭐' : '☆'} ${fav ? '已收藏' : '收藏'}</span>
        <span id="share-btn">💊 分享药方</span>
      </div>
    </div>
    <div class="detail-body">
      ${[...propKeys, ...extraKeys].map(key => `
        <div class="detail-section">
          <div class="label">${escapeHtml(key)}</div>
          <div class="value">${escapeHtml(item.properties[key])}</div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(item.name).catch(() => {});
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = '药方名称复制成功';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1000);
  });

  document.getElementById('fav-btn').addEventListener('click', () => {
    const nowFav = toggleFavorite({ id: item.id, name: item.name, type });
    const btn = document.getElementById('fav-btn');
    btn.textContent = nowFav ? '⭐ 已收藏' : '☆ 收藏';
  });

  document.getElementById('share-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(location.href).catch(() => {});
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = '链接复制成功';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1000);
  });
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}
