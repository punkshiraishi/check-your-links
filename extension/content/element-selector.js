class ElementSelector {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.selectedElements = [];
    this.hoveredElement = null;
    this.isActive = false; // パネル表示時のみアクティブ
  }

  init() {
    this.attachEventListeners();
    this.updateSelectedElements();
  }

  attachEventListeners() {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    this.setupButtonListeners();
  }

  setupButtonListeners() {
    const panel = this.uiManager.panel;
    
    const manualBtn = panel.querySelector('#lcp-manual-selection');
    
    if (manualBtn) {
      manualBtn.addEventListener('click', () => {
        this.toggleSelection();
      });
    }
  }

  handleMouseOver(e) {
    if (!this.isActive) return;
    if (this.isPartOfPanel(e.target)) return;
    
    const element = this.getSelectableElement(e.target);
    if (!element) return;
    
    if (this.hoveredElement && this.hoveredElement !== element) {
      this.hoveredElement.classList.remove('lcp-highlight-hover');
    }
    
    this.hoveredElement = element;
    element.classList.add('lcp-highlight-hover');
  }

  handleMouseOut(e) {
    if (!this.isActive) return;
    if (!this.hoveredElement) return;
    
    const relatedTarget = e.relatedTarget;
    if (!relatedTarget || !this.hoveredElement.contains(relatedTarget)) {
      this.hoveredElement.classList.remove('lcp-highlight-hover');
      this.hoveredElement = null;
    }
  }

  handleClick(e) {
    if (!this.isActive) return;
    if (this.isPartOfPanel(e.target)) return;
    
    const element = this.getSelectableElement(e.target);
    if (!element) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    this.toggleElementSelection(element);
  }

  getSelectableElement(target) {
    // div, main, article, section, p などの要素を優先的に選択
    const preferredTags = ['main', 'article', 'section', 'div', 'aside', 'nav', 'header', 'footer'];
    
    let current = target;
    while (current && current !== document.body) {
      if (preferredTags.includes(current.tagName.toLowerCase())) {
        return current;
      }
      current = current.parentElement;
    }
    
    // 適切な要素が見つからない場合は元の要素を返す
    return target;
  }

  toggleElementSelection(element) {
    const index = this.selectedElements.findIndex(sel => sel.element === element);
    
    if (index > -1) {
      element.classList.remove('lcp-highlight-selected');
      this.selectedElements.splice(index, 1);
    } else {
      element.classList.add('lcp-highlight-selected');
      const links = Utils.getLinksFromElement(element);
      this.selectedElements.push({
        element,
        links
      });
    }
    
    this.updateSelectedElements();
  }

  clearSelection() {
    this.selectedElements.forEach(sel => {
      sel.element.classList.remove('lcp-highlight-selected');
    });
    this.selectedElements = [];
    this.updateSelectedElements();
  }

  removeElementByIndex(index) {
    if (index >= 0 && index < this.selectedElements.length) {
      const removedElement = this.selectedElements[index];
      removedElement.element.classList.remove('lcp-highlight-selected');
      this.selectedElements.splice(index, 1);
      this.updateSelectedElements();
    }
  }

  updateSelectedElements() {
    this.uiManager.updateSelectedElements(this.selectedElements);
  }

  getSelectedLinks() {
    if (this.selectedElements.length === 0) {
      // 何も選択されていない場合はページ全体のリンクを返す
      return Utils.getLinksFromElement(document.body);
    }
    
    const allLinks = [];
    const seen = new Set();
    
    this.selectedElements.forEach(sel => {
      sel.links.forEach(link => {
        if (!seen.has(link.url)) {
          seen.add(link.url);
          allLinks.push(link);
        }
      });
    });
    
    return allLinks;
  }

  refreshLinks() {
    // 選択済み要素のリンクを再スキャン
    this.selectedElements.forEach(sel => {
      sel.links = Utils.getLinksFromElement(sel.element);
    });
    this.updateSelectedElements();
  }

  toggleSelection() {
    this.isActive = !this.isActive;
    if (!this.isActive && this.hoveredElement) {
      this.hoveredElement.classList.remove('lcp-highlight-hover');
      this.hoveredElement = null;
    }
    this.updateSelectionButton();
  }

  activate() {
    // パネル表示時の初期化
    this.updateSelectionButton();
    this.updateSelectedElements();
  }

  deactivate() {
    this.isActive = false;
    if (this.hoveredElement) {
      this.hoveredElement.classList.remove('lcp-highlight-hover');
      this.hoveredElement = null;
    }
  }

  updateSelectionButton() {
    const panel = this.uiManager.panel;
    const manualBtn = panel.querySelector('#lcp-manual-selection');
    
    if (manualBtn) {
      if (this.isActive) {
        manualBtn.textContent = window.i18n.t('endSelection');
        manualBtn.className = 'lcp-btn lcp-btn-success';
      } else {
        manualBtn.textContent = window.i18n.t('manualSelection');
        manualBtn.className = 'lcp-btn lcp-btn-outline';
      }
    }
  }

  isPartOfPanel(element) {
    return element.closest('.lcp-panel') !== null;
  }
}