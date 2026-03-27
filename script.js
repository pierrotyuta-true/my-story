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
    setupMonthSelect();
}

function renderEvents() {
    const container = document.getElementById('event-container');
    const svg = document.getElementById('connection-svg');
    container.innerHTML = ''; svg.innerHTML = '';
    
    // [정렬] 연도 내림차순 -> 월 내림차순
    storyboard.sort((a, b) => b.year.localeCompare(a.year) || b.month - a.month);

    const centerX = window.innerWidth / 2;

    storyboard.forEach((ev) => {
        const card = document.createElement('div');
        const isLeft = ev.x + 70 < centerX;
        card.className = `event-card ${isLeft ? 'left-side' : 'right-side'}`;
        card.id = `ev-${ev.id}`;
        card.style.left = ev.x + 'px'; card.style.top = ev.y + 'px';
        
        // 인덱스 (타임라인 박스 옆 작은 바)
        let idxHtml = '<div class="branch-indices">';
        (ev.branches || []).forEach((_, i) => idxHtml += `<div class="idx-dot b-${i}"></div>`);
        idxHtml += '</div>';

        card.innerHTML = `${idxHtml}<div class="card-date">${ev.year} ${ev.month}월</div><h4>${ev.title}</h4>`;
        card.onclick = () => { if(!card.classList.contains('dragging')) openSheet(ev.id); };
        container.appendChild(card);

        // 중앙선 점선 & 노드 생성
        createTimelineUI(ev, centerX, svg);
    });
    setupDraggable();
}

function createTimelineUI(ev, centerX, svg) {
    const y = ev.y + 35; // 박스 높이 고려
    // 노드 추가
    const node = document.createElement('div');
    node.className = 'time-node';
    node.style.top = y + 'px';
    document.getElementById('canvas').appendChild(node);

    // 점선 추가 (중앙선과 동일 색상)
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const endX = ev.x + 70 < centerX ? ev.x + 145 : ev.x;
    line.setAttribute("x1", centerX); line.setAttribute("y1", y);
    line.setAttribute("x2", endX); line.setAttribute("y2", y);
    line.setAttribute("style", "stroke:#dee2e6; stroke-width:1.5; stroke-dasharray:4;");
    svg.appendChild(line);
}

function setupDraggable() {
    interact('.event-card').draggable({
        hold: 400, // 모바일 롱프레스
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
                
                // 스냅 로직
                const finalX = (parseFloat(t.style.left) + 72 < centerX) ? (centerX - 145 - 45) : (centerX + 45);
                storyboard[idx].x = finalX;
                storyboard[idx].y = parseFloat(t.style.top);
                saveToCloud();
                setTimeout(() => t.classList.remove('dragging'), 150);
            }
        }
    });
}

function createNewEvent() {
    const id = Date.now();
    // 마지막 사건보다 120px 아래에 생성 (겹침 방지)
    const lastY = storyboard.length > 0 ? Math.max(...storyboard.map(e => e.y)) + 120 : 100;
    storyboard.push({ 
        id: id, title: "내용 입력", year: years[0], month: 1, 
        x: window.innerWidth / 2 + 45, y: lastY, memo: "", branches: [] 
    });
    saveToCloud();
}

// 시트 열기 (상세보기 하얀 탭 우선)
function openSheet(id) {
    currentEditId = id;
    const ev = storyboard.find(i => i.id == id);
    toggleEditMode(false);
    
    document.getElementById('view-date').innerText = `${ev.year} ${ev.month}월`;
    document.getElementById('view-title').innerText = ev.title || "내용 없음";
    document.getElementById('view-memo').innerText = ev.memo || "상세 메모가 없습니다.";
    
    const bView = document.getElementById('view-branches');
    bView.innerHTML = '';
    (ev.branches || []).forEach((b, i) => {
        bView.innerHTML += `<div class="branch-chip b-${i}">${b}</div>`;
    });

    const layer = document.getElementById('bottom-sheet-layer');
    layer.style.display = 'flex';
    setTimeout(() => document.getElementById('bottom-sheet').style.transform = 'translateY(0)', 10);
}

function addBranch() {
    const ev = storyboard.find(i => i.id == currentEditId);
    if(!ev.branches) ev.branches = [];
    if(ev.branches.length >= 4) return alert("가지는 4개까지만 가능해요!");
    
    const bName = prompt(`${ev.branches.length + 1}단계 가지 내용을 입력하세요:`);
    if(bName) {
        ev.branches.push(bName);
        saveToCloud();
        openSheet(currentEditId);
    }
}

function toggleEditMode(isEdit) {
    document.getElementById('view-mode').classList.toggle('hidden', isEdit);
    document.getElementById('edit-mode').classList.toggle('hidden', !isEdit);
    if(isEdit) {
        const ev = storyboard.find(i => i.id == currentEditId);
        document.getElementById('edit-year-sel').value = ev.year;
        document.getElementById('edit-month').value = ev.month;
        document.getElementById('edit-title').value = ev.title;
        document.getElementById('edit-memo').value = ev.memo;
    }
}

function addNewYear() {
    const newY = prompt("추가할 연대를 입력하세요 (예: 제국력 591년):");
    if(newY && !years.includes(newY)) { years.push(newY); updateYearSelect(); }
}

function updateYearSelect() {
    const sel = document.getElementById('edit-year-sel');
    sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
}

function setupMonthSelect() {
    const sel = document.getElementById('edit-month');
    let h = ''; for(let i=1; i<=12; i++) h += `<option value="${i}">${i}월</option>`;
    sel.innerHTML = h;
}

function closeSheet(e) {
    if(e && e.target !== document.getElementById('bottom-sheet-layer') && e.target.className !== 'btn-close-sheet') return;
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
