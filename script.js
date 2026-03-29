// Firebase 로드 및 상태 관리는 기존과 동일하게 유지

// 타임라인 그리기 함수 (지그재그/수평 연결선 적용)
function renderTimeline() {
    const list = document.getElementById('tl-list');
    if (!list) return;
    list.innerHTML = '<div class="center-line"></div>'; // 초기화

    // 데이터를 연도/월 순으로 정렬
    const sorted = [...state.data.storyboard].sort((a,b) => a.year - b.year || a.month - b.month);
    
    let lastYear = null;

    sorted.forEach((item, index) => {
        const isLeft = index % 2 === 0; // 지그재그 배치 (왼쪽, 오른쪽 반복)
        const row = document.createElement('div');
        row.className = 'event-row';

        // 연도가 바뀔 때만 연대 배지 표시
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
