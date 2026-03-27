//Firebase 설정 (기존 설정 유지)
const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], currentProject = localStorage.getItem('lastProject') || "이그리예가"; // 실제 프로젝트명으로 변경 권장

function init() {
    db.ref('projects/' + currentProject).on('value', s => {
        const d = s.val() || {};
        storyboard = d.data || [];
        renderEvents();
    });
}

// [복구] 지그재그 곡선 타임라인 렌더링
function renderEvents() {
    const list = document.getElementById('event-list');
    list.innerHTML = `<div class="era-badge">제국력 589년</div>`; // 배지 추가
    
    list.innerHTML += storyboard.map((ev, i) => `
        <div class="event-row ${i % 2 === 0 ? 'left' : 'right'}" id="ev-${ev.id}">
            <div class="node"></div>
            <div class="event-card" onclick="openMemo('${ev.id}')">
                <span class="month">${ev.year || 589}년 ${ev.month || 3}월</span>
                <h4>${ev.title || '새 사건'}</h4>
            </div>
        </div>
    `).join('');
    
    // 드래그 기능 및 곡선 그리기
    if(typeof interact !== 'undefined') setupDraggable();
    drawCurves(); 
}

// [복구] Interact.js 드래그 및 자동 저장
function setupDraggable() {
    interact('.event-card').draggable({
        listeners: {
            move(event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x); target.setAttribute('data-y', y);
                drawCurves(); // 드래그 중 곡선 실시간 업데이트
            },
            end(event) {
                // Y축 위치에 따라 연월 자동 계산 (v2.1 로직 복구)
                const y = parseFloat(event.target.getAttribute('data-y'));
                const month = Math.floor(y / 150) + 1; // 예: 150px 당 1달
                const idx = storyboard.findIndex(i => i.id == event.target.closest('.event-row').id.split('-')[1]);
                if(idx !== -1) { storyboard[idx].month = month; saveToCloud(); }
            }
        }
    });
}

// [복구] 부드러운 곡선 라인 그리기
function drawCurves() {
    const svg = document.getElementById('connection-svg');
    if(!svg) return; svg.innerHTML = '';
    const rows = document.querySelectorAll('.event-row');
    for(let i=0; i<rows.length - 1; i++) {
        const startNode = rows[i].querySelector('.node').getBoundingClientRect();
        const endNode = rows[i+1].querySelector('.node').getBoundingClientRect();
        const path = `M ${startNode.left + 6} ${startNode.top + 6} C ${startNode.left + 6} ${(startNode.top + endNode.top)/2}, ${endNode.left + 6} ${(startNode.top + endNode.top)/2}, ${endNode.left + 6} ${endNode.top + 6}`;
        const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        newPath.setAttribute("d", path); newPath.setAttribute("class", "curve-line");
        svg.appendChild(newPath);
    }
}

// ... 메모 및 사건 추가 기능 동일 ...

window.onload = init;
