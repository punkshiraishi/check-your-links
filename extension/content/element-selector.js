class ElementSelector {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.selectedElements = [];
    this.hoveredElement = null;
    this.isActive = true; // 常にアクティブ
  }

  init() {
    this.attachEventListeners();
    this.updateStatus();
  }

  attachEventListeners() {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    const panel = this.uiManager.panel;
    const clearBtn = panel.querySelector('#lcp-clear-selection');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearSelection();
      });
    }
  }

  handleMouseOver(e) {
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
    if (!this.hoveredElement) return;
    
    const relatedTarget = e.relatedTarget;
    if (!relatedTarget || !this.hoveredElement.contains(relatedTarget)) {
      this.hoveredElement.classList.remove('lcp-highlight-hover');
      this.hoveredElement = null;
    }
  }

  handleClick(e) {
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
    this.updateStatus();
  }

  clearSelection() {
    this.selectedElements.forEach(sel => {
      sel.element.classList.remove('lcp-highlight-selected');
    });
    this.selectedElements = [];
    this.updateSelectedElements();
    this.updateStatus();
  }

  updateSelectedElements() {
    this.uiManager.updateSelectedElements(this.selectedElements);
  }

  updateStatus() {
    if (this.selectedElements.length === 0) {
      const allLinks = Utils.getLinksFromElement(document.body);
      this.uiManager.updateStatus(`ページ内に ${allLinks.length} 個のリンクがあります。要素をクリックして範囲を選択できます。`);
    } else {
      const totalLinks = this.selectedElements.reduce((sum, sel) => sum + sel.links.length, 0);
      this.uiManager.updateStatus(`${this.selectedElements.length} 個の要素を選択中（計 ${totalLinks} 個のリンク）`);
    }
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
    this.updateStatus();
  }

  isPartOfPanel(element) {
    return element.closest('.lcp-panel') !== null;
  }
}