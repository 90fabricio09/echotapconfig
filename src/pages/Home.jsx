import { Link } from 'react-router-dom';
import EchoTap from '../assets/images/echotap.png';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const Home = () => {
  const { translations } = useLanguage();
  const primaryColor = "#2563EB";

  const links = [
    {
      title: translations.config,
      description: translations.configDesc,
      icon: "bi-gear-fill",
      path: "/manager",
      color: "#2f4b87",
      isExternal: false
    },
    {
      title: translations.website,
      description: translations.websiteDesc,
      icon: "bi-globe",
      path: "https://echotap.com.br",
      color: primaryColor,
      isExternal: true
    },
    {
      title: translations.instagram,
      description: translations.instagramDesc,
      icon: "bi-instagram",
      path: "https://instagram.com/echotapoficial",
      color: primaryColor,
      isExternal: true
    },
    {
      title: translations.whatsapp,
      description: translations.whatsappDesc,
      icon: "bi-whatsapp",
      path: "https://wa.me/5511994921448",
      color: primaryColor,
      isExternal: true
    }
  ];

  return (
    <div className="home-container" style={{ "--primary-color": primaryColor }}>
      <div className="content-wrapper">
        <LanguageSelector />
        <div className="profile-section">
          <div className="profile-image">
            <img src={EchoTap} alt="Fabricio Bettarello" />
          </div>
          <div className="profile-info">
            <h1>{translations.title}</h1>
            <p className="bio">{translations.bio}</p>
          </div>
        </div>

        <div className="links-container">
          {links.map((link, index) => (
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
                  <p>{link.description}</p>
                </div>
              </div>
              <i className="bi bi-arrow-right"></i>
            </a>
          ))}
        </div>

        <footer className="home-footer">
          <p>{translations.footer} <i className="bi bi-heart-fill"></i> {translations.by} <a href="https://echotap.com.br/" target="_blank" rel="noopener noreferrer" className="footer-link">EchoTap</a></p>
        </footer>
      </div>
    </div>
  );
};

export default Home;