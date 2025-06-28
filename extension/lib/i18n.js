class I18n {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.translations = {};
    this.loadTranslations();
  }

  detectLanguage() {
    // ブラウザの言語設定を取得
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    
    // 日本語の場合は 'ja'、それ以外は 'en' をデフォルトに
    if (browserLang.startsWith('ja')) {
      return 'ja';
    }
    return 'en';
  }

  loadTranslations() {
    this.translations = {
      ja: {
        // UI Manager
        title: '🔗 リンクチェッカー Pro',
        tabs: {
          selection: '要素選択',
          results: '結果表示',
          settings: '設定'
        },
        
        // Selection Tab
        manualSelection: '手動選択',
        endSelection: '選択終了',
        startCheck: 'チェック開始',
        
        // Results Tab
        valid: '有効',
        broken: '破損',
        redirect: 'リダイレクト',
        newCheck: '新規チェック',
        allLinksValid: '🎉 すべてのリンクが正常です！',
        
        // Settings Tab
        timeout: 'タイムアウト (秒)',
        interval: 'チェック間隔 (ミリ秒)',
        
        // Messages
        noElementsSelected: 'チェックする要素を選択してください',
        checkingError: 'チェック中にエラーが発生しました',
        pageWide: 'ページ全体',
        links: 'リンク',
        status: 'ステータス',
        responseTime: '応答時間',
        error: 'エラー',
        
        // Progress
        progress: '進行状況',
        
        // Element info
        elementRemoved: '要素が削除されました',
        
        // Export messages (kept for potential future use)
        noResultsToExport: 'エクスポートする結果がありません',
        noBrokenLinks: '破損したリンクがありません',
        brokenLinksCopied: '個の破損したリンクをクリップボードにコピーしました',
        copyFailed: 'クリップボードへのコピーに失敗しました'
      },
      
      en: {
        // UI Manager
        title: '🔗 Link Checker Pro',
        tabs: {
          selection: 'Element Selection',
          results: 'Results',
          settings: 'Settings'
        },
        
        // Selection Tab
        manualSelection: 'Manual Selection',
        endSelection: 'End Selection',
        startCheck: 'Start Check',
        
        // Results Tab
        valid: 'Valid',
        broken: 'Broken',
        redirect: 'Redirect',
        newCheck: 'New Check',
        allLinksValid: '🎉 All links are working!',
        
        // Settings Tab
        timeout: 'Timeout (seconds)',
        interval: 'Check Interval (milliseconds)',
        
        // Messages
        noElementsSelected: 'Please select elements to check',
        checkingError: 'An error occurred during checking',
        pageWide: 'Entire Page',
        links: 'links',
        status: 'Status',
        responseTime: 'Response Time',
        error: 'Error',
        
        // Progress
        progress: 'Progress',
        
        // Element info
        elementRemoved: 'Element removed',
        
        // Export messages (kept for potential future use)
        noResultsToExport: 'No results to export',
        noBrokenLinks: 'No broken links found',
        brokenLinksCopied: 'broken links copied to clipboard',
        copyFailed: 'Failed to copy to clipboard'
      }
    };
  }

  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        // フォールバック: キーが見つからない場合は英語を試す
        value = this.translations['en'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object') {
            value = value[fallbackKey];
          } else {
            return key; // キーが見つからない場合はキー自体を返す
          }
        }
        break;
      }
    }
    
    return value || key;
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
    }
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

// グローバルインスタンスを作成
window.i18n = new I18n();