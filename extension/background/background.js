chrome.runtime.onInstalled.addListener(() => {
  console.log('リンクチェッカー Pro がインストールされました');
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkLink') {
    checkLink(request.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function checkLink(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    return {
      url,
      status: response.status || 0,
      statusText: response.statusText || 'Unknown',
      responseTime,
      ok: response.ok || response.status === 0
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        url,
        status: 0,
        statusText: 'Timeout',
        responseTime: 30000,
        ok: false,
        error: 'Request timeout'
      };
    }
    return {
      url,
      status: 0,
      statusText: 'Error',
      responseTime: 0,
      ok: false,
      error: error.message
    };
  }
}