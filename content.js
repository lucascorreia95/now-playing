// Content script para extrair informações do YouTube Music

console.log('YouTube Music Now Playing: Content script carregado');

let extensionContextValid = true;

// Detectar quando o contexto da extensão é invalidado
chrome.runtime.onConnect.addListener(() => {
  extensionContextValid = true;
});

// Função para extrair informações da música
function getNowPlaying() {
  // Se o contexto foi invalidado, parar de tentar
  if (!extensionContextValid) {
    return null;
  }
  
  try {
    console.log('YouTube Music Now Playing: Tentando extrair informações...');
    
    // Seletores do YouTube Music baseados na estrutura real
    const playerBar = document.querySelector('ytmusic-player-bar');
    
    if (!playerBar) {
      console.log('YouTube Music Now Playing: Player bar não encontrado');
      return null;
    }
    
    // Título: <yt-formatted-string class="title style-scope ytmusic-player-bar">
    const titleElement = playerBar.querySelector('.title');
    
    // Artista: pode ser um link <a> ou um <yt-formatted-string class="byline">
    const artistElement = playerBar.querySelector('.subtitle a') || 
                         playerBar.querySelector('.subtitle .byline');
    
    // Thumbnail: <img class="image style-scope ytmusic-player-bar">
    const thumbnailElement = playerBar.querySelector('.image');
    
    console.log('Elementos encontrados:', {
      title: !!titleElement,
      artist: !!artistElement,
      thumbnail: !!thumbnailElement
    });
    
    // Extrair título
    let title = titleElement?.textContent?.trim() || '';
    
    // Extrair artista
    let artist = artistElement?.textContent?.trim() || '';
    
    // Extrair thumbnail
    let thumbnail = thumbnailElement?.src || '';
    
    // Substituir tamanho da thumbnail para qualidade melhor (60x60 -> 300x300)
    if (thumbnail) {
      // O padrão é =wX-hY-lZ-rj, substituímos para =w300-h300
      thumbnail = thumbnail.replace(/=w\d+-h\d+-l\d+-rj/g, '=w300-h300-l90-rj');
    }
    
    // Última tentativa: primeira imagem no player bar
    if (!thumbnail) {
      const allImages = playerBar.querySelectorAll('img');
      if (allImages.length > 0) {
        let fallbackThumbnail = allImages[0].src;
        if (fallbackThumbnail) {
          fallbackThumbnail = fallbackThumbnail.replace(/=w\d+-h\d+-l\d+-rj/g, '=w300-h300-l90-rj');
        }
        thumbnail = fallbackThumbnail;
      }
    }
    
    // Verificar se está tocando
    const playButton = playerBar.querySelector('.play-pause-button');
    const isPlaying = playButton?.getAttribute('aria-label')?.includes('Pausar') || 
                      playButton?.getAttribute('title')?.includes('Pausar') ||
                      false;
    
    // Verificar duração e tempo atual
    const timeElement = playerBar.querySelector('.time-info');
    const timeInfo = timeElement?.textContent?.trim() || '';
    
    const data = {
      title,
      artist,
      album: '',
      thumbnail,
      isPlaying,
      timeInfo,
      timestamp: Date.now()
    };
    
    console.log('YouTube Music Now Playing: Dados extraídos:', data);
    
    // Se não houver título ou não estiver tocando, enviar dados vazios
    if (!title || !isPlaying) {
      console.log('YouTube Music Now Playing: Música parada ou sem título, limpando...');
      const emptyData = {
        title: '',
        artist: '',
        album: '',
        thumbnail: '',
        isPlaying: false,
        timeInfo: '',
        timestamp: Date.now()
      };
      
      if (extensionContextValid) {
        chrome.runtime.sendMessage({ type: 'NOW_PLAYING', data: emptyData }).catch((error) => {
          if (error.message && error.message.includes('Extension context invalidated')) {
            extensionContextValid = false;
            console.log('YouTube Music Now Playing: Contexto da extensão invalidado, recarregue a página');
          }
        });
      }
      return emptyData;
    }
    
    // Enviar dados para o background
    if (extensionContextValid) {
      chrome.runtime.sendMessage({ type: 'NOW_PLAYING', data }).catch((error) => {
        // Se o contexto foi invalidado, marcar e parar
        if (error.message && error.message.includes('Extension context invalidated')) {
          extensionContextValid = false;
          console.log('YouTube Music Now Playing: Contexto da extensão invalidado, recarregue a página');
        }
      });
    }
    
    return data;
  } catch (error) {
    // Se o erro for sobre contexto invalidado, marcar e parar
    if (error.message && error.message.includes('Extension context invalidated')) {
      extensionContextValid = false;
      console.log('YouTube Music Now Playing: Contexto da extensão invalidado, recarregue a página');
    } else {
      console.error('YouTube Music Now Playing: Erro ao extrair informações:', error);
    }
    return null;
  }
}

// Debounce para evitar chamadas excessivas
let lastCall = 0;
const debounceDelay = 500;

// Observar mudanças no DOM para detectar quando a música muda
const observer = new MutationObserver(() => {
  const now = Date.now();
  if (now - lastCall > debounceDelay) {
    lastCall = now;
    getNowPlaying();
  }
});

// Configurar o observer
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'aria-label']
});

// Extrair informações iniciais quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', getNowPlaying);
} else {
  getNowPlaying();
}

// Extrair informações periodicamente (como fallback)
const intervalId = setInterval(getNowPlaying, 2000);

// Limpar interval quando a página for descarregada
window.addEventListener('beforeunload', () => {
  clearInterval(intervalId);
});
