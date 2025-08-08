import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';

import App from './App.jsx';
import Home from './pages/Home.jsx';
import ConfigCard from './pages/ConfigCard.jsx';
import DynamicCard from './pages/DynamicCard.jsx';
import CardManager from './pages/CardManager.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NotFound from './pages/NotFound.jsx'

import './css/home.css';
import './css/notfound.css';
import './css/config.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      {path:"/config/:cardId", element: <ProtectedRoute><ConfigCard /></ProtectedRoute> },
      {path:"/card/:cardId", element: <DynamicCard /> },
      {path:"/manager", element: <ProtectedRoute><CardManager /></ProtectedRoute> },
      {path:"/login", element: <Login /> },
      {path:"*",
        element: <NotFound />
      }
    ]
  }
], {
  future: {
    v7_startTransition: true
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>,
);