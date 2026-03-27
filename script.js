// ... Firebase 설정 동일 ...

// [커스텀 모달 제어 로직] - 투박한 prompt 대체
function openCustomModal(title, callback) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('customModal').style.display = 'flex';
    document.getElementById('modalInput').value = ""; // 초기화
    document.getElementById('modalInput').focus();
    
    // 확인 버튼 클릭 시
    document.getElementById('modalConfirmBtn').onclick = () => {
        const val = document.getElementById('modalInput').value;
        if(val) {
            callback(val);
            closeCustomModal();
        }
    };
}

function closeCustomModal() {
    document.getElementById('customModal').style.display = 'none';
}

// [사건 추가 함수 - 수정]
function addEvent() {
    // 1. 영어 주소 없는 모달을 엽니다.
    openCustomModal("새로운 사건 추가", (text) => {
        // 2. 입력받은 내용으로 사건을 추가합니다.
        const newEvent = {
            id: Date.now(),
            title: text,
            month: "3월", // 기본값
            era: "제국력 589년"
        };
        storyboard = [...storyboard, newEvent];
        saveToCloud(); // Firebase에 저장 및 타임라인 렌더링
    });
}

// [뷰 전환 함수 - 수정]
function switchTab(viewId) {
    // ... active 상태 변경 로직 동일 ...
    
    // 스토리모드에서 사이드바 제어 로직 보완
    if(viewId === 'story') {
        document.getElementById('sidebar-toggle').style.display = 'block'; // 사이드바 버튼 보이기
        toggleSidebar(); // 사이드바 자동 열기 (사용자 편의)
    } else {
        document.getElementById('sidebar-toggle').style.display = 'none';
        closeSidebar(); // 다른 탭에선 사이드바 닫기
    }
}
