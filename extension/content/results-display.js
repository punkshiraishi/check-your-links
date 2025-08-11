class ResultsDisplay {
  constructor(uiManager, linkChecker) {
    this.uiManager = uiManager;
    this.linkChecker = linkChecker;
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    // CSVエクスポートボタン
    const csvButton = document.getElementById('lcp-export-csv');
    if (csvButton) {
      csvButton.addEventListener('click', () => this.exportCSV());
    }

    // クリップボードコピーボタン
    const copyButton = document.getElementById('lcp-copy-clipboard');
    if (copyButton) {
      copyButton.addEventListener('click', () => this.copyResultsToClipboard());
    }
  }

  exportCSV() {
    if (!this.linkChecker.results || this.linkChecker.results.length === 0) {
      alert(window.i18n.t('noResultsToExport'));
      return;
    }

    const results = this.linkChecker.results.map(result => ({
      url: result.url,
      status: result.status,
      statusText: result.statusText,
      responseTime: result.responseTime,
      location: this.getElementLocation(result.element),
      error: result.error || ''
    }));

    Utils.exportToCSV(results);
  }

  exportJSON() {
    if (!this.linkChecker.results || this.linkChecker.results.length === 0) {
      alert(window.i18n.t('noResultsToExport'));
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      totalChecked: this.linkChecker.results.length,
      summary: this.getSummary(),
      results: this.linkChecker.results.map(result => ({
        url: result.url,
        status: result.status,
        statusText: result.statusText,
        responseTime: result.responseTime,
        ok: result.ok,
        location: this.getElementLocation(result.element),
        error: result.error || null
      }))
    };

    Utils.exportToJSON(exportData);
  }

  getSummary() {
    const results = this.linkChecker.results;
    const valid = results.filter(r => r.ok && r.status >= 200 && r.status < 300).length;
    const broken = results.filter(r => !r.ok || r.status >= 400).length;
    const redirect = results.filter(r => r.status >= 300 && r.status < 400).length;
    const warnings = results.filter(r => r.responseTime > 10000).length;

    return {
      valid,
      broken,
      redirect,
      warnings,
      total: results.length
    };
  }

  getElementLocation(element) {
    if (!element) return '';
    
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }
      
      if (current.className) {
        const classes = current.className.split(' ')
          .filter(cls => cls && !cls.startsWith('lcp-'))
          .slice(0, 2)
          .join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }
      
      const siblings = Array.from(current.parentNode?.children || []);
      const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
      
      path.unshift(selector);
      current = current.parentElement;
      
      if (path.length > 5) break;
    }
    
    return path.join(' > ');
  }

  copyBrokenLinksToClipboard() {
    const brokenResults = this.linkChecker.results.filter(r => !r.ok || r.status >= 400);
    
    if (brokenResults.length === 0) {
      alert(window.i18n.t('noBrokenLinks'));
      return;
    }

    const brokenUrls = brokenResults.map(r => r.url).join('\\n');
    
    navigator.clipboard.writeText(brokenUrls).then(() => {
      alert(`${brokenResults.length} ${window.i18n.t('brokenLinksCopied')}`);
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
      alert(window.i18n.t('copyFailed'));
    });
  }

  copyResultsToClipboard() {
    if (!this.linkChecker.results || this.linkChecker.results.length === 0) {
      alert(window.i18n.t('noResultsToCopy'));
      return;
    }

    // CSVフォーマットでクリップボードにコピー
    const i18n = window.i18n;
    const csvHeaders = ['URL', i18n.t('status'), 'Status Text', i18n.t('responseTime') + '(ms)', 'Location', i18n.t('error')];
    const csvRows = this.linkChecker.results.map(result => [
      result.url,
      result.status || '',
      result.statusText || '',
      result.responseTime || '',
      this.getElementLocation(result.element),
      result.error || ''
    ]);

    const csvContent = [
      csvHeaders.join('\t'),
      ...csvRows.map(row => row.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(csvContent).then(() => {
      // 成功メッセージを一時的に表示
      const copyButton = document.getElementById('lcp-copy-clipboard');
      if (copyButton) {
        const originalText = copyButton.textContent;
        copyButton.textContent = '✓ ' + window.i18n.t('copyComplete');
        copyButton.style.backgroundColor = '#4caf50';
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.style.backgroundColor = '';
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
      alert(window.i18n.t('copyFailed'));
    });
  }

  generateReport() {
    const summary = this.getSummary();
    const timestamp = new Date().toLocaleString('ja-JP');
    
    const report = `
# リンクチェック レポート

**実行日時**: ${timestamp}
**チェック対象**: ${summary.total} リンク

## サマリー

- ✅ **有効なリンク**: ${summary.valid}
- ❌ **破損したリンク**: ${summary.broken}
- ↻ **リダイレクト**: ${summary.redirect}
- ⚠️ **警告 (応答遅延)**: ${summary.warnings}

## 破損したリンク詳細

${this.linkChecker.results
  .filter(r => !r.ok || r.status >= 400)
  .map(r => `
### ${r.url}
- **ステータス**: ${r.status} ${r.statusText}
- **場所**: ${this.getElementLocation(r.element)}
- **応答時間**: ${r.responseTime}ms
${r.error ? `- **エラー**: ${r.error}` : ''}
`).join('\\n')}

---
*Generated by リンクチェッカー Pro*
    `.trim();

    return report;
  }
}