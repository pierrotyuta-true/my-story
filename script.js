let events = JSON.parse(localStorage.getItem('yuta_events')) || [];
let stories = JSON.parse(localStorage.getItem('yuta_stories')) || [{ id: 1, title: "메인 줄거리", content: "내용을 입력하세요.", parentId: null }];
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
    list.innerHTML = '<div class="era-badge">제국력 589년</div>';
    events.forEach((ev, idx) => {
        const side = idx % 2 === 0 ? 'left' : 'right';
        const item = document.createElement('div');
        item.className = `event-item ${side}`;
        item.innerHTML = `<div class="node"></div><div class="event-card"><span style="color:#54b3ff; font-weight:800; font-size:0.8rem;">3월</span><h4>${ev.title}</h4></div>`;
        list.appendChild(item);
    });
}

function renderStory() {
    const doc = stories.find(s => s.id === currentDocId) || stories[0];
    currentDocId = doc.id;
    document.getElementById('current-title').innerText = doc.title;
    
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
            <button class="del-btn" onclick="deleteStory(${s.id}, event)">×</button>
        </li>
    `).join('');
}

function loadStory(id) {
    currentDocId = id;
    isEditing = false;
    updateDisplay();
    renderStory();
    if(window.innerWidth <= 768) toggleSidebar();
}

function jumpToStory(titleSnippet) {
    const target = stories.find(s => s.title.includes(titleSnippet));
    if(target) loadStory(target.id);
}

function deleteStory(id, e) {
    e.stopPropagation();
    if(confirm("이 파트를 삭제할까요?")) {
        stories = stories.filter(s => s.id !== id);
        if(currentDocId === id) currentDocId = stories[0].id;
        renderStory();
    }
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
    document.getElementById('viewer').style.display = isEditing ? 'none' : 'block';
    document.getElementById('editor').style.display = isEditing ? 'block' : 'none';
    document.getElementById('edit-btn').innerText = isEditing ? '저장' : '편집';
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    sb.classList.toggle('open');
    ov.style.display = sb.classList.contains('open') ? 'block' : 'none';
}

function addEvent() {
    const t = prompt("새 사건:");
    if(t) { events.push({title: t}); localStorage.setItem('yuta_events', JSON.stringify(events)); renderTimeline(); }
}

function createNewStory() {
    const t = prompt("새 제목:");
    if(t) { stories.push({ id: Date.now(), title: t, content: "", parentId: null }); renderStory(); }
}

function makeSubDocument() {
    const ed = document.getElementById('editor');
    let text = isEditing ? ed.value.substring(ed.selectionStart, ed.selectionEnd) : window.getSelection().toString();
    if (!text.trim()) return alert("텍스트를 드래그 선택해주세요.");
    const newDoc = { id: Date.now(), title: text.substring(0,8), content: text, parentId: currentDocId };
    stories.push(newDoc);
    stories.find(s => s.id === currentDocId).content += `\n\n[연계 파트: ${newDoc.title}]`;
    renderStory();
}

renderTimeline();
renderStory();
