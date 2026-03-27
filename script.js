const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], eras = ["공통"], characters = [], mainStory = "";
let currentProject = null, currentView = 'timeline';
let editingCharId = null;

// [1. 뷰 전환 로직]
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('m-' + view).classList.add('active');
    
    // 뷰별 UI 제어
    document.getElementById('timeline-bar').style.display = (view === 'timeline') ? 'flex' : 'none';
    
    if(view === 'timeline') renderTimeline();
    if(view === 'character') renderCharacters();
    if(view === 'story') renderStory();
    
    if(window.innerWidth < 768) toggleSidebar();
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    const isOpen = sb.classList.toggle('open');
    ov.style.display = isOpen ? 'block' : 'none';
}

// [2. 캐릭터 도감 로직]
function renderCharacters() {
    const list = document.getElementById('char-list');
    list.innerHTML = characters.length ? characters.map(c => `
        <div class="char-card" onclick="openCharModal('${c.id}')">
            <span class="name">${c.name}</span>
            <span class="role">${c.role}</span>
        </div>
    `).join('') : '<p style="grid-column:1/3; text-align:center; color:#999; padding:20px;">등록된 캐릭터가 없습니다.</p>';
}

function openCharModal(id = null) {
    editingCharId = id;
    if(id) {
        const c = characters.find(x => x.id == id);
        document.getElementById('cName').value = c.name;
        document.getElementById('cRole').value = c.role;
        document.getElementById('cDesc').value = c.desc || "";
    } else {
        document.getElementById('cName').value = "";
        document.getElementById('cRole').value = "";
        document.getElementById('cDesc').value = "";
    }
    document.getElementById('charModal').style.display = 'flex';
}

function saveCharacter() {
    const name = document.getElementById('cName').value.trim();
    const role = document.getElementById('cRole').value.trim();
    const desc = document.getElementById('cDesc').value.trim();
    if(!name) return;

    if(editingCharId) {
        characters = characters.map(c => c.id == editingCharId ? {...c, name, role, desc} : c);
    } else {
        characters.push({ id: Date.now().toString(), name, role, desc });
    }
    sync(); closeModal('charModal'); renderCharacters();
}

// [3. 줄거리 집필 로직]
function renderStory() {
    document.getElementById('story-viewer').innerText = mainStory || "내용이 없습니다. 편집 버튼을 눌러 작성해 보세요.";
    document.getElementById('story-input').value = mainStory;
}

function toggleStoryEdit() {
    const viewer = document.getElementById('story-viewer');
    const input = document.getElementById('story-input');
    const btn = document.getElementById('story-edit-btn');
    
    if(input.style.display === 'none') {
        viewer.style.display = 'none';
        input.style.display = 'block';
        btn.innerText = "저장하기";
    } else {
        mainStory = input.value;
        viewer.style.display = 'block';
        input.style.display = 'none';
        btn.innerText = "편집 시작";
        sync(); renderStory();
    }
}

// [4. FAB 통합 제어]
function handleFab() {
    if(currentView === 'timeline') addScene(); // 기존 타임라인 추가 함수 호출
    else if(currentView === 'character') openCharModal();
}

// [5. 데이터 동기화]
function sync() {
    if(!currentProject) return;
    db.ref('projects/' + currentProject).set({
        data: storyboard,
        eras: eras,
        characters: characters,
        mainStory: mainStory
    });
}

function loadP(k) {
    currentProject = k;
    localStorage.setItem('lastProject', k);
    document.getElementById('projectTitle').innerText = k;
    db.ref('projects/' + k).on('value', s => {
        const d = s.val();
        if(d) {
            storyboard = d.data || [];
            eras = d.eras || ["공통"];
            characters = d.characters || [];
            mainStory = d.mainStory || "";
            switchView(currentView);
        }
    });
    closeModal('loadModal');
}

// [기타 기능: 타임라인 렌더링 등 기존 로직 유지 필요]
// ... (기존에 드렸던 renderTimeline, openLoadModal, createNewProject 등 함수들 포함)

window.onload = () => {
    const last = localStorage.getItem('lastProject');
    if(last) loadP(last); else openLoadModal();
};

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
