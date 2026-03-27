const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], currentProject = localStorage.getItem('lastProject') || "이그리예가"; 
let currentEditId = null;

function init() {
    document.getElementById('currentProjectTitle').innerText = currentProject;
    db.ref('projects/' + currentProject + '/data').on('value', s => {
        storyboard = s.val() || [];
        renderEvents();
    });
}

function renderEvents() {
    const container = document.getElementById('event-container');
    container.innerHTML = '';
    storyboard.forEach(ev => {
        const card = document.createElement('div');
        card.className = `event-card ${ev.memo ? 'has-memo' : ''}`;
        card.id = `ev-${ev.id}`;
        card.style.left = (ev.x || 0) + 'px';
        card.style.top = (ev.y || 0) + 'px';
        card.innerHTML = `<div class="card-tab"></div><h4>${ev.title || '내용 입력'}</h4>`;
        card.onclick = () => { if(!card.classList.contains('dragging')) openSheet(ev.id); };
        container.appendChild(card);
    });
    setupDraggable();
    drawLines();
}

function setupDraggable() {
    interact('.event-card').draggable({
        hold: 400, // 모바일 대응: 0.4초 꾹 누르기
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
                
                // [스냅] 중앙선 기준 좌/우 45px 지점 정렬
                const snappedX = (parseFloat(t.style.left) + 65 < centerX) ? (centerX - 130 - 45) : (centerX + 45);
                const snappedY = Math.round(parseFloat(t.style.top) / 40) * 40;

                storyboard[idx].x = snappedX;
                storyboard[idx].y = snappedY;
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
        const endX = ev.x < centerX ? ev.x + 130 : ev.x;
        line.setAttribute("x1", centerX); line.setAttribute("y1", ev.y + 25);
        line.setAttribute("x2", endX); line.setAttribute("y2", ev.y + 25);
        line.setAttribute("style", "stroke:#4dabf7; stroke-width:1.5; stroke-dasharray:4; opacity:0.5;");
        svg.appendChild(line);
    });
}

// [시트 제어 로직]
function openSheet(id) {
    currentEditId = id;
    const ev = storyboard.find(i => i.id == id);
    document.getElementById('edit-title').value = ev.title || '';
    document.getElementById('edit-memo').value = ev.memo || '';
    
    const layer = document.getElementById('bottom-sheet-layer');
    const sheet = document.getElementById('bottom-sheet');
    layer.style.display = 'flex';
    setTimeout(() => sheet.classList.add('show'), 10);
}

function closeSheet(e) {
    if(e && e.target !== document.getElementById('bottom-sheet-layer')) return;
    const sheet = document.getElementById('bottom-sheet');
    sheet.classList.remove('show');
    setTimeout(() => { document.getElementById('bottom-sheet-layer').style.display = 'none'; }, 300);
}

function updateEvent() {
    const idx = storyboard.findIndex(i => i.id == currentEditId);
    storyboard[idx].title = document.getElementById('edit-title').value;
    storyboard[idx].memo = document.getElementById('edit-memo').value;
    saveToCloud();
    closeSheet();
}

function deleteEvent() {
    if(confirm("이 사건을 삭제할까요?")) {
        storyboard = storyboard.filter(i => i.id != currentEditId);
        saveToCloud();
        closeSheet();
    }
}

function createNewEvent() {
    const id = Date.now();
    const centerX = window.innerWidth / 2;
    storyboard.push({ id: id, title: "새로운 사건", x: centerX + 45, y: 150, memo: "" });
    saveToCloud();
}

function toggleProjMenu() { document.getElementById('projMenuPopup').classList.toggle('hidden'); }
function saveToCloud() { db.ref('projects/' + currentProject + '/data').set(storyboard); }

window.onload = init;
