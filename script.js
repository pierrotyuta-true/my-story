// 1. Firebase 설정 (Yuta님의 설정값을 그대로 사용하세요)
const firebaseConfig = {
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc",
    authDomain: "true-s.firebaseapp.com",
    databaseURL: "https://true-s-default-rtdb.firebaseio.com",
    projectId: "true-s",
    storageBucket: "true-s.appspot.com",
    messagingSenderId: "374223122111",
    appId: "1:374223122111:web:65884966606f71d5306634"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let state = { storyboard: [] };

// 2. 타임라인 그리기 함수
function renderTimeline() {
    const list = document.getElementById('tl-list');
    if (!list) return;

    list.innerHTML = '<div class="center-line"></div>';
    
    const items = state.storyboard || [];
    
    // 데이터가 없을 때 메시지 표시
    if (items.length === 0) {
        list.innerHTML += '<p style="text-align:center; padding-top:100px; color:#999;">등록된 타임라인이 없습니다.<br>+ 버튼을 눌러 추가해보세요!</p>';
        return;
    }

    let lastYear = "";
    items.sort((a, b) => a.year - b.year || a.month - b.month).forEach((item, index) => {
        const row = document.createElement('div');
        row.className = `event-row ${index % 2 === 0 ? 'left' : 'right'}`;
        
        const currentYearLabel = `제국력 ${item.year}년`;
        let yearHtml = '';
        if (currentYearLabel !== lastYear) {
            yearHtml = `<div class="year-badge">${currentYearLabel}</div>`;
            lastYear = currentYearLabel;
        }

        row.innerHTML = `
            ${yearHtml}
            <div class="node-point" style="top:50%"></div>
            <div class="card">
                <div class="card-meta">${item.month}월</div>
                <div class="card-content">${item.text}</div>
            </div>
        `;
        list.appendChild(row);
    });
}

// 3. 페이지 로드 시 데이터 호출
window.onload = () => {
    console.log("데이터 로딩 시작...");
    
    // 경로를 'users/Yuta/projects/기본'으로 고정해서 호출
    db.ref('users/Yuta/projects/기본').on('value', (snapshot) => {
        const val = snapshot.val();
        const nameEl = document.getElementById('project-name');
        
        if (val) {
            state = val;
            if (nameEl) nameEl.innerText = val.name || "기본 프로젝트";
            renderTimeline();
        } else {
            // 데이터 자체가 아예 없는 경우
            if (nameEl) nameEl.innerText = "새 프로젝트";
            renderTimeline(); // 빈 화면이라도 그리도록 호출
        }
    }, (error) => {
        console.error("Firebase 연결 에러:", error);
        document.getElementById('project-name').innerText = "연결 오류";
    });
};
