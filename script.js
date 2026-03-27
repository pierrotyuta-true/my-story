// 업데이트 체크 로직
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=1.6').then(reg => {
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    if (confirm("✨ 디자인 오류가 수정되었습니다. 지금 적용할까요?")) {
                        window.location.reload();
                    }
                }
            });
        });
    });
}

// Firebase 설정 (기존 설정 유지)
const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], eras = ["제국력"], characters = [], mainStory = "";
let currentProject = localStorage.getItem('lastProject') || null;
let currentView = 'timeline';

// [데이터 불러오기 핵심 수정]
function loadProject(name) {
    currentProject = name;
    localStorage.setItem('lastProject', name);
    document.getElementById('projectTitle').innerText = name;
    
    db.ref('projects/' + name).on('value', s => {
        const d = s.val() || {};
        // undefined 방지 처리
        storyboard = Array.isArray(d.data) ? d.data : [];
        eras = Array.isArray(d.eras) ? d.eras : ["제국력"];
        characters = Array.isArray(d.characters) ? d.characters : [];
        mainStory = d.mainStory || "";
        
        renderTimeline();
        if(currentView === 'story') renderStory();
        if(currentView === 'character') renderCharacters();
    });
    closeModal('loadModal');
}

// [타임라인 렌더링 수정]
function renderTimeline() {
    const list = document.getElementById('event-list');
    if (storyboard.length === 0) {
        list.innerHTML = `<p class="empty-msg">사건이 없습니다. + 버튼을 눌러 추가하세요!</p>`;
        return;
    }
    
    list.innerHTML = storyboard.map((ev, index) => `
        <div class="event-card-wrapper ${index % 2 === 0 ? 'left' : 'right'}">
            <div class="event-card">
                <span class="event-date">${ev.year || "589"}년 ${ev.month || "1"}월</span>
                <div class="event-title">${ev.title || "내용 없음"}</div>
            </div>
            <div class="timeline-dot"></div>
        </div>
    `).join('');
}

// [사이드바 제어]
function toggleMainSidebar() {
    document.getElementById('main-sidebar').classList.toggle('open');
    const overlay = document.getElementById('sidebar-overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.menu-section li').forEach(li => li.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('menu-' + view).classList.add('active');
    
    if(view === 'timeline') renderTimeline();
    if(view === 'character') renderCharacters();
    if(view === 'story') renderStory();
    if(window.innerWidth < 768) toggleMainSidebar();
}

// [기타 기능들]
function openLoadModal() {
    db.ref('projects').once('value').then(s => {
        const d = s.val();
        const listUI = document.getElementById('projectList');
        listUI.innerHTML = d ? Object.keys(d).map(k => `
            <div class="proj-item" onclick="loadProject('${k}')">
                <b>${k}</b> <i class="fas fa-chevron-right"></i>
            </div>
        `).join('') : '<p>작품이 없습니다.</p>';
        document.getElementById('loadModal').style.display = 'flex';
    });
}

function handleFab() {
    const txt = prompt("새로운 사건을 입력하세요:");
    if(txt) {
        storyboard.push({ id: Date.now(), title: txt, year: 589, month: 3 });
        saveToCloud();
    }
}

function saveToCloud() {
    if(!currentProject) return alert("작품을 먼저 선택하세요.");
    db.ref('projects/' + currentProject).set({
        data: storyboard,
        eras: eras,
        characters: characters,
        mainStory: mainStory
    }).then(() => {
        console.log("저장 완료");
    });
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

window.onload = () => {
    if(currentProject) loadProject(currentProject);
    else openLoadModal();
};
