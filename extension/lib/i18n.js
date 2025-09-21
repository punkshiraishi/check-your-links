class I18n {
  constructor() {
    this.locale = this.detectLocale();
  }

  detectLocale() {
    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
        return chrome.i18n.getUILanguage();
      }
    } catch (_) {}
    return navigator.language || 'en';
  }

  // Map dot.notation to message names like dot_notation
  toMessageName(key) {
    return String(key).replace(/\./g, '_');
  }

  // substitutions can be a string or an array per Chrome docs
  t(key, substitutions) {
    const name = this.toMessageName(key);
    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getMessage === 'function') {
        const message = chrome.i18n.getMessage(name, substitutions);
        if (message) return message;
      }
    } catch (_) {}
    // Fallback: return key if not found
    return key;
  }

  // Provided for compatibility; Chrome controls locale resolution
  setLanguage(_lang) { /* no-op under chrome.i18n */ }

  getCurrentLanguage() {
    return this.locale;
  }
}

// グローバルインスタンスを作成
window.i18n = new I18n();