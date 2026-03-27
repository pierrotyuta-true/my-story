const config = { 
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", 
    authDomain: "true-s.firebaseapp.com", 
    databaseURL: "https://true-s-default-rtdb.firebaseio.com", 
    projectId: "true-s" 
};

// 안전한 초기화
try {
    if (!firebase.apps.length) firebase.initializeApp(config);
} catch(e) { console.error("Firebase 초기화 에러:", e); }

const db = firebase.database();
let storyboard = [];
let currentProject = localStorage.getItem('lastProject') || "기본작품";

function init() {
    console.log("앱 시작...");
    // Firebase 연결 시도
    db.ref('projects/' + currentProject).on('value', s => {
        const d = s.val() || {};
        storyboard = d.data || [];
        renderEvents();
    }, e => {
        console.error("데이터 로드 실패:", e);
        renderEvents(); // 실패해도 일단 그리기 시도
    });
}

function renderEvents() {
    const container = document.getElementById('event-container');
    const loadingMsg = document.getElementById('loading-msg');
    if(loadingMsg) loadingMsg.remove(); // 로딩 메시지 제거

    if(storyboard.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding-top:100px; color:#ccc;">사건이 없습니다. + 버튼을 눌러주세요.</p>';
    } else {
        container.innerHTML = storyboard.map(ev => `
            <div class="event-card ${ev.memo ? 'has-memo' : ''}" 
                 id="ev-${ev.id}" 
                 data-id="${ev.id}"
                 style="left: ${ev.x || 50}px; top: ${ev.y || 150}px;">
                <div class="card-tab"></div>
                <div onclick="openMemo('${ev.id}')">
                    <h4 style="margin:0; font-size:13px;">${ev.title || '새 사건'}</h4>
                </div>
            </div>
        `).join('');
    }
    
    // 드래그 기능 연결 (interact.js 로드 확인 후)
    if(typeof interact !== 'undefined') {
        setupDraggable();
    }
}

function setupDraggable() {
    interact('.event-card').draggable({
        listeners: {
            move(event) {
                const target = event.target;
                const x = (parseFloat(target.style.left) || 0) + event.dx;
                const y = (parseFloat(target.style.top) || 0) + event.dy;
                target.style.left = x + 'px';
                target.style.top = y + 'px';
            },
            end(event) {
                const id = event.target.getAttribute('data-id');
                const idx = storyboard.findIndex(i => i.id == id);
                if(idx !== -1) {
                    storyboard[idx].x = parseFloat(event.target.style.left);
                    storyboard[idx].y = parseFloat(event.target.style.top);
                    saveToCloud();
                }
            }
        }
    });
}

function openMemo(id) {
    const ev = storyboard.find(i => i.id == id);
    const layer = document.getElementById('memo-layer');
    layer.style.pointerEvents = "auto";
    layer.innerHTML = `
        <div class="floating-index" style="left: ${ev.x + 150}px; top: ${ev.y}px;">
            <div class="index-label">사건 메모</div>
            <div class="index-content">
                <textarea onchange="updateMemo('${id}', this.value)">${ev.memo || ''}</textarea>
            </div>
        </div>
    `;
    layer.onclick = (e) => { if(e.target === layer) { layer.innerHTML = ''; layer.style.pointerEvents = "none"; } };
}

function updateMemo(id, val) {
    const idx = storyboard.findIndex(i => i.id == id);
    if(idx !== -1) {
        storyboard[idx].memo = val;
        saveToCloud();
        renderEvents();
    }
}

function createNewEvent() {
    const id = Date.now();
    storyboard.push({ id: id, title: "새로운 사건", x: 50, y: 150, memo: "" });
    renderEvents();
}

function saveToCloud() {
    db.ref('projects/' + currentProject + '/data').set(storyboard);
}

window.onload = init;
