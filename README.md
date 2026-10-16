# YouTube Music Now Playing

Extensão do Chrome para extrair e exibir informações sobre a música que está tocando no YouTube Music, com integração em tempo real para OBS Studio.

## 🎯 Funcionalidades

- 🎵 Exibe título da música
- 🎤 Exibe nome do artista
- 🖼️ Exibe thumbnail da capa do álbum com fallback
- ⏱️ Exibe tempo atual e duração da música
- � Barra de progresso visual
- ▶️ Esconde automaticamente ao pausar/fechar
- �🔄 Atualização automática quando a música muda
- 📺 Integração com OBS Studio via WebSocket
- 🚀 Cache inteligente de imagens (evita bloqueio da API)
- 🛡️ Proteção XSS em todas as saídas

## 📸 Capturas

### Popup da Extensão
![Popup](https://via.placeholder.com/350x200/667eea/ffffff?text=Popup+Preview)

### Browser Source no OBS
![OBS](https://via.placeholder.com/400x150/764ba2/ffffff?text=OBS+Preview)

## 🚀 Instalação

### 1. Carregar a extensão no Chrome

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o "Modo do desenvolvedor" no canto superior direito
3. Clique em "Carregar sem compactação"
4. Selecione a pasta deste projeto

### 2. Criar atalho na área de trabalho (Opcional)

Execute o arquivo `criar-atalho.bat` para criar um atalho na área de trabalho que inicia o servidor em background.

### 3. Usar a extensão

1. Abra o [YouTube Music](https://music.youtube.com)
2. Comece a tocar uma música
3. Clique no ícone da extensão na barra do Chrome para ver as informações

## 📺 Integração com OBS Studio

### Iniciando o Servidor

#### Opção 1: Usar arquivo .bat (Recomendado - Windows)

Dê dois cliques no arquivo `iniciar-servidor.bat` para iniciar o servidor em uma janela de terminal.

#### Opção 2: Usar minimizado (Windows)

Dê dois cliques no arquivo `iniciar-servidor-minimizado.bat` para iniciar o servidor em janela minimizada.

#### Opção 3: Usar em background (Windows)

Dê dois cliques no arquivo `iniciar-servidor-background.vbs` para iniciar o servidor em background (sem janela de terminal).

> **Nota:** Para parar o servidor em background, use o Gerenciador de Tarefas e encerre o processo `node.exe`.

#### Opção 4: Usar terminal

```bash
npm start
```

O servidor irá rodar em `http://localhost:8765`

### Configuração no OBS Studio

#### Opção 1: Browser Source (Recomendado - Atualização em tempo real)

1. Adicione uma nova fonte "Browser"
2. URL: `http://localhost:8765`
3. Largura: 400
4. Altura: 150
5. Clique em OK

#### Opção 2: Text Source (Arquivo de texto)

1. Adicione uma nova fonte "Text (FreeType 2)"
2. Selecione "Read from file"
3. Selecione o arquivo `now-playing.txt` da pasta do projeto
4. Configure fonte, tamanho e cores conforme desejado
5. Clique em OK

### Como funciona

```
YouTube Music → Extensão Chrome → WebSocket → Servidor Local → OBS
                 Content Script        Background      Browser Source
```

1. A extensão do Chrome extrai informações do YouTube Music via content script
2. Envia as informações para o servidor local via WebSocket
3. O servidor:
   - Atualiza o arquivo `now-playing.txt` (para Text Source)
   - Serve uma página web dinâmica em `http://localhost:8765` (para Browser Source)
   - Broadcast para todos os clientes WebSocket conectados
4. O OBS lê a página web e exibe na sua live com atualização em tempo real

## 📁 Estrutura dos arquivos

```
playing-now/
├── manifest.json           # Configuração da extensão (Manifest v3)
├── content.js              # Script que extrai informações do YouTube Music
├── background.js           # Service worker que gerencia WebSocket
├── popup.html              # Interface do popup
├── popup.css               # Estilos do popup
├── popup.js                # Lógica do popup
├── server.js               # Servidor local para integração com OBS
├── icon.svg                # Ícone da extensão (SVG)
├── icon16.png              # Ícone 16x16
├── icon48.png              # Ícone 48x48
├── icon128.png             # Ícone 128x128
├── iniciar-servidor.bat    # Script para iniciar servidor
├── iniciar-servidor-minimizado.bat  # Script para iniciar minimizado
├── iniciar-servidor-background.vbs  # Script para iniciar em background
├── criar-atalho.bat        # Script para criar atalho na área de trabalho
├── package.json            # Dependências do Node.js
└── README.md               # Documentação
```

## 🎨 Personalização

### Personalizar o estilo no Browser Source

Edite a função `generateHTML()` no arquivo `server.js` para modificar:
- Cores
- Fontes
- Tamanhos
- Layout
- Elementos exibidos

### Personalizar o formato do arquivo de texto

Edite a função `saveToFile()` no arquivo `server.js` para modificar o formato do texto.

## 🔧 Solução de problemas

### Extensão não funciona

1. Verifique se você está no YouTube Music (não YouTube regular)
2. Recarregue a página do YouTube Music (F5)
3. Abra o console do navegador (F12) para ver erros
4. Recarregue a extensão em `chrome://extensions/`

### Erro "Extension context invalidated"

Este erro ocorre quando você recarrega a extensão mas não recarrega a página do YouTube Music.

**Solução:**
1. Recarregue a página do YouTube Music (F5)
2. O content script será reinjetado automaticamente

### Servidor não conecta

1. Verifique se o servidor está rodando: `iniciar-servidor.bat`
2. Verifique se a porta 8765 não está em uso por outro programa
3. Verifique o console do servidor para erros

### OBS não atualiza

1. Para Text Source: Recarregue a fonte manualmente (F2 na fonte)
2. Para Browser Source: A atualização é automática via WebSocket
3. Verifique se o servidor está rodando e a extensão está conectada

### Imagens não carregam no OBS

O sistema usa cache inteligente para evitar bloqueio da API do YouTube:
- Imagens só são recarregadas quando a música muda
- Atualizações de tempo não recarregam a imagem
- Fallback automático com ícone da extensão se a imagem falhar

## 🛠️ Tecnologias Utilizadas

- **Chrome Extension API** (Manifest v3)
- **WebSocket** (Comunicação em tempo real)
- **Node.js** (Servidor local)
- **MutationObserver** (Detecção de mudanças no DOM)
- **Content Security Policy** (Segurança)
- **XSS Protection** (Escapamento de HTML)

## 📝 Notas Importantes

- A extensão só funciona em páginas do YouTube Music (`https://music.youtube.com/*`)
- Os seletores CSS podem precisar de atualizações se o YouTube Music mudar sua estrutura
- A extensão usa o MutationObserver para detectar mudanças na página automaticamente
- O servidor WebSocket tenta reconectar automaticamente se desconectar
- Todas as saídas de HTML são escapadas para prevenir ataques XSS

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests
- Melhorar a documentação

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 👨‍💻 Desenvolvido por

[Seu Nome] - Desenvolvedor Full Stack

---

**Feito com ❤️ para streamers e criadores de conteúdo**
