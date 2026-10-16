// Servidor local para integração com OBS Studio
// Recebe informações da extensão e gera arquivo de texto para o OBS

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 8765;
const OUTPUT_FILE = path.join(__dirname, 'now-playing.txt');

// Criar servidor HTTP para servir a página web
const httpServer = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateHTML());
  } else if (req.url === '/now-playing.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    try {
      const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
      res.end(content);
    } catch (err) {
      res.end('Carregando...');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Criar servidor WebSocket
const wss = new WebSocket.Server({ server: httpServer });

let currentTrack = null;
let lastThumbnailUrl = null;

// Gerar HTML para Browser Source do OBS
function generateHTML() {
  const hasTrack = currentTrack && currentTrack.title;
  
  // Função simples para escapar HTML
  const escapeHtml = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
      background: transparent;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    }
    .container {
      display: flex;
      align-items: center;
      gap: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .container.visible {
      opacity: 1;
    }
    .thumbnail {
      width: 110px;
      height: 110px;
      border-radius: 10px;
      overflow: hidden;
      background: rgba(0,0,0,0.3);
    }
    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .info {
      flex: 1;
    }
    .title {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .artist {
      font-size: 18px;
      opacity: 0.9;
    }
    .progress-container {
      margin-top: 8px;
      width: 100%;
    }
    .progress-bar {
      width: 50%;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    .time-info {
      font-size: 14px;
      opacity: 0.7;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="container ${hasTrack ? 'visible' : ''}">
    ${hasTrack && currentTrack.thumbnail ? `<div class="thumbnail"><img src="${escapeHtml(currentTrack.thumbnail)}"></div>` : ''}
    <div class="info">
      <div class="title">${hasTrack ? escapeHtml(currentTrack.title) : ''}</div>
      <div class="artist">${hasTrack ? escapeHtml(currentTrack.artist) : ''}</div>
    </div>
  </div>
  <script>
    const ws = new WebSocket('ws://localhost:${PORT}');
    
    ws.onopen = () => {
      console.log('WebSocket conectado');
    };
    
    ws.onmessage = (event) => {
      console.log('Mensagem recebida:', event.data);
      const data = JSON.parse(event.data);
      updateDisplay(data);
    };
    
    ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket desconectado');
    };
    
    let lastTrackInfo = null;
    
    function updateDisplay(data) {
      console.log('Atualizando display:', data);
      const hasTrack = data && data.title;
      const container = document.querySelector('.container');
      
      // Verificar se é a mesma música e mesmo thumbnail
      const isSameTrack = lastTrackInfo && 
                          lastTrackInfo.title === data.title && 
                          lastTrackInfo.artist === data.artist;
      const isSameThumbnail = lastTrackInfo && lastTrackInfo.thumbnail === data.thumbnail;
      
      if (hasTrack) {
        // Escapar HTML para evitar XSS
        const escapeHtml = (text) => {
          if (!text) return '';
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        };
        
        // Calcular porcentagem do progresso
        const progressPercent = calculateProgress(data.timeInfo);
        
        // Se for a mesma música e mesmo thumbnail, só atualizar tempo e progresso
        if (isSameTrack && isSameThumbnail) {
          const titleEl = container.querySelector('.title');
          const artistEl = container.querySelector('.artist');
          const progressFill = container.querySelector('.progress-fill');
          const timeInfoEl = container.querySelector('.time-info');
          
          if (titleEl && artistEl) {
            titleEl.textContent = data.title;
            artistEl.textContent = data.artist;
            if (progressFill) progressFill.style.width = progressPercent + '%';
            if (timeInfoEl) timeInfoEl.textContent = data.timeInfo;
            container.classList.add('visible');
            lastTrackInfo = data;
            return; // Não recarrega o HTML inteiro
          }
        }
        
        // Música diferente ou thumbnail mudou, recarrega tudo
        let html = '';
        if (data.thumbnail) {
          html += '<div class="thumbnail"><img src="' + escapeHtml(data.thumbnail) + '" onerror="this.onerror=null; this.src=\\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCIgc3R5bGU9InN0b3AtY29sb3I6IzY2N2VlYTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM3NjRiYTI7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIHJ4PSIyNCIgZmlsbD0idXJsKCNncmFkKSIvPjxwYXRoIGQ9Ik00OCA0MCBMODggNjQgTDQ4IDg4IFoiIGZpbGw9IndoaXRlIi8+PC9zdmc+\\'"></div>';
        }
        html += '<div class="info">';
        html += '<div class="title">' + escapeHtml(data.title) + '</div>';
        html += '<div class="artist">' + escapeHtml(data.artist) + '</div>';
        
        // Adicionar barra de progresso e tempo
        if (data.timeInfo) {
          html += '<div class="progress-container">';
          html += '<div class="progress-bar"><div class="progress-fill" style="width: ' + progressPercent + '%"></div></div>';
          html += '<div class="time-info">' + escapeHtml(data.timeInfo) + '</div>';
          html += '</div>';
        }
        
        html += '</div>';
        
        container.innerHTML = html;
        container.classList.add('visible');
        lastTrackInfo = data;
      } else {
        container.classList.remove('visible');
        lastTrackInfo = null;
      }
    }
    
    function calculateProgress(timeInfo) {
      if (!timeInfo) return 0;
      
      // Parse timeInfo: "0:00 / 3:45"
      const parts = timeInfo.split(' / ');
      if (parts.length !== 2) return 0;
      
      const current = parseTime(parts[0]);
      const total = parseTime(parts[1]);
      
      if (total === 0) return 0;
      
      return Math.min(100, Math.max(0, (current / total) * 100));
    }
    
    function parseTime(timeStr) {
      // Parse "0:00" or "3:45" to seconds
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
      return 0;
    }
  </script>
</body>
</html>
  `;
}

// Salvar informações no arquivo de texto
function saveToFile(data) {
  try {
    let content = '';
    if (data && data.title) {
      // Escapar HTML para segurança no arquivo de texto
      const escapeHtml = (text) => {
        if (!text) return '';
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      content = `${escapeHtml(data.title)} - ${escapeHtml(data.artist)}`;
      if (data.timeInfo) {
        content += ` (${escapeHtml(data.timeInfo)})`;
      }
    } else {
      // Limpar o arquivo quando não houver música
      content = '';
    }
    
    fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
    console.log('Arquivo atualizado:', content || '(vazio)');
  } catch (err) {
    console.error('Erro ao salvar arquivo:', err);
  }
}

// Conexões WebSocket
wss.on('connection', (ws) => {
  console.log('Cliente conectado');
  
  // Enviar dados atuais se existirem
  if (currentTrack) {
    ws.send(JSON.stringify(currentTrack));
  }
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Só atualizar se for uma música diferente ou se o thumbnail mudou
      const isDifferentTrack = !currentTrack || currentTrack.title !== data.title || currentTrack.artist !== data.artist;
      const thumbnailChanged = data.thumbnail && data.thumbnail !== lastThumbnailUrl;
      
      currentTrack = data;
      
      if (data.thumbnail) {
        lastThumbnailUrl = data.thumbnail;
      }
      
      saveToFile(data);
      
      // Broadcast para todos os clientes conectados
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
      
      if (isDifferentTrack || thumbnailChanged) {
        console.log('Música ou thumbnail mudou, atualizando');
      }
    } catch (err) {
      console.error('Erro ao processar mensagem:', err);
    }
  });
  
  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log('Servidor rodando em http://localhost:' + PORT);
  console.log('WebSocket em ws://localhost:' + PORT);
  console.log('Arquivo de saída: ' + OUTPUT_FILE);
  console.log('\nPara usar no OBS:');
  console.log('1. Opção 1 - Text Source: Adicione "Text (FreeType 2)" e selecione o arquivo now-playing.txt');
  console.log('2. Opção 2 - Browser Source: Adicione "Browser Source" com URL http://localhost:' + PORT);
});
