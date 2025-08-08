import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cardService } from '../services/cardService';

const ConfigCard = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profileImage: '',
    primaryColor: '#2563EB',
    links: [
      {
        title: '',
        description: '',
        icon: 'bi-globe',
        path: '',
        color: '#2563EB',
        isExternal: true
      }
    ]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
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

  // Sistema de notificações
  const showNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto remover após duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
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

  // Carregar dados existentes se o cartão já foi configurado
  useEffect(() => {
    const loadExistingData = async () => {
      if (!currentUser) return;

      try {
        const result = await cardService.getCard(currentUser.uid, cardId);
        if (result.success) {
          const cardData = result.data;
          setIsEditing(true);
          setFormData({
            name: cardData.name || '',
            bio: cardData.bio || '',
            profileImage: cardData.profileImage || '',
            primaryColor: cardData.primaryColor || '#2563EB',
            links: cardData.links || [{
              title: '',
              description: '',
              icon: 'bi-globe',
              path: '',
              color: cardData.primaryColor || '#2563EB',
              isExternal: true
            }]
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados existentes:', error);
        // Fallback para localStorage em caso de erro
        try {
          const storedData = localStorage.getItem(`card_${cardId}`);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            if (parsedData.isConfigured) {
              setIsEditing(true);
              setFormData({
                name: parsedData.name || '',
                bio: parsedData.bio || '',
                profileImage: parsedData.profileImage || '',
                primaryColor: parsedData.primaryColor || '#2563EB',
                links: parsedData.links || [{
                  title: '',
                  description: '',
                  icon: 'bi-globe',
                  path: '',
                  color: parsedData.primaryColor || '#2563EB',
                  isExternal: true
                }]
              });
            }
          }
        } catch (localError) {
          console.error('Erro no fallback localStorage:', localError);
        }
      }
    };

    loadExistingData();
  }, [cardId, currentUser]);

  const iconOptions = [
    { value: 'bi-globe', label: 'Website' },
    { value: 'bi-chat-dots', label: 'Chat/Bate-papo' },
    { value: 'bi-instagram', label: 'Instagram' },
    { value: 'bi-linkedin', label: 'LinkedIn' },
    { value: 'bi-github', label: 'GitHub' },
    { value: 'bi-facebook', label: 'Facebook' },
    { value: 'bi-twitter', label: 'Twitter' },
    { value: 'bi-youtube', label: 'YouTube' },
    { value: 'bi-envelope', label: 'Email' },
    { value: 'bi-telephone', label: 'Telefone' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLinkChange = (index, field, value) => {
    const updatedLinks = [...formData.links];
    updatedLinks[index] = {
      ...updatedLinks[index],
      [field]: value,
      color: formData.primaryColor
    };
    setFormData(prev => ({
      ...prev,
      links: updatedLinks
    }));
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, {
        title: '',
        description: '',
        icon: 'bi-globe',
        path: '',
        color: formData.primaryColor,
        isExternal: true
      }]
    }));
  };

  const removeLink = (index) => {
    if (formData.links.length <= 1) {
      showNotification('Você deve ter pelo menos um link!', 'warning');
      return;
    }
    
    const linkTitle = formData.links[index]?.title || 'este link';
    showConfirmModal({
      title: 'Remover Link',
      message: `Tem certeza que deseja remover "${linkTitle}"?`,
      type: 'warning',
      onConfirm: () => {
        const updatedLinks = formData.links.filter((_, i) => i !== index);
        setFormData(prev => ({
          ...prev,
          links: updatedLinks
        }));
        showNotification('Link removido com sucesso!', 'success');
      },
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    });
  };

  const compressImage = (file, maxWidth = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Fazer quadrado (recorte central)
        const size = Math.min(img.width, img.height);
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        
        canvas.width = maxWidth;
        canvas.height = maxWidth;
        
        // Desenhar imagem quadrada
        ctx.drawImage(
          img,
          offsetX, offsetY, size, size, // source
          0, 0, maxWidth, maxWidth // destination
        );
        
        // Converter para base64 comprimido
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecione apenas arquivos de imagem.', 'error');
        e.target.value = '';
        return;
      }
      
      // Verificar tamanho do arquivo (máximo 10MB antes da compressão)
      if (file.size > 10 * 1024 * 1024) {
        showNotification('Imagem muito grande. Por favor, selecione uma imagem menor que 10MB.', 'error');
        e.target.value = '';
        return;
      }
      
      setIsCompressingImage(true);
      
      try {
        // Comprimir a imagem diretamente
        const compressedImage = await compressImage(file);
        
        // Verificar se a imagem comprimida ainda está muito grande
        if (compressedImage.length > 700000) {
          // Comprimir mais
          const moreCompressed = await compressImage(file, 300, 0.6);
          setFormData(prev => ({
            ...prev,
            profileImage: moreCompressed
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            profileImage: compressedImage
          }));
        }
        
        showNotification('Imagem adicionada com sucesso!', 'success');
        
      } catch (error) {
        console.error('Erro ao comprimir imagem:', error);
        showNotification('Erro ao processar a imagem. Tente novamente.', 'error');
      } finally {
        setIsCompressingImage(false);
      }
      
      // Limpar input para permitir selecionar a mesma imagem novamente
      e.target.value = '';
    }
  };



  const handleColorChange = (color) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: color,
      links: prev.links.map(link => ({
        ...link,
        color: color
      }))
    }));
  };

  const handleSave = async () => {
    if (!formData.name || formData.links.some(link => !link.title || !link.path)) {
      showNotification('Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    if (!currentUser) {
      showNotification('Usuário não autenticado. Faça login novamente.', 'error');
      navigate('/login');
      return;
    }

    setIsLoading(true);
    
    try {
      const cardData = {
        ...formData,
        cardId,
        isConfigured: true,
        createdAt: isEditing && formData.createdAt ? formData.createdAt : new Date().toISOString()
      };
      
      // Salvar no Firestore
      await cardService.saveCard(currentUser.uid, cardId, cardData);
      
      // Também salvar no localStorage como backup
      localStorage.setItem(`card_${cardId}`, JSON.stringify({
        ...cardData,
        createdAt: cardData.createdAt
      }));
      
      if (isEditing) {
        showNotification('Cartão atualizado com sucesso!', 'success');
        setTimeout(() => navigate('/manager'), 1500);
      } else {
        showNotification('Cartão criado com sucesso!', 'success');
        setTimeout(() => navigate('/manager'), 1500);
      }
      
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      
      // Mostrar mensagem de erro mais específica
      if (error.message && error.message.includes('Limite de 3 cartões')) {
        showNotification('Limite de 3 cartões por conta atingido. Exclua um cartão existente para criar um novo.', 'error', 6000);
      } else if (error.message && error.message.includes('Permissão negada')) {
        showNotification('Erro de permissão. Faça login novamente.', 'error');
        navigate('/login');
      } else {
        showNotification(`Erro ao salvar configuração: ${error.message || 'Erro desconhecido'}. Tente novamente.`, 'error', 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const colorOptions = [
    '#2563EB', '#7C3AED', '#DC2626', '#059669', 
    '#D97706', '#DB2777', '#0891B2', '#4F46E5'
  ];

      return (
      <div className="config-container" style={{ "--primary-color": formData.primaryColor }}>
        <div className="config-wrapper">
        
        <div className="config-header">
          <div className="header-content">
            <div className="header-info">
              <h1>{isEditing ? 'Editar Cartão NFC' : 'Configuração do Cartão NFC'}</h1>
              <p>ID: <strong>{cardId}</strong></p>
            </div>
            <div className="header-badge">
              {isEditing ? (
                <span className="badge-edit">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 8.207l-3-3L12.146.146zM11.207 9L6 14.207V11h3.207z"/>
                  </svg>
                  Editando
                </span>
              ) : (
                <span className="badge-new">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                  Novo
                </span>
              )}
            </div>
          </div>
          <p className="header-description">
            {isEditing ? 'Edite seus dados pessoais e links' : 'Configure seus dados pessoais e links para ativar seu cartão NFC'}
          </p>
        </div>

        <form className="config-form" onSubmit={(e) => e.preventDefault()}>
          {/* Dados Pessoais */}
          <div className="form-section">
            <h2>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              </svg>
              Dados Pessoais
            </h2>
            
            <div className="form-group">
              <label htmlFor="name">Nome *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Biografia</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Conte um pouco sobre você ou sua empresa"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Foto de Perfil</label>
              <div className="image-upload-container">
                {formData.profileImage && !isCompressingImage ? (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <img src={formData.profileImage} alt="Preview" />
                    </div>
                    <div className="image-actions">
                      <button
                        type="button"
                        className="change-image-btn"
                        onClick={() => document.getElementById('profileImage').click()}
                        disabled={isCompressingImage}
                      >
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                          <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                        </svg>
                        Alterar
                      </button>
                                              <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => showConfirmModal({
                            title: 'Remover Foto',
                            message: 'Tem certeza que deseja remover a foto de perfil?',
                            type: 'warning',
                            onConfirm: () => setFormData(prev => ({ ...prev, profileImage: '' })),
                            confirmText: 'Remover',
                            cancelText: 'Cancelar'
                          })}
                          disabled={isCompressingImage}
                        >
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                          <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                        </svg>
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={() => document.getElementById('profileImage').click()}
                      disabled={isCompressingImage}
                    >
                      <div className="upload-icon">
                        <svg width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                          <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                        </svg>
                      </div>
                      <div className="upload-text">
                        <span className="upload-title">Adicionar Foto</span>
                        <span className="upload-subtitle">Clique para selecionar uma imagem</span>
                      </div>
                    </button>
                  </div>
                )}
                
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isCompressingImage}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Cor do Tema */}
          <div className="form-section">
            <h2>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.433 10.07C14.133 10.585 16 11.15 16 8a8 8 0 1 0-8 8c1.996 0 1.826-1.504 1.649-3.08-.124-1.101-.252-2.237.351-2.92.465-.527 1.42-.237 2.433.07zM8 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
              </svg>
              Cor do Tema
            </h2>
            
            <div className="color-section">
              <div className="color-presets">
                <h4>Cores Pré-definidas</h4>
                <div className="color-options">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.primaryColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div className="color-custom">
                <h4>Cor Personalizada</h4>
                <div className="custom-color-input">
                  <input
                    type="color"
                    id="customColor"
                    value={formData.primaryColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="color-picker"
                  />
                  <label htmlFor="customColor" className="color-picker-label">
                    <span className="color-preview" style={{ backgroundColor: formData.primaryColor }}></span>
                    <span className="color-value">{formData.primaryColor}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="form-section">
            <h2>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H2zM4.5 3a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM2 6.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V7a.5.5 0 0 0-.5-.5H2zM4.5 7a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM2 10.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5H2zM4.5 11a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/>
              </svg>
              Links
            </h2>
            {formData.links.map((link, index) => (
              <div key={index} className="link-form-group">
                <div className="link-header">
                  <h3>Link {index + 1}</h3>
                  {formData.links.length > 1 && (
                    <button
                      type="button"
                      className="remove-link-btn"
                      onClick={() => removeLink(index)}
                      title="Remover link"
                    >
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Título *</label>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                      placeholder="Ex: Meu Website"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Ícone</label>
                    <select
                      value={link.icon}
                      onChange={(e) => handleLinkChange(index, 'icon', e.target.value)}
                    >
                      {iconOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição</label>
                  <input
                    type="text"
                    value={link.description}
                    onChange={(e) => handleLinkChange(index, 'description', e.target.value)}
                    placeholder="Breve descrição do link"
                  />
                </div>

                <div className="form-group">
                  <label>URL *</label>
                  <input
                    type="url"
                    value={link.path}
                    onChange={(e) => handleLinkChange(index, 'path', e.target.value)}
                    placeholder="https://exemplo.com"
                    required
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              className="add-link-btn"
              onClick={addLink}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Adicionar Link
            </button>
          </div>

          {/* Botões de Ação */}
          <div className="form-actions">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="animate-spin">
                        <path d="M8 0c-4.418 0-8 3.582-8 8 0 1.335.325 2.618.899 3.738l1.456-.728c-.394-.77-.605-1.631-.605-2.51 0-3.037 2.463-5.5 5.5-5.5s5.5 2.463 5.5 5.5-2.463 5.5-5.5 5.5c-1.731 0-3.277-.799-4.298-2.052l-1.456.728c1.263 1.554 3.174 2.574 5.254 2.574 3.866 0 7-3.134 7-7s-3.134-7-7-7z"/>
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/>
                      </svg>
                      Salvar Alterações
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => showConfirmModal({
                    title: 'Sair sem Salvar',
                    message: 'Tem certeza que deseja sair? Todas as alterações não salvas serão perdidas.',
                    type: 'warning',
                    onConfirm: () => navigate('/manager'),
                    confirmText: 'Sair sem Salvar',
                    cancelText: 'Continuar Editando'
                  })}
                  className="cancel-btn"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                  </svg>
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="animate-spin">
                        <path d="M8 0c-4.418 0-8 3.582-8 8 0 1.335.325 2.618.899 3.738l1.456-.728c-.394-.77-.605-1.631-.605-2.51 0-3.037 2.463-5.5 5.5-5.5s5.5 2.463 5.5 5.5-2.463 5.5-5.5 5.5c-1.731 0-3.277-.799-4.298-2.052l-1.456.728c1.263 1.554 3.174 2.574 5.254 2.574 3.866 0 7-3.134 7-7s-3.134-7-7-7z"/>
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/>
                      </svg>
                      Salvar Cartão
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => showConfirmModal({
                    title: 'Sair sem Salvar',
                    message: 'Tem certeza que deseja sair? Todas as alterações não salvas serão perdidas.',
                    type: 'warning',
                    onConfirm: () => navigate('/manager'),
                    confirmText: 'Sair sem Salvar',
                    cancelText: 'Continuar Editando'
                  })}
                  className="cancel-btn"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                  </svg>
                  Cancelar
                </button>
              </>
            )}
          </div>
        </form>
      </div>
      


      {/* Modal de Carregamento de Imagem */}
      {isCompressingImage && (
        <div className="image-loading-overlay">
          <div className="image-loading-modal">
            <div className="image-loading-content">
              <div className="image-loading-spinner">
                <div className="spinner-ring">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
              <h3>Processando imagem</h3>
              <p>Aguarde enquanto otimizamos sua foto...</p>
            </div>
          </div>
        </div>
      )}

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
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
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
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
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
                <p>{notification.message}</p>
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
    </div>
  );
};

export default ConfigCard; 