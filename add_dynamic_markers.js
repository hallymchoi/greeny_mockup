// 동적으로 번호 마커를 정확한 위치에 배치하는 스크립트

function addDynamicMarkers() {
    // 페이지별 요소 선택자 정의
    const pageConfigs = {
        '3-4-판매하기': [
            { selector: 'button[onclick="history.back()"]', number: 1 },
            { selector: 'button[onclick*="3-4-2-중고마켓-판매관리-등록"]', number: 2 }
        ],
        '2-1-홈': [
            { selector: 'button.p-2:last-of-type', number: 1 },
            { selector: '.swiper-container', number: 2 },
            { selector: '.bg-gradient-to-br', number: 3 },
            { selector: 'button[onclick*="2-2-1"]', number: 4 },
            { selector: 'button[onclick*="2-3-1"]', number: 5 },
            // ... 추가 요소들
        ]
        // ... 다른 페이지 설정
    };
    
    // 현재 페이지 파일명 가져오기
    const currentPage = window.location.pathname.split('/').pop().replace('_N.html', '');
    
    // 해당 페이지의 설정 가져오기
    const config = pageConfigs[currentPage];
    if (!config) return;
    
    // left-panel 요소 찾기
    const leftPanel = document.querySelector('.left-panel');
    if (!leftPanel) return;
    
    // 기존 마커 제거
    const existingMarkers = leftPanel.querySelectorAll('.number-marker');
    existingMarkers.forEach(marker => marker.remove());
    
    // 각 요소에 대해 마커 추가
    config.forEach(item => {
        const element = document.querySelector(item.selector);
        if (!element) {
            console.warn(`Element not found: ${item.selector}`);
            return;
        }
        
        // 요소의 위치 계산
        const elementRect = element.getBoundingClientRect();
        const panelRect = leftPanel.getBoundingClientRect();
        
        // 상대적 위치 계산 (좌상단에 살짝 걸치도록)
        const relativeTop = elementRect.top - panelRect.top - 8;
        const relativeLeft = elementRect.left - panelRect.left - 8;
        
        // 마커 생성
        const marker = document.createElement('div');
        marker.className = 'number-marker';
        marker.textContent = item.number;
        marker.style.cssText = `
            position: absolute;
            top: ${relativeTop}px;
            left: ${relativeLeft}px;
            width: 24px;
            height: 24px;
            background: rgba(255, 20, 147, 0.8);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
        `;
        
        leftPanel.appendChild(marker);
    });
}

// DOM 로드 완료 후 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDynamicMarkers);
} else {
    addDynamicMarkers();
}

// 윈도우 리사이즈 시 재계산
window.addEventListener('resize', addDynamicMarkers);