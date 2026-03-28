// Firebase 설정 (Yuta님의 키 값을 그대로 유지해주세요)
const firebaseConfig = { /* 기존 설정 복사 */ };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 데이터 상태
let state = { storyboard: [] };

function init() {
    // 임시 데이터로 화면이 뜨는지 먼저 확인 (나중에 Firebase 연결)
    state.storyboard = [
        { id: 1, year: 1995, month: 1, text: "테스트 데이터" }
    ];
    renderTimeline();
}

function renderTimeline() {
    const list = document.getElementById('tl-list');
    if (!list) return;

    list.innerHTML = '<div class="center-line"></div>';
    
    state.storyboard.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = `event-row ${index % 2 === 0 ? 'left' : 'right'}`;
        row.innerHTML = `
            <div class="node-point" style="top:50%"></div>
            <div class="card">
                <div style="font-size:11px; color:#4dabf7; font-weight:bold;">${item.year}년 ${item.month}월</div>
                <div style="font-size:14px; margin-top:5px;">${item.text}</div>
            </div>
        `;
        list.appendChild(row);
    });
}

// 페이지 로드 시 실행
window.onload = init;
