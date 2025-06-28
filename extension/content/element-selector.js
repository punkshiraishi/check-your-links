class ElementSelector {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.isSelecting = false;
    this.selectedElements = [];
    this.currentFilter = '*';
    this.hoveredElement = null;
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    const panel = this.uiManager.panel;
    panel.querySelectorAll('.lcp-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setFilter(btn.dataset.filter);
        panel.querySelectorAll('.lcp-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    panel.querySelector('#lcp-clear-selection').addEventListener('click', () => {
      this.clearSelection();
    });
  }

  startSelection() {
    this.isSelecting = true;
    this.uiManager.updateStatus('要素をクリックして選択してください');
    document.body.style.cursor = 'pointer';
  }

  stopSelection() {
    this.isSelecting = false;
    document.body.style.cursor = '';
    if (this.hoveredElement) {
      this.hoveredElement.classList.remove('lcp-highlight-hover');
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.startSelection();
  }

  handleMouseOver(e) {
    if (!this.isSelecting) return;
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
    if (!this.isSelecting) return;
    if (!this.hoveredElement) return;
    
    const relatedTarget = e.relatedTarget;
    if (!relatedTarget || !this.hoveredElement.contains(relatedTarget)) {
      this.hoveredElement.classList.remove('lcp-highlight-hover');
      this.hoveredElement = null;
    }
  }

  handleClick(e) {
    if (!this.isSelecting) return;
    if (this.isPartOfPanel(e.target)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = this.getSelectableElement(e.target);
    if (!element) return;
    
    this.toggleElementSelection(element);
  }

  getSelectableElement(target) {
    if (this.currentFilter === '*') {
      return target;
    }
    
    let current = target;
    while (current && current !== document.body) {
      if (current.tagName.toLowerCase() === this.currentFilter) {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
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
    
    this.uiManager.updateSelectedElements(this.selectedElements);
  }

  clearSelection() {
    this.selectedElements.forEach(sel => {
      sel.element.classList.remove('lcp-highlight-selected');
    });
    this.selectedElements = [];
    this.uiManager.updateSelectedElements([]);
    this.stopSelection();
  }

  getSelectedLinks() {
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

  isPartOfPanel(element) {
    return element.closest('.lcp-panel') !== null;
  }
}