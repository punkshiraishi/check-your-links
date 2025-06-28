// ユーティリティ関数

/**
 * 要素が表示されているかチェック
 */
function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetWidth > 0 && 
         element.offsetHeight > 0;
}

/**
 * 要素のセレクターを生成
 */
function generateElementSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  let selector = element.tagName.toLowerCase();
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      selector += '.' + classes.join('.');
    }
  }
  
  // 親要素との関係で一意性を確保
  let parent = element.parentElement;
  if (parent && parent !== document.body) {
    const siblings = Array.from(parent.children).filter(child => 
      child.tagName === element.tagName
    );
    
    if (siblings.length > 1) {
      const index = siblings.indexOf(element);
      selector += `:nth-of-type(${index + 1})`;
    }
  }
  
  return selector;
}

/**
 * URLが有効かチェック
 */
function isValidUrl(string) {
  try {
    const url = new URL(string, window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * 相対URLを絶対URLに変換
 */
function resolveUrl(url, baseUrl = window.location.href) {
  try {
    return new URL(url, baseUrl).href;
  } catch (_) {
    return null;
  }
}

/**
 * 要素から全てのリンクを抽出
 */
function extractLinksFromElement(element) {
  const links = [];
  
  // <a> タグのリンク
  const anchors = element.querySelectorAll('a[href]');
  anchors.forEach(anchor => {
    const href = anchor.getAttribute('href');
    if (href && href.trim()) {
      const resolvedUrl = resolveUrl(href.trim());
      if (resolvedUrl && isValidUrl(resolvedUrl)) {
        links.push({
          element: anchor,
          url: resolvedUrl,
          text: anchor.textContent.trim(),
          type: 'anchor'
        });
      }
    }
  });
  
  // <img> タグのsrc
  const images = element.querySelectorAll('img[src]');
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.trim()) {
      const resolvedUrl = resolveUrl(src.trim());
      if (resolvedUrl && isValidUrl(resolvedUrl)) {
        links.push({
          element: img,
          url: resolvedUrl,
          text: img.alt || img.title || 'Image',
          type: 'image'
        });
      }
    }
  });
  
  // <link> タグのhref
  const linkElements = element.querySelectorAll('link[href]');
  linkElements.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.trim()) {
      const resolvedUrl = resolveUrl(href.trim());
      if (resolvedUrl && isValidUrl(resolvedUrl)) {
        links.push({
          element: link,
          url: resolvedUrl,
          text: link.rel || 'Link',
          type: 'link'
        });
      }
    }
  });
  
  return links;
}

/**
 * HTTP ステータスコードからステータスタイプを取得
 */
function getStatusType(statusCode) {
  if (statusCode >= 200 && statusCode < 300) {
    return 'valid';
  } else if (statusCode >= 300 && statusCode < 400) {
    return 'redirect';
  } else if (statusCode >= 400) {
    return 'broken';
  } else {
    return 'unknown';
  }
}

/**
 * デバウンス関数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 要素の境界矩形を取得（スクロールオフセット考慮）
 */
function getElementBounds(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
    bottom: rect.top + window.scrollY + rect.height,
    right: rect.left + window.scrollX + rect.width
  };
}

/**
 * 色を16進数からRGBAに変換
 */
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 要素のテキスト内容を取得（子要素を除く）
 */
function getDirectTextContent(element) {
  return Array.from(element.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent.trim())
    .join(' ')
    .trim();
}