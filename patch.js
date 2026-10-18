const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let code = fs.readFileSync(filePath, 'utf-8');

// 1. Replace renderExploreGrid
const newRenderExploreGrid = `
  renderExploreGrid() {
    const grid = document.getElementById('heritage-cards-grid');
    if (!grid) return;

    grid.innerHTML = \`
      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/South_Korea_location_map.svg" class="absolute inset-0 w-full h-full object-cover sm:object-contain opacity-50 dark:opacity-30 dark:invert" />
      \${REGION_DATA.map(region => {
        const isStamped = region.sites.every(siteId => this.state.hasStamp(siteId));
        const pos = region.mapPos || { top: '50%', left: '50%' };
        return \\\`
          <div 
            class="heritage-card absolute flex flex-col items-center justify-center cursor-pointer group transform hover:scale-110 transition-transform z-10"
            style="top: \\\${pos.top}; left: \\\${pos.left}; margin-top: -20px; margin-left: -20px;"
            data-region-id="\\\${region.id}"
            role="button"
            tabindex="0"
          >
            <div class="relative">
              <svg class="w-10 h-10 \\\${isStamped ? 'text-red-500' : 'text-teal-600'} drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              \\\${isStamped ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border border-white rounded-full animate-pulse"></div>' : ''}
            </div>
            <div class="mt-1 px-2 py-0.5 bg-white/90 dark:bg-slate-800/90 rounded shadow text-[11px] font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap border border-slate-200 dark:border-slate-700 group-hover:border-teal-500">
              \\\${region.name.split('(')[0].trim()}
            </div>
          </div>
        \\\`;
      }).join('')}
    \`;

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

    if (region.displayType === 'single' || region.displayType === 'tabs') {
      this.openHeritageModal(region.sites[0], regionId);
      return;
    }

    const modal = document.getElementById('heritage-modal');
    const container = document.getElementById('modal-content-container');
    
    container.innerHTML = \`
      <div class="relative w-full bg-slate-900 p-6 sm:p-10">
        <button 
          id="modal-close-btn"
          class="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 hover:scale-105 transition-all"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 class="font-serif-kr text-2xl sm:text-4xl font-bold text-white mb-2">
          \${region.name} 탐방
        </h2>
        <p class="text-amber-200/90 mb-8">어느 유적지를 탐방하시겠습니까?</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          \${region.sites.map(sId => {
            const s = HERITAGE_DATA.find(x => x.id === sId);
            return \\\`
              <div 
                class="region-card-btn bg-slate-800 hover:bg-slate-700 rounded-xl overflow-hidden cursor-pointer border border-slate-700 transition-all hover:-translate-y-1"
                data-site-id="\\\${sId}"
              >
                <img src="\\\${s.image}" class="w-full h-32 object-cover" />
                <div class="p-4">
                  <h3 class="font-bold text-white text-lg">\\\${s.name}</h3>
                  <p class="text-sm text-slate-400 mt-1">\\\${s.summary}</p>
                </div>
              </div>
            \\\`;
          }).join('')}
        </div>
      </div>
    \`;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeHeritageModal());
    
    container.querySelectorAll('.region-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openHeritageModal(btn.dataset.siteId);
      });
    });
  }
`;

// Replace renderExploreGrid
code = code.replace(/renderExploreGrid\(\) \{[\s\S]*?\/\/ 카드\(마커\) 클릭 이벤트 바인딩[\s\S]*?\}\);[\s]*\}/, newRenderExploreGrid.trim());


// 2. modify openHeritageModal
const modalDecl = 'openHeritageModal(siteId) {';
const newModalDecl = `openHeritageModal(siteId, regionId = null) {`;
code = code.replace(modalDecl, newModalDecl);

const containerInnerHTMLIdx = code.indexOf('container.innerHTML = `');
const tabsInjection = `
    let tabsHTML = '';
    if (regionId) {
      const region = REGION_DATA.find(r => r.id === regionId);
      if (region && region.displayType === 'tabs') {
        tabsHTML = \\\`
          <div class="flex flex-wrap bg-slate-900 border-b border-slate-800 p-3 gap-2">
            \\\${region.sites.map(sId => {
              const s = HERITAGE_DATA.find(x => x.id === sId);
              const isActive = sId === siteId;
              return \\\\\\\`
                <button 
                  class="region-tab-btn px-4 py-2 text-sm font-bold rounded-lg transition-colors \\\\\\\${isActive ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
                  data-site-id="\\\\\\\${sId}"
                  data-region-id="\\\\\\\${regionId}"
                >
                  \\\\\\\${s.era.split(' ')[0]} (\\\\\\\${s.name.split('(')[0].trim()})
                </button>
              \\\\\\\`;
            }).join('')}
          </div>
        \\\`;
      }
    }

    container.innerHTML = tabsHTML + \`
`;

code = code.replace('container.innerHTML = `', tabsInjection.trim() + '\n');

// 3. Add event listeners for the tabs inside openHeritageModal
const eventsEndIdx = code.indexOf(`document.getElementById('modal-stamp-btn').addEventListener('click', (e) => {`);
const tabEventsInjection = `
    container.querySelectorAll('.region-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openHeritageModal(btn.dataset.siteId, btn.dataset.regionId);
      });
    });

    `;
code = code.slice(0, eventsEndIdx) + tabEventsInjection + code.slice(eventsEndIdx);

fs.writeFileSync(filePath, code);
console.log('Successfully patched app.js');
