/* Firebase 설정 (기존 키 유지) */
const firebaseConfig = {
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc",
    databaseURL: "https://true-s-default-rtdb.firebaseio.com",
    projectId: "true-s"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let state = { curProject: '기본', eras: [], storyboard: [], story: "" };

// 데이터 로드 및 정렬 로직 (연대 순서 반영)
function syncData() {
    db.ref('users/Yuta/projects/' + state.curProject).on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
            state.eras = data.eras || ['제국력'];
            state.storyboard = data.storyboard ? Object.values(data.storyboard) : [];
            state.story = data.story || "";
            renderByActiveTab();
        }
    });
}

// 1. 타임라인 그리기 (연대 순서 + 연도 + 월 순 정렬)
function renderTimeline() {
    const list = document.getElementById('tl-list');
    list.innerHTML = '<div class="center-line"></div>';

    // 정렬 로직: 1. eras 배열 내의 인덱스 순서, 2. 연도, 3. 월
    const sorted = [...state.storyboard].sort((a, b) => {
        const eraA = state.eras.indexOf(a.era);
        const eraB = state.eras.indexOf(b.era);
        if (eraA !== eraB) return eraA - eraB;
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    });

    let lastEraYear = "";
    sorted.forEach((item, index) => {
        const isLeft = index % 2 === 0;
        const row = document.createElement('div');
        row.className = `event-row ${isLeft ? 'left' : 'right'}`;

        const currentEraYear = `${item.era} ${item.year}년`;
        let yearHtml = '';
        if (currentEraYear !== lastEraYear) {
            yearHtml = `<div class="node-year-label">${currentEraYear}</div>`;
            lastEraYear = currentEraYear;
        }

        row.innerHTML = `
            ${yearHtml}
            <div class="node-point"></div>
            <div class="h-line"></div>
            <div class="card-side">
                <div class="card" onclick="openMemoDetail(${item.id})">
                    <div class="card-index">INDEX ${String(index + 1).padStart(3, '0')}</div>
                    <div class="card-meta">${item.month}월</div>
                    <div class="card-text">${item.text}</div>
                </div>
            </div>
        `;
        list.appendChild(row);
    });
}

// 2. 연대 순서 바꾸기 (화살표 로직)
function populateEraManager() {
    const list = document.getElementById('era-manager-list');
    list.innerHTML = state.eras.map((e, i) => `
        <div class="reorder-item">
            <span style="font-weight:bold;">${e}</span>
            <div class="era-order-btns">
                <button class="btn-arrow" onclick="moveEra(${i}, -1)">▲</button>
                <button class="btn-arrow" onclick="moveEra(${i}, 1)">▼</button>
                <button class="btn-sub danger small" onclick="deleteEra(${i})">삭제</button>
            </div>
        </div>
    `).join('');
}

function moveEra(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= state.eras.length) return;
    
    const temp = state.eras[index];
    state.eras[index] = state.eras[newIndex];
    state.eras[newIndex] = temp;
    
    db.ref('users/Yuta/projects/' + state.curProject).update({ eras: state.eras });
    populateEraManager();
}

// 3. 상세보기 및 가지추가 버튼
function openMemoDetail(id) {
    detailMemoId = id;
    const memo = state.storyboard.find(m => m.id === id);
    if (!memo) return;
    document.getElementById('memo-detail-text').innerText = memo.text;
    
    // 상세보기 버튼 영역 (가지추가 포함)
    const btnWrap = document.querySelector('.detail-btn-wrap');
    btnWrap.innerHTML = `
        <button class="btn-detail primary" onclick="addBranch()">가지추가</button>
        <button class="btn-detail" onclick="openEditFromDetail()">편집</button>
        <button class="btn-detail danger" onclick="deleteEventFromDetail()">삭제</button>
    `;
    openModal('memoDetailModal');
}

function addBranch() {
    alert("현재 사건에서 파생된 새로운 사건을 기록합니다.");
    const baseMemo = state.storyboard.find(m => m.id === detailMemoId);
    closeModal('memoDetailModal');
    
    // 기존 정보 자동 입력 후 편집창 열기
    openEventModal();
    document.getElementById('e-year').value = baseMemo.year;
    document.getElementById('e-era').value = baseMemo.era;
}
