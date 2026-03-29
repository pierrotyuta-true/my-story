// 💡 Firebase 설정 (Yuta님의 기존 키 값을 그대로 적용)
const firebaseConfig = {
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc",
    databaseURL: "https://true-s-default-rtdb.firebaseio.com",
    projectId: "true-s"
};

// Firebase 초기화 (중복 방지)
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 앱 통합 상태 관리 (데이터 구조 싹 정비)
let state = {
    curProject: '이그리에가', // 현재 선택된 프로젝트 이름
    projects: ['이그리에가'], // 프로젝트 목록
    eras: ['제국력'], // 연대 목록
    storyboard: [], // 타임라인 기록
    characters: [], // 캐릭터 도감
    story: "", // 스토리 트리트먼트
};

// 전역 변수
let curView = 'timeline';
let editEventId = null;
let detailMemoId = null;
let editCharId = null;

/* ============================
   1. 코어 기능 및 초기화
============================ */

// 초기 데이터 로딩 및 동기화
window.onload = () => {
    loadMeta(); // 마지막 프로젝트 로드
};

function loadMeta() {
    // 마지막 작업하던 프로젝트 이름을 가져옴
    db.ref('users/Yuta/meta').once('value', snapshot => {
        const meta = snapshot.val();
        if (meta && meta.lastProject) {
            state.curProject = meta.lastProject;
        }
        syncData(); // 해당 프로젝트 데이터 로드
    });
}

function syncData() {
    document.getElementById('project-name').innerText = "연결 중...";
    // 현재 프로젝트 데이터 감시 (on('value', ...))
    db.ref('users/Yuta/projects/' + state.curProject).on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
            // 데이터가 있으면 상태 업데이트
            state = {
                curProject: state.curProject,
                eras: data.eras || ['제국력'],
                storyboard: data.storyboard ? Object.values(data.storyboard) : [],
                characters: data.characters ? Object.values(data.characters) : [],
                story: data.story || "",
            };
            // 탭에 맞게 화면 렌더링
            renderByActiveTab();
            document.getElementById('project-name').innerText = state.curProject;
        } else {
            // 프로젝트 데이터가 아예 없을 때 (초기화)
            state = { curProject: state.curProject, eras: ['제국력'], storyboard: [], characters: [], story: "" };
            renderByActiveTab();
            document.getElementById('project-name').innerText = state.curProject;
        }
    });
    // 프로젝트 목록만 따로 로드 (on('value', ...))
    db.ref('users/Yuta/projects').on('value', snapshot => {
        const projs = snapshot.val();
        if(projs) state.projects = Object.keys(projs);
    });
}

// 자동 저장 함수 (주요 데이터 변경 시)
function autoSave() { db.ref('users/Yuta/projects/' + state.curProject).update({ storyboard: state.storyboard.reduce((a,v) => ({...a, [v.id]: v}), {}), eras: state.eras, story: state.story }); }

// 수동 저장 함수
function saveToCloudManual() { db.ref('users/Yuta/projects/' + state.curProject).set(state).then(()=>alert("클라우드 저장 완료!")); }

// 탭 전환
function showTab(viewName) {
    curView = viewName;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.getElementById(viewName + '-view').classList.add('active');
    // 이벤트로 active 클래스 추가
    const targetTabIndex = {'timeline': 0, 'story': 1, 'char': 2}[viewName];
    document.querySelectorAll('.tab-item')[targetTabIndex].classList.add('active');
    renderByActiveTab();
}

// 활성화된 탭에 맞춰 그리기
function renderByActiveTab() {
    if (curView === 'timeline') renderTimeline();
    if (curView === 'story') loadStory();
    if (curView === 'char') renderChars();
}

/* ============================
   2. 프로젝트 관리
============================ */
function openProjManager() {
    document.getElementById('cur-proj-name-in').value = state.curProject;
    openModal('projModal');
}

// 프로젝트 이름 변경
function updateProjName() {
    const newName = document.getElementById('cur-proj-name-in').value;
    if(!newName || newName === state.curProject) return alert("새 이름을 입력하세요.");
    // 1. 기존 데이터 복사
    db.ref('users/Yuta/projects/' + state.curProject).once('value', s => {
        const data = s.val();
        // 2. 새 경로에 저장
        db.ref('users/Yuta/projects/' + newName).set(data);
        // 3. 기존 경로 삭제
        db.ref('users/Yuta/projects/' + state.curProject).remove();
        // 4. 메타 데이터 업데이트
        state.curProject = newName;
        db.ref('users/Yuta/meta').update({ lastProject: newName });
        syncData(); closeModal('projModal');
    });
}

