import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NFCInstructions from '../components/NFCInstructions';
import { useAuth } from '../contexts/AuthContext';
import { cardService } from '../services/cardService';
import logoImage from '../assets/images/logo.png';
import echoTapImage from '../assets/images/echotap.png';

const CardManager = () => {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canCreateCard, setCanCreateCard] = useState(true);
  const [showNFCInstructions, setShowNFCInstructions] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirmar',
    cancelText: 'Cancelar'
  });
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Sistema de notificações
  const showNotification = (message, type = 'info', duration = 4000, cardId = null) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration, cardId };
    setNotifications(prev => [...prev, notification]);

    // Auto remover após duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Função para renderizar mensagem da notificação com ID em negrito
  const renderNotificationMessage = (notification) => {
    if (notification.cardId && notification.message.includes(notification.cardId)) {
      const parts = notification.message.split(notification.cardId);
      return (
        <>
          {parts[0]}
          <strong>{notification.cardId}</strong>
          {parts[1]}
        </>
      );
    }
    return notification.message;
  };

  // Sistema de modal de confirmação
  const showConfirmModal = ({
    title = 'Confirmar Ação',
    message = 'Tem certeza que deseja continuar?',
    type = 'warning',
    onConfirm = () => {},
    onCancel = () => {},
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
  }) => {
    setConfirmModal({
      show: true,
      title,
      message,
      type,
      onConfirm,
      onCancel,
      confirmText,
      cancelText
    });
  };

  const hideConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, show: false }));
  };

  const handleConfirmAction = () => {
    if (confirmModal.onConfirm) {
      confirmModal.onConfirm();
    }
    hideConfirmModal();
  };

  const handleCancelAction = () => {
    if (confirmModal.onCancel) {
      confirmModal.onCancel();
    }
    hideConfirmModal();
  };

  // Função para formatar datas de forma segura
  const formatCardDate = (dateValue) => {
    if (!dateValue) {
      return 'Data não disponível';
    }

    try {
      let date;
      
      // Se for um objeto Firestore Timestamp
      if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      }
      // Se for um objeto com propriedades seconds e nanoseconds (Firestore timestamp serializado)
      else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      }
      // Se for uma string ISO
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // Se for um número (timestamp)
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      // Se já for um objeto Date
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      else {
        return 'Data inválida';
      }

      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }

      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateValue);
      return 'Data inválida';
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadCards();
    }
  }, [currentUser]);

  const loadCards = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Primeiro tentar migrar dados do localStorage
      await cardService.migrateLocalStorageData(currentUser.uid);
      
      // Buscar cartões do Firestore
      const result = await cardService.getUserCards(currentUser.uid);
      
      if (result.success) {
        const userCards = result.data.map(card => ({
          ...card,
          id: card.cardId
        }));
        setCards(userCards);
        
        // Verificar se pode criar mais cartões
        setCanCreateCard(userCards.length < 3);
      } else {
        console.error('Erro ao carregar cartões:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
      // Fallback para localStorage em caso de erro
      try {
        const allCards = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('card_')) {
            try {
              const cardData = JSON.parse(localStorage.getItem(key));
              if (cardData && cardData.isConfigured) {
                allCards.push({
                  ...cardData,
                  id: key.replace('card_', '')
                });
              }
            } catch (error) {
              console.error(`Erro ao carregar cartão ${key}:`, error);
            }
          }
        }
        
        allCards.sort((a, b) => {
          // Função auxiliar para converter data para timestamp
          const getTimestamp = (dateValue) => {
            if (!dateValue) return 0;
            
            if (dateValue && typeof dateValue.toDate === 'function') {
              return dateValue.toDate().getTime();
            }
            if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
              return dateValue.seconds * 1000;
            }
            if (typeof dateValue === 'string') {
              return new Date(dateValue).getTime();
            }
            if (typeof dateValue === 'number') {
              return dateValue;
            }
            if (dateValue instanceof Date) {
              return dateValue.getTime();
            }
            return 0;
          };
          
          return getTimestamp(b.updatedAt || b.createdAt) - getTimestamp(a.updatedAt || a.createdAt);
        });
        setCards(allCards);
        setCanCreateCard(allCards.length < 3);
      } catch (localError) {
        console.error('Erro no fallback localStorage:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCard = (cardId) => {
    showConfirmModal({
      title: 'Excluir Cartão', 
      message: (
        <>
          Tem certeza que deseja excluir o cartão <strong>{cardId}</strong>? Esta ação não pode ser desfeita.
        </>
      ),
      type: 'danger',
      onConfirm: async () => {
        try {
          console.log('Tentando excluir cartão:', cardId, 'para usuário:', currentUser.uid);
          
          // Excluir do Firestore
          await cardService.deleteCard(currentUser.uid, cardId);
          
          // Também remover do localStorage
          localStorage.removeItem(`card_${cardId}`);
          
          console.log('Cartão excluído com sucesso:', cardId);
          
          // Recarregar lista
          await loadCards();
          
          showNotification(
            `Cartão ${cardId} excluído com sucesso!`, 
            'success',
            4000,
            cardId
          );
        } catch (error) {
          console.error('Erro detalhado ao excluir cartão:', error);
          console.error('CardId:', cardId, 'UserId:', currentUser?.uid);
          showNotification(`Erro ao excluir cartão: ${error.message || 'Erro desconhecido'}`, 'error', 6000);
        }
      },
      confirmText: 'Excluir Cartão',
      cancelText: 'Cancelar'
    });
  };

  const openNFCInstructions = (cardId) => {
    setSelectedCardId(cardId);
    setShowNFCInstructions(true);
  };

  const closeNFCInstructions = () => {
    setShowNFCInstructions(false);
    setSelectedCardId(null);
  };

  const createNewCard = async () => {
    if (!canCreateCard) {
      showNotification('Você atingiu o limite de 3 cartões por conta. Exclua um cartão existente para criar um novo.', 'warning', 5000);
      return;
    }
    
    try {
      // Verificar novamente se pode criar (para garantir)
      const canCreate = await cardService.canCreateCard(currentUser.uid);
      if (!canCreate) {
        showNotification('Limite de 3 cartões por conta atingido. Exclua um cartão existente para criar um novo.', 'warning', 5000);
        return;
      }
      
      const newCardId = cardService.generateCardId();
      navigate(`/config/${newCardId}`);
    } catch (error) {
      console.error('Erro ao verificar limite:', error);
      showNotification('Erro ao verificar limite de cartões. Tente novamente.', 'error');
    }
  };

  const handleLogout = () => {
    showConfirmModal({
      title: 'Sair da Conta',
      message: 'Tem certeza que deseja sair da sua conta?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await logout();
        } catch (error) {
          console.error('Erro ao fazer logout:', error);
          showNotification('Erro ao sair da conta. Tente novamente.', 'error');
        }
      },
      confirmText: 'Sair',
      cancelText: 'Cancelar'
    });
  };

  const shareCard = async (cardId, cardName) => {
    const cardUrl = `${window.location.origin}/card/${cardId}`;
    
    // Verificar se o navegador suporta Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cartão NFC - ${cardName}`,
          text: `Confira meu cartão de visita digital: ${cardName}`,
          url: cardUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao compartilhar:', error);
          // Fallback para copiar link
          copyToClipboard(cardUrl, cardName);
        }
      }
    } else {
      // Fallback para navegadores que não suportam Web Share API
      copyToClipboard(cardUrl, cardName);
    }
  };

  const copyToClipboard = async (url, cardName) => {
    try {
      await navigator.clipboard.writeText(url);
      showNotification(`Link do cartão "${cardName}" copiado para a área de transferência!`, 'success');
    } catch (error) {
      console.error('Erro ao copiar para a área de transferência:', error);
      // Fallback final - mostrar o link para o usuário copiar manualmente
      prompt('Copie o link do cartão:', url);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner">
            <div className="spinner-ring">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
          <div className="loading-text">
            <h3>Carregando cartões</h3>
            <p>Aguarde enquanto sincronizamos seus dados...</p>
          </div>
        </div>
      </div>
    );
  }

      return (
      <div className="manager-container">
        {/* Logo no topo */}
        <div className="top-logo-section">
          <img 
            src={logoImage} 
            alt="EchoTap Logo" 
            className="top-logo"
            onError={(e) => {
              e.target.src = echoTapImage;
            }}
          />
        </div>
        
        <div className="manager-wrapper">
        <div className="manager-header">
          <div className="header-content">
            <div className="header-info">
              <h1>Gerenciador de Cartões NFC</h1>
              <p>Bem-vindo, <strong>{currentUser?.email}</strong></p>
            </div>
            
            <div className="header-actions">
              <button 
                onClick={createNewCard} 
                className={`btn-primary ${!canCreateCard ? 'btn-disabled' : ''}`}
                disabled={!canCreateCard}
                title={!canCreateCard ? 'Limite de 3 cartões atingido' : 'Criar novo cartão'}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                {canCreateCard ? 'Novo Cartão' : `Limite Atingido (${cards.length}/3)`}
              </button>
              <div className="header-secondary-actions">
                <Link to="/" className="btn-secondary">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146zM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5z"/>
                  </svg>
                  Início
                </Link>
                <button onClick={handleLogout} className="btn-outline">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0v2z"/>
                    <path d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3z"/>
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="manager-content">
          {cards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
                </svg>
              </div>
              <h2>Nenhum cartão configurado</h2>
              <p>Comece criando seu primeiro cartão NFC para começar a usar o sistema.</p>
              <button 
                onClick={createNewCard} 
                className="btn-primary"
                title="Criar seu primeiro cartão NFC"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Criar Primeiro Cartão
              </button>
            </div>
          ) : (
            <>
              <div className="cards-stats">
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-number">{cards.length}/3</div>
                    <div className="stat-label">Cartões Utilizados</div>
                    {cards.length >= 3 && (
                      <div className="stat-warning">Limite atingido</div>
                    )}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H2zM4.5 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM2 6.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V7a.5.5 0 0 0-.5-.5H2zM4.5 7a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM2 10.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5H2zM4.5 11a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-number">{cards.reduce((acc, card) => acc + (card.links?.length || 0), 0)}</div>
                    <div className="stat-label">Total de Links</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-number">{3 - cards.length}</div>
                    <div className="stat-label">Cartões Disponíveis</div>
                    {!canCreateCard && (
                      <div className="stat-info">Exclua um cartão para criar outro</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="cards-grid">
                {cards.map((card) => (
                  <div key={card.id} className="card-item" style={{ "--primary-color": card.primaryColor }}>
                    <div className="card-preview">
                      <div className="card-image">
                        <img 
                          src={card.profileImage || '/public/EchoTap.png'} 
                          alt={card.name}
                          onError={(e) => {
                            e.target.src = '/public/EchoTap.png';
                          }}
                        />
                      </div>
                      <div className="card-info">
                        <h3>{card.name}</h3>
                        <p>{card.bio}</p>
                        <div className="card-meta">
                          <span className="card-id">ID: {card.id}</span>
                          <span className="card-links">{card.links.length} links</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-nfc-section">
                      <button
                        onClick={() => openNFCInstructions(card.id)}
                        className="nfc-instructions-btn"
                        title="Ver instruções para gravar cartão NFC"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M6 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V2zM7 3v10h2V3H7z"/>
                          <path d="M1.5 5A1.5 1.5 0 0 1 3 3.5h1a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h1a.5.5 0 0 1 0 1H3A1.5 1.5 0 0 1 1.5 11V5zm13 0v6A1.5 1.5 0 0 1 13 12.5h-1a.5.5 0 0 1 0-1h1a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 1 0-1h1A1.5 1.5 0 0 1 14.5 5z"/>
                          <circle cx="8" cy="8" r="1"/>
                        </svg>
                        Como Gravar NFC
                      </button>
                    </div>
                    
                    <div className="card-actions">
                      <Link 
                        to={`/card/${card.id}`} 
                        className="action-btn view-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/card/${card.id}`);
                        }}
                      >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                          <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                        </svg>
                        Ver
                      </Link>
                      <button 
                        onClick={() => shareCard(card.id, card.name)}
                        className="action-btn share-btn"
                        title="Compartilhar cartão"
                      >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                        </svg>
                        Compartilhar
                      </button>
                      <Link 
                        to={`/config/${card.id}`} 
                        className="action-btn edit-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/config/${card.id}`);
                        }}
                      >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                          <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                        </svg>
                        Editar
                      </Link>
                      <button 
                        onClick={() => deleteCard(card.id)} 
                        className="action-btn delete-btn"
                      >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                        Excluir
                      </button>
                    </div>
                    
                    <div className="card-updated">
                      Última edição: {formatCardDate(card.updatedAt || card.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal de Confirmação */}
      {confirmModal.show && (
        <div className="confirm-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancelAction()}>
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <div className={`confirm-icon confirm-icon-${confirmModal.type}`}>
                {confirmModal.type === 'warning' && (
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                    <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                  </svg>
                )}
                {confirmModal.type === 'danger' && (
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                  </svg>
                )}
                {confirmModal.type === 'info' && (
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                  </svg>
                )}
              </div>
              <h3>{confirmModal.title}</h3>
            </div>
            
            <div className="confirm-modal-content">
              <p>{confirmModal.message}</p>
            </div>
            
            <div className="confirm-modal-actions">
              <button 
                className="confirm-cancel-btn" 
                onClick={handleCancelAction}
              >
                {confirmModal.cancelText}
              </button>
              <button 
                className={`confirm-action-btn confirm-action-${confirmModal.type}`}
                onClick={handleConfirmAction}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sistema de Notificações */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification notification-${notification.type}`}
              onClick={() => removeNotification(notification.id)}
            >
              <div className="notification-icon">
                {notification.type === 'success' && (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                  </svg>
                )}
                {notification.type === 'warning' && (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                    <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                  </svg>
                )}
              </div>
              <div className="notification-content">
                <p>{renderNotificationMessage(notification)}</p>
              </div>
              <button className="notification-close" onClick={() => removeNotification(notification.id)}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Instruções NFC */}
      {showNFCInstructions && selectedCardId && (
        <NFCInstructions 
          cardId={selectedCardId}
          onClose={closeNFCInstructions}
        />
      )}
    </div>
  );
};

export default CardManager; 