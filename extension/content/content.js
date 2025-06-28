class LinkCheckerPro {
  constructor() {
    this.uiManager = null;
    this.elementSelector = null;
    this.linkChecker = null;
    this.resultsDisplay = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    await this.waitForDOMReady();
    
    this.uiManager = new UIManager();
    this.uiManager.init();
    
    this.elementSelector = new ElementSelector(this.uiManager);
    this.elementSelector.init();
    
    this.linkChecker = new LinkChecker(this.uiManager, this.elementSelector);
    this.linkChecker.init();
    
    this.resultsDisplay = new ResultsDisplay(this.uiManager, this.linkChecker);
    this.resultsDisplay.init();
    
    this.attachMessageListener();
    this.isInitialized = true;
    
    console.log('リンクチェッカー Pro が初期化されました');
  }

  waitForDOMReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  attachMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'togglePanel':
          this.togglePanel();
          break;
        case 'startSelection':
          this.elementSelector.startSelection();
          break;
        case 'getSelectedElements':
          sendResponse(this.elementSelector.selectedElements);
          break;
        case 'checkSelectedLinks':
          this.linkChecker.startCheck();
          break;
        default:
          break;
      }
    });
  }

  togglePanel() {
    if (this.uiManager.panel.style.display === 'none') {
      this.uiManager.show();
    } else {
      this.uiManager.hide();
    }
  }

  destroy() {
    if (this.elementSelector) {
      this.elementSelector.clearSelection();
    }
    
    if (this.uiManager && this.uiManager.panel) {
      this.uiManager.panel.remove();
    }
    
    this.isInitialized = false;
  }
}

let linkCheckerProInstance = null;

function initializeLinkCheckerPro() {
  if (linkCheckerProInstance) {
    linkCheckerProInstance.destroy();
  }
  
  linkCheckerProInstance = new LinkCheckerPro();
  linkCheckerProInstance.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLinkCheckerPro);
} else {
  initializeLinkCheckerPro();
}

window.addEventListener('beforeunload', () => {
  if (linkCheckerProInstance) {
    linkCheckerProInstance.destroy();
  }
});