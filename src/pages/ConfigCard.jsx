import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NFCWriter from '../components/NFCWriter';
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
    { value: 'bi-whatsapp', label: 'WhatsApp' },
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
    if (formData.links.length > 1) {
      const updatedLinks = formData.links.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        links: updatedLinks
      }));
    }
  };

  const compressImage = (file, maxWidth = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
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
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      // Verificar tamanho do arquivo (máximo 10MB antes da compressão)
      if (file.size > 10 * 1024 * 1024) {
        alert('Imagem muito grande. Por favor, selecione uma imagem menor que 10MB.');
        return;
      }
      
      setIsCompressingImage(true);
      
      try {
        // Comprimir a imagem
        const compressedImage = await compressImage(file);
        
        // Verificar se a imagem comprimida ainda está muito grande (máximo ~500KB em base64)
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
        
      } catch (error) {
        console.error('Erro ao comprimir imagem:', error);
        alert('Erro ao processar a imagem. Tente novamente.');
      } finally {
        setIsCompressingImage(false);
      }
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
    if (!formData.name || !formData.bio || formData.links.some(link => !link.title || !link.path)) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!currentUser) {
      alert('Usuário não autenticado. Faça login novamente.');
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
        alert('Cartão atualizado com sucesso! Redirecionando para o painel...');
        navigate('/manager');
      } else {
        alert('Cartão criado com sucesso! Redirecionando para o painel...');
        navigate('/manager');
      }
      
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      
      // Mostrar mensagem de erro mais específica
      if (error.message && error.message.includes('Limite de 3 cartões')) {
        alert('Limite de 3 cartões por conta atingido. Exclua um cartão existente para criar um novo.');
      } else if (error.message && error.message.includes('Permissão negada')) {
        alert('Erro de permissão. Faça login novamente.');
        navigate('/login');
      } else {
        alert(`Erro ao salvar configuração: ${error.message || 'Erro desconhecido'}. Tente novamente.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNFCSuccess = (message) => {
    alert(message);
  };

  const handleNFCError = (error) => {
    alert(`Erro: ${error}`);
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
              <label htmlFor="bio">Biografia *</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Conte um pouco sobre você ou sua empresa"
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="profileImage">Foto de Perfil</label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isCompressingImage}
              />
              {formData.profileImage && !isCompressingImage && (
                <div className="image-preview">
                  <img src={formData.profileImage} alt="Preview" />
                </div>
              )}
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
                  onClick={() => navigate('/manager')}
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
                      Salvar e Ativar Cartão
                    </>
                  )}
                </button>
                <div className="nfc-writer-wrapper">
                  <NFCWriter 
                    cardId={cardId}
                    onSuccess={handleNFCSuccess}
                    onError={handleNFCError}
                  />
                </div>
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
    </div>
  );
};

export default ConfigCard; 