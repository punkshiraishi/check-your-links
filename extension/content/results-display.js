class ResultsDisplay {
  constructor() {
    this.results = [];
    this.isVisible = false;
    this.panel = null;
    this.createStyles();
  }
  
  createStyles() {
    if (document.getElementById('link-checker-results-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'link-checker-results-styles';
    style.textContent = `
      .link-checker-result-highlight {
        outline: 3px solid transparent !important;
        outline-offset: 2px !important;
        position: relative !important;
        transition: all 0.3s ease !important;
      }
      
      .link-checker-result-valid {
        outline-color: #28a745 !important;
        background-color: rgba(40, 167, 69, 0.1) !important;
      }
      
      .link-checker-result-broken {
        outline-color: #dc3545 !important;
        background-color: rgba(220, 53, 69, 0.1) !important;
      }
      
      .link-checker-result-warning {
        outline-color: #ffc107 !important;
        background-color: rgba(255, 193, 7, 0.1) !important;
      }
      
      .link-checker-result-tooltip {
        position: absolute;
        top: -35px;
        left: 0;
        background: #333;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      
      .link-checker-result-highlight:hover .link-checker-result-tooltip {
        opacity: 1;
      }
      
      .link-checker-results-panel {
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        width: 350px;
        max-height: 80vh;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        overflow: hidden;
      }
      
      .link-checker-results-header {
        background: #28a745;
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }
      
      .link-checker-results-close {
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
      
      .link-checker-results-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .link-checker-results-summary {
        padding: 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
      }
      
      .link-checker-summary-stats {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      
      .link-checker-stat {
        text-align: center;
        flex: 1;
      }
      
      .link-checker-stat-number {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .link-checker-stat-label {
        font-size: 12px;
        color: #666;
      }
      
      .link-checker-stat-valid .link-checker-stat-number { color: #28a745; }
      .link-checker-stat-broken .link-checker-stat-number { color: #dc3545; }
      .link-checker-stat-warning .link-checker-stat-number { color: #ffc107; }
      
      .link-checker-results-actions {
        display: flex;
        gap: 8px;
      }
      
      .link-checker-action-btn {
        flex: 1;
        padding: 6px 12px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .link-checker-action-btn:hover {
        background: #f8f9fa;
        border-color: #007bff;
      }
      
      .link-checker-results-content {
        max-height: 400px;
        overflow-y: auto;
        padding: 0;
      }
      
      .link-checker-results-tabs {
        display: flex;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
      }
      
      .link-checker-tab {
        flex: 1;
        padding: 8px 12px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
      }
      
      .link-checker-tab.active {
        background: white;
        border-bottom-color: #007bff;
        font-weight: 600;
      }
      
      .link-checker-tab:hover:not(.active) {
        background: #e9ecef;
      }
      
      .link-checker-results-list {
        padding: 0;
      }
      
      .link-checker-result-item {
        padding: 12px 16px;
        border-bottom: 1px solid #e9ecef;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .link-checker-result-item:hover {
        background: #f8f9fa;
      }
      
      .link-checker-result-item:last-child {
        border-bottom: none;
      }
      
      .link-checker-result-url {
        font-size: 13px;
        color: #007bff;
        text-decoration: none;
        word-break: break-all;
        margin-bottom: 4px;
        display: block;
      }
      
      .link-checker-result-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #666;
      }
      
      .link-checker-result-status {
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 500;
        color: white;
      }
      
      .link-checker-status-valid { background: #28a745; }
      .link-checker-status-broken { background: #dc3545; }
      .link-checker-status-warning { background: #ffc107; color: #333; }
      
      .link-checker-no-results {
        padding: 20px;
        text-align: center;
        color: #666;
        font-size: 13px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  displayResults(results, detailedResults) {
    this.results = detailedResults || [];
    this.highlightLinksOnPage();
    this.showResultsPanel(results);
  }
  
  highlightLinksOnPage() {
    // 既存のハイライトをクリア
    this.clearHighlights();
    
    this.results.forEach(result => {
      if (result.element) {
        this.highlightElement(result.element, result.status);
      }
    });
  }
  
  highlightElement(element, status) {
    element.classList.add('link-checker-result-highlight');
    
    // ステータスに応じたクラスを追加
    if (status === 'valid') {
      element.classList.add('link-checker-result-valid');
    } else if (status === 'broken' || status === 'error' || status === 'server_error') {
      element.classList.add('link-checker-result-broken');
    } else {
      element.classList.add('link-checker-result-warning');
    }
    
    // ツールチップを追加
    const tooltip = document.createElement('div');
    tooltip.className = 'link-checker-result-tooltip';
    
    const result = this.results.find(r => r.element === element);
    if (result) {
      tooltip.textContent = `${result.statusCode} ${result.statusText} (${result.responseTime}ms)`;
    }
    
    element.style.position = 'relative';
    element.appendChild(tooltip);
  }
  
  clearHighlights() {
    // ハイライトクラスを削除
    document.querySelectorAll('.link-checker-result-highlight').forEach(element => {
      element.classList.remove(
        'link-checker-result-highlight',
        'link-checker-result-valid',
        'link-checker-result-broken',
        'link-checker-result-warning'
      );
      
      // ツールチップを削除
      const tooltip = element.querySelector('.link-checker-result-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    });
  }
  
  showResultsPanel(results) {
    this.hideResultsPanel();
    
    const validCount = results.find(r => r.status === 'valid')?.count || 0;
    const brokenCount = results.find(r => r.status === 'broken')?.count || 0;
    const warningCount = results.find(r => r.status === 'warning')?.count || 0;
    const totalCount = validCount + brokenCount + warningCount;
    
    this.panel = document.createElement('div');
    this.panel.className = 'link-checker-results-panel';
    this.panel.innerHTML = `
      <div class="link-checker-results-header">
        <span>チェック結果 (${totalCount}件)</span>
        <button class="link-checker-results-close">×</button>
      </div>
      
      <div class="link-checker-results-summary">
        <div class="link-checker-summary-stats">
          <div class="link-checker-stat link-checker-stat-valid">
            <div class="link-checker-stat-number">${validCount}</div>
            <div class="link-checker-stat-label">有効</div>
          </div>
          <div class="link-checker-stat link-checker-stat-broken">
            <div class="link-checker-stat-number">${brokenCount}</div>
            <div class="link-checker-stat-label">破損</div>
          </div>
          <div class="link-checker-stat link-checker-stat-warning">
            <div class="link-checker-stat-number">${warningCount}</div>
            <div class="link-checker-stat-label">警告</div>
          </div>
        </div>
        
        <div class="link-checker-results-actions">
          <button class="link-checker-action-btn" id="link-checker-export-csv">CSV出力</button>
          <button class="link-checker-action-btn" id="link-checker-copy-broken">破損リンクをコピー</button>
          <button class="link-checker-action-btn" id="link-checker-clear-highlights">ハイライト解除</button>
        </div>
      </div>
      
      <div class="link-checker-results-tabs">
        <button class="link-checker-tab active" data-tab="all">全て (${totalCount})</button>
        <button class="link-checker-tab" data-tab="broken">破損 (${brokenCount})</button>
        <button class="link-checker-tab" data-tab="warning">警告 (${warningCount})</button>
      </div>
      
      <div class="link-checker-results-content">
        <div class="link-checker-results-list" id="link-checker-results-list">
          ${this.renderResultsList('all')}
        </div>
      </div>
    `;
    
    document.body.appendChild(this.panel);
    this.isVisible = true;
    
    this.bindPanelEvents();
  }
  
  bindPanelEvents() {
    if (!this.panel) return;
    
    // 閉じるボタン
    this.panel.querySelector('.link-checker-results-close').addEventListener('click', () => {
      this.hideResultsPanel();
    });
    
    // タブ切り替え
    this.panel.querySelectorAll('.link-checker-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab, tab);
      });
    });
    
    // アクションボタン
    this.panel.querySelector('#link-checker-export-csv').addEventListener('click', () => {
      this.exportCSV();
    });
    
    this.panel.querySelector('#link-checker-copy-broken').addEventListener('click', () => {
      this.copyBrokenLinks();
    });
    
    this.panel.querySelector('#link-checker-clear-highlights').addEventListener('click', () => {
      this.clearHighlights();
    });
    
    // 結果アイテムのクリック（スクロール）
    this.panel.querySelectorAll('.link-checker-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        this.scrollToLink(url);
      });
    });
  }
  
  switchTab(tabName, tabButton) {
    // タブボタンの状態を更新
    this.panel.querySelectorAll('.link-checker-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    tabButton.classList.add('active');
    
    // リスト内容を更新
    const listEl = this.panel.querySelector('#link-checker-results-list');
    listEl.innerHTML = this.renderResultsList(tabName);
    
    // 新しいリストのイベントリスナーを設定
    listEl.querySelectorAll('.link-checker-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        this.scrollToLink(url);
      });
    });
  }
  
  renderResultsList(filter) {
    let filteredResults = this.results;
    
    if (filter === 'broken') {
      filteredResults = this.results.filter(r => 
        r.status === 'broken' || r.status === 'error' || r.status === 'server_error'
      );
    } else if (filter === 'warning') {
      filteredResults = this.results.filter(r => 
        r.status === 'redirect' || r.status === 'timeout'
      );
    }
    
    if (filteredResults.length === 0) {
      return '<div class="link-checker-no-results">該当するリンクはありません</div>';
    }
    
    return filteredResults.map(result => {
      const statusClass = this.getStatusClass(result.status);
      const statusText = this.getStatusText(result.status);
      
      return `
        <div class="link-checker-result-item" data-url="${result.url}">
          <a href="${result.url}" class="link-checker-result-url" target="_blank" rel="noopener">
            ${this.truncateUrl(result.url, 40)}
          </a>
          <div class="link-checker-result-info">
            <span>${result.responseTime}ms</span>
            <span class="link-checker-result-status ${statusClass}">
              ${statusText}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }
  
  getStatusClass(status) {
    if (status === 'valid') return 'link-checker-status-valid';
    if (status === 'broken' || status === 'error' || status === 'server_error') {
      return 'link-checker-status-broken';
    }
    return 'link-checker-status-warning';
  }
  
  getStatusText(status) {
    const statusTexts = {
      'valid': '有効',
      'broken': '破損',
      'error': 'エラー',
      'server_error': 'サーバーエラー',
      'redirect': 'リダイレクト',
      'timeout': 'タイムアウト'
    };
    return statusTexts[status] || '不明';
  }
  
  truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  }
  
  scrollToLink(url) {
    const result = this.results.find(r => r.url === url);
    if (result && result.element) {
      result.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // 一時的にハイライトを強調
      result.element.style.boxShadow = '0 0 10px #007bff';
      setTimeout(() => {
        result.element.style.boxShadow = '';
      }, 2000);
    }
  }
  
  exportCSV() {
    const headers = ['URL', 'ステータス', 'ステータスコード', 'レスポンス時間(ms)', 'タイプ'];
    const rows = this.results.map(result => [
      result.url,
      this.getStatusText(result.status),
      result.statusCode,
      result.responseTime,
      result.type || 'anchor'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `link-check-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  }
  
  copyBrokenLinks() {
    const brokenLinks = this.results
      .filter(r => r.status === 'broken' || r.status === 'error' || r.status === 'server_error')
      .map(r => r.url)
      .join('\n');
    
    if (brokenLinks) {
      navigator.clipboard.writeText(brokenLinks).then(() => {
        // 一時的にボタンテキストを変更
        const button = this.panel.querySelector('#link-checker-copy-broken');
        const originalText = button.textContent;
        button.textContent = 'コピー完了!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy broken links:', err);
      });
    }
  }
  
  hideResultsPanel() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
      this.isVisible = false;
    }
  }
  
  hide() {
    this.clearHighlights();
    this.hideResultsPanel();
  }
}