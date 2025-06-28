class UIManager {
  constructor() {
    this.panel = null;
    this.isMinimized = false;
    this.currentTab = 'selection';
    this.position = { x: 20, y: 20 };
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
  }

  init() {
    this.createPanel();
    this.attachEventListeners();
    this.restoreState();
  }

  createPanel() {
    this.panel = Utils.createElement('div', 'lcp-panel');
    this.panel.innerHTML = this.createPanelContent();

    document.body.appendChild(this.panel);
    
    // 初期状態で非表示
    this.hide();
  }

  createPanelContent() {
    const i18n = window.i18n;
    return `
      <div class="lcp-header">
        <span class="lcp-title">${i18n.t('title')}</span>
        <div class="lcp-controls">
          <button class="lcp-btn-minimize">－</button>
          <button class="lcp-btn-close">✕</button>
        </div>
      </div>
      <div class="lcp-tabs">
        <button class="lcp-tab active" data-tab="selection">${i18n.t('tabs.selection')}</button>
        <button class="lcp-tab" data-tab="results">${i18n.t('tabs.results')}</button>
        <button class="lcp-tab" data-tab="settings">${i18n.t('tabs.settings')}</button>
      </div>
      <div class="lcp-content">
        <div class="lcp-tab-content active" data-content="selection">
          <div class="lcp-selection-mode">
            <div class="lcp-section">
              <div class="lcp-control-buttons">
                <button class="lcp-btn lcp-btn-outline" id="lcp-manual-selection">${i18n.t('manualSelection')}</button>
              </div>
            </div>

            <div class="lcp-section">
              <div class="lcp-selected-elements">
                <div class="lcp-selected-container">
                  <ul class="lcp-selected-list"></ul>
                </div>
              </div>
            </div>

            <div class="lcp-section lcp-action-section">
              <button class="lcp-btn lcp-btn-primary lcp-btn-large" id="lcp-start-check">${i18n.t('startCheck')}</button>
            </div>
          </div>
        </div>
        <div class="lcp-tab-content" data-content="results">
          <div class="lcp-results">
            <div class="lcp-progress" style="display: none;">
              <div class="lcp-progress-bar">
                <div class="lcp-progress-fill"></div>
              </div>
              <span class="lcp-progress-text">0%</span>
            </div>
            <div class="lcp-summary">
              <span class="lcp-summary-item">✓ ${i18n.t('valid')}: <span id="lcp-valid-count">0</span></span>
              <span class="lcp-summary-item">✗ ${i18n.t('broken')}: <span id="lcp-broken-count">0</span></span>
              <span class="lcp-summary-item">↻ ${i18n.t('redirect')}: <span id="lcp-redirect-count">0</span></span>
            </div>
            <div class="lcp-results-list"></div>
            <div class="lcp-export-actions" style="display: none;">
              <button class="lcp-btn lcp-btn-primary" id="lcp-new-check">${i18n.t('newCheck')}</button>
            </div>
          </div>
        </div>
        <div class="lcp-tab-content" data-content="settings">
          <div class="lcp-settings">
            <label>
              ${i18n.t('timeout')}:
              <input type="number" id="lcp-timeout" min="5" max="60" value="30">
            </label>
            <label>
              ${i18n.t('interval')}:
              <input type="number" id="lcp-interval" min="100" max="5000" value="100">
            </label>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const header = this.panel.querySelector('.lcp-header');
    header.addEventListener('mousedown', this.startDrag.bind(this));
    
    this.panel.querySelector('.lcp-btn-minimize').addEventListener('click', () => this.toggleMinimize());
    this.panel.querySelector('.lcp-btn-close').addEventListener('click', () => this.hide());
    
    this.panel.querySelectorAll('.lcp-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // 設定値の変更を監視
    this.panel.querySelector('#lcp-timeout').addEventListener('change', () => this.saveSettings());
    this.panel.querySelector('#lcp-interval').addEventListener('change', () => this.saveSettings());

    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
  }

  startDrag(e) {
    if (e.target.classList.contains('lcp-btn-minimize') || e.target.classList.contains('lcp-btn-close')) {
      return;
    }
    this.isDragging = true;
    this.dragOffset = {
      x: e.clientX - this.position.x,
      y: e.clientY - this.position.y
    };
    this.panel.style.cursor = 'move';
  }

  drag(e) {
    if (!this.isDragging) return;
    
    this.position = {
      x: e.clientX - this.dragOffset.x,
      y: e.clientY - this.dragOffset.y
    };
    
    this.panel.style.left = `${this.position.x}px`;
    this.panel.style.top = `${this.position.y}px`;
  }

  stopDrag() {
    this.isDragging = false;
    this.panel.style.cursor = '';
    this.saveState();
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    this.panel.querySelectorAll('.lcp-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    this.panel.querySelectorAll('.lcp-tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.content === tabName);
    });
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.panel.classList.add('minimized');
      this.panel.innerHTML = '<div class="lcp-minimized">🔗 <span class="lcp-badge">0</span></div>';
      this.panel.querySelector('.lcp-minimized').addEventListener('click', () => this.toggleMinimize());
    } else {
      this.panel.classList.remove('minimized');
      this.restoreFullPanel();
    }
    this.saveState();
  }

  restoreFullPanel() {
    this.panel.innerHTML = this.createPanelContent();
    this.attachEventListeners();
    
    // 設定値を復元
    this.loadSettings();
    
    // ElementSelectorとの連携を復元するためのイベントを発火
    if (window.linkCheckerProInstance && window.linkCheckerProInstance.elementSelector) {
      window.linkCheckerProInstance.elementSelector.setupButtonListeners();
      window.linkCheckerProInstance.elementSelector.updateSelectedElements();
      window.linkCheckerProInstance.elementSelector.updateSelectionButton();
    }
  }

  show() {
    this.panel.style.display = 'block';
    this.saveState();
  }

  hide() {
    this.panel.style.display = 'none';
    this.saveState();
  }

  toggle() {
    if (this.panel.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }


  updateSelectedElements(elements) {
    const listEl = this.panel.querySelector('.lcp-selected-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    if (elements.length === 0) {
      // ページ全体選択時
      const item = Utils.createElement('li');
      const allLinks = Utils.getLinksFromElement(document.body);
      
      item.innerHTML = `
        <div class="lcp-element-info">
          <span class="lcp-element-name">${window.i18n.t('pageWide')}</span>
          <span class="lcp-element-count">${allLinks.length} ${window.i18n.t('links')}</span>
        </div>
      `;
      listEl.appendChild(item);
    } else {
      // 手動選択要素がある時
      elements.forEach((el, index) => {
        const item = Utils.createElement('li');
        const selector = this.getElementSelector(el.element);
        const linkCount = el.links.length;
        
        item.innerHTML = `
          <div class="lcp-element-info">
            <span class="lcp-element-name">${selector}</span>
            <span class="lcp-element-count">${linkCount} ${window.i18n.t('links')}</span>
          </div>
          <button class="lcp-remove-btn" data-index="${index}">×</button>
        `;
        listEl.appendChild(item);
      });
      
      // バツボタンのイベントリスナーを追加
      this.attachRemoveButtonListeners();
    }
  }

  attachRemoveButtonListeners() {
    const removeButtons = this.panel.querySelectorAll('.lcp-remove-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.removeElementByIndex(index);
      });
    });
  }

  removeElementByIndex(index) {
    // ElementSelectorに削除を依頼
    if (window.linkCheckerProInstance && window.linkCheckerProInstance.elementSelector) {
      window.linkCheckerProInstance.elementSelector.removeElementByIndex(index);
    }
  }

  getElementSelector(element) {
    let selector = element.tagName.toLowerCase();
    if (element.id) {
      selector = '#' + element.id;
    } else if (element.className) {
      const classes = element.className.split(' ')
        .filter(cls => cls && !cls.startsWith('lcp-'))
        .slice(0, 2)
        .join('.');
      if (classes) {
        selector += '.' + classes;
      }
    }
    return selector;
  }


  saveState() {
    chrome.storage.local.set({
      lcpState: {
        position: this.position,
        isMinimized: this.isMinimized,
        currentTab: this.currentTab,
        isVisible: this.panel.style.display !== 'none'
      }
    });
  }

  getPageKey() {
    // URLのホスト名とパス名を組み合わせてページキーを作成
    const url = new URL(window.location.href);
    return `${url.hostname}${url.pathname}`;
  }

  saveSettings() {
    const pageKey = this.getPageKey();
    const timeout = parseInt(this.panel.querySelector('#lcp-timeout').value) || 30;
    const interval = parseInt(this.panel.querySelector('#lcp-interval').value) || 100;
    
    chrome.storage.local.set({
      [`lcpSettings_${pageKey}`]: {
        timeout,
        interval
      }
    });
  }

  loadSettings() {
    const pageKey = this.getPageKey();
    chrome.storage.local.get(`lcpSettings_${pageKey}`, (data) => {
      const settings = data[`lcpSettings_${pageKey}`];
      if (settings) {
        const timeoutInput = this.panel.querySelector('#lcp-timeout');
        const intervalInput = this.panel.querySelector('#lcp-interval');
        
        if (timeoutInput) timeoutInput.value = settings.timeout || 30;
        if (intervalInput) intervalInput.value = settings.interval || 100;
      }
    });
  }

  restoreState() {
    chrome.storage.local.get('lcpState', (data) => {
      if (data.lcpState) {
        const state = data.lcpState;
        this.position = state.position || this.position;
        this.panel.style.left = `${this.position.x}px`;
        this.panel.style.top = `${this.position.y}px`;
        
        if (state.isMinimized) {
          this.toggleMinimize();
        }
        
        if (state.currentTab) {
          this.switchTab(state.currentTab);
        }
      }
      // 設定値を復元
      this.loadSettings();
      // 常に初期状態では非表示
      this.hide();
    });
  }
}