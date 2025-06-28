// メインコンテンツスクリプト
class LinkCheckerContent {
  constructor() {
    this.elementSelector = new ElementSelector();
    this.linkChecker = new LinkChecker();
    this.resultsDisplay = new ResultsDisplay();
    
    this.setupMessageListener();
    
    // ページ読み込み完了時に初期化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }
  
  initialize() {
    // 拡張機能が利用可能であることをログ出力
    console.log('Link Checker Pro: Content script loaded');
    
    // 既存の結果表示をクリア
    this.resultsDisplay.hide();
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 非同期レスポンスを許可
    });
  }
  
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'getState':
          sendResponse(this.getState());
          break;
          
        case 'startElementSelection':
          this.elementSelector.start();
          sendResponse({ success: true });
          break;
          
        case 'stopElementSelection':
          this.elementSelector.stop();
          sendResponse({ success: true });
          break;
          
        case 'startLinkCheck':
          await this.startLinkCheck();
          sendResponse({ success: true });
          break;
          
        case 'stopLinkCheck':
          this.linkChecker.stop();
          sendResponse({ success: true });
          break;
          
        case 'clearResults':
          this.resultsDisplay.hide();
          sendResponse({ success: true });
          break;
          
        case 'getResults':
          sendResponse({ results: this.linkChecker.results });
          break;
          
        case 'exportResults':
          this.exportResults(message.format);
          sendResponse({ success: true });
          break;
          
        default:
          console.warn('Unknown message action:', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  getState() {
    return {
      elementSelector: this.elementSelector.getState(),
      linkChecker: this.linkChecker.getProgress(),
      resultsVisible: this.resultsDisplay.isVisible
    };
  }
  
  async startLinkCheck() {
    const selectedElements = this.elementSelector.selectedElements;
    
    if (selectedElements.length === 0) {
      throw new Error('要素が選択されていません');
    }
    
    try {
      // 既存の結果表示をクリア
      this.resultsDisplay.hide();
      
      // リンクチェック実行
      const results = await this.linkChecker.checkLinks(selectedElements);
      
      // 結果表示
      if (results && results.length > 0) {
        // 統計を計算して結果を表示
        const stats = this.linkChecker.calculateStats(results);
        this.resultsDisplay.displayResults(stats, results);
      }
      
      return results;
    } catch (error) {
      console.error('Link check failed:', error);
      throw error;
    }
  }
  
  exportResults(format = 'csv') {
    if (!this.linkChecker.results || this.linkChecker.results.length === 0) {
      throw new Error('エクスポートする結果がありません');
    }
    
    switch (format) {
      case 'csv':
        this.resultsDisplay.exportCSV();
        break;
      case 'json':
        this.exportJSON();
        break;
      default:
        throw new Error('サポートされていない形式です');
    }
  }
  
  exportJSON() {
    const data = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      selectedElements: this.elementSelector.selectedElements.map(sel => ({
        selector: sel.selector,
        tagName: sel.tagName
      })),
      results: this.linkChecker.results.map(result => ({
        url: result.url,
        status: result.status,
        statusCode: result.statusCode,
        statusText: result.statusText,
        responseTime: result.responseTime,
        type: result.type
      })),
      summary: this.linkChecker.calculateStats(this.linkChecker.results)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `link-check-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }
}

// コンテンツスクリプトの初期化
let linkCheckerContent;

// ページ読み込み時または拡張機能注入時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    linkCheckerContent = new LinkCheckerContent();
  });
} else {
  linkCheckerContent = new LinkCheckerContent();
}

// 拡張機能のアンロード時にクリーンアップ
window.addEventListener('beforeunload', () => {
  if (linkCheckerContent) {
    linkCheckerContent.resultsDisplay.hide();
    if (linkCheckerContent.elementSelector.isActive) {
      linkCheckerContent.elementSelector.stop();
    }
  }
});