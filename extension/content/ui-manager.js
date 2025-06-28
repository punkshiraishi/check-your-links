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
    return `
      <div class="lcp-header">
        <span class="lcp-title">🔗 リンクチェッカー Pro</span>
        <div class="lcp-controls">
          <button class="lcp-btn-minimize">－</button>
          <button class="lcp-btn-close">✕</button>
        </div>
      </div>
      <div class="lcp-tabs">
        <button class="lcp-tab active" data-tab="selection">◉ 要素選択</button>
        <button class="lcp-tab" data-tab="results">○ 結果表示</button>
        <button class="lcp-tab" data-tab="settings">○ 設定</button>
      </div>
      <div class="lcp-content">
        <div class="lcp-tab-content active" data-content="selection">
          <div class="lcp-selection-mode">
            <h3>要素選択</h3>
            <div class="lcp-info">
              <p>要素をクリックして選択するか、そのままページ全体をチェックできます</p>
            </div>
            <div class="lcp-selected-elements">
              <h4>選択中の要素:</h4>
              <ul class="lcp-selected-list"></ul>
            </div>
            <div class="lcp-status">
              <span id="lcp-status-text">準備中...</span>
            </div>
            <div class="lcp-actions">
              <button class="lcp-btn lcp-btn-primary" id="lcp-start-check">▶ チェック開始</button>
              <button class="lcp-btn" id="lcp-clear-selection">選択クリア</button>
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
              <span class="lcp-summary-item">✓ 有効: <span id="lcp-valid-count">0</span></span>
              <span class="lcp-summary-item">✗ 破損: <span id="lcp-broken-count">0</span></span>
              <span class="lcp-summary-item">↻ リダイレクト: <span id="lcp-redirect-count">0</span></span>
            </div>
            <div class="lcp-results-list"></div>
            <div class="lcp-export-actions" style="display: none;">
              <button class="lcp-btn" id="lcp-export-csv">CSV出力</button>
              <button class="lcp-btn" id="lcp-export-json">JSON出力</button>
              <button class="lcp-btn lcp-btn-primary" id="lcp-new-check">新規チェック</button>
            </div>
          </div>
        </div>
        <div class="lcp-tab-content" data-content="settings">
          <div class="lcp-settings">
            <h3>設定</h3>
            <label>
              同時チェック数:
              <input type="number" id="lcp-concurrency" min="1" max="10" value="5">
            </label>
            <label>
              タイムアウト (秒):
              <input type="number" id="lcp-timeout" min="5" max="60" value="30">
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
      const icon = tab.dataset.tab === tabName ? '◉' : '○';
      tab.innerHTML = `${icon} ${tab.textContent.substring(2)}`;
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
    
    // ElementSelectorとの連携を復元するためのイベントを発火
    if (window.linkCheckerProInstance && window.linkCheckerProInstance.elementSelector) {
      window.linkCheckerProInstance.elementSelector.updateSelectedElements();
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

  updateStatus(text) {
    const statusEl = this.panel.querySelector('#lcp-status-text');
    if (statusEl) statusEl.textContent = text;
  }

  updateSelectedElements(elements) {
    const listEl = this.panel.querySelector('.lcp-selected-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    if (elements.length === 0) {
      const item = Utils.createElement('li', 'lcp-no-selection');
      item.textContent = '要素が選択されていません（ページ全体がチェック対象）';
      listEl.appendChild(item);
    } else {
      elements.forEach(el => {
        const item = Utils.createElement('li');
        const selector = this.getElementSelector(el.element);
        const linkCount = el.links.length;
        item.textContent = `${selector} (${linkCount} リンク)`;
        listEl.appendChild(item);
      });
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
      // 常に初期状態では非表示
      this.hide();
    });
  }
}