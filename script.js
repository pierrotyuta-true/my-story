// [데이터 복구 로직]
function getRecoveredData(key, fallback) {
    // 기존에 썼을 법한 다양한 키 이름들을 확인합니다.
    const legacyKeys = [key, 'events', 'timeline_data', 'yuta_events', 'my-story-events'];
    for (let k of legacyKeys) {
        const data = localStorage.getItem(k);
        if (data) {
            console.log(`데이터 복구 성공: ${k}`);
            return JSON.parse(data);
        }
    }
    return fallback;
}

let events = getRecoveredData('yuta_events', []);
let stories = getRecoveredData('yuta_stories', [{ id: 1, title: "메인 줄거리", content: "내용을 입력하세요.", parentId: null }]);

// [타임라인 카드 생성 시 연도별 그룹화]
function renderTimeline() {
    const list = document.getElementById('event-list');
    if(!list) return;
    
    list.innerHTML = '';
    
    // 데이터가 없을 때 안내 문구 (사진 4번 스타일)
    if (events.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#adb5bd; margin-top:100px;">새로운 사건을 추가해보세요.</div>';
        return;
    }

    // 예시로 제국력 배지를 하나 넣습니다. (데이터에 연도 정보가 있다면 자동화 가능)
    list.innerHTML = '<div class="era-badge">제국력 589년</div>';

    events.forEach((ev, idx) => {
        const side = idx % 2 === 0 ? 'left' : 'right';
        const item = document.createElement('div');
        item.className = `event-item ${side}`;
        item.innerHTML = `
            <div class="node"></div>
            <div class="event-card">
                <span class="month">${ev.month || '3월'}</span>
                <h4>${ev.title}</h4>
                <p style="font-size:0.8rem; color:#666; margin:5px 0 0 0;">${ev.desc || ''}</p>
            </div>
        `;
        list.appendChild(item);
    });
}

// 사건 추가 시 상세 내용도 입력받기
function addEvent() {
    const title = prompt("사건 제목을 입력하세요:");
    if(!title) return;
    const month = prompt("월을 입력하세요 (예: 3월):", "3월");
    
    events.push({
        id: Date.now(),
        title: title,
        month: month,
        desc: "" // 필요시 설명 추가
    });
    
    localStorage.setItem('yuta_events', JSON.stringify(events));
    renderTimeline();
}
