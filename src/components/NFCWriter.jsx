import { useState } from 'react';

const NFCWriter = ({ cardId, onSuccess, onError }) => {
  const [isWriting, setIsWriting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const checkNFCSupport = () => {
    if (!('NDEFReader' in window)) {
      return {
        supported: false,
        message: 'NFC não é suportado neste navegador. Use Chrome no Android ou Edge no Windows.'
      };
    }
    return { supported: true };
  };

  const writeToNFC = async () => {
    const nfcCheck = checkNFCSupport();
    
    if (!nfcCheck.supported) {
      onError(nfcCheck.message);
      return;
    }

    try {
      setIsWriting(true);
      setShowModal(true);

      // URL que será gravada no cartão
      const cardUrl = `${window.location.origin}/card/${cardId}`;
      
      const ndef = new NDEFReader();
      
      // Escrever no cartão NFC
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: cardUrl
          }
        ]
      });

      setShowModal(false);
      setIsWriting(false);
      onSuccess(`Cartão programado com sucesso!\nURL gravada: ${cardUrl}`);
      
    } catch (error) {
      setShowModal(false);
      setIsWriting(false);
      
      console.error('Erro ao escrever NFC:', error);
      
      let errorMessage = 'Erro ao gravar no cartão NFC.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão negada. Permita o acesso ao NFC nas configurações do navegador.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'NFC não é suportado neste dispositivo.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Erro ao ler o cartão. Tente novamente.';
      } else if (error.name === 'NetworkError') {
        errorMessage = 'Cartão não encontrado. Aproxime o cartão do dispositivo.';
      }
      
      onError(errorMessage);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsWriting(false);
  };

  return (
    <>
      <button
        onClick={writeToNFC}
        className="nfc-write-btn"
        disabled={isWriting}
        title="Gravar URL no cartão NFC"
      >
        {isWriting ? (
          <>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="animate-spin">
              <path d="M8 0c-4.418 0-8 3.582-8 8 0 1.335.325 2.618.899 3.738l1.456-.728c-.394-.77-.605-1.631-.605-2.51 0-3.037 2.463-5.5 5.5-5.5s5.5 2.463 5.5 5.5-2.463 5.5-5.5 5.5c-1.731 0-3.277-.799-4.298-2.052l-1.456.728c1.263 1.554 3.174 2.574 5.254 2.574 3.866 0 7-3.134 7-7s-3.134-7-7-7z"/>
            </svg>
            Gravando...
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V2zM7 3v10h2V3H7z"/>
              <path d="M1.5 5A1.5 1.5 0 0 1 3 3.5h1a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h1a.5.5 0 0 1 0 1H3A1.5 1.5 0 0 1 1.5 11V5zm13 0v6A1.5 1.5 0 0 1 13 12.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 1 0-1h1A1.5 1.5 0 0 1 14.5 5z"/>
              <circle cx="8" cy="8" r="1"/>
            </svg>
            Gravar no Cartão
          </>
        )}
      </button>

      {showModal && (
        <div className="nfc-modal-overlay" onClick={closeModal}>
          <div className="nfc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nfc-modal-content">
              <h2>📡 Gravando no Cartão NFC</h2>
              
              <div className="nfc-animation">
                <div className="nfc-waves">
                  <div className="wave"></div>
                  <div className="wave"></div>
                  <div className="wave"></div>
                </div>
                <div className="phone-icon">📱</div>
                <div className="card-icon">💳</div>
              </div>
              
              <div className="nfc-instructions">
                <h3>Instruções:</h3>
                <ol>
                  <li>Aproxime o cartão NFC da parte traseira do seu celular</li>
                  <li>Mantenha o cartão próximo até aparecer a confirmação</li>
                  <li>Não mova o cartão durante a gravação</li>
                </ol>
              </div>
              
              <div className="nfc-info">
                <p><strong>URL que será gravada:</strong></p>
                <code>{window.location.origin}/card/{cardId}</code>
              </div>
              
              <div className="nfc-modal-actions">
                <button onClick={closeModal} className="cancel-btn">
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NFCWriter; 