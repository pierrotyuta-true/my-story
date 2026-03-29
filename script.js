// 1. Firebase 설정 (Yuta님의 키 값을 정확히 넣어주세요)
const firebaseConfig = {
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc",
    databaseURL: "https://true-s-default-rtdb.firebaseio.com",
    projectId: "true-s"
};

// 초기화 에러 방지
try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
} catch (e) {
    console.error("Firebase 초기화 실패:", e);
}

const db = firebase.database();
let state = { storyboard: [] };

// 2. 화면 그리기 (데이터가 없어도 기본 틀은 유지)
function renderTimeline() {
    const list = document.getElementById('tl-list');
    if (!list) return;

    list.innerHTML = '<div class="center-line"></div>';
    
    const items = state.storyboard || [];
    if (items.length === 0) {
        list.innerHTML += '<p style="text-align:center; padding-top:100px; color:#adb5bd;">데이터가 없습니다. + 버튼으로 추가하세요!</p>';
        return;
    }

    // 데이터 정렬 및 그리기 로직 (지난번 디자인 적용)
    let lastYear = null;
    items.sort((a, b) => a.year - b.year || a.month - b.month).forEach((item, index) => {
        const isLeft = index % 2 === 0;
        const row = document.createElement('div');
        row.className = 'event-row';
        
        let yearHtml = '';
        if (item.year !== lastYear) {
            yearHtml = `<div class="year-badge">제국력 ${item.year}년</div>`;
            lastYear = item.year;
        }

        row.innerHTML = `
            ${yearHtml}
            <div class="node-point" style="top:50%"></div>
            <div class="card-wrapper ${isLeft ? 'left-card' : 'right-card'}">
                <div class="card">
                    <div class="card-meta">${item.month}월</div>
                    <div class="card-content">${item.text}</div>
                </div>
            </div>
        `;
        list.appendChild(row);
    });
}

// 3. 실행 (데이터 연결)
window.onload = () => {
    // 메뉴와 레이아웃이 즉시 보이도록 초기 실행
    renderTimeline(); 
    document.getElementById('project-name').innerText = "연결 중...";

    // Firebase 데이터 감시
    db.ref('users/Yuta/projects/기본').on('value', (s) => {
        const val = s.val();
        if (val) {
            state = val;
            document.getElementById('project-name').innerText = val.name || "기본 프로젝트";
        } else {
            document.getElementById('project-name').innerText = "새 프로젝트";
        }
        renderTimeline();
    }, (err) => {
        console.error("연결 에러:", err);
        document.getElementById('project-name').innerText = "오프라인 모드";
    });
};
