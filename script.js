// [1] 데이터 및 초기화 (이전 동일)
let events = JSON.parse(localStorage.getItem('yuta_events')) || [];
let stories = JSON.parse(localStorage.getItem('yuta_stories')) || [{ id: 1, title: "메인 줄거리", content: "모바일 화면이 최적화되었습니다!\n\n왼쪽 상단의 ☰ 버튼을 눌러 스토리 리스트를 여닫을 수 있습니다.", parentId: null }];
let currentDocId = stories[0].id;
let isEditing = false;

// [2] 탭 전환 (이전 동일)
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    
    event.currentTarget.classList.add('active');
    document.getElementById('view-' + tabId).classList.add('active');
    
    if (tabId === 'timeline') renderTimeline();
    if (tabId === 'story') renderStory();
}

// [3] ★사이드바 토글 (모바일 접기 기능)★
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isOpen = sidebar.classList.contains('open');

    if (isOpen) {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
    } else {
        sidebar.classList.add('open');
        overlay.style.display = 'block';
    }
}

// [4] 타임라인 로직 (이전 동일)
function renderTimeline() {
    const list = document.getElementById('event-list');
    list.innerHTML = '';
    if (events.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:50px; color:#999; font-size:0.9rem;">등록된 사건이 없습니다.</div>';
        return;
    }
    events.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `<h4>${ev.title}</h4><p>${ev.memo || '메모가 없습니다.'}</p><small style="color:#4c6ef5; margin-top:10px; display:block; font-size:0.75rem;">📝 상세 줄거리 쓰기</small>`;
        card.onclick = () => connectToStory(ev.title);
        list.appendChild(card);
    });
    localStorage.setItem('yuta_events', JSON.stringify(events));
}

function addEvent() {
    const title = prompt("사건 제목을 입력하세요:");
    if (title) {
        events.push({ id: Date.now(), title, memo: "" });
        renderTimeline();
    }
}

// [5] 스토리 로직 (연동 및 접기 반영)
function renderStory() {
    const doc = stories.find(s => s.id === currentDocId) || stories[0];
    currentDocId = doc.id;
    document.getElementById('current-title').innerText = doc.title;
    document.getElementById('viewer').innerHTML = doc.content.replace(/==(.+?)==/g, '<span class="highlight">$1</span>');
    document.getElementById('editor').value = doc.content;
    
    updateStoryList();
    localStorage.setItem('yuta_stories', JSON.stringify(stories));
}

function updateStoryList() {
    const listUI = document.getElementById('story-list');
    listUI.innerHTML = '';
    stories.forEach(s => {
        const li = document.createElement('li');
        li.className = `story-item ${s.id === currentDocId ? 'active' : ''}`;
        li.innerText = `📄 ${s.title}`;
        li.onclick = () => { 
            currentDocId = s.id; 
            isEditing = false; 
            updateDisplay(); 
            renderStory();
            // 모바일에서 항목 선택 시 자동으로 사이드바 접기
            if(window.innerWidth <= 768) toggleSidebar(); 
        };
        listUI.appendChild(li);
    });
}

function handleEdit() {
    const doc = stories.find(s => s.id === currentDocId);
    if (!isEditing) {
        isEditing = true;
        updateDisplay();
        document.getElementById('editor').focus();
    } else {
        doc.content = document.getElementById('editor').value;
        isEditing = false;
        updateDisplay();
        renderStory();
    }
}

function updateDisplay() {
    const editBtn = document.getElementById('edit-btn');
    document.getElementById('viewer').style.display = isEditing ? 'none' : 'block';
    document.getElementById('editor').style.display = isEditing ? 'block' : 'none';
    editBtn.innerText = isEditing ? '저장 완료' : '편집 시작';
    editBtn.style.background = isEditing ? '#40c057' : '#4c6ef5';
}

function makeSubDocument() {
    const editorEl = document.getElementById('editor');
    let text = isEditing ? editorEl.value.substring(editorEl.selectionStart, editorEl.selectionEnd) : window.getSelection().toString();
    
    if (!text.trim()) return alert("텍스트를 드래그하여 선택해주세요.");

    const newDoc = { id: Date.now(), title: text.substring(0, 10) + "...", content: text, parentId: currentDocId };
    stories.push(newDoc);
    stories.find(s => s.id === currentDocId).content += `\n\n[연계 파트: ${newDoc.title}]`;
    
    alert("새 파트가 생성되었습니다!");
    renderStory();
}

function connectToStory(title) {
    let existing = stories.find(s => s.title === title);
    if (!existing) {
        const newDoc = { id: Date.now(), title, content: "", parentId: null };
        stories.push(newDoc);
        currentDocId = newDoc.id;
    } else {
        currentDocId = existing.id;
    }
    // 스토리 탭으로 전환
    document.querySelectorAll('.tab-btn')[1].click();
}

function createNewStory() {
    const t = prompt("새 스토리 제목:");
    if (t) {
        const newDoc = { id: Date.now(), title: t, content: "", parentId: null };
        stories.push(newDoc);
        currentDocId = newDoc.id;
        renderStory();
        // 모바일에서 새 스토리 만들면 사이드바 접기
        if(window.innerWidth <= 768) toggleSidebar();
    }
}

// 초기 로드
renderTimeline();
renderStory();
