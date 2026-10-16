// Popup script para exibir informações da música

const trackInfo = document.getElementById('track-info');
const refreshBtn = document.getElementById('refresh-btn');

// Função para formatar as informações da música
function formatTrackInfo(data) {
  if (!data || !data.title) {
    return `
      <div class="no-track">
        <p>Nenhuma música tocando</p>
        <p style="font-size: 12px; margin-top: 10px;">Abra o YouTube Music para começar</p>
      </div>
    `;
  }
  
  const thumbnailHtml = data.thumbnail 
    ? `<div class="thumbnail"><img src="${data.thumbnail}" alt="Thumbnail"></div>`
    : '';
  
  const albumHtml = data.album ? `<div class="track-album">${data.album}</div>` : '';
  const timeHtml = data.timeInfo ? `<div class="track-time">${data.timeInfo}</div>` : '';
  
  return `
    <div class="track">
      ${thumbnailHtml}
      <div class="track-details">
        <div class="track-title">${data.title}</div>
        <div class="track-artist">${data.artist}</div>
        ${albumHtml}
        ${timeHtml}
      </div>
    </div>
  `;
}

// Função para carregar informações da música
async function loadTrackInfo() {
  try {
    // Recuperar do storage (content script atualiza automaticamente)
    const result = await chrome.storage.local.get(['currentTrack']);
    
    if (result.currentTrack && result.currentTrack.title) {
      trackInfo.innerHTML = formatTrackInfo(result.currentTrack);
    } else {
      trackInfo.innerHTML = formatTrackInfo(null);
    }
  } catch (error) {
    console.error('Erro ao carregar informações:', error);
    trackInfo.innerHTML = formatTrackInfo(null);
  }
}

// Ouvir atualizações do background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TRACK_UPDATED') {
    trackInfo.innerHTML = formatTrackInfo(request.data);
  }
});

// Carregar informações quando o popup abrir
document.addEventListener('DOMContentLoaded', loadTrackInfo);

// Botão de atualização
refreshBtn.addEventListener('click', loadTrackInfo);
