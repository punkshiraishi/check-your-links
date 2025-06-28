// バックグラウンドサービスワーカー

class BackgroundService {
  constructor() {
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // 拡張機能インストール時
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });
    
    // タブ更新時
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });
    
    // メッセージリスナー
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 非同期レスポンス用
    });
    
    // アクション（ポップアップ）クリック時
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });
  }
  
  handleInstall(details) {
    console.log('Link Checker Pro installed:', details);
    
    if (details.reason === 'install') {
      // 初回インストール時の処理
      chrome.storage.local.set({
        settings: {
          maxConcurrentRequests: 5,
          timeout: 10000,
          enableNotifications: true,
          autoHighlight: true
        },
        recentResults: []
      });
      
      // ヘルプページを開く
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup/popup.html')
      });
    }
  }
  
  handleTabUpdate(tabId, changeInfo, tab) {
    // ページ読み込み完了時にバッジをリセット
    if (changeInfo.status === 'complete' && tab.url) {
      chrome.action.setBadgeText({
        tabId: tabId,
        text: ''
      });
    }
  }
  
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'linkCheckProgress':
          await this.updateProgress(sender.tab.id, message.current, message.total);
          sendResponse({ success: true });
          break;
          
        case 'linkCheckComplete':
          await this.handleCheckComplete(sender.tab.id, message.results);
          sendResponse({ success: true });
          break;
          
        case 'getSettings':
          const settings = await this.getSettings();
          sendResponse({ settings });
          break;
          
        case 'saveSettings':
          await this.saveSettings(message.settings);
          sendResponse({ success: true });
          break;
          
        case 'exportResults':
          await this.exportResults(message.data, message.format);
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  handleActionClick(tab) {
    // ポップアップではなく直接操作する場合（将来の機能）
    console.log('Action clicked for tab:', tab.id);
  }
  
  async updateProgress(tabId, current, total) {
    // バッジにプログレスを表示
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    chrome.action.setBadgeText({
      tabId: tabId,
      text: current < total ? `${percentage}%` : '✓'
    });
    
    chrome.action.setBadgeBackgroundColor({
      tabId: tabId,
      color: current < total ? '#007bff' : '#28a745'
    });
  }
  
  async handleCheckComplete(tabId, results) {
    const brokenCount = results.find(r => r.status === 'broken')?.count || 0;
    
    // バッジに結果を表示
    if (brokenCount > 0) {
      chrome.action.setBadgeText({
        tabId: tabId,
        text: brokenCount.toString()
      });
      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#dc3545'
      });
    } else {
      chrome.action.setBadgeText({
        tabId: tabId,
        text: '✓'
      });
      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#28a745'
      });
    }
    
    // 通知を表示（設定で有効な場合）
    const settings = await this.getSettings();
    if (settings.enableNotifications && brokenCount > 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icons/icon48.png',
        title: 'リンクチェック完了',
        message: `${brokenCount}個の破損したリンクが見つかりました`
      });
    }
  }
  
  async getSettings() {
    const result = await chrome.storage.local.get(['settings']);
    return result.settings || {
      maxConcurrentRequests: 5,
      timeout: 10000,
      enableNotifications: true,
      autoHighlight: true
    };
  }
  
  async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  }
  
  async exportResults(data, format) {
    // バックグラウンドでの結果エクスポート処理
    // 必要に応じて実装
    console.log('Export results:', format, data);
  }
}

// バックグラウンドサービスを初期化
const backgroundService = new BackgroundService();

// グローバル関数としてエクスポート（デバッグ用）
globalThis.linkCheckerBackground = backgroundService;