const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], eras = ["공통"], currentProject = null;
let editingId = null, currentTabIdx = 0;

// [뷰 제어]
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    const isOpen = sb.classList.toggle('open');
    ov.style.display = isOpen ? 'block' : 'none';
}

function switchView(view) {
    document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('m-' + view).classList.add('active');
    document.getElementById('timeline-bar').style.display = (view === 'timeline') ? 'flex' : 'none';
    if(view === 'timeline') renderTimeline();
    if(window.innerWidth < 768) toggleSidebar();
}

// [타임라인 렌더링]
function renderTimeline() {
    const list = document.getElementById('event-list');
    if(!list) return;
    list.innerHTML = '';
    
    eras.forEach(eName => {
        const eraEvents = storyboard.filter(s => s.era === eName).sort((a,b) => a.year - b.year || a.month - b.month);
        if(eraEvents.length === 0) return;
        
        list.innerHTML += `<div class="era-label">${eName}</div>`;
        eraEvents.forEach((ev, idx) => {
            const side = idx % 2 === 0 ? 'left' : 'right';
            const row = document.createElement('div');
            row.className = `event-row ${side}`;
            
            let tabs = `<div class="mini-tab t-main"></div>`;
            if(ev.branches) ev.branches.forEach(() => tabs += `<div class="mini-tab t-branch"></div>`);

            row.innerHTML = `
                <div class="card-tabs">${tabs}</div>
                <div class="card" onclick="openDetail('${ev.id}')">
                    <span class="date">${ev.year}년 ${ev.month}월</span>
                    <h4>${ev.text}</h4>
                </div>
            `;
            list.appendChild(row);
        });
    });
}

// [상세/모달 제어]
function openDetail(id) {
    editingId = id; currentTabIdx = 0;
    const ev = storyboard.find(x => x.id == id);
    renderModalContent(ev);
    document.getElementById('detailModal').style.display = 'flex';
}

function renderModalContent(ev) {
    const tabMenu = document.getElementById('modalTabMenu');
    let h = `<button class="modal-tab ${currentTabIdx===0?'active':''}" onclick="setTab(0)">기본</button>`;
    if(ev.branches) ev.branches.forEach((_, i) => {
        h += `<button class="modal-tab ${currentTabIdx===i+1?'active':''}" onclick="setTab(${i+1})">가지 ${i+1}</button>`;
    });
    tabMenu.innerHTML = h;
    document.getElementById('modalText').innerText = currentTabIdx === 0 ? ev.text : ev.branches[currentTabIdx-1];
    document.getElementById('modalDate').innerText = `${ev.era} ${ev.year}년 ${ev.month}월`;
}

function setTab(idx) { currentTabIdx = idx; renderModalContent(storyboard.find(x => x.id == editingId)); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// [편집/저장]
function addScene() { 
    editingId = null; 
    document.getElementById('eContent').value = "";
    document.getElementById('eraType').innerHTML = eras.map(e => `<option value="${e}">${e}</option>`).join('');
    document.getElementById('delBtn').style.display = 'none';
    document.getElementById('detailModal').style.display = 'none';
    document.getElementById('editModal').style.display = 'flex'; 
}

function handleTabEdit() {
    const ev = storyboard.find(x => x.id == editingId);
    if(currentTabIdx === 0) {
        document.getElementById('eContent').value = ev.text;
        document.getElementById('eYear').value = ev.year;
        document.getElementById('eMonth').value = ev.month;
        document.getElementById('eraType').innerHTML = eras.map(e => `<option value="${e}">${e}</option>`).join('');
        document.getElementById('eraType').value = ev.era;
        document.getElementById('delBtn').style.display = 'block';
        document.getElementById('detailModal').style.display = 'none';
        document.getElementById('editModal').style.display = 'flex';
    } else {
        const val = prompt("가지 내용 수정 (비우면 삭제):", ev.branches[currentTabIdx-1]);
        if(val === "") ev.branches.splice(currentTabIdx-1, 1);
        else if(val) ev.branches[currentTabIdx-1] = val;
        sync(); openDetail(editingId);
    }
}

function saveScene() {
    const text = document.getElementById('eContent').value.trim();
    const year = parseInt(document.getElementById('eYear').value) || 1000;
    const era = document.getElementById('eraType').value;
    const month = parseInt(document.getElementById('eMonth').value);
    
    if(!text) return;

    if(editingId) {
        storyboard = storyboard.map(s => s.id == editingId ? {...s, text, year, era, month} : s);
    } else {
        storyboard.push({ id: Date.now().toString(), text, year, era, month, branches: [] });
    }
    sync(); closeModal('editModal');
}

// [데이터 로드]
function sync() { if(currentProject) db.ref('projects/'+currentProject).set({ data: storyboard, eras }); renderTimeline(); }
function saveToCloud() { sync(); alert("저장 완료!"); }

function loadP(k) {
    currentProject = k;
    localStorage.setItem('lastProject', k);
    document.getElementById('projectTitle').innerText = k;
    db.ref('projects/'+k).on('value', s => {
        const d = s.val();
        if(d) { storyboard = d.data || []; eras = d.eras || ["공통"]; renderTimeline(); }
    });
    closeModal('loadModal');
}

function openLoadModal() {
    db.ref('projects').once('value').then(s => {
        const d = s.val();
        if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          if (confirm('새로운 업데이트가 있습니다! 적용하시겠습니까?')) {
            window.location.reload();
          }
        }
      });
    });
  });
}

        document.getElementById('projectList').innerHTML = d ? Object.keys(d).map(k => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8f9fa; padding:10px; border-radius:10px; margin-bottom:5px;">
                <span style="font-weight:700;">${k}</span>
                <button class="save-btn" onclick="loadP('${k}')">열기</button>
            </div>
        `).join('') : '프로젝트가 없습니다.';
        document.getElementById('loadModal').style.display = 'flex';
    });
}

window.onload = () => {
    const last = localStorage.getItem('lastProject');
    if(last) loadP(last); else openLoadModal();
};
