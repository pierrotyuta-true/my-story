// [데이터 복구 로직] - 기존에 썼을 법한 키값들을 모두 확인합니다.
function getRecoveredData(key, fallback) {
    const legacyKeys = [key, 'events', 'timeline_data', 'yuta_events', 'my-story-events', 'story_data'];
    for (let k of legacyKeys) {
        const data = localStorage.getItem(k);
        if (data) {
            console.log(`데이터 복구 성공: ${k}`);
            try { return JSON.parse(data); } catch(e) { console.error(e); }
        }
    }
    return fallback;
}

let events = getRecoveredData('yuta_events', []);
let stories = getRecoveredData('yuta_stories', [{ id: 1, title: "메인 줄거리", content: "내용을 입력하세요.", parentId: null }]);
let currentDocId = stories[0].id;
let isEditing = false;

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('view-' + tabId).classList.add('active');
    
    if(tabId === 'timeline') renderTimeline();
    if(tabId === 'story') renderStory();
}

function renderTimeline() {
    const list = document.getElementById('event-list');
    if(!list) return;
    
    list.innerHTML = '<div class="era-badge">제국력 589년</div>'; // 예시 연도
    
    // 데이터가 없을 때 안내 문구 (사진 4번 스타일)
    if (events.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#adb5bd; margin-top:100px;">새로운 사건을 추가해보세요.</div>';
        return;
    }

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

function renderStory() {
    const doc = stories.find(s => s.id === currentDocId) || stories[0];
    currentDocId = doc.id;
    document.getElementById('current-title').innerText = doc.title;
    
    // 연계 파트 링크 디자인 (예쁜 카드형)
    let displayContent = doc.content.replace(/\[연계 파트: (.+?)\]/g, (match, p1) => {
        return `<a href="#" class="sub-link-card" onclick="jumpToStory('${p1}')">🔗 연계 파트 이동: ${p1}</a>`;
    });
    
    document.getElementById('viewer').innerHTML = displayContent;
    document.getElementById('editor').value = doc.content;
    updateStoryList();
    localStorage.setItem('yuta_stories', JSON.stringify(stories));
}

function updateStoryList() {
    const listUI = document.getElementById('story-list');
    listUI.innerHTML = stories.map(s => `
        <li class="story-item ${s.id === currentDocId ? 'active' : ''} ${s.parentId ? 'child' : ''}" onclick="loadStory(${s.id})">
            <span>${s.parentId ? '└ ' : ''}${s.title}</span>
            <button style="border:none; background:none; color:#ff6b6b; font-size:1.1rem; cursor:pointer;" onclick="deleteStory(${s.id}, event)">×</button>
        </li>
    `).join('');
}

// ... 이하 loadStory, jumpToStory, handleEdit, addEvent 등 나머지 기능 함수는 이전과 동일 ...
// (지면 관계상 생략하지만, 이전 답변의 script.js 코드를 그대로 유지하시면 됩니다.)
function loadStory(id) { currentDocId = id; isEditing = false; updateDisplay(); renderStory(); if(window.innerWidth <= 768) toggleSidebar(); }
function jumpToStory(title) { const target = stories.find(s => s.title.includes(title)); if(target) loadStory(target.id); }
function handleEdit() {
    const doc = stories.find(s => s.id === currentDocId);
    if (!isEditing) { isEditing = true; updateDisplay(); document.getElementById('editor').focus(); }
    else { doc.content = document.getElementById('editor').value; isEditing = false; updateDisplay(); renderStory(); }
}
function updateDisplay() {
    document.getElementById('viewer').style.display = isEditing ? 'none' : 'block';
    document.getElementById('editor').style.display = isEditing ? 'block' : 'none';
    document.getElementById('edit-btn').innerText = isEditing ? '저장' : '편집';
}
function addEvent() { const t = prompt("새 사건:"); if(t) { events.push({title: t}); renderTimeline(); } }
function createNewStory() { const t = prompt("새 제목:"); if(t) { stories.push({ id: Date.now(), title: t, content: "", parentId: null }); renderStory(); } }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').style.display = document.getElementById('sidebar').classList.contains('open') ? 'block' : 'none'; }
function makeSubDocument() {
    const ed = document.getElementById('editor');
    let text = isEditing ? ed.value.substring(ed.selectionStart, ed.selectionEnd) : window.getSelection().toString();
    if (!text.trim()) return alert("텍스트를 드래그 선택해주세요.");
    const newDoc = { id: Date.now(), title: text.substring(0,8), content: text, parentId: currentDocId };
    stories.push(newDoc);
    stories.find(s => s.id === currentDocId).content += `\n\n[연계 파트: ${newDoc.title}]`;
    renderStory();
}
function deleteStory(id, e) {
    e.stopPropagation();
    if(stories.length <= 1) return alert("최소 한 개의 문서는 있어야 합니다.");
    if(confirm("이 파트를 삭제할까요?")) {
        stories = stories.filter(s => s.id !== id);
        if(currentDocId === id) currentDocId = stories[0].id;
        renderStory();
    }
}

renderTimeline();
renderStory();
