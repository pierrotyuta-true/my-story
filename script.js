// 1. Firebase 설정 (Yuta님의 키 값을 그대로 유지합니다)
const firebaseConfig = {
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc",
    databaseURL: "https://true-s-default-rtdb.firebaseio.com",
    projectId: "true-s"
};

// Firebase 초기화
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 앱의 상태 저장소
let state = {
    name: "로딩 중...",
    storyboard: []
};

// 2. 타임라인 화면을 그리는 핵심 함수 (지그재그 로직 포함)
function renderTimeline() {
    const list = document.getElementById('tl-list');
    if (!list) return;

    // 중앙선과 배경 초기화
    list.innerHTML = '<div class="center-line"></div>';
    
    const items = state.storyboard || [];
    
    // 데이터가 없을 때 메시지
    if (items.length === 0) {
        list.innerHTML += '<p style="text-align:center; padding-top:100px; color:#adb5bd;">데이터가 없습니다. + 버튼으로 추가하세요!</p>';
        return;
    }

    let lastYear = null;

    // 데이터를 연도/월 순으로 정렬하여 하나씩 그리기
    items.sort((a, b) => a.year - b.year || a.month - b.month).forEach((item, index) => {
        // index가 짝수면 왼쪽(left), 홀수면 오른쪽(right)으로 배치 (지그재그 핵심!)
        const side = index % 2 === 0 ? 'left' : 'right';
        
        const row = document.createElement('div');
        row.className = `event-row ${side}`;

        // 연도가 바뀔 때만 연도 배지 표시
        let yearHtml = '';
        if (item.year !== lastYear) {
            yearHtml = `<div class="year-badge">제국력 ${item.year}년</div>`;
            lastYear = item.year;
        }

        row.innerHTML = `
            ${yearHtml}
            <div class="node-point"></div>
            <div class="card">
                <div class="card-meta">${item.month}월</div>
                <div class="card-content">${item.text}</div>
            </div>
        `;
        list.appendChild(row);
    });
}

// 3. 데이터 추가 함수 (+ 버튼 클릭 시 작동)
function addEvent() {
    const year = prompt("연도를 입력하세요 (숫자만)", "589");
    const month = prompt("월을 입력하세요 (1~12)", "3");
    const text = prompt("사건 내용을 입력하세요");

    if (year && month && text) {
        const newEvent = {
            year: parseInt(year),
            month: parseInt(month),
            text: text
        };
        
        // Firebase에 즉시 저장
        const newRef = db.ref('users/Yuta/projects/기본/storyboard').push();
        newRef.set(newEvent);
    }
}

// 4. 앱 시작 시 실행되는 로직
window.onload = () => {
    // 실시간 데이터베이스 연결
    db.ref('users/Yuta/projects/기본').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // 서버 데이터를 받아서 화면 갱신
            state.name = data.name || "이그리에가";
            // 객체 형태의 데이터를 배열로 변환
            state.storyboard = data.storyboard ? Object.values(data.storyboard) : [];
            
            document.getElementById('project-name').innerText = state.name;
            renderTimeline();
        }
    });
};