// 새 프로젝트 추가
function createNewProj() {
    const newName = document.getElementById('new-proj-name-in').value;
    if(!newName || state.projects.includes(newName)) return alert("고유한 이름을 입력하세요.");
    // 초기 데이터로 생성
    const initData = { curProject: newName, eras: ['제국력'], story: "" };
    db.ref('users/Yuta/projects/' + newName).set(initData);
    // 메타 업데이트
    state.curProject = newName;
    db.ref('users/Yuta/meta').update({ lastProject: newName });
    document.getElementById('new-proj-name-in').value = "";
    syncData(); closeModal('projModal');
}

// 프로젝트 삭제
function deleteCurrentProj() {
    if(!confirm(`'${state.curProject}' 프로젝트를 영구 삭제하시겠습니까?`)) return;
    db.ref('users/Yuta/projects/' + state.curProject).remove();
    // 첫 번째 프로젝트로 복귀
    db.ref('users/Yuta/meta').update({ lastProject: '기본' });
    location.reload();
}

/* ============================
   3. 타임라인 & 기록 관리
============================ */

// 타임라인 그리기 (수평 지그재그 적용)
function renderTimeline() {
    const list = document.getElementById('tl-list');
    list.innerHTML = '<div class="center-line"></div>'; // 초기화

    // 데이터가 없을 때 메시지
    if (state.storyboard.length === 0) {
        list.innerHTML += '<p style="text-align:center; padding:100px 0; color:#adb5bd; font-size:13px;">데이터가 없습니다.<br>+ 버튼으로 추가하세요!</p>';
        return;
    }

    // 데이터 정렬
    const sorted = [...state.storyboard].sort((a,b) => a.year - b.year || a.month - b.month);
    let lastYearLabel = null;

    sorted.forEach((item, index) => {
        const isLeft = index % 2 === 0; // 지그재그 배치
        const row = document.createElement('div');
        row.className = `event-row ${isLeft ? 'left' : 'right'}`;

        // 연도가 바뀔 때만 연대 배지 표시
        const curYearLabel = `${item.era} ${item.year}년`;
        let yearHtml = '';
        if (curYearLabel !== lastYearLabel) {
            yearHtml = `<div class="node-year-label">${curYearLabel}</div>`;
            lastYearLabel = curYearLabel;
        }

        row.innerHTML = `
            ${yearHtml}
            <div class="node-point" style="top:50%"></div>
            <div class="h-line"></div>
            <div class="card-side">
                <div class="card" style="border-left-color:${['#d0ebff','#b2f2bb','#ffec99','#ffccf9'][index % 4]}" onclick="openMemoDetail(${item.id})">
                    <div class="card-meta">No.${index+1} <span>${item.month}월</span></div>
                    <div class="card-text">${item.text}</div>
                </div>
            </div>
        `;
        list.appendChild(row);
    });
}

// 사건 기록 모달 열기
function openEventModal() {
    editEventId = null; // 신규 등록 모드
    document.getElementById('e-text').value = ""; document.getElementById('e-year').value = ""; document.getElementById('e-month').value = "";
    document.getElementById('eventModal').querySelector('h3').innerText = "기록 추가";
    populateEraSelect();
    openModal('eventModal');
}

// 메모 상세보기 열기
function openMemoDetail(id) {
    detailMemoId = id;
    const memo = state.storyboard.find(m => m.id === id);
    if (!memo) return;
    document.getElementById('memo-detail-text').innerText = memo.text;
    openModal('memoDetailModal');
}

// 상세보기에서 편집으로 전환 ( image_20.png 버튼 크기 축소 반영)
function openEditFromDetail() {
    const id = detailMemoId;
    closeModal('memoDetailModal');
    const memo = state.storyboard.find(m => m.id === id);
    if (!memo) return;
    editEventId = id; // 편집 모드
    document.getElementById('e-text').value = memo.text;
    document.getElementById('e-year').value = memo.year;
    document.getElementById('e-month').value = memo.month;
    document.getElementById('eventModal').querySelector('h3').innerText = "기록 편집";
    populateEraSelect(memo.era);
    openModal('eventModal');
}

// 기록 저장 (신규 또는 수정)
function saveEvent() {
    const text = document.getElementById('e-text').value; if(!text) return;
    const era = document.getElementById('e-era').value;
    const year = parseInt(document.getElementById('e-year').value) || 0;
    const month = parseInt(document.getElementById('e-month').value) || 1;

    const dataRef = db.ref('users/Yuta/projects/' + state.curProject + '/storyboard');
    const eventData = { id: editEventId || Date.now(), era, year, month, text };

    if (editEventId) { // 수정
        dataRef.child(editEventId).set(eventData);
    } else { // 신규
        dataRef.child(eventData.id).set(eventData);
    }
    closeModal('eventModal'); // 모달 닫으면 싱크는 자동으로 실행됨
}

