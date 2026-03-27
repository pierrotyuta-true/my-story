const config = { 
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", 
    authDomain: "true-s.firebaseapp.com", 
    databaseURL: "https://true-s-default-rtdb.firebaseio.com", 
    projectId: "true-s" 
};
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], currentProject = localStorage.getItem('lastProject') || "이그리예가"; 
const GRID_Y = 80; // 스냅할 높이 단위 (월별 간격)

function init() {
    db.ref('projects/' + currentProject + '/data').on('value', s => {
        storyboard = s.val() || [];
        renderEvents();
    });
}

function renderEvents() {
    const container = document.getElementById('event-container');
    container.innerHTML = storyboard.map(ev => `
        <div class="event-card ${ev.memo ? 'has-memo' : ''}" 
             id="ev-${ev.id}" data-id="${ev.id}"
             style="left: ${ev.x || 100}px; top: ${ev.y || 150}px;">
            <div class="card-tab"></div>
            <div onclick="openMemo('${ev.id}', event)">
                <h4 style="margin:0; font-size:13px; color:#444;">${ev.title || '사건 입력'}</h4>
            </div>
        </div>
    `).join('');
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
                t.style.left = x + 'px';
                t.style.top = y + 'px';
                drawCurves();
            },
            end(event) {
                const t = event.target;
                const id = t.getAttribute('data-id');
                const idx = storyboard.findIndex(i => i.id == id);
                
                // [스냅 로직] Y축을 GRID_Y 단위로 딱딱 맞춤
                const currentY = parseFloat(t.style.top);
                const snappedY = Math.round(currentY / GRID_Y) * GRID_Y;
                t.style.top = snappedY + 'px';

                storyboard[idx].x = parseFloat(t.style.left);
                storyboard[idx].y = snappedY;
                saveToCloud();
                drawCurves();
            }
        }
    });
}

// [중앙선에서 뻗어나오는 곡선 그리기]
function drawCurves() {
    const svg = document.getElementById('connection-svg');
    if(!svg) return; svg.innerHTML = '';
    const centerX = window.innerWidth / 2;

    storyboard.forEach(ev => {
        const cardX = (ev.x || 100) + (ev.x < centerX ? 140 : 0); // 카드 방향에 따른 연결점
        const cardY = (ev.y || 150) + 25;
        
        // 중앙선(centerX)에서 카드(ev.x)로 뻗는 곡선
        const path = `M ${centerX} ${cardY} C ${centerX} ${cardY}, ${ev.x + 70} ${cardY}, ${ev.x + 70} ${ev.y}`;
        const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        newPath.setAttribute("d", `M ${centerX} ${cardY} L ${ev.x < centerX ? ev.x + 140 : ev.x} ${cardY}`); // 일단 직선으로 연결 (유타님 스샷 참고)
        newPath.setAttribute("class", "curve-line");
        svg.appendChild(newPath);
    });
}

// ... 메모 및 사건 추가 기능 동일 ...
function openMemo(id, e) {
    const ev = storyboard.find(i => i.id == id);
    const layer = document.getElementById('memo-layer');
    layer.style.pointerEvents = "auto";
    layer.innerHTML = `<div class="floating-index" style="left: ${ev.x + 150}px; top: ${ev.y}px;">
        <div class="index-label">생각의 가지</div>
        <div class="index-content"><textarea onchange="updateMemo('${id}', this.value)">${ev.memo || ''}</textarea></div>
    </div>`;
    layer.onclick = (el) => { if(el.target === layer) { layer.innerHTML = ''; layer.style.pointerEvents = "none"; } };
}

function updateMemo(id, val) {
    const idx = storyboard.findIndex(i => i.id == id);
    storyboard[idx].memo = val;
    saveToCloud();
}

function createNewEvent() {
    const id = Date.now();
    storyboard.push({ id: id, title: "새로운 사건", x: 50, y: 160, memo: "" });
    renderEvents();
}

function saveToCloud() {
    db.ref('projects/' + currentProject + '/data').set(storyboard);
}

window.onload = init;
