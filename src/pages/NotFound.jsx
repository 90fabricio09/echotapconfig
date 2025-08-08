import { Link } from 'react-router-dom';
import '../css/notfound.css';
import Logo from '../assets/images/Icon.png';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">
          <span>404</span>
          <div className="error-icon">
            <img src={Logo} alt="Logo" />
          </div>
        </div>
        <h1>Página não encontrada</h1>
        <p>Ops! Parece que você se perdeu. Vamos voltar para a página inicial?</p>
        <a href="/" className="home-button">
          <i className="bi bi-house-fill"></i>
          Voltar para Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
