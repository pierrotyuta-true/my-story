const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], years = ["제국력 589년", "제국력 590년"];
let currentProject = localStorage.getItem('lastProject') || "이그리예가";
let currentEditId = null;

function init() {
    db.ref('projects/' + currentProject + '/data').on('value', s => {
        storyboard = s.val() || [];
        renderEvents();
    });
    updateYearSelect();
}

function renderEvents() {
    const container = document.getElementById('event-container');
    const svg = document.getElementById('connection-svg');
    container.innerHTML = ''; svg.innerHTML = '';
    
    // 내림차순 정렬 (연도 역순, 월 역순)
    storyboard.sort((a, b) => b.year.localeCompare(a.year) || b.month - a.month);

    const centerX = window.innerWidth / 2;

    storyboard.forEach((ev, idx) => {
        const card = document.createElement('div');
        const isLeft = ev.x + 70 < centerX;
        card.className = `event-card ${isLeft ? 'left-side' : 'right-side'}`;
        card.id = `ev-${ev.id}`;
        card.style.left = ev.x + 'px'; card.style.top = ev.y + 'px';
        
        // 인덱스 생성
        let indexHtml = '<div class="branch-indices">';
        (ev.branches || []).forEach((b, i) => { indexHtml += `<div class="idx-dot b-${i}"></div>`; });
        indexHtml += '</div>';

        card.innerHTML = `${indexHtml}<div class="card-date">${ev.year} ${ev.month}월</div><h4>${ev.title}</h4>`;
        card.onclick = () => { if(!card.classList.contains('dragging')) openSheet(ev.id); };
        container.appendChild(card);

        // 노드 및 점선
        createNodeLine(ev, centerX, svg);
    });
    setupDraggable();
}

function createNodeLine(ev, centerX, svg) {
    const y = ev.y + 30;
    const node = document.createElement('div');
    node.className = 'time-node';
    node.style.top = y + 'px';
    document.getElementById('canvas').appendChild(node);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const endX = ev.x + 70 < centerX ? ev.x + 140 : ev.x;
    line.setAttribute("x1", centerX); line.setAttribute("y1", y);
    line.setAttribute("x2", endX); line.setAttribute("y2", y);
    line.setAttribute("style", "stroke:#dee2e6; stroke-width:1.5; stroke-dasharray:4;");
    svg.appendChild(line);
}

function setupDraggable() {
    interact('.event-card').draggable({
        hold: 300,
        listeners: {
            start(e) { e.target.classList.add('dragging'); },
            move(e) {
                const t = e.target;
                const x = (parseFloat(t.style.left) || 0) + e.dx;
                const y = (parseFloat(t.style.top) || 0) + e.dy;
                t.style.left = x + 'px'; t.style.top = y + 'px';
            },
            end(e) {
                const t = e.target;
                const id = t.id.replace('ev-', '');
                const idx = storyboard.findIndex(i => i.id == id);
                const centerX = window.innerWidth / 2;
                
                storyboard[idx].x = (parseFloat(t.style.left) + 70 < centerX) ? (centerX - 140 - 45) : (centerX + 45);
                storyboard[idx].y = Math.round(parseFloat(t.style.top) / 20) * 20;
                saveToCloud();
                setTimeout(() => t.classList.remove('dragging'), 100);
            }
        }
    });
}

// 시트 기능
function openSheet(id) {
    currentEditId = id;
    const ev = storyboard.find(i => i.id == id);
    toggleEditMode(false);
    
    document.getElementById('view-date').innerText = `${ev.year} ${ev.month}월`;
    document.getElementById('view-title').innerText = ev.title;
    document.getElementById('view-memo').innerText = ev.memo || "내용이 없습니다.";
    
    const bView = document.getElementById('view-branches');
    bView.innerHTML = '';
    (ev.branches || []).forEach((b, i) => {
        bView.innerHTML += `<div class="branch-chip b-${i}">${b}</div>`;
    });

    document.getElementById('bottom-sheet-layer').style.display = 'flex';
    setTimeout(() => document.getElementById('bottom-sheet').style.transform = 'translateY(0)', 10);
}

function toggleEditMode(isEdit) {
    const ev = storyboard.find(i => i.id == currentEditId);
    document.getElementById('view-mode').classList.toggle('hidden', isEdit);
    document.getElementById('edit-mode').classList.toggle('hidden', !isEdit);
    if(isEdit) {
        document.getElementById('edit-year-sel').value = ev.year;
        document.getElementById('edit-month').value = ev.month;
        document.getElementById('edit-title').value = ev.title;
        document.getElementById('edit-memo').value = ev.memo;
    }
}

function addBranch() {
    const ev = storyboard.find(i => i.id == currentEditId);
    if(!ev.branches) ev.branches = [];
    if(ev.branches.length >= 4) return alert("가지는 최대 4차까지만 가능합니다.");
    const bName = prompt("새로운 가지 내용을 입력하세요:");
    if(bName) {
        ev.branches.push(bName);
        saveToCloud();
        openSheet(currentEditId);
    }
}

function createNewEvent() {
    const id = Date.now();
    const lastY = storyboard.length > 0 ? Math.max(...storyboard.map(e => e.y)) + 100 : 100;
    storyboard.push({ 
        id: id, title: "새 사건", year: years[0], month: 1, 
        x: window.innerWidth / 2 + 45, y: lastY, memo: "", branches: [] 
    });
    saveToCloud();
}

function addNewYear() {
    const newY = prompt("새로운 연대를 입력하세요 (예: 제국력 591년):");
    if(newY) { years.push(newY); updateYearSelect(); }
}

function updateYearSelect() {
    const sel = document.getElementById('edit-year-sel');
    sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
}

function closeSheet(e) {
    if(e && e.target !== document.getElementById('bottom-sheet-layer')) return;
    document.getElementById('bottom-sheet').style.transform = 'translateY(100%)';
    setTimeout(() => document.getElementById('bottom-sheet-layer').style.display = 'none', 300);
}

function updateEvent() {
    const idx = storyboard.findIndex(i => i.id == currentEditId);
    storyboard[idx].year = document.getElementById('edit-year-sel').value;
    storyboard[idx].month = parseInt(document.getElementById('edit-month').value);
    storyboard[idx].title = document.getElementById('edit-title').value;
    storyboard[idx].memo = document.getElementById('edit-memo').value;
    saveToCloud();
    closeSheet();
}

function saveToCloud() { db.ref('projects/' + currentProject + '/data').set(storyboard); }
window.onload = init;
