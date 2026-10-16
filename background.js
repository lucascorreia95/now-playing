// Background service worker para a extensão

let currentTrack = null;
let ws = null;
let reconnectInterval = null;
let heartbeatInterval = null;
let lastUpdate = Date.now();
let youtubeMusicTabId = null;

// Conectar ao servidor WebSocket local
function connectWebSocket() {
  try {
    ws = new WebSocket('ws://localhost:8765');
    
    ws.onopen = () => {
      console.log('Conectado ao servidor WebSocket');
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
      // Iniciar heartbeat
      startHeartbeat();
    };
    
    ws.onmessage = (event) => {
      console.log('Mensagem do servidor:', event.data);
    };
    
    ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket desconectado, tentando reconectar em 5 segundos...');
      stopHeartbeat();
      if (!reconnectInterval) {
        reconnectInterval = setInterval(connectWebSocket, 5000);
      }
    };
  } catch (error) {
    console.error('Erro ao conectar WebSocket:', error);
    if (!reconnectInterval) {
      reconnectInterval = setInterval(connectWebSocket, 5000);
    }
  }
}

// Enviar dados para o servidor WebSocket
function sendToServer(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
    }
  }
}

// Limpar dados da música
function clearTrackData() {
  console.log('Limpando dados da música...');
  currentTrack = null;
  youtubeMusicTabId = null;
  chrome.storage.local.set({ currentTrack: null });
  sendToServer({ title: '', artist: '', thumbnail: '', isPlaying: false, timeInfo: '', timestamp: Date.now() });
}

// Heartbeat para detectar quando o YouTube Music é fechado
function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  heartbeatInterval = setInterval(() => {
    const now = Date.now();
    // Se não houver atualizações por 60 segundos, limpar
    if (now - lastUpdate > 60000 && currentTrack && currentTrack.title) {
      console.log('Nenhuma atualização por 60 segundos, limpando...');
      clearTrackData();
    }
  }, 10000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Armazenar informações da música atual
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'NOW_PLAYING') {
    currentTrack = request.data;
    lastUpdate = Date.now();
    
    // Rastrear a aba do YouTube Music
    if (sender.tab && sender.tab.url && sender.tab.url.includes('music.youtube.com')) {
      youtubeMusicTabId = sender.tab.id;
    }
    
    // Salvar no storage para persistência
    chrome.storage.local.set({ currentTrack });
    
    // Enviar para o popup se estiver aberto
    chrome.runtime.sendMessage({ type: 'TRACK_UPDATED', data: currentTrack }).catch(() => {
      // Popup pode não estar aberto, ignorar erro
    });
    
    // Enviar para o servidor WebSocket local
    sendToServer(currentTrack);
  }
});

// Listener para quando a aba é fechada
chrome.tabs.onRemoved.addListener((tabId) => {
  if (youtubeMusicTabId && tabId === youtubeMusicTabId) {
    console.log('Aba do YouTube Music fechada, limpando...');
    clearTrackData();
  }
});

// Listener para quando a aba é atualizada
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (youtubeMusicTabId && tabId === youtubeMusicTabId && changeInfo.status === 'loading') {
    console.log('Aba do YouTube Music sendo atualizada, limpando...');
    clearTrackData();
  }
});

// Listener para quando a extensão é instalada
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Music Now Playing extensão instalada');
  connectWebSocket();
});

// Listener para quando o navegador inicia
chrome.runtime.onStartup.addListener(() => {
  // Recuperar última música do storage
  chrome.storage.local.get(['currentTrack'], (result) => {
    if (result.currentTrack) {
      currentTrack = result.currentTrack;
      lastUpdate = Date.now();
      // Enviar para o servidor ao iniciar
      connectWebSocket();
      setTimeout(() => sendToServer(currentTrack), 1000);
    } else {
      connectWebSocket();
    }
  });
});

// Tentar conectar ao iniciar
connectWebSocket();
