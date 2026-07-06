export async function render(container, params) {
  const part = params.part || '';
  const parts = ['正面穴位', '背面穴位', '侧面穴位'];
  const partKeys = { front: '正面穴位', back: '背面穴位', side: '侧面穴位' };
  const partMap = { '正面穴位': 'front', '背面穴位': 'back', '侧面穴位': 'side' };
  const imagePath = './data/';

  if (part && partKeys[part]) {
    /* 显示对应穴位图 */
    const name = partKeys[part];
    container.innerHTML = `
      <div class="acupoint-view">
        <div class="acupoint-options">
          ${parts.map(p => `<button class="acupoint-btn${p === name ? ' active' : ''}" data-part="${partMap[p]}">${p}</button>`).join('')}
        </div>
        <div class="acupoint-image-wrap">
          <img class="acupoint-img" src="${imagePath}${name}.jpg" alt="${name}" draggable="false">
        </div>
        <p class="acupoint-hint">双指缩放查看细节</p>
      </div>
    `;
  } else {
    /* 显示三选项 */
    container.innerHTML = `
      <div class="acupoint-view">
        <div class="acupoint-options">
          ${parts.map(p => `<button class="acupoint-btn" data-part="${partMap[p]}">${p}</button>`).join('')}
        </div>
        <p class="acupoint-prompt">选择视图查看对应穴位图</p>
      </div>
    `;
  }

  /* 绑定按钮事件 */
  container.querySelectorAll('.acupoint-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.navigateTo('acupoint?part=' + btn.dataset.part);
    });
  });
}
