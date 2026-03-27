const config = { 
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", 
    authDomain: "true-s.firebaseapp.com", 
    databaseURL: "https://true-s-default-rtdb.firebaseio.com", 
    projectId: "true-s" 
};
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], currentProject = localStorage.getItem('lastProject') || "이그리예가"; 

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
                const id = event.target.getAttribute('data-id');
                const idx = storyboard.findIndex(i => i.id == id);
                storyboard[idx].x = parseFloat(event.target.style.left);
                storyboard[idx].y = parseFloat(event.target.style.top);
                saveToCloud();
            }
        }
    });
}

function drawCurves() {
    const svg = document.getElementById('connection-svg');
    if(!svg) return; svg.innerHTML = '';
    // Y축(시간순)으로 정렬하여 곡선 연결
    const cards = Array.from(document.querySelectorAll('.event-card'))
                       .sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top));

    for(let i=0; i<cards.length - 1; i++) {
        const x1 = parseFloat(cards[i].style.left) + 75;
        const y1 = parseFloat(cards[i].style.top) + 40;
        const x2 = parseFloat(cards[i+1].style.left) + 75;
        const y2 = parseFloat(cards[i+1].style.top);

        const path = `M ${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}`;
        const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        newPath.setAttribute("d", path); newPath.setAttribute("class", "curve-line");
        svg.appendChild(newPath);
    }
}

function openMemo(id, e) {
    const ev = storyboard.find(i => i.id == id);
    const layer = document.getElementById('memo-layer');
    layer.style.pointerEvents = "auto";
    layer.innerHTML = `
        <div class="floating-index" style="left: ${ev.x + 160}px; top: ${ev.y}px;">
            <div class="index-label">생각의 가지</div>
            <div class="index-content">
                <textarea onchange="updateMemo('${id}', this.value)">${ev.memo || ''}</textarea>
            </div>
        </div>
    `;
    layer.onclick = (el) => { if(el.target === layer) { layer.innerHTML = ''; layer.style.pointerEvents = "none"; } };
}

function updateMemo(id, val) {
    const idx = storyboard.findIndex(i => i.id == id);
    storyboard[idx].memo = val;
    saveToCloud();
}

function createNewEvent() {
    const id = Date.now();
    storyboard.push({ id: id, title: "새로운 사건", x: 200, y: window.scrollY + 150, memo: "" });
    renderEvents();
}

function saveToCloud() {
    db.ref('projects/' + currentProject + '/data').set(storyboard);
}

window.onload = init;
