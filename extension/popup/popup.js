class PopupController {
  constructor() {
    this.isSelecting = false;
    this.selectedElements = [];
    this.checkingInProgress = false;
    
    this.initializeElements();
    this.bindEvents();
    this.loadState();
  }
  
  initializeElements() {
    this.selectElementsBtn = document.getElementById('selectElementsBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.checkLinksBtn = document.getElementById('checkLinksBtn');
    this.status = document.getElementById('status');
    this.selectedCount = document.getElementById('selectedCount');
    this.recentResults = document.getElementById('recentResults');
    this.progressSection = document.querySelector('.progress-section');
    this.progressFill = document.getElementById('progressFill');
    this.progressText = document.getElementById('progressText');
  }
  
  bindEvents() {
    this.selectElementsBtn.addEventListener('click', () => this.toggleElementSelection());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.checkLinksBtn.addEventListener('click', () => this.startLinkCheck());
    
    // メッセージリスナー
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
  }
  
  async loadState() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // コンテンツスクリプトに状態を要求
      chrome.tabs.sendMessage(tab.id, { action: 'getState' }, (response) => {
        if (response) {
          this.updateState(response);
        }
      });
      
      // 保存された結果を読み込み
      this.loadRecentResults();
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }
  
  async toggleElementSelection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!this.isSelecting) {
        // 選択モード開始
        chrome.tabs.sendMessage(tab.id, { action: 'startElementSelection' });
        this.enterSelectionMode();
      } else {
        // 選択モード終了
        chrome.tabs.sendMessage(tab.id, { action: 'stopElementSelection' });
        this.exitSelectionMode();
      }
    } catch (error) {
      console.error('Failed to toggle element selection:', error);
    }
  }
  
  enterSelectionMode() {
    this.isSelecting = true;
    this.selectElementsBtn.textContent = '✅ 選択完了';
    this.selectElementsBtn.classList.add('btn-secondary');
    this.selectElementsBtn.classList.remove('btn-primary');
    this.status.textContent = '要素選択中...';
    document.querySelector('.popup-container').classList.add('selecting-mode');
  }
  
  exitSelectionMode() {
    this.isSelecting = false;
    this.selectElementsBtn.textContent = '📍 要素選択';
    this.selectElementsBtn.classList.add('btn-primary');
    this.selectElementsBtn.classList.remove('btn-secondary');
    this.status.textContent = '準備完了';
    document.querySelector('.popup-container').classList.remove('selecting-mode');
  }
  
  async startLinkCheck() {
    if (this.checkingInProgress || this.selectedElements.length === 0) {
      return;
    }
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      this.checkingInProgress = true;
      this.updateCheckingUI(true);
      
      chrome.tabs.sendMessage(tab.id, { action: 'startLinkCheck' });
    } catch (error) {
      console.error('Failed to start link check:', error);
      this.checkingInProgress = false;
      this.updateCheckingUI(false);
    }
  }
  
  updateCheckingUI(checking) {
    if (checking) {
      this.checkLinksBtn.disabled = true;
      this.checkLinksBtn.textContent = '⏳ チェック中...';
      this.progressSection.style.display = 'block';
      this.status.textContent = 'リンクチェック中...';
      document.querySelector('.popup-container').classList.add('checking-mode');
    } else {
      this.checkLinksBtn.disabled = this.selectedElements.length === 0;
      this.checkLinksBtn.textContent = '▶️ リンクチェック開始';
      this.progressSection.style.display = 'none';
      this.status.textContent = '準備完了';
      document.querySelector('.popup-container').classList.remove('checking-mode');
    }
  }
  
  updateProgress(current, total) {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    this.progressFill.style.width = `${percentage}%`;
    this.progressText.textContent = `${current} / ${total} リンクをチェック中...`;
  }
  
  updateState(state) {
    this.selectedElements = state.selectedElements || [];
    this.selectedCount.textContent = `${this.selectedElements.length} 要素`;
    this.checkLinksBtn.disabled = this.selectedElements.length === 0 || this.checkingInProgress;
  }
  
  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'elementSelected':
        this.updateState(message.state);
        break;
        
      case 'linkCheckProgress':
        this.updateProgress(message.current, message.total);
        break;
        
      case 'linkCheckComplete':
        this.checkingInProgress = false;
        this.updateCheckingUI(false);
        this.addRecentResult(message.results);
        break;
        
      case 'selectionModeEnded':
        this.exitSelectionMode();
        this.updateState(message.state);
        break;
    }
  }
  
  addRecentResult(results) {
    const validCount = results.filter(r => r.status === 'valid').length;
    const brokenCount = results.filter(r => r.status === 'broken').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.innerHTML = `
      <div class="result-stats">
        <span class="stat stat-valid">✅ ${validCount}</span>
        <span class="stat stat-broken">❌ ${brokenCount}</span>
        <span class="stat stat-warning">⚠️ ${warningCount}</span>
      </div>
      <div class="result-time">${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    
    // 「結果がありません」メッセージを削除
    const noResults = this.recentResults.querySelector('.no-results');
    if (noResults) {
      noResults.remove();
    }
    
    // 新しい結果を先頭に追加
    this.recentResults.insertBefore(resultItem, this.recentResults.firstChild);
    
    // 最大5件まで保持
    const items = this.recentResults.querySelectorAll('.result-item');
    if (items.length > 5) {
      items[items.length - 1].remove();
    }
    
    // 結果を保存
    this.saveRecentResults();
  }
  
  async loadRecentResults() {
    try {
      const result = await chrome.storage.local.get(['recentResults']);
      const recentResults = result.recentResults || [];
      
      if (recentResults.length === 0) {
        return;
      }
      
      // 「結果がありません」メッセージを削除
      const noResults = this.recentResults.querySelector('.no-results');
      if (noResults) {
        noResults.remove();
      }
      
      // 保存された結果を表示
      recentResults.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
          <div class="result-stats">
            <span class="stat stat-valid">✅ ${result.valid}</span>
            <span class="stat stat-broken">❌ ${result.broken}</span>
            <span class="stat stat-warning">⚠️ ${result.warning}</span>
          </div>
          <div class="result-time">${result.time}</div>
        `;
        this.recentResults.appendChild(resultItem);
      });
    } catch (error) {
      console.error('Failed to load recent results:', error);
    }
  }
  
  async saveRecentResults() {
    try {
      const items = this.recentResults.querySelectorAll('.result-item');
      const recentResults = Array.from(items).map(item => {
        const stats = item.querySelectorAll('.stat');
        return {
          valid: parseInt(stats[0].textContent.match(/\d+/)[0]),
          broken: parseInt(stats[1].textContent.match(/\d+/)[0]),
          warning: parseInt(stats[2].textContent.match(/\d+/)[0]),
          time: item.querySelector('.result-time').textContent
        };
      });
      
      await chrome.storage.local.set({ recentResults });
    } catch (error) {
      console.error('Failed to save recent results:', error);
    }
  }
  
  openSettings() {
    // TODO: 設定画面を実装
    alert('設定機能は今後実装予定です');
  }
}

// ポップアップが読み込まれたときに初期化
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});