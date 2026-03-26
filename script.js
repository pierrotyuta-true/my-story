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
    if(!list) return;
    
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
    
    // 연계 파트 링크 디자인
    let displayContent = doc.content.replace(/\[연계 파트: (.+?)\]/g, (match, p1) => {
        return `<div style="margin-top:15px; padding:12px; background:#f8f9fa; border-left:4px solid #54b3ff; border-radius:6px; cursor:pointer; color:#54b3ff; font-weight:bold;" onclick="jumpToStory('${p1}')">🔗 연계 파트 이동: ${p1}</div>`;
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
            <button style="border:none; background:none; color:#ff6b6b;" onclick="deleteStory(${s.id}, event)">×</button>
        </li>
    `).join('');
}

// 나머지 함수들 (loadStory, handleEdit, deleteStory, addEvent 등)은 이전과 동일하게 유지
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
function addEvent() { const t = prompt("새 사건:"); if(t) { events.push({title: t}); localStorage.setItem('yuta_events', JSON.stringify(events)); renderTimeline(); } }
function createNewStory() { const t = prompt("새 제목:"); if(t) { stories.push({ id: Date.now(), title: t, content: "", parentId: null }); renderStory(); } }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
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
