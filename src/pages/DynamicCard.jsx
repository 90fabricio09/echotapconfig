import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import EchoTap from '../assets/images/echotap.png';
import { cardService } from '../services/cardService';

const DynamicCard = () => {
  const { cardId } = useParams();
  const [cardData, setCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCardData = async () => {
      try {
        // Primeiro tentar buscar no Firestore
        const result = await cardService.getPublicCard(cardId);
        
        if (result.success) {
          setCardData(result.data);
        } else {
          // Fallback para localStorage
          const storedData = localStorage.getItem(`card_${cardId}`);
          
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            if (parsedData.isConfigured) {
              setCardData(parsedData);
            } else {
              setError('not_configured');
            }
          } else {
            setError('not_found');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do cartão:', error);
        
        // Fallback para localStorage em caso de erro
        try {
          const storedData = localStorage.getItem(`card_${cardId}`);
          
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            if (parsedData.isConfigured) {
              setCardData(parsedData);
            } else {
              setError('not_configured');
            }
          } else {
            setError('not_found');
          }
        } catch (localError) {
          console.error('Erro no fallback localStorage:', localError);
          setError('load_error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCardData();
  }, [cardId]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando cartão...</p>
        </div>
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="error-container">
        <div className="error-content">
          <h1>🔍 Cartão não encontrado</h1>
          <p>O cartão com ID <strong>{cardId}</strong> não foi encontrado.</p>
          <p>Verifique se o ID está correto ou se o cartão foi configurado.</p>
          <Link to={`/config/${cardId}`} className="config-link">
            ⚙️ Configurar este cartão
          </Link>
        </div>
      </div>
    );
  }

  if (error === 'not_configured') {
    return (
      <div className="error-container">
        <div className="error-content">
          <h1>⚙️ Cartão não configurado</h1>
          <p>O cartão com ID <strong>{cardId}</strong> ainda não foi configurado.</p>
          <p>Clique no botão abaixo para configurar seus dados:</p>
          <Link to={`/config/${cardId}`} className="config-link">
            🚀 Configurar cartão agora
          </Link>
        </div>
      </div>
    );
  }

  if (error === 'load_error') {
    return (
      <div className="error-container">
        <div className="error-content">
          <h1>❌ Erro ao carregar</h1>
          <p>Ocorreu um erro ao carregar os dados do cartão.</p>
          <p>Tente recarregar a página ou entre em contato com o suporte.</p>
          <button onClick={() => window.location.reload()} className="reload-btn">
            🔄 Recarregar página
          </button>
        </div>
      </div>
    );
  }

  // Renderizar cartão configurado
      return (
      <div className="home-container" style={{ "--primary-color": cardData.primaryColor }}>
        <div className="content-wrapper">
        
        <div className="profile-section">
          <div className="profile-image">
            <img 
              src={cardData.profileImage || EchoTap} 
              alt={cardData.name}
              onError={(e) => {
                e.target.src = EchoTap;
              }}
            />
          </div>
          <div className="profile-info">
            <h1>{cardData.name}</h1>
            <p className="bio">{cardData.bio}</p>
          </div>
        </div>

        <div className="links-container">
          {cardData.links.map((link, index) => (
            <a
              href={link.path}
              target={link.isExternal ? "_blank" : undefined}
              rel={link.isExternal ? "noopener noreferrer" : undefined}
              className="link-card"
              key={index}
              style={{ '--hover-color': link.color }}
            >
              <div className="link-content">
                <div className="link-icon" style={{ backgroundColor: link.color }}>
                  <i className={`bi ${link.icon}`} style={{ color: 'white' }}></i>
                </div>
                <div className="link-text">
                  <h3>{link.title}</h3>
                  {link.description && <p>{link.description}</p>}
                </div>
              </div>
              <i className="bi bi-arrow-right"></i>
            </a>
          ))}
        </div>

        <footer className="home-footer">
          <p>
            Criado com <i className="bi bi-heart-fill"></i> por{' '}
            <a href="https://echotap.com.br/" target="_blank" rel="noopener noreferrer" className="footer-link">
              EchoTap
            </a>
          </p>
          <p className="card-id">ID: {cardId}</p>
        </footer>
      </div>
    </div>
  );
};

export default DynamicCard; 