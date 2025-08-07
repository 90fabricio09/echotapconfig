import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector = () => {
  const { translations, toggleLanguage, currentLanguage, languages } = useLanguage();
  const [showOptions, setShowOptions] = useState(false);
  const selectorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setShowOptions(!showOptions);
  };

  const handleSelect = (lang) => {
    toggleLanguage(lang);
    setShowOptions(false);
  };

  return (
    <div className="language-selector" ref={selectorRef}>
      <button 
        onClick={handleToggle} 
        className="language-toggle"
      >
        <i className="bi bi-translate"></i>
        <span>{translations.language}: {languages[currentLanguage].icon}</span>
        <i className={`bi bi-chevron-${showOptions ? 'up' : 'down'}`}></i>
      </button>
      
      {showOptions && (
        <div className="language-options">
          {Object.entries(languages).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className={`language-option ${currentLanguage === code ? 'active' : ''}`}
            >
              <span>{lang.icon}</span>
              <span>{lang.language}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 