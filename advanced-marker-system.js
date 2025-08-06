/**
 * 고급 번호 마커 위치 계산 시스템
 * HTML 레이아웃에서 번호 마커 위치를 정확하게 계산하는 근본적인 해결책
 */

class AdvancedMarkerSystem {
    constructor(options = {}) {
        this.options = {
            markerSize: 24,
            markerOffset: 8,
            debugMode: false,
            autoPosition: true,
            ...options
        };
        
        this.pageConfigs = new Map();
        this.observers = new Set();
        this.init();
    }
    
    init() {
        // DOM 로드 완료 시 실행
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupPage());
        } else {
            this.setupPage();
        }
        
        // 리사이즈 시 재계산
        window.addEventListener('resize', () => this.debounce(() => this.updateAllMarkers(), 250));
        
        // 폰트 로드 완료 시 재계산
        if (document.fonts) {
            document.fonts.ready.then(() => this.updateAllMarkers());
        }
    }
    
    /**
     * 페이지별 요소 설정을 등록합니다
     */
    registerPageConfig(pageName, elements) {
        this.pageConfigs.set(pageName, elements.map((el, index) => ({
            ...el,
            number: el.number || (index + 1)
        })));
        
        if (this.getCurrentPageName() === pageName) {
            this.updateAllMarkers();
        }
    }
    
    /**
     * 현재 페이지 이름을 가져옵니다
     */
    getCurrentPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        // _N.html 제거
        let pageName = filename.replace('_N.html', '').replace('.html', '');
        
        // 대시를 공백으로 변경
        pageName = pageName.replace(/-/g, ' ');
        
        return pageName;
    }
    
    /**
     * 페이지 설정
     */
    setupPage() {
        const pageName = this.getCurrentPageName();
        
        // 기본 페이지 설정들을 등록
        this.registerDefaultConfigs();
        
        // 현재 페이지 설정이 있으면 마커 업데이트
        if (this.pageConfigs.has(pageName)) {
            this.updateAllMarkers();
        }
        
        // 동적 콘텐츠 변경 감지
        this.setupMutationObserver();
    }
    
    /**
     * 기본 페이지 설정들을 등록합니다
     */
    registerDefaultConfigs() {
        // 3-4 판매하기 페이지
        this.registerPageConfig('3 4 판매하기', [
            {
                selector: 'button[onclick="history.back()"]',
                description: '뒤로가기 버튼',
                preferredPosition: 'top-left'
            },
            {
                selector: 'button[onclick*="3-4-2"]',
                description: '판매 등록 시작 버튼',
                preferredPosition: 'top-left'
            }
        ]);
        
        // 2-1 홈 페이지
        this.registerPageConfig('2 1 홈', [
            {
                selector: 'button.p-2:last-of-type',
                description: '프로필 버튼',
                preferredPosition: 'top-right'
            },
            {
                selector: '.swiper-container, [class*="swiper"]',
                description: '이벤트 배너',
                preferredPosition: 'center'
            },
            {
                selector: '.bg-gradient-to-br',
                description: 'My Clubs 섹션',
                preferredPosition: 'top-left'
            },
            {
                selector: 'button[onclick*="2-2-1"], button[onclick*="AI"], button[onclick*="추천"]',
                description: '클럽 추천받기',
                preferredPosition: 'top-left'
            }
        ]);
        
        // 더 많은 페이지 설정들...
    }
    
    /**
     * 모든 마커를 업데이트합니다
     */
    updateAllMarkers() {
        const pageName = this.getCurrentPageName();
        const config = this.pageConfigs.get(pageName);
        
        if (!config) {
            this.log(`No configuration found for page: ${pageName}`);
            return;
        }
        
        const leftPanel = this.getLeftPanel();
        if (!leftPanel) {
            this.log('Left panel not found');
            return;
        }
        
        // 기존 마커 제거
        this.clearExistingMarkers();
        
        // 새 마커 추가
        config.forEach((item, index) => {
            const element = this.findElement(item.selector);
            if (element) {
                const position = this.calculateOptimalPosition(element, leftPanel, item);
                this.createMarker(leftPanel, position, item.number, item.description);
            } else {
                this.log(`Element not found: ${item.selector}`);
            }
        });
    }
    
    /**
     * 요소를 찾습니다 (여러 선택자 지원)
     */
    findElement(selector) {
        if (typeof selector === 'string') {
            return document.querySelector(selector);
        }
        
        // 배열인 경우 첫 번째로 찾은 요소 반환
        if (Array.isArray(selector)) {
            for (const sel of selector) {
                const element = document.querySelector(sel);
                if (element) return element;
            }
        }
        
        return null;
    }
    
    /**
     * 최적의 마커 위치를 계산합니다
     */
    calculateOptimalPosition(element, leftPanel, config) {
        const elementRect = element.getBoundingClientRect();
        const panelRect = leftPanel.getBoundingClientRect();
        
        // 기본 상대 위치 계산
        let relativeTop = elementRect.top - panelRect.top;
        let relativeLeft = elementRect.left - panelRect.left;
        
        // 선호 위치에 따른 조정
        const preferredPosition = config.preferredPosition || 'top-left';
        const offset = this.options.markerOffset;
        const markerSize = this.options.markerSize;
        
        switch (preferredPosition) {
            case 'top-left':
                relativeTop -= offset;
                relativeLeft -= offset;
                break;
            case 'top-right':
                relativeTop -= offset;
                relativeLeft += elementRect.width - markerSize + offset;
                break;
            case 'bottom-left':
                relativeTop += elementRect.height - markerSize + offset;
                relativeLeft -= offset;
                break;
            case 'bottom-right':
                relativeTop += elementRect.height - markerSize + offset;
                relativeLeft += elementRect.width - markerSize + offset;
                break;
            case 'center':
                relativeTop += (elementRect.height - markerSize) / 2;
                relativeLeft += (elementRect.width - markerSize) / 2;
                break;
            default:
                relativeTop -= offset;
                relativeLeft -= offset;
        }
        
        // 경계 검사 및 조정
        const panelWidth = leftPanel.offsetWidth;
        const panelHeight = leftPanel.offsetHeight;
        
        relativeTop = Math.max(0, Math.min(relativeTop, panelHeight - markerSize));
        relativeLeft = Math.max(0, Math.min(relativeLeft, panelWidth - markerSize));
        
        // 스크롤 오프셋 보정
        relativeTop += leftPanel.scrollTop;
        relativeLeft += leftPanel.scrollLeft;
        
        return {
            top: Math.round(relativeTop),
            left: Math.round(relativeLeft)
        };
    }
    
    /**
     * 마커를 생성합니다
     */
    createMarker(container, position, number, description) {
        const marker = document.createElement('div');
        marker.className = 'number-marker';
        marker.textContent = number;
        marker.title = description || `마커 ${number}`;
        
        marker.style.cssText = `
            position: absolute;
            top: ${position.top}px;
            left: ${position.left}px;
            width: ${this.options.markerSize}px;
            height: ${this.options.markerSize}px;
            background: rgba(255, 20, 147, 0.9);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 2px solid white;
            cursor: help;
            transition: transform 0.2s ease;
        `;
        
        // 호버 효과
        marker.addEventListener('mouseenter', () => {
            marker.style.transform = 'scale(1.2)';
        });
        
        marker.addEventListener('mouseleave', () => {
            marker.style.transform = 'scale(1)';
        });
        
        container.appendChild(marker);
        
        this.log(`Created marker ${number} at (${position.top}, ${position.left}) for: ${description}`);
    }
    
    /**
     * Left Panel을 찾습니다
     */
    getLeftPanel() {
        // 여러 가능한 선택자 시도
        const selectors = [
            '.left-panel',
            '.original-content',
            '.container .left-panel',
            '.container > div:first-child',
            '.main-content'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        
        // 기본적으로 body 반환
        return document.body;
    }
    
    /**
     * 기존 마커를 제거합니다
     */
    clearExistingMarkers() {
        const markers = document.querySelectorAll('.number-marker');
        markers.forEach(marker => marker.remove());
    }
    
    /**
     * 동적 콘텐츠 변경 감지 설정
     */
    setupMutationObserver() {
        if (!window.MutationObserver) return;
        
        const observer = new MutationObserver(() => {
            this.debounce(() => this.updateAllMarkers(), 500);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        this.observers.add(observer);
    }
    
    /**
     * 디버그 로그
     */
    log(message) {
        if (this.options.debugMode) {
            console.log(`[AdvancedMarkerSystem] ${message}`);
        }
    }
    
    /**
     * Debounce 유틸리티
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * 현재 위치 정보를 출력합니다 (디버그용)
     */
    exportCurrentPositions() {
        const pageName = this.getCurrentPageName();
        const config = this.pageConfigs.get(pageName);
        
        if (!config) return null;
        
        const leftPanel = this.getLeftPanel();
        const positions = [];
        
        config.forEach((item) => {
            const element = this.findElement(item.selector);
            if (element) {
                const position = this.calculateOptimalPosition(element, leftPanel, item);
                positions.push({
                    selector: item.selector,
                    description: item.description,
                    position: position,
                    pythonConfig: `{'selector': '${item.selector}', 'offset': {'top': ${position.top}, 'left': ${position.left}}, 'desc': '${item.description}'}`
                });
            }
        });
        
        return {
            pageName,
            positions,
            pythonCode: this.generatePythonConfig(pageName, positions)
        };
    }
    
    /**
     * Python 설정 코드를 생성합니다
     */
    generatePythonConfig(pageName, positions) {
        const configs = positions.map(p => `        ${p.pythonConfig}`).join(',\n');
        return `    '${pageName}': [\n${configs}\n    ]`;
    }
    
    /**
     * 시스템 정리
     */
    destroy() {
        this.clearExistingMarkers();
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.pageConfigs.clear();
    }
}

// 전역 인스턴스 생성
window.advancedMarkerSystem = new AdvancedMarkerSystem({
    debugMode: true,
    markerSize: 24,
    markerOffset: 8
});

// 개발자 도구용 헬퍼 함수들
window.markerDebugTools = {
    showCurrentPositions: () => {
        const data = window.advancedMarkerSystem.exportCurrentPositions();
        console.log('Current marker positions:', data);
        return data;
    },
    
    getPythonConfig: () => {
        const data = window.advancedMarkerSystem.exportCurrentPositions();
        if (data) {
            console.log('Python configuration:');
            console.log(data.pythonCode);
            return data.pythonCode;
        }
        return null;
    },
    
    recalculate: () => {
        window.advancedMarkerSystem.updateAllMarkers();
    },
    
    clearMarkers: () => {
        window.advancedMarkerSystem.clearExistingMarkers();
    }
};

console.log('Advanced Marker System loaded. Use window.markerDebugTools for debugging.');