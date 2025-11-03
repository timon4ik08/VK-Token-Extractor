document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const copyBtn = document.getElementById('copyBtn');
    const testBtn = document.getElementById('testBtn');
    const tokenOutput = document.getElementById('tokenOutput');
    const status = document.getElementById('status');
    const log = document.getElementById('log');

    function updateStatus(message, type = 'info') {
        status.textContent = message;
        status.className = `status ${type}`;
    }

    function addLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        log.innerHTML += `[${timestamp}] ${message}<br>`;
        log.scrollTop = log.scrollHeight;
    }

    function enableButtons() {
        copyBtn.disabled = false;
        testBtn.disabled = false;
    }

    function disableButtons() {
        copyBtn.disabled = true;
        testBtn.disabled = true;
    }

    // Проверяем, открыта ли страница VK
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (currentTab.url.includes('vk.com')) {
            updateStatus('VK.com открыт. Можете извлекать токен', 'success');
            extractBtn.disabled = false;
        } else {
            updateStatus('Откройте VK.com для работы расширения', 'error');
            extractBtn.disabled = true;
        }
    });

    // Извлечение токена
    extractBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            updateStatus('🔍 Ищем токен...', 'info');
            addLog('Начинаю поиск токена...');
            
            // Выполняем скрипт на странице VK
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: extractVKToken
            }, (results) => {
                if (results && results[0] && results[0].result) {
                    const tokenData = results[0].result;
                    
                    if (tokenData.token) {
                        tokenOutput.value = tokenData.token;
                        updateStatus('✅ Токен найден!', 'success');
                        addLog(`Токен извлечен: ${tokenData.token.substring(0, 50)}...`);
                        addLog(`Ключ: ${tokenData.key}`);
                        enableButtons();
                    } else {
                        updateStatus('❌ Токен не найден', 'error');
                        addLog('Токен не найден в localStorage');
                    }
                } else {
                    updateStatus('❌ Ошибка при извлечении', 'error');
                    addLog('Не удалось выполнить скрипт');
                }
            });
        });
    });

    // Копирование токена
    copyBtn.addEventListener('click', function() {
        tokenOutput.select();
        document.execCommand('copy');
        updateStatus('📋 Токен скопирован!', 'success');
        addLog('Токен скопирован в буфер обмена');
    });

    // Проверка токена
    testBtn.addEventListener('click', function() {
        const token = tokenOutput.value.trim();
        if (!token) return;

        updateStatus('🧪 Проверяю токен...', 'info');
        addLog('Проверяю валидность токена...');

        fetch(`https://api.vk.com/method/users.get?access_token=${token}&v=5.199`)
            .then(response => response.json())
            .then(data => {
                if (data.response) {
                    const user = data.response[0];
                    updateStatus(`✅ Токен валидный! Пользователь: ${user.first_name} ${user.last_name}`, 'success');
                    addLog(`Токен работает! ID пользователя: ${user.id}`);
                } else {
                    updateStatus('❌ Токен невалидный', 'error');
                    addLog(`Ошибка VK: ${data.error.error_msg}`);
                }
            })
            .catch(error => {
                updateStatus('❌ Ошибка проверки', 'error');
                addLog(`Ошибка сети: ${error.message}`);
            });
    });
});

// Функция, которая выполняется на странице VK
function extractVKToken() {
    console.log('🔍 VK Token Extractor: Ищем токен...');
    
    let foundToken = null;
    
    // Ищем в localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        if (value && value.includes('"access_token"')) {
            try {
                const data = JSON.parse(value);
                if (data.access_token) {
                    console.log('✅ VK Token Extractor: Токен найден!');
                    foundToken = {
                        key: key,
                        token: data.access_token
                    };
                    break;
                }
            } catch (e) {
                console.log('❌ VK Token Extractor: Ошибка парсинга JSON');
            }
        }
    }
    
    // Если не нашли в localStorage, проверяем cookies
    if (!foundToken) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            if (cookie.includes('remixsid')) {
                const token = cookie.split('=')[1]?.trim();
                if (token) {
                    foundToken = {
                        key: 'remixsid_cookie',
                        token: token
                    };
                    break;
                }
            }
        }
    }
    
    return foundToken;
}