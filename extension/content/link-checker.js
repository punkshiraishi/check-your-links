class LinkChecker {
  constructor(uiManager, elementSelector) {
    this.uiManager = uiManager;
    this.elementSelector = elementSelector;
    this.httpChecker = new HttpChecker();
    this.isChecking = false;
    this.results = [];
    this.currentProgress = 0;
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    const panel = this.uiManager.panel;
    
    panel.querySelector('#lcp-start-check').addEventListener('click', () => {
      this.startCheck();
    });
    
    panel.querySelector('#lcp-new-check').addEventListener('click', () => {
      this.resetCheck();
    });
  }

  async startCheck() {
    if (this.isChecking) return;
    
    const links = this.elementSelector.getSelectedLinks();
    if (links.length === 0) {
      alert('チェックする要素を選択してください');
      return;
    }

    this.isChecking = true;
    this.results = [];
    this.currentProgress = 0;
    
    this.uiManager.switchTab('results');
    this.showProgress();
    this.updateSummary(0, 0, 0);
    
    const concurrency = parseInt(this.uiManager.panel.querySelector('#lcp-concurrency').value) || 5;
    const timeout = parseInt(this.uiManager.panel.querySelector('#lcp-timeout').value) * 1000 || 30000;
    
    this.httpChecker = new HttpChecker({ concurrency, timeout });
    
    try {
      this.results = await this.httpChecker.checkLinks(links, this.onProgress.bind(this));
      this.showResults();
    } catch (error) {
      console.error('Link check error:', error);
      alert('チェック中にエラーが発生しました: ' + error.message);
    } finally {
      this.isChecking = false;
      this.hideProgress();
    }
  }

  onProgress(progress) {
    this.currentProgress = Math.round((progress.completed / progress.total) * 100);
    this.updateProgressBar(this.currentProgress);
    
    if (progress.current) {
      this.results[this.results.length] = progress.current;
      this.highlightLink(progress.current);
      this.addRealTimeResult(progress.current);
    }
    
    this.updateSummaryFromResults();
  }

  updateProgressBar(percentage) {
    const progressFill = this.uiManager.panel.querySelector('.lcp-progress-fill');
    const progressText = this.uiManager.panel.querySelector('.lcp-progress-text');
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}%`;
  }

  showProgress() {
    const progressEl = this.uiManager.panel.querySelector('.lcp-progress');
    const exportActionsEl = this.uiManager.panel.querySelector('.lcp-export-actions');
    
    if (progressEl) progressEl.style.display = 'block';
    if (exportActionsEl) exportActionsEl.style.display = 'none';
    
    this.clearResultsList();
  }

  hideProgress() {
    const progressEl = this.uiManager.panel.querySelector('.lcp-progress');
    const exportActionsEl = this.uiManager.panel.querySelector('.lcp-export-actions');
    
    if (progressEl) progressEl.style.display = 'none';
    if (exportActionsEl) exportActionsEl.style.display = 'block';
  }

  highlightLink(result) {
    if (!result.element) return;
    
    result.element.classList.remove('lcp-link-valid', 'lcp-link-broken', 'lcp-link-redirect', 'lcp-link-warning');
    
    if (result.ok && result.status >= 200 && result.status < 300) {
      result.element.classList.add('lcp-link-valid');
    } else if (result.status >= 300 && result.status < 400) {
      result.element.classList.add('lcp-link-redirect');
    } else if (result.responseTime > 10000) {
      result.element.classList.add('lcp-link-warning');
    } else {
      result.element.classList.add('lcp-link-broken');
    }
  }

  addRealTimeResult(result) {
    const resultsList = this.uiManager.panel.querySelector('.lcp-results-list');
    if (!resultsList) return;
    
    if (result.status < 200 || result.status >= 400) {
      const item = Utils.createElement('div', 'lcp-result-item');
      const status = Utils.formatStatus(result.status);
      
      item.innerHTML = `
        <div class="lcp-result-status" style="color: ${status.color}">
          ${this.getStatusIcon(result.status)} ${result.url}
        </div>
        <div class="lcp-result-url">
          ステータス: ${result.status} ${result.statusText}
          ${result.responseTime ? ` | 応答時間: ${result.responseTime}ms` : ''}
        </div>
      `;
      
      resultsList.appendChild(item);
      resultsList.scrollTop = resultsList.scrollHeight;
    }
  }

  showResults() {
    this.clearResultsList();
    
    const resultsList = this.uiManager.panel.querySelector('.lcp-results-list');
    if (!resultsList) return;
    
    const brokenResults = this.results.filter(r => !r.ok || r.status >= 400);
    const redirectResults = this.results.filter(r => r.status >= 300 && r.status < 400);
    
    if (brokenResults.length === 0 && redirectResults.length === 0) {
      resultsList.innerHTML = '<div class="lcp-result-item">🎉 すべてのリンクが正常です！</div>';
      return;
    }
    
    [...brokenResults, ...redirectResults].forEach(result => {
      const item = Utils.createElement('div', 'lcp-result-item');
      const status = Utils.formatStatus(result.status);
      
      item.innerHTML = `
        <div class="lcp-result-status" style="color: ${status.color}">
          ${this.getStatusIcon(result.status)} ${result.url}
        </div>
        <div class="lcp-result-url">
          ステータス: ${result.status} ${result.statusText}
          ${result.responseTime ? ` | 応答時間: ${result.responseTime}ms` : ''}
          ${result.error ? ` | エラー: ${result.error}` : ''}
        </div>
      `;
      
      resultsList.appendChild(item);
    });
  }

  getStatusIcon(status) {
    if (status >= 200 && status < 300) return '✓';
    if (status >= 300 && status < 400) return '↻';
    return '✗';
  }

  updateSummary(valid, broken, redirect) {
    const validEl = this.uiManager.panel.querySelector('#lcp-valid-count');
    const brokenEl = this.uiManager.panel.querySelector('#lcp-broken-count');
    const redirectEl = this.uiManager.panel.querySelector('#lcp-redirect-count');
    
    if (validEl) validEl.textContent = valid;
    if (brokenEl) brokenEl.textContent = broken;
    if (redirectEl) redirectEl.textContent = redirect;
    
    if (this.uiManager.isMinimized) {
      const badge = this.uiManager.panel.querySelector('.lcp-badge');
      if (badge) badge.textContent = broken;
    }
  }

  updateSummaryFromResults() {
    const valid = this.results.filter(r => r && r.ok && r.status >= 200 && r.status < 300).length;
    const broken = this.results.filter(r => r && (!r.ok || r.status >= 400)).length;
    const redirect = this.results.filter(r => r && r.status >= 300 && r.status < 400).length;
    
    this.updateSummary(valid, broken, redirect);
  }

  clearResultsList() {
    const resultsList = this.uiManager.panel.querySelector('.lcp-results-list');
    if (resultsList) resultsList.innerHTML = '';
  }

  resetCheck() {
    this.isChecking = false;
    this.results = [];
    this.currentProgress = 0;
    
    this.results.forEach(result => {
      if (result.element) {
        result.element.classList.remove('lcp-link-valid', 'lcp-link-broken', 'lcp-link-redirect', 'lcp-link-warning');
      }
    });
    
    this.uiManager.switchTab('selection');
    this.elementSelector.refreshLinks();
  }
}