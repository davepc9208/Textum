import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LangProvider } from './i18n/LangContext';
import ScrollToTop from './components/ScrollToTop';
import AppErrorBoundary from './components/AppErrorBoundary';
import App from './App.tsx';
import './index.css';
import './monitoring';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <LangProvider>
          {/* ScrollToTop reinicia el scroll en cada cambio de ruta.
              Debe ir dentro de BrowserRouter para tener acceso a useLocation. */}
          <ScrollToTop />
          <App />
        </LangProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>
);
