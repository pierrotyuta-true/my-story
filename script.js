const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], currentProject = localStorage.getItem('lastProject') || "이그리예가"; 
const OFFSET_X = 50; 

function init() {
    document.getElementById('currentProjectTitle').innerText = currentProject;
    db.ref('projects/' + currentProject + '/data').on('value', s => {
        storyboard = s.val() || [];
        renderEvents();
    });
}

function renderEvents() {
    const container = document.getElementById('event-container');
    container.innerHTML = `<div class="era-badge" style="top:30px">제국력 589년</div>`;
    
    storyboard.forEach(ev => {
        const card = document.createElement('div');
        card.className = `event-card ${ev.memo ? 'has-memo' : ''}`;
        card.id = `ev-${ev.id}`;
        card.style.left = (ev.x || 0) + 'px';
        card.style.top = (ev.y || 0) + 'px';
        card.innerHTML = `<div class="card-tab"></div><h4>${ev.title || '내용 입력'}</h4>`;
        
        // 클릭 시 모달 띄우기 (드래그와 구분)
        card.onclick = (e) => { if(!card.classList.contains('dragging')) openModal(ev.id); };
        container.appendChild(card);
    });
    setupDraggable();
    drawLines();
}

function setupDraggable() {
    interact('.event-card').draggable({
        hold: 500, // [중요] 0.5초 꾹 눌러야 드래그 시작 (모바일 대응)
        listeners: {
            start(event) { event.target.classList.add('dragging'); },
            move(event) {
                const t = event.target;
                const x = (parseFloat(t.style.left) || 0) + event.dx;
                const y = (parseFloat(t.style.top) || 0) + event.dy;
                t.style.left = x + 'px'; t.style.top = y + 'px';
                drawLines();
            },
            end(event) {
                const t = event.target;
                const id = t.id.replace('ev-', '');
                const idx = storyboard.findIndex(i => i.id == id);
                const centerX = window.innerWidth / 2;
                
                const snappedX = (parseFloat(t.style.left) + 65 < centerX) ? (centerX - 130 - OFFSET_X) : (centerX + OFFSET_X);
                const snappedY = Math.round(parseFloat(t.style.top) / 40) * 40;

                storyboard[idx].x = snappedX; storyboard[idx].y = snappedY;
                saveToCloud();
                setTimeout(() => t.classList.remove('dragging'), 100);
            }
        }
    });
}

function drawLines() {
    const svg = document.getElementById('connection-svg');
    if(!svg) return; svg.innerHTML = '';
    const centerX = window.innerWidth / 2;
    storyboard.forEach(ev => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        const startX = centerX;
        const endX = ev.x < centerX ? ev.x + 130 : ev.x;
        line.setAttribute("x1", startX); line.setAttribute("y1", ev.y + 25);
        line.setAttribute("x2", endX); line.setAttribute("y2", ev.y + 25);
        line.setAttribute("class", "curve-line");
        svg.appendChild(line);
    });
}

function openModal(id) {
    const ev = storyboard.find(i => i.id == id);
    const modal = document.getElementById('modal-layer');
    modal.style.display = 'flex';
    document.getElementById('modal-content').innerHTML = `
        <h3>사건 수정</h3>
        <input type="text" id="edit-title" value="${ev.title || ''}" style="width:100%; padding:10px; margin-bottom:10px;">
        <textarea id="edit-memo" style="width:100%; height:80px;">${ev.memo || ''}</textarea>
        <div style="display:flex; gap:10px; margin-top:15px;">
            <button onclick="updateEvent('${id}')" style="flex:1; padding:10px; background:var(--primary); color:#fff; border:none; border-radius:5px;">저장</button>
            <button onclick="closeModal()" style="flex:1; padding:10px; background:#eee; border:none; border-radius:5px;">취소</button>
        </div>
    `;
}

function updateEvent(id) {
    const idx = storyboard.findIndex(i => i.id == id);
    storyboard[idx].title = document.getElementById('edit-title').value;
    storyboard[idx].memo = document.getElementById('edit-memo').value;
    saveToCloud();
    closeModal();
}

function closeModal() { document.getElementById('modal-layer').style.display = 'none'; }
function toggleProjMenu() { document.getElementById('projMenuPopup').classList.toggle('hidden'); }
function saveToCloud() { db.ref('projects/' + currentProject + '/data').set(storyboard); }

window.onload = init;
