class LinkChecker {
  constructor() {
    this.isChecking = false;
    this.checkQueue = [];
    this.results = [];
    this.maxConcurrentRequests = 5;
    this.timeout = 10000; // 10秒
    this.activeRequests = 0;
    this.completedCount = 0;
    this.totalCount = 0;
  }
  
  async checkLinks(selectedElements) {
    if (this.isChecking) {
      console.warn('Link checking is already in progress');
      return;
    }
    
    this.isChecking = true;
    this.results = [];
    this.checkQueue = [];
    this.completedCount = 0;
    this.activeRequests = 0;
    
    try {
      // 選択された要素からリンクを抽出
      const allLinks = this.extractLinksFromElements(selectedElements);
      
      // 重複するURLを除去
      const uniqueLinks = this.removeDuplicateLinks(allLinks);
      
      this.totalCount = uniqueLinks.length;
      this.checkQueue = [...uniqueLinks];
      
      if (this.totalCount === 0) {
        this.notifyProgress(0, 0);
        this.notifyComplete([]);
        this.isChecking = false;
        return [];
      }
      
      // 並行チェック開始
      this.notifyProgress(0, this.totalCount);
      const promises = [];
      
      for (let i = 0; i < Math.min(this.maxConcurrentRequests, this.totalCount); i++) {
        promises.push(this.processQueue());
      }
      
      await Promise.all(promises);
      
      this.notifyComplete(this.results);
      return this.results;
      
    } catch (error) {
      console.error('Error during link checking:', error);
      this.notifyComplete([]);
      return [];
    } finally {
      this.isChecking = false;
    }
  }
  
  extractLinksFromElements(selectedElements) {
    const allLinks = [];
    
    selectedElements.forEach(elementInfo => {
      try {
        // セレクターから実際の要素を取得
        const element = document.querySelector(elementInfo.selector);
        if (element) {
          const links = extractLinksFromElement(element);
          links.forEach(link => {
            link.sourceElement = elementInfo;
          });
          allLinks.push(...links);
        }
      } catch (error) {
        console.error('Error extracting links from element:', elementInfo.selector, error);
      }
    });
    
    return allLinks;
  }
  
  removeDuplicateLinks(links) {
    const seen = new Set();
    return links.filter(link => {
      if (seen.has(link.url)) {
        return false;
      }
      seen.add(link.url);
      return true;
    });
  }
  
  async processQueue() {
    while (this.checkQueue.length > 0 && this.isChecking) {
      const link = this.checkQueue.shift();
      if (link) {
        this.activeRequests++;
        try {
          const result = await this.checkSingleLink(link);
          this.results.push(result);
          this.completedCount++;
          this.notifyProgress(this.completedCount, this.totalCount);
        } catch (error) {
          console.error('Error checking link:', link.url, error);
          this.results.push({
            url: link.url,
            status: 'error',
            statusCode: 0,
            statusText: error.message,
            responseTime: 0,
            element: link.element,
            sourceElement: link.sourceElement
          });
          this.completedCount++;
          this.notifyProgress(this.completedCount, this.totalCount);
        } finally {
          this.activeRequests--;
        }
      }
    }
  }
  
  async checkSingleLink(link) {
    const startTime = Date.now();
    
    try {
      // AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(link.url, {
        method: 'HEAD', // HEADリクエストでレスポンスヘッダーのみ取得
        signal: controller.signal,
        mode: 'no-cors', // CORS制限を回避
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      return {
        url: link.url,
        status: this.getStatusFromResponse(response),
        statusCode: response.status || 0,
        statusText: response.statusText || 'OK',
        responseTime: responseTime,
        element: link.element,
        sourceElement: link.sourceElement,
        type: link.type
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        return {
          url: link.url,
          status: 'timeout',
          statusCode: 0,
          statusText: 'Timeout',
          responseTime: responseTime,
          element: link.element,
          sourceElement: link.sourceElement,
          type: link.type
        };
      }
      
      // CORS制限の場合、実際のリクエストを試行
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        try {
          return await this.checkWithImage(link, startTime);
        } catch (imageError) {
          return {
            url: link.url,
            status: 'error',
            statusCode: 0,
            statusText: error.message,
            responseTime: responseTime,
            element: link.element,
            sourceElement: link.sourceElement,
            type: link.type
          };
        }
      }
      
      throw error;
    }
  }
  
  async checkWithImage(link, startTime) {
    return new Promise((resolve) => {
      const img = new Image();
      const timeoutId = setTimeout(() => {
        resolve({
          url: link.url,
          status: 'timeout',
          statusCode: 0,
          statusText: 'Timeout',
          responseTime: Date.now() - startTime,
          element: link.element,
          sourceElement: link.sourceElement,
          type: link.type
        });
      }, this.timeout);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        resolve({
          url: link.url,
          status: 'valid',
          statusCode: 200,
          statusText: 'OK',
          responseTime: Date.now() - startTime,
          element: link.element,
          sourceElement: link.sourceElement,
          type: link.type
        });
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve({
          url: link.url,
          status: 'broken',
          statusCode: 404,
          statusText: 'Not Found',
          responseTime: Date.now() - startTime,
          element: link.element,
          sourceElement: link.sourceElement,
          type: link.type
        });
      };
      
      img.src = link.url;
    });
  }
  
  getStatusFromResponse(response) {
    // no-corsモードの場合、statusが0になることがある
    if (response.type === 'opaque') {
      return 'valid'; // レスポンスが返ってきた場合は有効と判断
    }
    
    if (response.status >= 200 && response.status < 300) {
      return 'valid';
    } else if (response.status >= 300 && response.status < 400) {
      return 'redirect';
    } else if (response.status >= 400 && response.status < 500) {
      return 'broken';
    } else if (response.status >= 500) {
      return 'server_error';
    } else {
      return 'unknown';
    }
  }
  
  notifyProgress(current, total) {
    chrome.runtime.sendMessage({
      action: 'linkCheckProgress',
      current: current,
      total: total
    });
  }
  
  notifyComplete(results) {
    // 結果を統計でまとめる
    const stats = this.calculateStats(results);
    
    chrome.runtime.sendMessage({
      action: 'linkCheckComplete',
      results: stats,
      detailedResults: results
    });
  }
  
  calculateStats(results) {
    const stats = {
      total: results.length,
      valid: 0,
      broken: 0,
      redirect: 0,
      timeout: 0,
      error: 0,
      server_error: 0
    };
    
    results.forEach(result => {
      if (stats.hasOwnProperty(result.status)) {
        stats[result.status]++;
      }
    });
    
    return [
      { status: 'valid', count: stats.valid },
      { status: 'broken', count: stats.broken + stats.error + stats.server_error },
      { status: 'warning', count: stats.redirect + stats.timeout }
    ];
  }
  
  stop() {
    this.isChecking = false;
    this.checkQueue = [];
  }
  
  getProgress() {
    return {
      isChecking: this.isChecking,
      completed: this.completedCount,
      total: this.totalCount,
      active: this.activeRequests
    };
  }
}