/**
 * 온고지신 (溫故知新) : 한국 역사 문화유산 탐방기 인터랙티브 스크립트
 * Single Page Application (SPA) Controller
 */

// ==========================================
// 1. Web Audio API 사운드 합성기 (외부 파일 무의존)
// ==========================================
class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 전통 도장 쿵! 찍히는 둔탁하고 묵직한 타격음
  playStamp() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);

      // 보조 잔향 효과
      const noise = this.ctx.createOscillator();
      const noiseGain = this.ctx.createGain();
      noise.type = 'sine';
      noise.frequency.setValueAtTime(65, this.ctx.currentTime);
      noiseGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start();
      noise.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  // 퀴즈 정답 국악풍 맑은 종소리 (솔-라-도-레 청아한 멜로디)
  playCorrect() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        const startTime = this.ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  // 오답 효과음 (부드러운 저음 2연타)
  playIncorrect() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      [180, 140].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);

        const startTime = this.ctx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  // 탭 및 가벼운 클릭 효과음
  playClick() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }
}

// ==========================================
// 2. 애플리케이션 상태 관리 (State Manager)
// ==========================================
class AppState {
  constructor() {
    this.currentTab = 'explore';
    this.currentEra = 'all';
    this.searchQuery = '';
    this.activeSiteId = null;
    this.isDarkMode = false;
    this.soundEnabled = true;

    // 로컬 스토리지 키
    this.STAMP_STORAGE_KEY = 'ongojisin_stamps_v1';
    this.NOTES_STORAGE_KEY = 'ongojisin_notes_v1';
    this.THEME_STORAGE_KEY = 'ongojisin_theme_v1';
    this.SOUND_STORAGE_KEY = 'ongojisin_sound_v1';
    this.QUIZ_STORAGE_KEY = 'ongojisin_quiz_stats_v1';

    // 저장된 데이터 로드
    this.stamps = this.loadStorage(this.STAMP_STORAGE_KEY, {});
    this.notes = this.loadStorage(this.NOTES_STORAGE_KEY, {});
    this.quizStats = this.loadStorage(this.QUIZ_STORAGE_KEY, { totalSolved: 0, correct: 0, history: {} });
    this.isDarkMode = localStorage.getItem(this.THEME_STORAGE_KEY) === 'dark';
    this.soundEnabled = localStorage.getItem(this.SOUND_STORAGE_KEY) !== 'false';
  }

  loadStorage(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error("Storage load failed:", e);
      return defaultValue;
    }
  }

  saveStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error("Storage save failed:", e);
    }
  }

  hasStamp(siteId) {
    return !!this.stamps[siteId];
  }

  addStamp(siteId) {
    if (!this.stamps[siteId]) {
      this.stamps[siteId] = {
        stampedAt: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
      this.saveStorage(this.STAMP_STORAGE_KEY, this.stamps);
      return true;
    }
    return false;
  }

  resetStamps() {
    this.stamps = {};
    this.saveStorage(this.STAMP_STORAGE_KEY, this.stamps);
  }

  saveNote(siteId, noteText) {
    this.notes[siteId] = {
      text: noteText,
      updatedAt: new Date().toLocaleDateString('ko-KR')
    };
    this.saveStorage(this.NOTES_STORAGE_KEY, this.notes);
  }

  getNote(siteId) {
    return this.notes[siteId] ? this.notes[siteId].text : '';
  }

  recordQuiz(quizId, isCorrect) {
    this.quizStats.totalSolved += 1;
    if (isCorrect) {
      this.quizStats.correct += 1;
    }
    this.quizStats.history[quizId] = isCorrect;
    this.saveStorage(this.QUIZ_STORAGE_KEY, this.quizStats);
  }

  getStampCount() {
    return Object.keys(this.stamps).length;
  }

  getTotalSitesCount() {
    return HERITAGE_DATA.length;
  }
}

// ==========================================
// 3. 메인 웹 애플리케이션 클래스
// ==========================================
class HeritageApp {
  constructor() {
    this.state = new AppState();
    this.sound = new SoundSynthesizer();
    this.sound.enabled = this.state.soundEnabled;

    // 퀴즈 관련 상태
    this.currentQuizFilter = 'all';
    this.quizIndex = 0;
    this.flattenedQuizzes = [];

    this.init();
  }

  init() {
    this.applyTheme();
    this.initFlattenedQuizzes();
    this.renderAll();
    this.bindEvents();
    this.updateSoundButtonUI();

    // URL 해시 라우팅 지원
    if (window.location.hash) {
      const tab = window.location.hash.replace('#', '');
      if (['explore', 'tour', 'quiz', 'journal'].includes(tab)) {
        this.switchTab(tab);
      }
    }
  }

  initFlattenedQuizzes() {
    this.flattenedQuizzes = [];
    HERITAGE_DATA.forEach(site => {
      site.quizzes.forEach(q => {
        this.flattenedQuizzes.push({
          ...q,
          siteId: site.id,
          siteName: site.name,
          siteEra: site.era
        });
      });
    });
  }

