const Utils = {
  createElement(tag, className, innerHTML) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  },

  getLinksFromElement(element) {
    const links = [];
    const anchors = element.querySelectorAll('a[href]');
    
    anchors.forEach(anchor => {
      const href = anchor.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const absoluteUrl = new URL(href, window.location.href).href;
        links.push({
          url: absoluteUrl,
          element: anchor,
          text: anchor.textContent.trim(),
          parent: anchor.parentElement
        });
      }
    });
    
    return links;
  },

  formatStatus(status) {
    if (status >= 200 && status < 300) return { color: '#4caf50', text: 'OK' };
    if (status >= 300 && status < 400) return { color: '#ff9800', text: 'Redirect' };
    if (status >= 400 && status < 500) return { color: '#f44336', text: 'Client Error' };
    if (status >= 500) return { color: '#f44336', text: 'Server Error' };
    if (status === 0) return { color: '#9e9e9e', text: 'Unknown' };
    return { color: '#9e9e9e', text: 'Unknown' };
  },

  // Escape a single CSV cell per RFC 4180
  escapeCSVCell(value) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    const escaped = stringValue.replace(/"/g, '""');
    // Quote if contains comma, quote, CR or LF
    return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
  },

  exportToCSV(results) {
    const headers = ['URL', 'Status', 'Status Text', 'Response Time (ms)', 'Location'];
    const rows = results.map(r => [
      r.url,
      r.status,
      r.statusText,
      r.responseTime,
      r.location || ''
    ]);
    const lines = [headers, ...rows]
      .map(row => row.map(cell => Utils.escapeCSVCell(cell)).join(','))
      .join('\\r\\n');
    const csvWithBom = '\\uFEFF' + lines;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `link-check-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  },

  exportToJSON(results) {
    const jsonContent = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `link-check-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  }
};