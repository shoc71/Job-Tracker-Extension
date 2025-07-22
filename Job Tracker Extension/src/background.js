// chrome.action.onClicked.addListener(() => {
//   chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
// });

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === 'openTable') {
//     chrome.tabs.create({ url: chrome.runtime.getURL("table.html") });
//   }
// });

// side-panel
// chrome.action.onClicked.addListener(async (tab) => {
//   try {
//     await chrome.sidePanel.setOptions({
//       tabId: tab.id,
//       path: "index.html",
//       enabled: true,
//     });

//     // ✅ This is allowed because it's inside onClicked (user gesture)
//     // await chrome.sidePanel.open({ tabId: tab.id });
//   } catch (err) {
//     console.error("Failed to open side panel:", err);
//   }
// });

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
