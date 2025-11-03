// Фоновый скрипт для расширения
chrome.runtime.onInstalled.addListener(() => {
    console.log('VK Token Extractor установлен');
});

// Обновляем иконку когда открыт VK
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.includes('vk.com')) {
        chrome.action.setIcon({
            path: {
                "16": "icons/icon16.png",
                "48": "icons/icon48.png", 
                "128": "icons/icon128.png"
            },
            tabId: tabId
        });
    }
});