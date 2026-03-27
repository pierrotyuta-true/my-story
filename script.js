// 사건 데이터 구조에 메모(index_tabs) 필드 추가
function renderEvents() {
    const container = document.getElementById('event-container');
    container.innerHTML = storyboard.map(ev => `
        <div class="event-card ${ev.memos ? 'has-memo' : ''}" 
             id="ev-${ev.id}" 
             style="transform: translate(${ev.x}px, ${ev.y}px)">
            <div class="card-index-tab"></div> <div class="content" onclick="toggleMemo('${ev.id}')">
                <h4>${ev.title}</h4>
            </div>
        </div>
    `).join('');
}

// 메모창 열기 (흰 바탕 없이 탭만 띄우기)
function toggleMemo(id) {
    const memoGroup = document.getElementById('active-memo-group');
    const ev = storyboard.find(i => i.id == id);
    
    // 4방향 인덱스 탭 생성 로직
    memoGroup.innerHTML = `
        <div class="index-memo-tab" style="top: ${ev.y - 100}px; left: ${ev.x + 160}px;">
            <div class="tab-label">메모 인덱스</div>
            <div class="tab-input-area">
                <textarea onchange="saveMemo('${id}', this.value)">${ev.memo || ''}</textarea>
            </div>
        </div>
    `;
}
