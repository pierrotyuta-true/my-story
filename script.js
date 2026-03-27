function openMainSidebar() {
    document.getElementById('main-sidebar').classList.add('active');
    document.getElementById('sidebar-overlay').classList.add('active');
}

function closeMainSidebar() {
    document.getElementById('main-sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

// 탭 전환 시에도 사이드바를 확실히 닫아줍니다.
function switchTab(viewId) {
    // 모든 뷰 숨기기
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.v-tab').forEach(t => t.classList.remove('active'));
    
    // 선택한 뷰 보이기
    document.getElementById('view-' + viewId).classList.add('active');
    document.getElementById('tab-' + viewId).classList.add('active');
    
    closeMainSidebar(); // 터치 꼬임 방지를 위해 닫기
}
