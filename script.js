// Firebase 설정은 기존 Yuta님 것을 유지하세요!
const firebaseConfig = { /* ... 그대로 유지 ... */ };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let state = { storyboard: [] };

function renderTimeline() {
    const list = document.getElementById('tl-list');
    list.innerHTML = '<div class="center-line"></div>';
    
    let lastYear = "";
    const sorted = (state.storyboard || []).sort((a,b) => a.year - b.year || a.month - b.month);

    sorted.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = `event-row ${index % 2 === 0 ? 'left' : 'right'}`;
        
        // 연도 뱃지 추가 로직
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

window.onload = () => {
    db.ref('users/Yuta/projects/기본').on('value', (s) => {
        const val = s.val();
        if(val) {
            state = val;
            renderTimeline();
            document.getElementById('project-name').innerText = val.name || "기본 프로젝트";
        }
    });
};