// 상세보기에서 기록 삭제
function deleteEventFromDetail() {
    if(!confirm("이 기록을 정말 삭제하시겠습니까?")) return;
    db.ref('users/Yuta/projects/' + state.curProject + '/storyboard').child(detailMemoId).remove();
    closeModal('memoDetailModal');
}

/* ============================
   4. 연대(Era) 관리 통합
============================ */
function populateEraSelect(selectedEra = null) {
    const select = document.getElementById('e-era');
    select.innerHTML = state.eras.map(e => `<option ${e === selectedEra ? 'selected' : ''}>${e}</option>`).join('');
}

function openEraEditor() { populateEraManager(); openModal('eraModal'); }

function populateEraManager() {
    const list = document.getElementById('era-manager-list');
    list.innerHTML = state.eras.map((e, i) => `
        <div class="reorder-item">
            <input type="text" value="${e}" id="era-name-${i}" onchange="updateEraName(${i}, this.value)">
            <button class="btn-sub danger small" onclick="deleteEra(${i})">삭제</button>
        </div>
    `).join('');
}

function addNewEra() {
    const name = document.getElementById('new-era-in').value; if(!name || state.eras.includes(name)) return;
    state.eras.push(name); db.ref('users/Yuta/projects/' + state.curProject).update({ eras: state.eras });
    document.getElementById('new-era-in').value = ""; populateEraManager(); populateEraSelect();
}
function updateEraName(index, newName) { state.eras[index] = newName; db.ref('users/Yuta/projects/' + state.curProject).update({ eras: state.eras }); populateEraSelect(); }
function deleteEra(index) { if(state.eras.length<=1) return alert("최소 한 개의 연대가 필요합니다."); state.eras.splice(index, 1); db.ref('users/Yuta/projects/' + state.curProject).update({ eras: state.eras }); populateEraManager(); populateEraSelect(); }


/* ============================
   5. 캐릭터 도감 관리
============================ */
function renderChars() {
    const list = document.getElementById('char-list');
    list.innerHTML = (state.characters || []).map(c => `
        <div class="char-item" onclick="openEditChar(${c.id})">
            <div class="char-icon">👤</div>
            <div class="char-name">${c.name}</div>
        </div>
    `).join('');
}

function openCharModal() {
    editCharId = null;
    document.getElementById('c-name').value = ""; document.getElementById('c-age').value = ""; document.getElementById('c-gender').value = "";
    document.getElementById('c-feature').value = ""; document.getElementById('c-memo').value = ""; document.getElementById('c-group').value = "";
    document.getElementById('char-del-btn').style.display = 'none';
    openModal('charModal');
}

function openEditChar(id) {
    const c = state.characters.find(x => x.id === id);
    if(!c) return;
    editCharId = id;
    document.getElementById('c-name').value = c.name; document.getElementById('c-age').value = c.age; document.getElementById('c-gender').value = c.gender;
    document.getElementById('c-feature').value = c.feature; document.getElementById('c-memo').value = c.memo; document.getElementById('c-group').value = c.group;
    document.getElementById('char-del-btn').style.display = 'inline-block';
    openModal('charModal');
}

function saveChar() {
    const name = document.getElementById('c-name').value; if(!name) return;
    const charData = {
        id: editCharId || Date.now(),
        name,
        age: document.getElementById('c-age').value,
        gender: document.getElementById('c-gender').value,
        feature: document.getElementById('c-feature').value,
        memo: document.getElementById('c-memo').value,
        group: document.getElementById('c-group').value,
    };
    db.ref('users/Yuta/projects/' + state.curProject + '/characters').child(charData.id).set(charData);
    closeModal('charModal');
}

function deleteChar() {
    if(!confirm("캐릭터를 삭제하시겠습니까?")) return;
    db.ref('users/Yuta/projects/' + state.curProject + '/characters').child(editCharId).remove();
    closeModal('charModal');
}

/* ============================
   6. 스토리 에디터
============================ */
function loadStory() {
    document.getElementById('story-editor').innerText = state.story;
}

function saveStory() {
    state.story = document.getElementById('story-editor').innerText;
    autoSave();
    alert("스토리 저장 완료!");
}

/* ============================
   7. 하단 플로팅 버튼 & 유틸리티
============================ */
// 하단 + 버튼 동작 통합
function handleMainAdd() {
    if (curView === 'timeline') openEventModal();
    if (curView === 'story') alert('스토리 내용은 종이 질감 영역에 직접 작성하세요.');
    if (curView === 'char') openCharModal();
}

// 모달 제어
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
