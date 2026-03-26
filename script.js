// [1] 데이터 로드 (기존 데이터 보존)
let events = JSON.parse(localStorage.getItem('yuta_events')) || [];
let stories = JSON.parse(localStorage.getItem('yuta_stories')) || [{ id: 1, title: "메인 줄거리", content: "내용을 입력하세요.", parentId: null }];
let currentDocId = stories[0].id;
let isEditing = false;

// [2] 탭 전환
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('view-' + tabId).classList.add('active');
    if (tabId === 'timeline') renderTimeline();
    if (tabId === 'story') renderStory();
}

// [3] 타임라인 렌더링 (가지선 디자인 적용)
function renderTimeline() {
    const list = document.getElementById('event-list');
    list.innerHTML = '';
    if (!events.length) {
        list.innerHTML = '<p style="text-align:center; padding:50px; color:#999;">새로운 사건을 추가해보세요.</p>';
    }
    events.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `<h4>${ev.title}</h4><p>${ev.memo || '상세 메모가 없습니다.'}</p><small style="color:var(--primary); margin-top:10px; display:block;">📝 스토리 작성하기</small>`;
        card.onclick = () => connectToStory(ev.title);
        list.appendChild(card);
    });
    localStorage.setItem('yuta_events', JSON.stringify(events));
}

function addEvent() {
    const t = prompt("사건 제목:");
    if (t) { events.push({ id: Date.now(), title: t, memo: "" }); renderTimeline(); }
}

// [4] 스토리 렌더링 & 삭제 & 이동
function renderStory() {
    const doc = stories.find(s => s.id === currentDocId) || stories[0];
    currentDocId = doc.id;
    document.getElementById('current-title').innerText = doc.title;
    
    // 주석 텍스트를 카드형 링크로 치환
    let displayHTML = doc.content.replace(/\[연계 파트: (.+?)\]/g, (match, p1) => {
        return `
            <div class="sub-link-wrapper">
                <button class="sub-link-card" onclick="jumpToStory('${p1}')">
                    <span>📂 연계 파트 이동: ${p1}</span>
                    <small>클릭하여 상세 줄거리로 이동합니다.</small>
                </button>
            </div>`;
    });
    
    document.getElementById('viewer').innerHTML = displayHTML.replace(/==(.+?)==/g, '<span class="highlight">$1</span>');
    document.getElementById('editor').value = doc.content;
    updateStoryList();
    localStorage.setItem('yuta_stories', JSON.stringify(stories));
}

function updateStoryList() {
    const listUI = document.getElementById('story-list');
    listUI.innerHTML = '';
    stories.forEach(s => {
        const li = document.createElement('li');
        li.className = `story-item ${s.id === currentDocId ? 'active' : ''} ${s.parentId ? 'child' : ''}`;
        li.innerHTML = `<span>${s.title}</span> <button class="del-btn" onclick="deleteStory(${s.id}, event)">×</button>`;
        li.onclick = () => { currentDocId = s.id; isEditing = false; updateDisplay(); renderStory(); if(window.innerWidth <= 768) toggleSidebar(); };
        listUI.appendChild(li);
    });
}

function jumpToStory(title) {
    const target = stories.find(s => s.title.includes(title));
    if(target) { currentDocId = target.id; isEditing = false; updateDisplay(); renderStory(); }
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

// [기능 함수들]
function handleEdit() {
    const doc = stories.find(s => s.id === currentDocId);
    if (!isEditing) { isEditing = true; updateDisplay(); document.getElementById('editor').focus(); }
    else { doc.content = document.getElementById('editor').value; isEditing = false; updateDisplay(); renderStory(); }
}

function updateDisplay() {
    document.getElementById('viewer').style.display = isEditing ? 'none' : 'block';
    document.getElementById('editor').style.display = isEditing ? 'block' : 'none';
    document.getElementById('edit-btn').innerText = isEditing ? '저장 완료' : '편집 시작';
}

function makeSubDocument() {
    const ed = document.getElementById('editor');
    let text = isEditing ? ed.value.substring(ed.selectionStart, ed.selectionEnd) : window.getSelection().toString();
    if (!text.trim()) return alert("텍스트를 드래그 선택해주세요.");
    const newDoc = { id: Date.now(), title: text.substring(0,10), content: text, parentId: currentDocId };
    stories.push(newDoc);
    stories.find(s => s.id === currentDocId).content += `\n\n[연계 파트: ${newDoc.title}]`;
    renderStory();
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    const isOpen = sb.classList.contains('open');
    sb.classList.toggle('open');
    ov.style.display = isOpen ? 'none' : 'block';
}

function connectToStory(title) {
    let ex = stories.find(s => s.title === title);
    if (!ex) { ex = { id: Date.now(), title, content: "", parentId: null }; stories.push(ex); }
    currentDocId = ex.id;
    document.querySelectorAll('.tab-btn')[1].click();
}

function createNewStory() {
    const t = prompt("제목:");
    if(t) { stories.push({ id: Date.now(), title: t, content: "", parentId: null }); renderStory(); }
}

renderTimeline();
renderStory();
