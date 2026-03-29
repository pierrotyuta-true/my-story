const firebaseConfig = {
    apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc",
    databaseURL: "https://true-s-default-rtdb.firebaseio.com",
    projectId: "true-s"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let state = { storyboard: [] };

function renderTimeline() {
    const list = document.getElementById('tl-list');
    list.innerHTML = '<div class="center-line"></div>';
    
    (state.storyboard || []).forEach((item, index) => {
        const row = document.createElement('div');
        row.className = `event-row ${index % 2 === 0 ? 'left' : 'right'}`;
        row.innerHTML = `
            <div class="node-point" style="top:50%"></div>
            <div class="card">
                <div style="font-size:10px; color:var(--primary); font-weight:bold;">${item.month}월</div>
                <div style="font-size:13px; font-weight:600;">${item.text}</div>
            </div>
        `;
        list.appendChild(row);
    });
}

window.onload = () => {
    db.ref('users/Yuta/projects/기본').on('value', (s) => {
        if(s.val()) state = s.val();
        renderTimeline();
        document.getElementById('project-name').innerText = "기본 프로젝트";
    });
};
