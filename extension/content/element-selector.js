class ElementSelector {
  constructor() {
    this.isActive = false;
    this.selectedElements = [];
    this.hoveredElement = null;
    this.overlay = null;
    this.selectionPanel = null;
    
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    
    this.createStyles();
  }
  
  createStyles() {
    if (document.getElementById('link-checker-element-selector-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'link-checker-element-selector-styles';
    style.textContent = `
      .link-checker-highlight {
        position: absolute;
        pointer-events: none;
        border: 2px solid #007bff;
        background: rgba(0, 123, 255, 0.1);
        z-index: 9998;
        transition: all 0.1s ease;
      }
      
      .link-checker-selected {
        border-color: #28a745 !important;
        background: rgba(40, 167, 69, 0.2) !important;
      }
      
      .link-checker-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.1);
        z-index: 9997;
        cursor: crosshair;
      }
      
      .link-checker-selection-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      }
      
      .link-checker-panel-header {
        background: #007bff;
        color: white;
        padding: 12px 16px;
        border-radius: 8px 8px 0 0;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .link-checker-panel-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }
      
      .link-checker-panel-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .link-checker-panel-content {
        padding: 16px;
      }
      
      .link-checker-filter-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
      }
      
      .link-checker-filter-btn {
        padding: 4px 8px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .link-checker-filter-btn:hover {
        background: #f8f9fa;
        border-color: #007bff;
      }
      
      .link-checker-filter-btn.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }
      
      .link-checker-selected-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        margin-bottom: 12px;
      }
      
      .link-checker-selected-item {
        padding: 8px 12px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
      }
      
      .link-checker-selected-item:last-child {
        border-bottom: none;
      }
      
      .link-checker-selected-item:hover {
        background: #f8f9fa;
      }
      
      .link-checker-element-info {
        flex: 1;
        margin-right: 8px;
      }
      
      .link-checker-element-tag {
        font-weight: 600;
        color: #495057;
      }
      
      .link-checker-element-details {
        font-size: 11px;
        color: #6c757d;
        margin-top: 2px;
      }
      
      .link-checker-remove-btn {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 2px 6px;
        cursor: pointer;
        font-size: 11px;
      }
      
      .link-checker-remove-btn:hover {
        background: #c82333;
      }
      
      .link-checker-panel-actions {
        display: flex;
        gap: 8px;
      }
      
      .link-checker-action-btn {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
      }
      
      .link-checker-btn-primary {
        background: #28a745;
        color: white;
      }
      
      .link-checker-btn-primary:hover {
        background: #218838;
      }
      
      .link-checker-btn-secondary {
        background: #6c757d;
        color: white;
      }
      
      .link-checker-btn-secondary:hover {
        background: #5a6268;
      }
      
      .link-checker-instructions {
        background: #f8f9fa;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        color: #495057;
        margin-bottom: 12px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  start() {
    if (this.isActive) {
      return;
    }
    
    this.isActive = true;
    this.createOverlay();
    this.createSelectionPanel();
    this.bindEvents();
    
    // ページをスクロール不可にする
    document.body.style.overflow = 'hidden';
  }
  
  stop() {
    if (!this.isActive) {
      return;
    }
    
    this.isActive = false;
    this.removeOverlay();
    this.removeSelectionPanel();
    this.unbindEvents();
    this.clearHighlights();
    
    // ページのスクロールを復元
    document.body.style.overflow = '';
    
    // 状態をポップアップに通知
    chrome.runtime.sendMessage({
      action: 'selectionModeEnded',
      state: this.getState()
    });
  }
  
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'link-checker-overlay';
    document.body.appendChild(this.overlay);
  }
  
  removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
  
  createSelectionPanel() {
    this.selectionPanel = document.createElement('div');
    this.selectionPanel.className = 'link-checker-selection-panel';
    this.selectionPanel.innerHTML = `
      <div class="link-checker-panel-header">
        <span>要素選択</span>
        <button class="link-checker-panel-close">×</button>
      </div>
      <div class="link-checker-panel-content">
        <div class="link-checker-instructions">
          要素をクリックして選択してください。ESCキーで終了します。
        </div>
        <div class="link-checker-filter-buttons">
          <button class="link-checker-filter-btn" data-filter="div">div</button>
          <button class="link-checker-filter-btn" data-filter="main">main</button>
          <button class="link-checker-filter-btn" data-filter="article">article</button>
          <button class="link-checker-filter-btn" data-filter="section">section</button>
          <button class="link-checker-filter-btn" data-filter="p">p</button>
          <button class="link-checker-filter-btn" data-filter="nav">nav</button>
        </div>
        <div class="link-checker-selected-list" id="link-checker-selected-list">
          <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
            まだ要素が選択されていません
          </div>
        </div>
        <div class="link-checker-panel-actions">
          <button class="link-checker-action-btn link-checker-btn-secondary" id="link-checker-clear-btn">
            クリア
          </button>
          <button class="link-checker-action-btn link-checker-btn-primary" id="link-checker-done-btn">
            完了
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.selectionPanel);
    
    // パネル内のイベントリスナー
    this.selectionPanel.querySelector('.link-checker-panel-close').addEventListener('click', () => {
      this.stop();
    });
    
    this.selectionPanel.querySelector('#link-checker-clear-btn').addEventListener('click', () => {
      this.clearSelection();
    });
    
    this.selectionPanel.querySelector('#link-checker-done-btn').addEventListener('click', () => {
      this.stop();
    });
    
    // フィルターボタン
    this.selectionPanel.querySelectorAll('.link-checker-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        this.toggleFilter(filter, btn);
      });
    });
  }
  
  removeSelectionPanel() {
    if (this.selectionPanel) {
      this.selectionPanel.remove();
      this.selectionPanel = null;
    }
  }
  
  bindEvents() {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  unbindEvents() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keydown', this.handleKeyDown);
  }
  
  handleMouseMove(event) {
    if (!this.isActive) return;
    
    const element = this.getElementFromPoint(event.clientX, event.clientY);
    if (element && element !== this.hoveredElement) {
      this.highlightElement(element);
      this.hoveredElement = element;
    }
  }
  
  handleClick(event) {
    if (!this.isActive) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const element = this.getElementFromPoint(event.clientX, event.clientY);
    if (element && this.isSelectableElement(element)) {
      this.toggleElementSelection(element);
    }
  }
  
  handleKeyDown(event) {
    if (!this.isActive) return;
    
    if (event.key === 'Escape') {
      event.preventDefault();
      this.stop();
    }
  }
  
  getElementFromPoint(x, y) {
    // オーバーレイとパネルを一時的に非表示にして要素を取得
    if (this.overlay) this.overlay.style.display = 'none';
    if (this.selectionPanel) this.selectionPanel.style.display = 'none';
    
    const element = document.elementFromPoint(x, y);
    
    // 表示を復元
    if (this.overlay) this.overlay.style.display = '';
    if (this.selectionPanel) this.selectionPanel.style.display = '';
    
    return element;
  }
  
  isSelectableElement(element) {
    // 拡張機能の要素は選択できない
    if (element.closest('.link-checker-overlay, .link-checker-selection-panel')) {
      return false;
    }
    
    // 一般的なコンテナ要素のみ選択可能
    const selectableTags = ['div', 'main', 'article', 'section', 'p', 'nav', 'header', 'footer', 'aside'];
    return selectableTags.includes(element.tagName.toLowerCase());
  }
  
  highlightElement(element) {
    this.clearHighlights();
    
    if (!this.isSelectableElement(element)) {
      return;
    }
    
    const bounds = getElementBounds(element);
    
    const highlight = document.createElement('div');
    highlight.className = 'link-checker-highlight';
    highlight.style.top = bounds.top + 'px';
    highlight.style.left = bounds.left + 'px';
    highlight.style.width = bounds.width + 'px';
    highlight.style.height = bounds.height + 'px';
    
    document.body.appendChild(highlight);
  }
  
  clearHighlights() {
    document.querySelectorAll('.link-checker-highlight:not(.link-checker-selected)').forEach(el => {
      el.remove();
    });
  }
  
  toggleElementSelection(element) {
    const index = this.selectedElements.findIndex(sel => sel.element === element);
    
    if (index >= 0) {
      // 選択解除
      this.selectedElements.splice(index, 1);
      this.removeElementHighlight(element);
    } else {
      // 選択追加
      const selector = generateElementSelector(element);
      this.selectedElements.push({
        element: element,
        selector: selector,
        tagName: element.tagName.toLowerCase(),
        id: element.id || '',
        className: element.className || '',
        textContent: getDirectTextContent(element).substring(0, 50)
      });
      this.addElementHighlight(element);
    }
    
    this.updateSelectionPanel();
    this.notifySelectionChange();
  }
  
  addElementHighlight(element) {
    const bounds = getElementBounds(element);
    
    const highlight = document.createElement('div');
    highlight.className = 'link-checker-highlight link-checker-selected';
    highlight.style.top = bounds.top + 'px';
    highlight.style.left = bounds.left + 'px';
    highlight.style.width = bounds.width + 'px';
    highlight.style.height = bounds.height + 'px';
    highlight.dataset.elementId = this.generateElementId(element);
    
    document.body.appendChild(highlight);
  }
  
  removeElementHighlight(element) {
    const elementId = this.generateElementId(element);
    const highlight = document.querySelector(`[data-element-id="${elementId}"]`);
    if (highlight) {
      highlight.remove();
    }
  }
  
  generateElementId(element) {
    return btoa(generateElementSelector(element));
  }
  
  updateSelectionPanel() {
    const listEl = document.getElementById('link-checker-selected-list');
    if (!listEl) return;
    
    if (this.selectedElements.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          まだ要素が選択されていません
        </div>
      `;
      return;
    }
    
    listEl.innerHTML = this.selectedElements.map((sel, index) => `
      <div class="link-checker-selected-item">
        <div class="link-checker-element-info">
          <div class="link-checker-element-tag">&lt;${sel.tagName}&gt;</div>
          <div class="link-checker-element-details">
            ${sel.id ? `#${sel.id}` : ''}
            ${sel.className ? `.${sel.className.split(' ').join('.')}` : ''}
            ${sel.textContent ? `"${sel.textContent}..."` : ''}
          </div>
        </div>
        <button class="link-checker-remove-btn" data-index="${index}">×</button>
      </div>
    `).join('');
    
    // 削除ボタンのイベントリスナー
    listEl.querySelectorAll('.link-checker-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const selected = this.selectedElements[index];
        this.removeElementHighlight(selected.element);
        this.selectedElements.splice(index, 1);
        this.updateSelectionPanel();
        this.notifySelectionChange();
      });
    });
  }
  
  clearSelection() {
    this.selectedElements.forEach(sel => {
      this.removeElementHighlight(sel.element);
    });
    this.selectedElements = [];
    this.updateSelectionPanel();
    this.notifySelectionChange();
  }
  
  toggleFilter(tagName, button) {
    const isActive = button.classList.contains('active');
    
    // すべてのフィルターボタンを非アクティブにする
    this.selectionPanel.querySelectorAll('.link-checker-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    if (!isActive) {
      button.classList.add('active');
      // 指定されたタグの要素をすべて選択
      this.selectElementsByTag(tagName);
    }
  }
  
  selectElementsByTag(tagName) {
    const elements = document.querySelectorAll(tagName);
    
    elements.forEach(element => {
      if (this.isSelectableElement(element) && 
          !this.selectedElements.find(sel => sel.element === element)) {
        
        const selector = generateElementSelector(element);
        this.selectedElements.push({
          element: element,
          selector: selector,
          tagName: element.tagName.toLowerCase(),
          id: element.id || '',
          className: element.className || '',
          textContent: getDirectTextContent(element).substring(0, 50)
        });
        this.addElementHighlight(element);
      }
    });
    
    this.updateSelectionPanel();
    this.notifySelectionChange();
  }
  
  notifySelectionChange() {
    chrome.runtime.sendMessage({
      action: 'elementSelected',
      state: this.getState()
    });
  }
  
  getState() {
    return {
      isActive: this.isActive,
      selectedElements: this.selectedElements.map(sel => ({
        selector: sel.selector,
        tagName: sel.tagName,
        id: sel.id,
        className: sel.className,
        textContent: sel.textContent
      }))
    };
  }
}