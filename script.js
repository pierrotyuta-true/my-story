// 1. 앱 업데이트 체크 로직 (v1.5)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=1.5').then(reg => {
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    if (confirm("✨ 새로운 디자인과 기능이 업데이트되었습니다! 지금 적용할까요?")) {
                        window.location.reload();
                    }
                }
            });
        });
    });
}

const config = { apiKey: "AIzaSyCK3At50Eo49KIydPU6ibqtzZt0itO9-Oc", authDomain: "true-s.firebaseapp.com", databaseURL: "https://true-s-default-rtdb.firebaseio.com", projectId: "true-s" };
if (!firebase.apps.length) firebase.initializeApp(config);
const db = firebase.database();

let storyboard = [], eras = ["공통"], characters = [], mainStory = "";
let currentProject = localStorage.getItem('lastProject') || null;
let currentView = 'timeline';

// [뷰 전환]
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.menu-section li').forEach(li => li.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('menu-' + view).classList.add('active');
    if(view === 'character') renderCharacters();
    if(window.innerWidth < 768) toggleMainSidebar();
}

function toggleMainSidebar() {
    const sb = document.getElementById('main-sidebar');
    const ov = document.getElementById('sidebar-overlay');
    const isOpen = sb.classList.toggle('open');
    ov.style.display = isOpen ? 'block' : 'none';
}

// [프로젝트 관리]
function openLoadModal() {
    db.ref('projects').once('value').then(s => {
        const d = s.val();
        const listUI = document.getElementById('projectList');
        listUI.innerHTML = d ? Object.keys(d).map(k => `
            <div style="padding:15px; border-bottom:1px solid #f8f9fa; display:flex; justify-content:space-between; align-items:center;" onclick="loadProject('${k}')">
                <b style="${k === currentProject ? 'color:var(--primary);' : ''}">${k}</b>
                <i class="fas fa-chevron-right" style="color:#ccc;"></i>
            </div>
        `).join('') : '<p style="padding:20px; color:#999; text-align:center;">작품이 없습니다.</p>';
        document.getElementById('loadModal').style.display = 'flex';
    });
}

function createNewProjectFromModal() {
    const name = document.getElementById('newProjName').value.trim();
    if(!name) return alert("작품 제목을 입력해주세요.");
    db.ref('projects/' + name).set({ data: [], eras: ["공통"], characters: [], mainStory: "" }).then(() => {
        document.getElementById('newProjName').value = "";
        loadProject(name);
    });
}

function loadProject(name) {
    currentProject = name;
    localStorage.setItem('lastProject', name);
    document.getElementById('projectTitle').innerText = name;
    db.ref('projects/' + name).on('value', s => {
        const d = s.val();
        if(d) {
            storyboard = d.data || [];
            eras = d.eras || ["공통"];
            characters = d.characters || [];
            mainStory = d.mainStory || "";
            renderTimeline();
            if(currentView === 'story') renderStory();
        }
    });
    closeModal('loadModal');
}

// [기능: 저장/캐릭터/스토리]
function sync() { if(currentProject) db.ref('projects/' + currentProject).set({ data: storyboard, eras, characters, mainStory }); }
function saveToCloud() { sync(); alert("클라우드 저장 완료!"); }

function renderCharacters() {
    const list = document.getElementById('char-list');
    list.innerHTML = characters.map(c => `<div class="char-card" style="background:#fff; padding:15px; border-radius:12px; margin-bottom:10px;"><b>${c.name}</b><br><small>${c.role}</small></div>`).join('');
}

function handleFab() {
    if(currentView === 'timeline') {
        const t = prompt("새 사건 내용:");
        if(t) { storyboard.push({id: Date.now(), title: t, year: 2026, month: 3}); sync(); renderTimeline(); }
    } else if(currentView === 'character') {
        openCharModal();
    }
}

function renderTimeline() {
    const list = document.getElementById('event-list');
    list.innerHTML = storyboard.map(ev => `<div class="event-card" style="margin:20px;"><b>${ev.title}</b></div>`).join('');
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

window.onload = () => { if(currentProject) loadProject(currentProject); else openLoadModal(); }
