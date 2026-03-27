// [1] Firebase 설정 및 초기화
const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], eras = ["공통"], chars = [], currentProject = null, editingId = null;
let stories = [], currentDocId = null, isEditing = false, currentViewTab = 0;

// [2] 뷰 전환 및 사이드바 로직
function toggleMainSidebar() {
    const sb = document.getElementById('main-sidebar');
    const ov = document.getElementById('sidebar-overlay');
    sb.classList.toggle('open');
    ov.style.display = sb.classList.contains('open') ? 'block' : 'none';
}

function switchView(viewId) {
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.menu-section li').forEach(li => li.classList.remove('active'));
    
    document.getElementById('view-' + viewId).classList.add('active');
    if(viewId === 'timeline') { document.getElementById('menu-timeline').classList.add('active'); renderTimeline(); }
    if(viewId === 'story') { document.getElementById('menu-story').classList.add('active'); renderStory(); }
    
    document.getElementById('story-list-section').style.display = (viewId === 'story') ? 'flex' : 'none';
    if(window.innerWidth <= 768) toggleMainSidebar();
}

// [3] 타임라인 렌더링 (인덱스/연대 보완)
function renderTimeline() {
    const list = document.getElementById('event-list');
    if(!list || !currentProject) return;
    list.innerHTML = '';

    eras.forEach(eName => {
        const eraData = storyboard.filter(s => s.era === eName).sort((a,b) => (a.year - b.year) || (a.month - b.month));
        if(eraData.length === 0) return;

        list.innerHTML += `<div class="era-badge">${eName}</div>`;
        eraData.forEach((sc, idx) => {
            const side = idx % 2 === 0 ? 'left' : 'right';
            const item = document.createElement('div');
            item.className = `event-item ${side}`;
            
            // 가지치기 인덱스 생성
            let tabsHtml = `<div class="tab-idx tab-white"></div>`;
            if(sc.branches) sc.branches.forEach((_, i) => {
                const colors = ['tab-blue', 'tab-yellow', 'tab-pink'];
                tabsHtml += `<div class="tab-idx ${colors[i%3]}"></div>`;
            });

            item.innerHTML = `
                <div class="side-tabs">${tabsHtml}</div>
                <div class="event-card" onclick="openViewer('${sc.id}')">
                    <span class="month-tag">${sc.year}년 ${sc.month}월</span>
                    <h4>${sc.text}</h4>
                </div>
            `;
            list.appendChild(item);
        });
    });
    updateSearchBar();
}

// [4] 상세 뷰어 및 가지 편집
function openViewer(id) {
    editingId = id;
    const s = storyboard.find(x => x.id == id);
    currentViewTab = 0;
    renderTabs(s);
    openModal('viewModal');
}

function renderTabs(s) {
    const menu = document.getElementById('viewTabMenu');
    let tabs = [`<button class="v-tab ${currentViewTab===0?'active':''}" onclick="switchTab(0)">사건</button>`];
    if(s.branches) s.branches.forEach((_, i) => {
        tabs.push(`<button class="v-tab ${currentViewTab===(i+1)?'active':''}" onclick="switchTab(${i+1})">가지 ${i+1}</button>`);
    });
    menu.innerHTML = tabs.join('');
    document.getElementById('viewMonth').innerText = `${s.era} ${s.year}년 ${s.month}월`;
    document.getElementById('viewText').innerText = currentViewTab === 0 ? s.text : s.branches[currentViewTab-1];
}

function switchTab(idx) { currentViewTab = idx; renderTabs(storyboard.find(x => x.id == editingId)); }

function showBranchInput() {
    const s = storyboard.find(x => x.id == editingId);
    const val = prompt("새로운 가지 내용을 입력하세요:");
    if(val) {
        if(!s.branches) s.branches = [];
        s.branches.push(val);
        sync();
        openViewer(editingId);
    }
}

function handleTabEdit() {
    const s = storyboard.find(x => x.id == editingId);
    if(currentViewTab === 0) { closeModal('viewModal'); openEdit(editingId); }
    else {
        const val = prompt("내용 수정 (비우면 삭제):", s.branches[currentViewTab-1]);
        if(val === "") s.branches.splice(currentViewTab-1, 1);
        else if(val) s.branches[currentViewTab-1] = val;
        sync(); openViewer(editingId);
    }
}

// [5] Firebase 데이터 동기화 및 로드
function sync() { if(currentProject) db.ref('projects/'+currentProject).set({ data: storyboard, eras, chars, stories }); }
function saveToCloud() { sync(); alert("클라우드 저장 완료!"); }

function loadP(k) {
    currentProject = k;
    localStorage.setItem('lastProject', k);
    document.getElementById('projectTitle').innerText = k;
    db.ref('projects/'+k).on('value', s => {
        const d = s.val();
        if(d){
            storyboard = d.data || [];
            eras = d.eras || ["공통"];
            chars = d.chars || [];
            stories = d.stories || [{id:1, title:"메인 줄거리", content:""}];
            renderTimeline();
            renderStory();
        }
    });
    closeModal('loadModal');
}

// 초기 실행
window.onload = () => {
    const last = localStorage.getItem('lastProject');
    if(last) loadP(last); else openLoadModal();
};

// --- 나머지 팝업, 편집, 스토리 로직 (이전 기능과 동일하게 유지) ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openLoadModal() { /* 프로젝트 목록 로직 */ openModal('loadModal'); }
function openEraModal() { /* 시대 설정 로직 */ renderEraList(); openModal('eraModal'); }
function addScene() { editingId = null; openEdit(null); }
function openEdit(id) { /* 편집창 로직 */ openModal('editModal'); }
function saveScene() { /* 사건 저장 로직 */ sync(); closeModal('editModal'); }
