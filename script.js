const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], currentProject = localStorage.getItem('lastProject') || null;

function toggleMainSidebar() {
    document.getElementById('main-sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').style.display = document.getElementById('main-sidebar').classList.contains('open') ? 'block' : 'none';
}

function switchTab(view) {
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.v-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('tab-' + view).classList.add('active');
    if(view === 'timeline') renderTimeline();
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
}

function renderTimeline() {
    const list = document.getElementById('event-list');
    list.innerHTML = `<div class="era-badge">제국력 589년</div>`;
    list.innerHTML += storyboard.map((ev, i) => `
        <div class="event-row ${i % 2 === 0 ? 'left' : 'right'}">
            <div class="node"></div>
            <div class="event-card">
                <span class="month">3월</span>
                <h4>${ev.title}</h4>
            </div>
        </div>
    `).join('') || '<p style="text-align:center; padding:50px; color:#999;">새로운 사건을 추가해보세요!</p>';
}

function handleAddButton() {
    if(!currentProject) return alert("작품을 먼저 선택하세요!");
    document.getElementById('customModal').style.display = 'flex';
    document.getElementById('modalInput').focus();
    document.getElementById('modalConfirmBtn').onclick = () => {
        const val = document.getElementById('modalInput').value.trim();
        if(val) {
            storyboard.push({ id: Date.now(), title: val, month: 3 });
            saveToCloud();
            closeCustomModal();
        }
    };
}

function closeCustomModal() { document.getElementById('customModal').style.display = 'none'; document.getElementById('modalInput').value = ""; }
function saveToCloud() { db.ref('projects/' + currentProject + '/data').set(storyboard); }

window.onload = () => { if(currentProject) selectProject(currentProject); else alert("목록에서 작품을 선택하거나 생성하세요!"); };
