const config = { 
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", 
    authDomain: "true-s.firebaseapp.com", 
    databaseURL: "https://true-s-default-rtdb.firebaseio.com", 
    projectId: "true-s" 
};
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], currentProject = localStorage.getItem('lastProject') || "이그리예가"; 
const SNAP_Y = 80;

function init() {
    document.getElementById('project-title').innerText = currentProject;
    db.ref('projects/' + currentProject + '/data').on('value', s => {
        storyboard = s.val() || [];
        renderEvents();
    });
}

function renderEvents() {
    const container = document.getElementById('event-container');
    container.innerHTML = '';
    
    // 중앙 연도 배지 (일단 고정 1개 출력)
    const badge = document.createElement('div');
    badge.className = 'era-badge'; badge.innerText = `제국력 589년`;
    badge.style.top = '100px'; container.appendChild(badge);

    storyboard.forEach(ev => {
        const card = document.createElement('div');
        card.className = `event-card ${ev.memo ? 'has-memo' : ''}`;
        card.id = `ev-${ev.id}`;
        card.style.left = ev.x + 'px';
        card.style.top = ev.y + 'px';
        card.onclick = () => openModal(ev.id);
        card.innerHTML = `<div class="card-tab"></div><h4>${ev.title || '내용 없음'}</h4>`;
        container.appendChild(card);
    });
    
    setupDraggable();
    drawCurves();
}

function setupDraggable() {
    interact('.event-card').draggable({
        listeners: {
            move(event) {
                const t = event.target;
                const x = (parseFloat(t.style.left) || 0) + event.dx;
                const y = (parseFloat(t.style.top) || 0) + event.dy;
                t.style.left = x + 'px'; t.style.top = y + 'px';
                drawCurves();
            },
            end(event) {
                const t = event.target;
                const id = t.id.replace('ev-', '');
                const idx = storyboard.findIndex(i => i.id == id);
                
                // [강제 스냅 로직] 멀리 못 도망가게 고정
                const centerX = window.innerWidth / 2;
                const snappedX = (parseFloat(t.style.left) < centerX) ? centerX - 145 : centerX + 25;
                const snappedY = Math.round(parseFloat(t.style.top) / SNAP_Y) * SNAP_Y;

                storyboard[idx].x = snappedX;
                storyboard[idx].y = snappedY;
                saveToCloud();
            }
        }
    });
}

function drawCurves() {
    const svg = document.getElementById('connection-svg');
    if(!svg) return; svg.innerHTML = '';
    const centerX = window.innerWidth / 2;

    storyboard.forEach(ev => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", centerX); line.setAttribute("y1", ev.y + 25);
        line.setAttribute("x2", ev.x < centerX ? ev.x + 120 : ev.x); line.setAttribute("y2", ev.y + 25);
        line.setAttribute("class", "curve-line");
        svg.appendChild(line);
    });
}

// [모달 상세페이지]
function openModal(id) {
    const ev = storyboard.find(i => i.id == id);
    const modal = document.getElementById('modal-layer');
    const content = document.getElementById('modal-content');
    
    modal.style.display = 'flex';
    content.innerHTML = `
        <div class="modal-header">사건 상세정보</div>
        <div class="modal-body">
            <input type="text" id="edit-title" value="${ev.title}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee; margin-bottom:10px;">
            <textarea id="edit-memo" placeholder="가지를 추가하려면 여기에 메모를 입력하세요...">${ev.memo || ''}</textarea>
        </div>
        <div class="modal-footer">
            <button class="btn-edit" onclick="updateEvent('${id}')">수정</button>
            <button class="btn-memo" onclick="updateEvent('${id}')">가지추가</button>
            <button class="btn-del" onclick="deleteEvent('${id}')">삭제</button>
        </div>
    `;
    modal.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };
}

function updateEvent(id) {
    const idx = storyboard.findIndex(i => i.id == id);
    storyboard[idx].title = document.getElementById('edit-title').value;
    storyboard[idx].memo = document.getElementById('edit-memo').value;
    saveToCloud();
    document.getElementById('modal-layer').style.display = 'none';
}

function deleteEvent(id) {
    if(confirm("정말 삭제할까요?")) {
        storyboard = storyboard.filter(i => i.id != id);
        saveToCloud();
        document.getElementById('modal-layer').style.display = 'none';
    }
}

function createNewEvent() {
    const id = Date.now();
    const centerX = window.innerWidth / 2;
    storyboard.push({ id: id, title: "새로운 사건", x: centerX + 25, y: 160, memo: "" });
    saveToCloud();
}

function saveToCloud() {
    db.ref('projects/' + currentProject + '/data').set(storyboard);
}

window.onload = init;
