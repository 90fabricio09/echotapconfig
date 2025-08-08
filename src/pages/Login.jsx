import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirecionar para onde o usuário tentou acessar ou para o manager
  const redirectTo = location.state?.from || '/manager';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate(redirectTo);
    } catch (error) {
      console.error('Erro de autenticação:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate(redirectTo);
    } catch (error) {
      console.error('Erro no login com Google:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Digite seu email para recuperar a senha');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    setIsForgotPassword(true);
    setError('');
    setEmail('');
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setError('');
    setEmail('');
    setPassword('');
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Email não encontrado. Verifique se está correto ou crie uma conta.';
      case 'auth/wrong-password':
        return 'Senha incorreta';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido. Verifique o formato (exemplo@email.com)';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet e tente novamente';
      case 'auth/quota-exceeded':
        return 'Limite de emails atingido. Tente novamente em algumas horas';
      default:
        return 'Erro de autenticação. Tente novamente';
    }
  };

  if (resetEmailSent) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-header">
            <h1>
              <svg className="auth-icon" viewBox="0 0 24 24" width="24" height="24">
                <path fill="#10B981" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              Email Enviado com Sucesso!
            </h1>
            <p>Instruções de reset foram enviadas para <strong>{email}</strong></p>
          </div>
          
          <div className="auth-info">
            <h4>
              <svg className="auth-icon-small" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#6366F1" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
              Próximos passos:
            </h4>
            <ol>
              <li>
                <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#059669" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <strong>Verifique sua caixa de entrada</strong>
              </li>
              <li>
                <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#DC2626" d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                </svg>
                <strong>Olhe na pasta spam/lixo eletrônico</strong>
              </li>
              <li>
                <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#2563EB" d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                </svg>
                <strong>Clique no link do email</strong>
              </li>
              <li>
                <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#7C3AED" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <strong>Digite sua nova senha</strong>
              </li>
            </ol>
            
            <div className="auth-tips">
              <h5>
                <svg className="auth-icon-small" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#F59E0B" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                </svg>
                Não chegou o email?
              </h5>
              <ul>
                <li>• Aguarde até <strong>10 minutos</strong></li>
                <li>• Verifique se o email está correto</li>
                <li>• Tente novamente se necessário</li>
              </ul>
            </div>
          </div>
          
          <div className="auth-actions">
            <button 
              onClick={() => {
                setResetEmailSent(false);
                handleBackToLogin();
              }} 
              className="auth-btn secondary"
            >
              <svg className="btn-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Voltar ao Login
            </button>
            
            <button 
              onClick={() => setResetEmailSent(false)} 
              className="auth-link"
            >
              Enviar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-header">
            <h1>
              <svg className="auth-icon" viewBox="0 0 24 24" width="24" height="24">
                <path fill="#7C3AED" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              Esqueceu a Senha?
            </h1>
            <p>Digite seu email para receber as instruções</p>
          </div>
          
          <form onSubmit={handleResetPassword} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                required
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              className="auth-btn primary"
              disabled={loading}
            >
              <svg className="btn-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
              {loading ? 'Enviando...' : 'Enviar Email'}
            </button>

            <div className="auth-actions">
              <button 
                type="button"
                onClick={handleBackToLogin}
                className="auth-btn secondary"
              >
                <svg className="btn-icon" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
                Voltar ao Login
              </button>
            </div>
          </form>

          <div className="auth-info">
            <h4>
              <svg className="auth-icon-small" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#F59E0B" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M13,17H11V15H13V17M13,13H11V7H13V13Z"/>
              </svg>
              Dicas:
            </h4>
            <ul>
              <li>
                <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#10B981" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Verifique sua caixa de <strong>spam/lixo</strong>
              </li>
              <li>
                <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#10B981" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                O email pode demorar até <strong>10 minutos</strong>
              </li>
              <li>
                <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#10B981" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Use o mesmo email da sua conta
              </li>
              <li>
                <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#10B981" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Gmail funciona melhor que outros provedores
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-header">
          <h1>
            <svg className="auth-icon" viewBox="0 0 24 24" width="24" height="24">
              <path fill="#2563EB" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
            </svg>
            {isSignup ? 'Criar Conta' : 'Login'}
          </h1>
          <p>{isSignup ? 'Crie sua conta para gerenciar cartões NFC' : 'Acesse o sistema de gerenciamento'}</p>
        </div>

        {error && (
          <div className="auth-error">
            <svg className="error-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#DC2626" d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.708zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-btn primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="btn-icon spinner" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
                </svg>
                Carregando...
              </>
            ) : isSignup ? (
              <>
                <svg className="btn-icon" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Criar Conta
              </>
            ) : (
              <>
                <svg className="btn-icon" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M5,17H19V19H5V17M12,5.83L15.17,9L16.58,7.59L12,3L7.41,7.59L8.83,9L12,5.83Z"/>
                </svg>
                Entrar
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <div className="auth-google-container">
          <button 
            onClick={handleGoogleLogin}
            className="auth-btn google"
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Conectando...' : 'Continuar com Google'}
          </button>
        </div>

        <div className="auth-links">
          <button 
            onClick={() => setIsSignup(!isSignup)}
            className="auth-link"
          >
            {isSignup ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>

          {!isSignup && (
            <button 
              onClick={handleForgotPasswordClick}
              className="auth-link"
            >
              Esqueceu a senha?
            </button>
          )}
        </div>

        <div className="auth-info">
          <h3>
            Por que preciso fazer login?
          </h3>
          <ul>
            <li>
              <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="#10B981" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Seus cartões ficam salvos na nuvem
            </li>
            <li>
              <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="#10B981" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Acesse de qualquer dispositivo
            </li>
            <li>
              <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="#10B981" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Backup automático dos dados
            </li>
            <li>
              <svg className="list-icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="#10B981" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Gerenciamento seguro
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login; 