  // 테마 적용
  applyTheme() {
    if (this.state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    if (themeIcon) {
      themeIcon.innerHTML = this.state.isDarkMode 
        ? `<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`
        : `<svg class="w-5 h-5 text-indigo-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
    }
    if (themeText) {
      themeText.textContent = this.state.isDarkMode ? '밝은 테마' : '어두운 테마';
    }
  }

  toggleTheme() {
    this.sound.playClick();
    this.state.isDarkMode = !this.state.isDarkMode;
    localStorage.setItem(this.state.THEME_STORAGE_KEY, this.state.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
    this.showToast(this.state.isDarkMode ? '🌙 야간 묵색 테마가 적용되었습니다.' : '☀️ 주간 한지 테마가 적용되었습니다.');
  }

  toggleSound() {
    this.state.soundEnabled = !this.state.soundEnabled;
    this.sound.enabled = this.state.soundEnabled;
    localStorage.setItem(this.state.SOUND_STORAGE_KEY, this.state.soundEnabled ? 'true' : 'false');
    this.updateSoundButtonUI();
    if (this.sound.enabled) this.sound.playClick();
    this.showToast(this.sound.enabled ? '🔔 전통 음향 효과가 켜졌습니다.' : '🔕 음향 효과가 꺼졌습니다.');
  }

  updateSoundButtonUI() {
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      soundBtn.innerHTML = this.sound.enabled
        ? `<svg class="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg><span class="hidden md:inline text-xs font-medium">소리 켬</span>`
        : `<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg><span class="hidden md:inline text-xs font-medium">음소거</span>`;
    }
  }

  // 탭 전환
  switchTab(tabId) {
    this.sound.playClick();
    this.state.currentTab = tabId;
    window.location.hash = tabId;

    // 네비게이션 버튼 활성화 스타일 갱신
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const isTarget = btn.dataset.tab === tabId;
      if (isTarget) {
        btn.classList.add('active-nav-tab');
        btn.classList.remove('text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('active-nav-tab');
        btn.classList.add('text-slate-600', 'dark:text-slate-300');
      }
    });

    // 섹션 표시 전환
    const sections = ['explore', 'tour', 'quiz', 'journal'];
    sections.forEach(s => {
      const el = document.getElementById(`section-${s}`);
      if (el) {
        if (s === tabId) {
          el.classList.remove('hidden');
          el.classList.add('block');
        } else {
          el.classList.add('hidden');
          el.classList.remove('block');
        }
      }
    });

    // 탭별 추가 렌더링 갱신
    if (tabId === 'journal') {
      this.renderJournal();
    } else if (tabId === 'tour') {
      this.renderTour();
    } else if (tabId === 'quiz') {
      this.renderQuiz();
    } else if (tabId === 'explore') {
      this.renderExploreGrid();
    }

    // 모바일 메뉴 닫기
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 전체 화면 렌더링
  renderAll() {
    this.renderHeaderStats();
    this.renderExploreGrid();
    this.renderTour();
    this.renderQuiz();
    this.renderJournal();
  }

  // 상단 헤더 통계 표시
  renderHeaderStats() {
    const stampCount = this.state.getStampCount();
    const totalCount = this.state.getTotalSitesCount();
    const percent = Math.round((stampCount / totalCount) * 100);

    const statBadges = document.querySelectorAll('.header-stamp-badge');
    statBadges.forEach(badge => {
      badge.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <svg class="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.789l1.599.799L9 4.323V3a1 1 0 011-1z" clip-rule="evenodd"></path></svg>
          스탬프 <strong>${stampCount}/${totalCount}</strong> (${percent}%)
        </span>
      `;
    });

    // 메인 히어로 배너 통계 뱃지 동적 갱신
    const bannerSites = document.getElementById('banner-sites-count');
    if (bannerSites) {
      bannerSites.textContent = `${HERITAGE_DATA.length}개소 (${REGION_DATA.length}개 지역) 수록`;
    }
    const bannerQuizzes = document.getElementById('banner-quiz-count');
    if (bannerQuizzes) {
      bannerQuizzes.textContent = `${this.flattenedQuizzes.length}개 문항 탑재`;
    }
  }

  // ==========================================
  // [1] 문화유산 탐색 탭 렌더링
  // ==========================================
  getFilteredHeritageSites() {
    const q = this.state.searchQuery.trim().toLowerCase();
    const era = this.state.currentEra;

    return HERITAGE_DATA.filter(site => {
      // 시대 필터링
      const eraMatch = (era === 'all') || (site.eraCode === era);
      if (!eraMatch) return false;

      // 검색어 필터링
      if (!q) return true;

      const nameMatch = site.name.toLowerCase().includes(q);
      const summaryMatch = site.summary.toLowerCase().includes(q);
      const locationMatch = site.location.toLowerCase().includes(q);
      const eraNameMatch = site.era.toLowerCase().includes(q);
      const figureMatch = site.figures.some(f => f.name.toLowerCase().includes(q));

      return nameMatch || summaryMatch || locationMatch || eraNameMatch || figureMatch;
    });
  }

  renderExploreGrid() {
    const grid = document.getElementById('heritage-cards-grid');
    const emptyState = document.getElementById('heritage-empty-state');
    const resultCount = document.getElementById('search-result-count');
    if (!grid) return;

    const filteredSites = this.getFilteredHeritageSites();
    const hasFilter = Boolean(this.state.searchQuery.trim()) || (this.state.currentEra !== 'all');

    if (resultCount) {
      if (this.state.searchQuery.trim()) {
        resultCount.textContent = `검색 결과: ${filteredSites.length}개 유적지`;
      } else if (this.state.currentEra !== 'all') {
        const eraName = ERA_CONFIG[this.state.currentEra]?.name || '선택 시대';
        resultCount.textContent = `${eraName} 유적지: ${filteredSites.length}개`;
      } else {
        resultCount.textContent = `전체 ${HERITAGE_DATA.length}개 문화유산 (${REGION_DATA.length}개 지역)`;
      }
    }

    if (filteredSites.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      grid.classList.add('hidden');
      return;
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      grid.classList.remove('hidden');
    }

    grid.innerHTML = `
      <div class="w-full h-full flex items-center justify-center p-2 sm:p-4">
        <!-- 지도와 마커가 동일한 종횡비(624:468)를 공유하는 래퍼 -->
        <div class="relative w-full max-w-[624px] aspect-[624/468] select-none mx-auto flex items-center justify-center rounded-2xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <!-- 대한민국 지도 이미지 -->
          <img 
            src="./korea_map.png" 
            alt="대한민국 문화유산 탐방 지도" 
            class="w-full h-full object-contain pointer-events-none select-none opacity-85 dark:opacity-40 dark:invert transition-opacity duration-300 drop-shadow-sm" 
          />

          <!-- 각 지역 마커 -->
          ${REGION_DATA.map(region => {
            const activeSites = region.sites.filter(sId => filteredSites.some(fs => fs.id === sId));
            const isMatched = hasFilter ? (activeSites.length > 0) : true;
            const isStamped = region.sites.every(siteId => this.state.hasStamp(siteId));
            const pos = region.mapPos || { top: '50%', left: '50%' };
            const regionShortName = region.name.split('(')[0].trim();

            return `
              <div 
                class="heritage-card absolute -translate-x-1/2 -translate-y-[38px] sm:-translate-y-[42px] cursor-pointer group z-20 flex flex-col items-center transition-all duration-300 ${isMatched ? 'opacity-100 scale-100' : 'opacity-30 scale-90 pointer-events-none'}"
                style="top: ${pos.top}; left: ${pos.left};"
                data-region-id="${region.id}"
                role="button"
                tabindex="${isMatched ? '0' : '-1'}"
                aria-label="${region.name} 탐방하기"
              >
                <!-- 핀 아이콘 및 텍스트 태그 (호버 시 튕김 애니메이션) -->
                <div class="relative flex flex-col items-center transform group-hover:-translate-y-1.5 group-hover:scale-110 transition-all duration-200">
                  <div class="relative drop-shadow-lg filter">
                    <svg class="w-8 h-8 sm:w-10 sm:h-10 ${isStamped ? 'text-red-500' : (isMatched ? 'text-teal-600' : 'text-slate-400')} transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    
                    ${isStamped ? `
                      <div class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 border-2 border-white dark:border-slate-900 rounded-full animate-ping"></div>
                      <div class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-[8px] text-white font-bold leading-none">✓</div>
                    ` : ''}
                  </div>

                  <!-- 지역 이름 배지 -->
                  <div class="mt-0.5 px-2.5 py-1 bg-white/95 dark:bg-slate-800/95 rounded-lg shadow-md text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap border border-slate-200/90 dark:border-slate-700 group-hover:border-teal-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:shadow-lg transition-all pointer-events-none flex items-center gap-1.5">
                    <span>${regionShortName}</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isStamped ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300' : 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'} font-bold">
                      ${activeSites.length}곳
                    </span>
                  </div>
                </div>

                <!-- 핀 끝부분 바닥 앵커 점 (지리적 정확도 시각화) -->
                <div class="absolute top-[38px] sm:top-[42px] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div class="w-3 h-1.5 bg-slate-900/25 dark:bg-black/50 rounded-full blur-[0.5px]"></div>
                  ${isMatched ? `<div class="absolute inset-0 w-2 h-2 -top-0.5 left-0.5 rounded-full ${isStamped ? 'bg-red-500/50' : 'bg-teal-500/50'} animate-ping"></div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // 카드(마커) 클릭 이벤트 바인딩
    grid.querySelectorAll('.heritage-card').forEach(card => {
      card.addEventListener('click', () => {
        this.openRegionModal(card.dataset.regionId);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openRegionModal(card.dataset.regionId);
        }
      });
    });
  }

  openRegionModal(regionId) {
    this.sound.playClick();
    const region = REGION_DATA.find(r => r.id === regionId);
    if (!region) return;

    // 현재 검색어 및 시대 필터링 적용
    const filteredSites = this.getFilteredHeritageSites();
    const hasFilter = Boolean(this.state.searchQuery.trim()) || (this.state.currentEra !== 'all');
    const sitesToShow = hasFilter
      ? region.sites.filter(sId => filteredSites.some(fs => fs.id === sId))
      : region.sites;

    if (sitesToShow.length === 0) return;

    if (region.displayType === 'single' || region.displayType === 'tabs') {
      this.openHeritageModal(sitesToShow[0], regionId);
      return;
    }

    // cards display type
    const modal = document.getElementById('heritage-modal');
    const container = document.getElementById('modal-content-container');
    
    const eraName = this.state.currentEra !== 'all' ? (ERA_CONFIG[this.state.currentEra]?.name || '') : '';
    const filterBadge = hasFilter 
      ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">${eraName ? `${eraName} ` : ''}필터 적용 (${sitesToShow.length}곳)</span>`
      : '';

    container.innerHTML = `
      <div class="relative w-full bg-slate-900 p-6 sm:p-10">
        <button 
          id="modal-close-btn"
          class="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 hover:scale-105 transition-all"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 class="font-serif-kr text-2xl sm:text-4xl font-bold text-white mb-2">
          ${region.name} 탐방
        </h2>
        <div class="flex items-center flex-wrap gap-2 mb-8">
          <p class="text-amber-200/90 text-sm sm:text-base">어느 유적지를 탐방하시겠습니까?</p>
          ${filterBadge}
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${sitesToShow.map(sId => {
            const s = HERITAGE_DATA.find(x => x.id === sId);
            if (!s) return '';
            return `
              <div 
                class="region-card-btn bg-slate-800 hover:bg-slate-700 rounded-xl overflow-hidden cursor-pointer border border-slate-700 transition-all hover:-translate-y-1 flex flex-col"
                data-site-id="${sId}"
              >
                <img 
                  src="${s.image}" 
                  class="w-full h-32 object-cover" 
                  alt="${s.name}"
                  onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=1200&q=80';"
                />
                <div class="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-600/80 text-teal-100 mb-1.5">${s.era}</span>
                    <h3 class="font-bold text-white text-lg">${s.name}</h3>
                    <p class="text-sm text-slate-400 mt-1 line-clamp-2">${s.summary}</p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeHeritageModal());
    
    container.querySelectorAll('.region-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openHeritageModal(btn.dataset.siteId, regionId);
      });
    });
  }

  // ==========================================
  // [2] 문화유산 상세 모달창 제어
  // ==========================================
  openHeritageModal(siteId, regionId = null) {
    this.sound.playClick();
    this.state.activeSiteId = siteId;
    const site = HERITAGE_DATA.find(s => s.id === siteId);
    if (!site) return;

    const modal = document.getElementById('heritage-modal');
    const container = document.getElementById('modal-content-container');
    if (!modal || !container) return;

    const isStamped = this.state.hasStamp(site.id);
    const stampData = this.state.stamps[site.id];
    const userNote = this.state.getNote(site.id);

    let tabsHTML = '';
    if (regionId) {
      const region = REGION_DATA.find(r => r.id === regionId);
      if (region && region.displayType === 'tabs') {
        const filteredSites = this.getFilteredHeritageSites();
        const hasFilter = Boolean(this.state.searchQuery.trim()) || (this.state.currentEra !== 'all');
        const tabSites = hasFilter
          ? region.sites.filter(sId => filteredSites.some(fs => fs.id === sId))
          : region.sites;

        tabsHTML = `
          <div class="flex flex-wrap bg-slate-900 border-b border-slate-800 p-3 gap-2">
            ${tabSites.map(sId => {
              const s = HERITAGE_DATA.find(x => x.id === sId);
              if (!s) return '';
              const isActive = sId === siteId;
              return `
                <button 
                  class="region-tab-btn px-4 py-2 text-sm font-bold rounded-lg transition-colors ${isActive ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
                  data-site-id="${sId}"
                  data-region-id="${regionId}"
                >
                  ${s.era.split(' ')[0]} (${s.name.split('(')[0].trim()})
                </button>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    container.innerHTML = tabsHTML + `
      <!-- 모달 상단 히어로 배너 -->
      <div class="relative w-full h-64 sm:h-80 bg-slate-950 overflow-hidden">
        <img 
          src="${site.image}" 
          alt="${site.name}"
          class="w-full h-full object-cover object-center"
          onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=1200&q=80';"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30"></div>
        
        <!-- 닫기 버튼 -->
        <button 
          id="modal-close-btn"
          class="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 hover:scale-105 transition-all"
          aria-label="닫기"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <!-- 타이틀 및 뱃지 -->
        <div class="absolute bottom-6 left-6 right-6 z-10 text-white">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-teal-600 text-teal-100">
              ${site.era}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-600/90 text-amber-100">
              ${site.designation}
            </span>
            <span class="text-xs text-slate-300 font-mono">
              ${site.year}
            </span>
          </div>
          <h2 class="font-serif-kr text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            ${site.name}
          </h2>
          <p class="text-sm sm:text-base text-amber-200/90 font-medium">
            ${site.summary}
          </p>
        </div>
      </div>

      <!-- 모달 본문 콘텐츠 -->
      <div class="p-6 sm:p-8 space-y-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        <!-- 1. 역사적 배경 설명 -->
        <section class="space-y-3">
          <div class="flex items-center gap-2 border-b border-amber-500/20 pb-2">
            <span class="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            <h3 class="font-serif-kr text-lg font-bold text-slate-900 dark:text-amber-200">역사적 배경 및 의의</h3>
          </div>
          <p class="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 text-justify">
            ${site.description}
          </p>
        </section>

        <!-- 2. 주요 관람 포인트 -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 border-b border-amber-500/20 pb-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h3 class="font-serif-kr text-lg font-bold text-slate-900 dark:text-amber-200">놓쳐선 안 될 핵심 관람 포인트</h3>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${site.viewingPoints.map(point => `
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-teal-500/40 transition-colors">
                <h4 class="font-bold text-sm text-teal-700 dark:text-teal-300 mb-1 flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.789l1.599.799L9 4.323V3a1 1 0 011-1z"></path></svg>
                  ${point.title}
                </h4>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  ${point.desc}
                </p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 3. 관련 주요 인물 -->
        <section class="space-y-3">
          <div class="flex items-center gap-2 border-b border-amber-500/20 pb-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <h3 class="font-serif-kr text-lg font-bold text-slate-900 dark:text-amber-200">역사를 함께한 인물들</h3>
          </div>
          <div class="flex flex-wrap gap-2.5">
            ${site.figures.map(fig => `
              <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700">
                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500 text-white">${fig.tag}</span>
                <span class="text-xs font-bold text-slate-900 dark:text-white">${fig.name}</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">(${fig.role})</span>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 4. 내 탐방 수첩 메모 영역 -->
        <section class="space-y-2 p-4 rounded-xl bg-amber-50/50 dark:bg-slate-800/40 border border-amber-200/50 dark:border-slate-700/50">
          <label for="site-memo-input" class="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            내 탐방 메모 남기기 (현장 감상 및 기록)
          </label>
          <div class="flex gap-2">
            <input 
              type="text" 
              id="site-memo-input" 
              value="${userNote}"
              placeholder="예: 경회루 야간 관람이 너무 아름다웠음, 가족과 다시 방문할 예정"
              class="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button 
              id="save-memo-btn"
              class="px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              저장
            </button>
          </div>
        </section>

        <!-- 5. 모달 하단 액션 버튼 바 (스탬프 & 퀴즈) -->
        <div class="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <!-- 퀴즈 바로가기 버튼 -->
          <button 
            id="modal-quiz-btn"
            class="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 border border-teal-500/20 transition-all flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            이 유적지 퀴즈 도전 (${site.quizzes.length}문항)
          </button>

          <!-- 스탬프 찍기 메인 버튼 -->
          <div class="w-full sm:w-auto flex items-center justify-end" id="modal-stamp-action-wrap">
            ${isStamped ? `
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <div class="text-xs font-bold text-red-600 dark:text-red-400">탐방 완료 인장 획득됨</div>
                  <div class="text-[11px] text-slate-500">${stampData?.dateStr || '기록됨'}</div>
                </div>
                <button 
                  id="modal-stamp-btn"
                  class="px-5 py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all flex items-center gap-2"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                  스탬프 다시 찍기
                </button>
              </div>
            ` : `
              <button 
                id="modal-stamp-btn"
                class="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-xl hover:shadow-red-600/30 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2.5"
              >
                <span class="w-3 h-3 rounded-full bg-amber-300 animate-ping"></span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                탐방 완료 & 스탬프 찍기
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    // 이벤트 리스너 바인딩
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // 닫기 버튼
    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeHeritageModal());

    // 메모 저장 버튼
    document.getElementById('save-memo-btn').addEventListener('click', () => {
      const input = document.getElementById('site-memo-input');
      if (input) {
        this.state.saveNote(site.id, input.value.trim());
        this.sound.playClick();
        this.showToast('📝 탐방 메모가 저장되었습니다.');
      }
    });

    // 퀴즈 도전 버튼
    document.getElementById('modal-quiz-btn').addEventListener('click', () => {
      this.closeHeritageModal();
      this.switchTab('quiz');
      this.selectQuizSite(site.id);
    });

    // 스탬프 찍기 버튼
    document.getElementById('modal-stamp-btn').addEventListener('click', (e) => {
      this.handleStampClick(site.id, e.currentTarget);
    });

    // 탭 버튼 클릭 이벤트 바인딩
    container.querySelectorAll('.region-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openHeritageModal(btn.dataset.siteId, btn.dataset.regionId);
      });
    });
  }

  closeHeritageModal() {
    const modal = document.getElementById('heritage-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      this.state.activeSiteId = null;
    }
  }

  // 스탬프 찍기 애니메이션 및 사운드 실행
  handleStampClick(siteId, triggerBtn) {
    const site = HERITAGE_DATA.find(s => s.id === siteId);
    if (!site) return;

    // 사운드 재생 (전통 도장 쿵!)
    this.sound.playStamp();

    // 스탬프 저장
    const isNew = this.state.addStamp(siteId);

    // 스탬프 팝업 이펙트 컨테이너 생성
    this.createStampDropEffect(site);

    // 헤더 통계, 탐방수첩, 탐색 카드 갱신
    this.renderHeaderStats();
    this.renderExploreGrid();
    this.renderJournal();
    this.renderTour();

    // 모달 내 버튼 상태 갱신
    const wrap = document.getElementById('modal-stamp-action-wrap');
    if (wrap) {
      const stampData = this.state.stamps[siteId];
      wrap.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-xs font-bold text-red-600 dark:text-red-400">탐방 완료 인장 획득됨</div>
            <div class="text-[11px] text-slate-500">${stampData?.dateStr || '방금 전'}</div>
          </div>
          <button 
            id="modal-stamp-btn-renew"
            class="px-5 py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
            스탬프 다시 찍기
          </button>
        </div>
      `;
      document.getElementById('modal-stamp-btn-renew').addEventListener('click', (ev) => {
        this.handleStampClick(siteId, ev.currentTarget);
      });
    }

    if (isNew) {
      this.showToast(`㊗️ [${site.name}] 탐방 완료! 스탬프를 획득했습니다.`);
    } else {
      this.showToast(`✨ [${site.name}] 스탬프를 다시 날인했습니다.`);
    }
  }

  // 화면 중앙에 전각 도장이 쾅 찍히는 시각 애니메이션
  createStampDropEffect(site) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center pointer-events-none';
    overlay.innerHTML = `
      <div class="relative flex flex-col items-center justify-center p-8 rounded-full stamp-seal w-52 h-52 stamp-seal-stamping bg-red-600/10 border-4 border-red-600 text-red-600 shadow-2xl backdrop-blur-sm">
        <div class="ink-ripple"></div>
        <span class="text-xs font-bold tracking-widest text-red-700 dark:text-red-400 border-b border-red-500 pb-1 mb-1">
          ${site.stampSub}
        </span>
        <span class="font-serif-kr text-3xl font-extrabold tracking-widest text-red-700 dark:text-red-500">
          ${site.stampText}
        </span>
        <span class="text-[10px] mt-1 font-mono text-red-600/80 font-semibold">
          文化遺産 踏訪
        </span>
      </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.transition = 'opacity 0.4s ease';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 400);
    }, 1200);
  }

  // ==========================================
  // [3] 가상 스탬프 투어 탭 렌더링
  // ==========================================
  renderTour() {
    const container = document.getElementById('tour-timeline-container');
    if (!container) return;

    const stampCount = this.state.getStampCount();
    const totalCount = this.state.getTotalSitesCount();

    container.innerHTML = `
      <div class="space-y-6">
        <!-- 투어 안내 배너 -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-teal-900/40 via-slate-900/40 to-amber-900/30 border border-teal-500/20 backdrop-blur-sm">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-2 inline-block">
                답사 로드맵
              </span>
              <h3 class="font-serif-kr text-xl sm:text-2xl font-bold text-white mb-1">
                천년의 숨결을 잇는 한반도 역사 유람길
              </h3>
              <p class="text-sm text-slate-300">
                수도 한양의 경복궁부터 웅진 백제의 공주, 풍패지향 전주와 천년고도 경주까지, 주요 거점을 탐방하고 스탬프를 완성해보세요.
              </p>
            </div>
            <div class="flex items-center gap-3 bg-black/40 px-5 py-3 rounded-xl border border-white/10">
              <div class="text-right">
                <div class="text-xs text-slate-400">탐방 달성률</div>
                <div class="text-lg font-bold text-amber-400 font-mono">${stampCount} / ${totalCount} 완료</div>
              </div>
              <button 
                id="tour-go-journal-btn"
                class="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors"
              >
                수첩 보기
              </button>
            </div>
          </div>
        </div>

        <!-- 타임라인 코스 리스트 -->
        <div class="relative pl-6 sm:pl-8 border-l-2 border-amber-500/30 space-y-8 my-8 ml-3 sm:ml-4">
          ${HERITAGE_DATA.map((site, index) => {
            const isStamped = this.state.hasStamp(site.id);
            const stampData = this.state.stamps[site.id];

            return `
              <div class="relative group">
                <!-- 타임라인 원형 마커 -->
                <div class="absolute -left-[31px] sm:-left-[39px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                  isStamped 
                    ? 'bg-red-600 text-white ring-4 ring-red-600/30 shadow-lg' 
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-2 border-slate-400'
                }">
                  ${isStamped ? '✓' : index + 1}
                </div>

                <!-- 코스 카드 -->
                <div class="p-5 rounded-2xl border ${
                  isStamped 
                    ? 'border-red-500/30 bg-red-500/5 dark:bg-red-950/10' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                } shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div class="flex items-start gap-4">
                    <img 
                      src="${site.image}" 
                      alt="${site.name}"
                      class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-black/10 flex-shrink-0"
                      onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=1200&q=80';"
                    />
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/20">
                          ${site.era}
                        </span>
                        <span class="text-xs text-slate-500 dark:text-slate-400">${site.location}</span>
                      </div>
                      <h4 class="font-serif-kr text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        ${site.name}
                      </h4>
                      <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                        ${site.summary}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                    ${isStamped ? `
                      <span class="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-500/20">
                        ${stampData?.dateStr || '스탬프 완료'}
                      </span>
                    ` : ''}
                    <button 
                      class="tour-site-btn px-4 py-2 rounded-xl text-xs font-bold ${
                        isStamped 
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300' 
                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                      } transition-colors"
                      data-site-id="${site.id}"
                    >
                      ${isStamped ? '상세보기' : '답사하기 & 스탬프'}
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // 이벤트 바인딩
    container.querySelectorAll('.tour-site-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openHeritageModal(btn.dataset.siteId);
      });
    });

    const goJournalBtn = document.getElementById('tour-go-journal-btn');
    if (goJournalBtn) {
      goJournalBtn.addEventListener('click', () => this.switchTab('journal'));
    }
  }

  // ==========================================
  // [4] 역사 퀴즈 챌린지 탭 렌더링
  // ==========================================
  renderQuiz() {
    const filterContainer = document.getElementById('quiz-filter-container');
    const quizCard = document.getElementById('quiz-interactive-card');
    const statsContainer = document.getElementById('quiz-stats-display');
    if (!quizCard) return;

    // 1. 유적지 필터 버튼군 렌더링
    if (filterContainer) {
      filterContainer.innerHTML = `
        <button 
          class="quiz-filter-btn px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            this.currentQuizFilter === 'all' 
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
          }"
          data-filter="all"
        >
          전체 유적지 모음 (${this.flattenedQuizzes.length})
        </button>
        ${HERITAGE_DATA.map(site => `
          <button 
            class="quiz-filter-btn px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              this.currentQuizFilter === site.id 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
            }"
            data-filter="${site.id}"
          >
            ${site.name.split('(')[0].trim()} (${site.quizzes.length})
          </button>
        `).join('')}
      `;

      filterContainer.querySelectorAll('.quiz-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playClick();
          this.currentQuizFilter = btn.dataset.filter;
          this.quizIndex = 0;
          this.renderQuiz();
        });
      });
    }

    // 2. 현재 필터에 따른 퀴즈 목록 필터링
    const activeQuizzes = this.currentQuizFilter === 'all'
      ? this.flattenedQuizzes
      : this.flattenedQuizzes.filter(q => q.siteId === this.currentQuizFilter);

    if (activeQuizzes.length === 0) {
      quizCard.innerHTML = `<div class="p-8 text-center text-slate-500">해당 문화유산에 등록된 퀴즈가 없습니다.</div>`;
      return;
    }

    if (this.quizIndex >= activeQuizzes.length) {
      this.quizIndex = 0;
    }

    const currentQ = activeQuizzes[this.quizIndex];
    const isAnswered = this.state.quizStats.history[currentQ.id] !== undefined;
    const siteObj = HERITAGE_DATA.find(s => s.id === currentQ.siteId);
    const hasStampAlready = this.state.hasStamp(currentQ.siteId);

    // 3. 통계 바 갱신
    if (statsContainer) {
      const stats = this.state.quizStats;
      const rate = stats.totalSolved > 0 ? Math.round((stats.correct / stats.totalSolved) * 100) : 0;
      statsContainer.innerHTML = `
        <div class="flex items-center gap-4 text-xs">
          <span>총 푼 문제: <strong class="text-amber-500">${stats.totalSolved}</strong></span>
          <span>정답수: <strong class="text-teal-500">${stats.correct}</strong></span>
          <span>정답률: <strong class="text-rose-500">${rate}%</strong></span>
        </div>
      `;
    }

    // 4. 인터랙티브 퀴즈 카드 렌더링
    quizCard.innerHTML = `
      <div class="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-xl space-y-6">
        <!-- 퀴즈 상단 헤더 -->
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
              ${currentQ.siteEra}
            </span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">
              ${currentQ.siteName}
            </span>
          </div>
          <div class="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            문제 ${this.quizIndex + 1} / ${activeQuizzes.length}
          </div>
        </div>

        <!-- 문제 텍스트 -->
        <div class="space-y-2">
          <span class="text-xs font-bold text-rose-500 tracking-wider">QUESTION</span>
          <h3 class="font-serif-kr text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
            ${currentQ.question}
          </h3>
        </div>

        <!-- 4지선다 옵션 리스트 -->
        <div class="space-y-3" id="quiz-options-list">
          ${currentQ.options.map((option, idx) => `
            <button 
              class="quiz-option-btn w-full p-4 rounded-xl text-left text-sm font-medium border border-slate-200 dark:border-slate-700 hover:border-amber-500/60 dark:hover:border-amber-500/60 bg-slate-50 dark:bg-slate-800/70 hover:bg-amber-500/5 transition-all flex items-center justify-between group"
              data-opt-index="${idx}"
            >
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center transition-colors">
                  ${idx + 1}
                </span>
                <span class="text-slate-800 dark:text-slate-200">${option}</span>
              </div>
              <span class="quiz-option-indicator opacity-0 group-hover:opacity-100 text-xs font-bold text-amber-500 transition-opacity">
                선택
              </span>
            </button>
          `).join('')}
        </div>

        <!-- 정답 해설 및 피드백 박스 (기본 숨김) -->
        <div id="quiz-feedback-box" class="hidden p-5 rounded-xl border transition-all space-y-3">
          <!-- JS로 동적 주입 -->
        </div>

        <!-- 네비게이션 액션 버튼 -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            id="quiz-prev-btn"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            ${this.quizIndex === 0 ? 'disabled style="opacity: 0.4;"' : ''}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            이전 문제
          </button>
          
          <button 
            id="quiz-next-btn"
            class="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md"
          >
            다음 문제
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    `;

    // 보기 클릭 이벤트
    quizCard.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedIdx = parseInt(btn.dataset.optIndex, 10);
        this.handleQuizAnswer(currentQ, selectedIdx, activeQuizzes);
      });
    });

    // 다음/이전 버튼 이벤트
    const nextBtn = document.getElementById('quiz-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.sound.playClick();
        if (this.quizIndex < activeQuizzes.length - 1) {
          this.quizIndex += 1;
        } else {
          this.quizIndex = 0;
          this.showToast('🎉 마지막 문제까지 완료했습니다! 처음부터 다시 복습합니다.');
        }
        this.renderQuiz();
      });
    }

    const prevBtn = document.getElementById('quiz-prev-btn');
    if (prevBtn && this.quizIndex > 0) {
      prevBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.quizIndex -= 1;
        this.renderQuiz();
      });
    }
  }

  selectQuizSite(siteId) {
    this.currentQuizFilter = siteId;
    this.quizIndex = 0;
    this.renderQuiz();
  }

  // 퀴즈 정답 검증 및 피드백
  handleQuizAnswer(quiz, selectedIdx, activeQuizzes) {
    const isCorrect = selectedIdx === quiz.answer;
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const optionBtns = document.querySelectorAll('.quiz-option-btn');

    // 통계 기록
    this.state.recordQuiz(quiz.id, isCorrect);
    this.renderHeaderStats();

    // 보기 비활성화 및 스타일 적용
    optionBtns.forEach((btn, idx) => {
      btn.disabled = true;
      btn.classList.remove('hover:border-amber-500/60', 'hover:bg-amber-500/5');

      if (idx === quiz.answer) {
        // 정답 버튼 초록색 강조
        btn.classList.add('bg-emerald-500/20', 'border-emerald-500', 'text-emerald-700', 'dark:text-emerald-300', 'quiz-correct-pulse');
        const indicator = btn.querySelector('.quiz-option-indicator');
        if (indicator) {
          indicator.textContent = '정답 ✓';
          indicator.className = 'text-xs font-bold text-emerald-600 dark:text-emerald-400 opacity-100';
        }
      } else if (idx === selectedIdx && !isCorrect) {
        // 내가 고른 오답 붉은색 강조
        btn.classList.add('bg-rose-500/20', 'border-rose-500', 'text-rose-700', 'dark:text-rose-300', 'quiz-incorrect-shake');
        const indicator = btn.querySelector('.quiz-option-indicator');
        if (indicator) {
          indicator.textContent = '오답 ✗';
          indicator.className = 'text-xs font-bold text-rose-600 dark:text-rose-400 opacity-100';
        }
      } else {
        btn.style.opacity = '0.5';
      }
    });

    // 사운드 및 피드백 박스 렌더링
    if (isCorrect) {
      this.sound.playCorrect();

      // 자동으로 해당 유적지 스탬프 지급 연동!
      const wasStampedAlready = this.state.hasStamp(quiz.siteId);
      let stampBonusMsg = '';
      if (!wasStampedAlready) {
        this.state.addStamp(quiz.siteId);
        this.renderHeaderStats();
        this.renderExploreGrid();
        this.renderJournal();
        stampBonusMsg = `
          <div class="mt-3 p-3 rounded-lg bg-red-600/10 border border-red-600/30 flex items-center justify-between">
            <span class="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.789l1.599.799L9 4.323V3a1 1 0 011-1z"></path></svg>
              축하합니다! 퀴즈 정답 보너스로 [${quiz.siteName}] 스탬프를 자동 획득했습니다!
            </span>
            <button class="quiz-stamp-view-btn px-2.5 py-1 text-[11px] font-bold rounded bg-red-600 text-white">수첩 확인</button>
          </div>
        `;
      }

      if (feedbackBox) {
        feedbackBox.classList.remove('hidden');
        feedbackBox.className = 'p-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-slate-800 dark:text-slate-100 space-y-2';
        feedbackBox.innerHTML = `
          <div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            정답입니다! 훌륭한 역사 지식입니다.
          </div>
          <p class="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            ${quiz.explanation}
          </p>
          ${stampBonusMsg}
        `;
        const viewBtn = feedbackBox.querySelector('.quiz-stamp-view-btn');
        if (viewBtn) {
          viewBtn.addEventListener('click', () => this.switchTab('journal'));
        }
      }
    } else {
      this.sound.playIncorrect();
      if (feedbackBox) {
        feedbackBox.classList.remove('hidden');
        feedbackBox.className = 'p-5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-slate-800 dark:text-slate-100 space-y-2';
        feedbackBox.innerHTML = `
          <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            아쉽습니다! 정답은 ${quiz.answer + 1}번 [${quiz.options[quiz.answer]}] 입니다.
          </div>
          <p class="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            ${quiz.explanation}
          </p>
        `;
      }
    }
  }

  // ==========================================
  // [5] 내 탐방 수첩 (스탬프 북) 탭 렌더링
  // ==========================================
  renderJournal() {
    const count = this.state.getStampCount();
    const total = this.state.getTotalSitesCount();
    const percent = Math.round((count / total) * 100);

    // 1. 프로그레스 바 게이지 갱신
    const progressBar = document.getElementById('journal-progress-bar');
    const progressText = document.getElementById('journal-progress-text');
    const badgeTierEl = document.getElementById('journal-badge-tier');

    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
    if (progressText) {
      progressText.textContent = `${count} / ${total} 개 완료 (${percent}%)`;
    }

    // 탐방 칭호 부여
    let tierTitle = "초보 탐방객";
    let tierColor = "text-slate-400";
    if (count >= total) {
      tierTitle = "👑 문화유산 대명인 (완주 달성)";
      tierColor = "text-amber-400";
    } else if (count >= 5) {
      tierTitle = "📜 역사 애호가 (숙련자)";
      tierColor = "text-teal-400";
    } else if (count >= 2) {
      tierTitle = "🚶 삼천리 유람객 (중급자)";
      tierColor = "text-blue-400";
    }

    if (badgeTierEl) {
      badgeTierEl.innerHTML = `<span class="${tierColor} font-bold">${tierTitle}</span>`;
    }

    // 2. 스탬프 격자판 렌더링
    const grid = document.getElementById('journal-stamp-grid');
    if (!grid) return;

    grid.innerHTML = HERITAGE_DATA.map(site => {
      const isStamped = this.state.hasStamp(site.id);
      const stampData = this.state.stamps[site.id];
      const note = this.state.getNote(site.id);

      return `
        <div class="relative p-5 rounded-2xl border ${
          isStamped 
            ? 'border-red-500/40 bg-white dark:bg-slate-900/90 shadow-lg' 
            : 'border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'
        } flex flex-col justify-between min-h-[260px] transition-all hover:scale-102">
          
          <!-- 카드 상단 정보 -->
          <div class="flex items-start justify-between">
            <div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-300 border border-teal-500/20">
                ${site.era}
              </span>
              <h4 class="font-serif-kr text-base font-bold text-slate-900 dark:text-white mt-1">
                ${site.name}
              </h4>
            </div>
            <button 
              class="journal-detail-trigger text-xs text-slate-400 hover:text-teal-500 transition-colors p-1"
              data-site-id="${site.id}"
              title="상세보기"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>

          <!-- 중앙 전통 인장 도장 영역 -->
          <div class="my-4 flex items-center justify-center">
            ${isStamped ? `
              <div class="stamp-seal w-28 h-28 cursor-pointer hover:rotate-0 transition-transform">
                <span class="text-[9px] font-bold text-red-700 dark:text-red-400 tracking-wider">
                  ${site.stampSub}
                </span>
                <span class="font-serif-kr text-2xl font-black text-red-700 dark:text-red-500 tracking-widest my-0.5">
                  ${site.stampText}
                </span>
                <span class="text-[8px] font-mono font-bold text-red-600/70">
                  文化遺産
                </span>
              </div>
            ` : `
              <div class="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <svg class="w-7 h-7 mb-1 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <span class="text-[11px] font-medium">미날인</span>
              </div>
            `}
          </div>

          <!-- 하단 날짜 및 버튼 -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            ${isStamped ? `
              <div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span class="font-mono text-[11px]">${stampData?.dateStr || '방문 완료'}</span>
                <button 
                  class="journal-open-note-btn text-teal-600 dark:text-teal-400 font-bold hover:underline"
                  data-site-id="${site.id}"
                >
                  ${note ? '메모 보기' : '메모 작성'}
                </button>
              </div>
            ` : `
              <button 
                class="journal-stamp-go-btn w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-center block transition-colors shadow-sm"
                data-site-id="${site.id}"
              >
                탐방하고 스탬프 받기
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    // 이벤트 바인딩
    grid.querySelectorAll('.journal-detail-trigger, .journal-stamp-go-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openHeritageModal(btn.dataset.siteId);
      });
    });

    grid.querySelectorAll('.journal-open-note-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openHeritageModal(btn.dataset.siteId);
      });
    });
  }

  // ==========================================
  // [6] 글로벌 이벤트 바인딩
  // ==========================================
  bindEvents() {
    // 탭 클릭
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // 다크모드 토글
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // 사운드 토글
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => this.toggleSound());
    }

    // 모바일 햄버거 메뉴 토글
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        this.sound.playClick();
        mobileMenu.classList.toggle('hidden');
      });
    }

    // 검색창 실시간 입력 이벤트
    const searchInput = document.getElementById('heritage-search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        if (searchClearBtn) {
          if (this.state.searchQuery) {
            searchClearBtn.classList.remove('hidden');
          } else {
            searchClearBtn.classList.add('hidden');
          }
        }
        this.renderExploreGrid();
      });
    }

    if (searchClearBtn && searchInput) {
      searchClearBtn.addEventListener('click', () => {
        this.sound.playClick();
        searchInput.value = '';
        this.state.searchQuery = '';
        searchClearBtn.classList.add('hidden');
        this.renderExploreGrid();
        searchInput.focus();
      });
    }

    // 시대별 태그 필터 버튼 클릭
    document.querySelectorAll('.era-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sound.playClick();
        const era = btn.dataset.era;
        this.state.currentEra = era;

        // 버튼 스타일 활성화 갱신
        document.querySelectorAll('.era-filter-btn').forEach(b => {
          b.classList.remove('active-era-btn', 'bg-amber-500', 'text-slate-950', 'font-bold');
          b.classList.add('bg-slate-200/80', 'dark:bg-slate-800/80', 'text-slate-700', 'dark:text-slate-300');
        });
        btn.classList.add('active-era-btn', 'bg-amber-500', 'text-slate-950', 'font-bold');
        btn.classList.remove('bg-slate-200/80', 'dark:bg-slate-800/80', 'text-slate-700', 'dark:text-slate-300');

        this.renderExploreGrid();
      });
    });

    // 모달 배경 클릭 시 닫기
    const modal = document.getElementById('heritage-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeHeritageModal();
        }
      });
    }

    // ESC 키로 모달 닫기
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeHeritageModal();
      }
    });

    // 스탬프 초기화 버튼
    const resetBtn = document.getElementById('journal-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm("수집한 모든 스탬프 기록을 초기화하시겠습니까? (새로운 마음으로 다시 탐방을 시작할 수 있습니다)")) {
          this.state.resetStamps();
          this.sound.playClick();
          this.renderAll();
          this.showToast('🔄 모든 스탬프가 초기화되었습니다.');
        }
      });
    }
  }

  // 안내 토스트 알림 메시지
  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'fixed bottom-6 right-6 z-50 max-w-sm px-5 py-3.5 rounded-2xl shadow-2xl bg-slate-900/95 text-white border border-amber-500/40 text-xs sm:text-sm font-medium backdrop-blur-md transform translate-y-12 opacity-0 transition-all duration-300 flex items-center gap-2.5';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
      <span>${message}</span>
    `;

    toast.classList.remove('translate-y-12', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-12', 'opacity-0');
    }, 3200);
  }
}

// ==========================================
// 애플리케이션 DOM 로드 후 시작
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  window.app = new HeritageApp();
});
