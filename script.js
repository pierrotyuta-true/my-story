// [1] Firebase 설정 (유타님 설정 그대로 유지)
const config = { 
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", 
    authDomain: "true-s.firebaseapp.com", 
    databaseURL: "https://true-s-default-rtdb.firebaseio.com", 
    projectId: "true-s" 
};
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], currentProject = localStorage.getItem('lastProject') || null;

// [2] 화면 전환 및 사이드바
function toggleMainSidebar() {
    const sb = document.getElementById('main-sidebar');
    const ov = document.getElementById('sidebar-overlay');
    const isOpen = sb.classList.toggle('open');
    ov.style.display = isOpen ? 'block' : 'none';
}

function switchTab(view) {
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.v-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('tab-' + view).classList.add('active');
    if(view === 'timeline') renderTimeline();
}

// [3] 프로젝트 로드 & 생성
function openLoadModal() { document.getElementById('loadModal').style.display = 'flex'; loadProjectList(); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function loadProjectList() {
    db.ref('projects').once('value', s => {
        const d = s.val() || {};
        document.getElementById('projectList').innerHTML = Object.keys(d).map(k => `
            <div class="proj-item" onclick="selectProject('${k}')" style="padding:15px; border-bottom:1px solid #eee; cursor:pointer;">
                <b>${k}</b>
            </div>
        `).join('') || "작품이 없습니다.";
    });
}

function selectProject(name) {
    currentProject = name;
    localStorage.setItem('lastProject', name);
    document.getElementById('projectTitle').innerText = name;
    db.ref('projects/' + name).on('value', s => {
        const d = s.val() || {};
        storyboard = d.data || [];
        renderTimeline();
    });
    closeModal('loadModal');
}

function createNewProject() {
    const name = document.getElementById('newProjName').value.trim();
    if(!name) return;
    db.ref('projects/' + name).set({ data: [], mainStory: "" }).then(() => {
        document.getElementById('newProjName').value = "";
        selectProject(name);
    });
}

// [4] 타임라인 렌더링
function renderTimeline() {
    const list = document.getElementById('event-list');
    list.innerHTML = storyboard.map((ev, i) => `
        <div class="event-row ${i % 2 === 0 ? 'left' : 'right'}">
            <div class="node"></div>
            <div class="event-card">
                <span class="month">3월</span>
                <h4>${ev.title}</h4>
            </div>
        </div>
    `).join('') || '<p style="text-align:center; color:#999; margin-top:50px;">사건이 없습니다.</p>';
}

// [5] 사건 추가 (커스텀 모달)
function handleAddButton() {
    openCustomModal("새로운 사건 추가", (val) => {
        storyboard.push({ id: Date.now(), title: val, year: 2026, month: 3 });
        saveToCloud();
    });
}

function openCustomModal(title, callback) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('customModal').style.display = 'flex';
    document.getElementById('modalConfirmBtn').onclick = () => {
        const val = document.getElementById('modalInput').value.trim();
        if(val) { callback(val); closeCustomModal(); }
    };
}
function closeCustomModal() { document.getElementById('customModal').style.display = 'none'; document.getElementById('modalInput').value = ""; }

function saveToCloud() {
    if(!currentProject) return;
    db.ref('projects/' + currentProject + '/data').set(storyboard);
}

window.onload = () => { if(currentProject) selectProject(currentProject); else openLoadModal(); };
