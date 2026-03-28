// 데이터 렌더링 함수
function renderTimeline() {
  const list = document.getElementById('tl-list');
  list.innerHTML = '<div class="center-line"></div>';
  
  const sorted = [...state.data.storyboard].sort((a,b) => a.year - b.year || a.month - b.month);
  let lastYear = null;

  sorted.forEach((item, index) => {
    const isLeft = index % 2 === 0;
    const row = document.createElement('div');
    row.className = 'event-row';

    // 연도가 바뀔 때만 배지 표시
    let yearHtml = '';
    if (item.year !== lastYear) {
      yearHtml = `<div class="year-badge">${item.era || '제국력'} ${item.year}년</div>`;
      lastYear = item.year;
    }

    row.innerHTML = `
      ${yearHtml}
      <div class="node-point" style="top:50%"></div>
      <div class="h-line ${isLeft ? 'line-left' : 'line-right'}"></div>
      <div class="card-wrapper ${isLeft ? 'left-card' : 'right-card'}">
        <div class="card" onclick="editEvent(${item.id})">
          <div style="font-size:10px; color:var(--primary); font-weight:800; margin-bottom:4px;">${item.month}월</div>
          <div style="font-size:13px; font-weight:600; color:#333;">${item.text}</div>
        </div>
      </div>
    `;
    list.appendChild(row);
  });
}
