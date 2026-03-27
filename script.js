//Firebase 설정 (기존 설정 유지)
const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], eras = ["공통"], currentProject = localStorage.getItem('lastProject') || "이그리예가"; 

function init() {
    document.getElementById('currentProjectTitle').innerText = currentProject;
    db.ref('projects/' + currentProject).on('value', s => {
        const d = s.val() || {};
        storyboard = d.data || [];
        eras = d.eras || ["공통"];
        renderTimeline();
    });
}

// [복구] 지그재그 타임라인 렌더링 (중앙 30px 띄움)
function renderTimeline() {
    const list = document.getElementById('event-list');
    list.innerHTML = `<div class="era-badge">${eras[0] || "제국력"}</div>`;
    list.innerHTML += storyboard.map((ev, i) => `
        <div class="event-row ${i % 2 === 0 ? 'left' : 'right'}" id="ev-${ev.id}">
            <div class="node"></div>
            <div class="event-card">
                <span class="month">${ev.year || '2026'}년 ${ev.month || '3'}월</span>
                <h4>${ev.title}</h4>
            </div>
        </div>
    `).join('') || '<p style="text-align:center; padding:50px; color:#999;">새로운 사건을 추가해보세요!</p>';
    
    if(typeof interact !== 'undefined') setupDraggable();
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
            },
            end(event) {
                // 드래그 종료 시 Y축 위치에 따라 연월 자동 수정 (v2.1 로직)
                const y = parseFloat(event.target.getAttribute('data-y'));
                const month = Math.floor(y / 150) + 1; // 예: 150px 당 1달
                const idx = storyboard.findIndex(i => i.id == event.target.closest('.event-row').id.split('-')[1]);
                if(idx !== -1) { storyboard[idx].month = month; saveToCloud(); }
            }
        }
    });
}

// [통합] 뷰 전환 및 UI 초기화
function switchTab(view) {
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.v-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('tab-' + view).classList.add('active');
    // ... 캐릭터 뷰, 스토리 뷰 초기화 로직...
}

// [스토리] 하이라이트 & 문서 분리 기능 (유타님 요청)
function showHighlightMenu() {
    const sel = window.getSelection();
    const menu = document.getElementById('highlight-popup');
    if(!sel.isCollapsed && sel.toString().length > 0) {
        // 드래그 영역 위치 계산
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        menu.style.display = 'flex';
        menu.style.top = (rect.top - 50) + 'px'; menu.style.left = rect.left + 'px';
    } else { menu.style.display = 'none'; }
}

function applyHighlight(color) { /* 형광펜 CSS 적용 로직 */ document.getElementById('highlight-popup').style.display = 'none'; }
function splitDocument() { /* 단락 문서 분리 로직 */ }

// ... 기타 기능 함수들 ...
function toggleProjMenu() { document.getElementById('projMenuPopup').classList.toggle('hidden'); }
window.onload = init;
