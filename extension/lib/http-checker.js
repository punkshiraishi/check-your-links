class HttpChecker {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 5;
    this.timeout = options.timeout || 30000;
    this.cache = new Map();
    this.queue = [];
    this.active = 0;
  }

  async checkLinks(links, onProgress) {
    const results = [];
    this.queue = links.map((link, index) => ({ link, index }));
    
    return new Promise((resolve) => {
      const processQueue = async () => {
        while (this.queue.length > 0 && this.active < this.concurrency) {
          const { link, index } = this.queue.shift();
          this.active++;
          
          try {
            const result = await this.checkLink(link);
            results[index] = result;
            
            if (onProgress) {
              onProgress({
                completed: results.filter(r => r).length,
                total: links.length,
                current: result
              });
            }
          } catch (error) {
            results[index] = {
              ...link,
              status: 0,
              statusText: 'Error',
              responseTime: 0,
              ok: false,
              error: error.message
            };
          }
          
          this.active--;
          processQueue();
        }
        
        if (this.active === 0 && this.queue.length === 0) {
          resolve(results);
        }
      };
      
      for (let i = 0; i < this.concurrency; i++) {
        processQueue();
      }
    });
  }

  async checkLink(link) {
    if (this.cache.has(link.url)) {
      return { ...link, ...this.cache.get(link.url) };
    }

    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'checkLink', url: link.url },
        (response) => resolve(response)
      );
    });

    this.cache.set(link.url, result);
    return { ...link, ...result };
  }

  clearCache() {
    this.cache.clear();
  }
}