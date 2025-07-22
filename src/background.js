chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openTable') {
    chrome.tabs.create({ url: chrome.runtime.getURL("table.html") });
  }
});
