// [1] 데이터 복구 로직 (기존 이름이나 새 이름 모두 체크)
let events = JSON.parse(localStorage.getItem('yuta_events')) || [];
let stories = JSON.parse(localStorage.getItem('yuta_stories')) || [{ id: 1, title: "메인 줄거리", content: "내용을 작성하세요." }];
let currentDocId = stories[0].id;

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('view-' + tabId).classList.add('active');
    if(tabId === 'timeline') renderTimeline();
}

// [2] 지그재그 타임라인 렌더링
function renderTimeline() {
    const list = document.getElementById('event-list');
    list.innerHTML = '<div class="era-badge">제국력 589년</div>'; // 예시 헤더
    
    events.forEach((ev, idx) => {
        const side = idx % 2 === 0 ? 'left' : 'right';
        const item = document.createElement('div');
        item.className = `event-item ${side}`;
        item.innerHTML = `
            <div class="node"></div>
            <div class="event-card">
                <span class="month">${ev.month || '3월'}</span>
                <h4>${ev.title}</h4>
            </div>
        `;
        list.appendChild(item);
    });
    localStorage.setItem('yuta_events', JSON.stringify(events));
}

function addEvent() {
    const t = prompt("사건을 입력하세요:");
    if(t) {
        events.push({ id: Date.now(), title: t, month: "3월" });
        renderTimeline();
    }
}

// [3] 스토리 편집기 (모바일 접기 포함)
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').style.display = 
        document.getElementById('sidebar').classList.contains('open') ? 'block' : 'none';
}

function renderStory() {
    const doc = stories.find(s => s.id === currentDocId) || stories[0];
    document.getElementById('current-title').innerText = doc.title;
    document.getElementById('viewer').innerText = doc.content;
    document.getElementById('editor').value = doc.content;
    
    const listUI = document.getElementById('story-list');
    listUI.innerHTML = stories.map(s => `<li onclick="loadStory(${s.id})">${s.title}</li>`).join('');
}

function loadStory(id) {
    currentDocId = id;
    renderStory();
    if(window.innerWidth < 768) toggleSidebar();
}

// 초기 로딩
renderTimeline();
renderStory();
