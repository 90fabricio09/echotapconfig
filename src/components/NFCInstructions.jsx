import { useState } from 'react';

const NFCInstructions = ({ cardId, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Detectar plataforma do usuário
  const detectPlatform = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return 'ios';
    } else if (/android/i.test(userAgent)) {
      return 'android';
    }
    return 'desktop';
  };

  // Verificar se é dispositivo móvel
  const isMobile = () => {
    const platform = detectPlatform();
    return platform === 'ios' || platform === 'android';
  };

  // URLs das lojas de aplicativos
  const getAppStoreUrl = () => {
    const platform = detectPlatform();
    
    if (platform === 'ios') {
      return 'https://apps.apple.com/app/nfc-tools/id1252962749';
    } else if (platform === 'android') {
      return 'https://play.google.com/store/apps/details?id=com.wakdev.wdnfc';
    }
    return 'https://www.wakdev.com/en/apps/nfc-tools-pc-mac.html';
  };

  // Copiar link do cartão (sem protocolo para NFC Tools)
  const copyCardLink = async () => {
    const cardUrl = `${window.location.origin}/card/${cardId}`;
    // Remove http:// ou https:// para evitar duplicação no NFC Tools
    const linkForNFC = cardUrl.replace(/^https?:\/\//, '');
    
    try {
      await navigator.clipboard.writeText(linkForNFC);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = linkForNFC;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Erro no fallback de cópia:', fallbackError);
        alert(`Não foi possível copiar automaticamente. Copie manualmente: ${linkForNFC}`);
      }
      document.body.removeChild(textArea);
    }
  };

  const platform = detectPlatform();
  const cardUrl = `${window.location.origin}/card/${cardId}`;
  const displayUrl = cardUrl.replace(/^https?:\/\//, ''); // URL para exibição (sem protocolo)

  // Fechar modal ao clicar no overlay (fora da caixa)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="nfc-instructions-overlay" onClick={handleOverlayClick}>
      <div className="nfc-instructions-modal">
        {/* Botão de fechar */}
        <button className="close-btn" onClick={onClose} title="Fechar">
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
        </button>

        {/* Cabeçalho */}
        <div className="modal-header">
          <div className="nfc-icon">
            <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V2zM7 3v10h2V3H7z"/>
              <path d="M1.5 5A1.5 1.5 0 0 1 3 3.5h1a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h1a.5.5 0 0 1 0 1H3A1.5 1.5 0 0 1 1.5 11V5zm13 0v6A1.5 1.5 0 0 1 13 12.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 1 0-1h1A1.5 1.5 0 0 1 14.5 5z"/>
              <circle cx="8" cy="8" r="1"/>
            </svg>
          </div>
          <h2>Como Gravar seu Cartão NFC</h2>
          <p>Siga os passos abaixo para programar seu cartão usando o NFC Tools</p>
        </div>

        {/* Conteúdo principal */}
        <div className="modal-content">
          
          {/* Passo 1: Instalar NFC Tools */}
          <div className="instruction-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>{isMobile() ? 'Instale o NFC Tools' : 'Baixe o NFC Tools no seu celular'}</h3>
              <p>
                {isMobile() 
                  ? 'Baixe o aplicativo oficial para gravar cartões NFC' 
                  : 'Use seu celular para baixar o aplicativo NFC Tools e gravar o cartão'
                }
              </p>
              {isMobile() ? (
                <a 
                  href={getAppStoreUrl()} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="app-store-btn"
                >
                  <div className="store-icon">
                    {platform === 'ios' ? (
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.624-.319 1.359-.478 2.063-.478.704 0 1.438.159 2.063.478.624.319 1.523.165 1.843-.067.32-.232 1.083-.915 1.659-1.899.576-.984.97-2.067 1.273-2.796.303-.729.585-3.078-.067-4.56z"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M7.815 3.094a.5.5 0 0 1 .37 0L15.5 6.094a.5.5 0 0 1 0 .812L8.185 9.906a.5.5 0 0 1-.37 0L.5 6.906a.5.5 0 0 1 0-.812L7.815 3.094zM8 4.094L2.81 6.5 8 8.906 13.19 6.5 8 4.094z"/>
                        <path d="M.5 9.5a.5.5 0 0 1 .6-.49L8 11.5l6.9-2.49a.5.5 0 0 1 .6.49v3a.5.5 0 0 1-.314.464L8 15.464l-7.186-2.5A.5.5 0 0 1 .5 12.5v-3z"/>
                      </svg>
                    )}
                  </div>
                  <div className="store-text">
                    <div className="store-label">
                      {platform === 'ios' ? 'Baixar da' : 'Disponível no'}
                    </div>
                    <div className="store-name">
                      {platform === 'ios' ? 'App Store' : 'Google Play'}
                    </div>
                  </div>
                </a>
              ) : (
                <div className="desktop-instruction">
                  <div className="desktop-icon">
                    <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M6 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V2zM7 3v10h2V3H7z"/>
                      <path d="M1.5 5A1.5 1.5 0 0 1 3 3.5h1a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h1a.5.5 0 0 1 0 1H3A1.5 1.5 0 0 1 1.5 11V5zm13 0v6A1.5 1.5 0 0 1 13 12.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 1 0-1h1A1.5 1.5 0 0 1 14.5 5z"/>
                      <circle cx="8" cy="8" r="1"/>
                    </svg>
                  </div>
                  <p><strong>Procure por "NFC Tools" na loja de aplicativos do seu celular:</strong></p>
                  <ul>
                    <li>📱 <strong>iPhone/iPad:</strong> App Store</li>
                    <li>🤖 <strong>Android:</strong> Google Play Store</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Passo 2: Copiar Link */}
          <div className="instruction-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Copie o Link do Cartão</h3>
              <p>Este é o link que será gravado no seu cartão NFC</p>
              <div className="link-container">
                <div className="link-display">
                  <code>{displayUrl}</code>
                </div>
                <button 
                  onClick={copyCardLink} 
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  title="Copiar link"
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                      </svg>
                      Copiado!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                      </svg>
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Passo 3: Instruções do NFC Tools */}
          <div className="instruction-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>No Aplicativo NFC Tools</h3>
              <div className="substeps">
                <div className="substep">
                  <span className="substep-number">3.1</span>
                  <span>Abra o NFC Tools e toque em <strong>"Escrever"</strong></span>
                </div>
                <div className="substep">
                  <span className="substep-number">3.2</span>
                  <span>Toque no botão <strong>"Adicionar para salvar"</strong> para adicionar um registro</span>
                </div>
                <div className="substep">
                  <span className="substep-number">3.3</span>
                  <span>Selecione <strong>"URL/URI"</strong></span>
                </div>
                <div className="substep">
                  <span className="substep-number">3.4</span>
                  <span>Cole o link copiado no campo de texto</span>
                </div>
                <div className="substep">
                  <span className="substep-number">3.5</span>
                  <span>Toque em <strong>"Escrever"</strong> e aproxime o cartão</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dicas importantes */}
          <div className="tips-section">
            <h4>💡 Dicas Importantes:</h4>
            <ul>
              {isMobile() ? (
                <>
                  <li>Mantenha o cartão próximo ao celular durante toda a gravação</li>
                  <li>Certifique-se de que o NFC está ativado no seu dispositivo</li>
                  <li>Cada cartão pode ser regravado quantas vezes quiser</li>
                  <li>Teste o cartão após a gravação para verificar se funcionou</li>
                </>
              ) : (
                <>
                  <li>Use seu celular para baixar o NFC Tools e gravar o cartão</li>
                  <li>Você pode copiar o link nesta tela e enviar para seu celular</li>
                  <li>Certifique-se de que o NFC está ativado no celular</li>
                  <li>Mantenha o cartão próximo ao celular durante a gravação</li>
                  <li>Cada cartão pode ser regravado quantas vezes quiser</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFCInstructions;
