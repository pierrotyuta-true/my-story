const config = { 
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", 
    authDomain: "true-s.firebaseapp.com", 
    databaseURL: "https://true-s-default-rtdb.firebaseio.com", 
    projectId: "true-s" 
};
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], currentProject = localStorage.getItem('lastProject') || "이그리예가"; 
const SNAP_X = 140; // 좌우 스냅 간격
const SNAP_Y = 60;  // 상하 스냅 간격

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
    
    // 중앙 연도 배지 생성 (중앙선에 붙어서 흐름)
    const years = [...new Set(storyboard.map(ev => ev.year || 589))];
    years.forEach((y, i) => {
        const badge = document.createElement('div');
        badge.className = 'era-badge';
        badge.innerText = `제국력 ${y}년`;
        badge.style.top = (i * 400 + 100) + 'px';
        container.appendChild(badge);
    });

    storyboard.forEach(ev => {
        const card = document.createElement('div');
        card.className = `event-card ${ev.memo ? 'has-memo' : ''}`;
        card.id = `ev-${ev.id}`;
        card.style.left = (ev.x || (window.innerWidth/2 + 30)) + 'px';
        card.style.top = (ev.y || 150) + 'px';
        card.innerHTML = `<div class="card-tab"></div><div onclick="openMemo('${ev.id}')"><h4>${ev.title || '내용 입력'}</h4></div>`;
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
                t.style.left = x + 'px';
                t.style.top = y + 'px';
                drawCurves();
            },
            end(event) {
                const t = event.target;
                const id = t.id.replace('ev-', '');
                const idx = storyboard.findIndex(i => i.id == id);
                
                // [깔끔한 스냅 로직]
                const centerX = window.innerWidth / 2;
                const currentX = parseFloat(t.style.left);
                const currentY = parseFloat(t.style.top);
                
                // 좌우 스냅: 중앙선 기준 왼쪽 또는 오른쪽 고정
                const snappedX = currentX < centerX ? centerX - 160 : centerX + 30;
                // 상하 스냅: SNAP_Y 단위로 정렬
                const snappedY = Math.round(currentY / SNAP_Y) * SNAP_Y;

                t.style.left = snappedX + 'px';
                t.style.top = snappedY + 'px';

                storyboard[idx].x = snappedX;
                storyboard[idx].y = snappedY;
                saveToCloud();
                drawCurves();
            }
        }
    });
}

function drawCurves() {
    const svg = document.getElementById('connection-svg');
    if(!svg) return; svg.innerHTML = '';
    const centerX = window.innerWidth / 2;

    storyboard.forEach(ev => {
        const startX = centerX;
        const startY = (ev.y || 150) + 25;
        const endX = (ev.x < centerX) ? ev.x + 125 : ev.x;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "line");
        path.setAttribute("x1", startX); path.setAttribute("y1", startY);
        path.setAttribute("x2", endX); path.setAttribute("y2", startY);
        path.setAttribute("class", "curve-line");
        svg.appendChild(path);
    });
}

function openMemo(id) {
    const ev = storyboard.find(i => i.id == id);
    const layer = document.getElementById('memo-layer');
    layer.style.pointerEvents = "auto";
    layer.innerHTML = `<div class="floating-index" style="left: ${ev.x + 10}px; top: ${ev.y + 40}px;">
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
    const centerX = window.innerWidth / 2;
    storyboard.push({ id: id, title: "새로운 사건", x: centerX + 30, y: 180, memo: "" });
    renderEvents();
}

function changeProject(dir) {
    // 프로젝트 전환 로직 (간단 구현)
    alert("프로젝트 기능 준비 중입니다.");
}

function saveToCloud() {
    db.ref('projects/' + currentProject + '/data').set(storyboard);
}

window.onload = init;
