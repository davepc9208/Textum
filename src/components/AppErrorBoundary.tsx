import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { reportError } from '../monitoring';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string;
}

function createErrorId() {
  return `TXT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorId: '' };

  static getDerivedStateFromError(): State {
    return { hasError: true, errorId: createErrorId() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, {
      componentStack: info.componentStack,
      errorId: this.state.errorId,
    });
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isEnglish = new URLSearchParams(window.location.search).get('lang') === 'en'
      || document.documentElement.lang === 'en';
    const copy = isEnglish
      ? {
          label: 'Unexpected error',
          title: 'Something went wrong',
          description: 'The page could not be loaded correctly. Try again or return to the homepage.',
          retry: 'Try again',
          home: 'Back to home',
          incident: 'Incident code',
        }
      : {
          label: 'Error inesperado',
          title: 'Algo no salió como esperábamos',
          description: 'La página no pudo cargarse correctamente. Puedes reintentar o volver al inicio.',
          retry: 'Reintentar',
          home: 'Volver al inicio',
          incident: 'Código de incidencia',
        };

    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6 py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-7 rounded-full bg-amber-50 border border-gold/30 flex items-center justify-center">
            <AlertTriangle size={28} className="text-gold" aria-hidden="true" />
          </div>
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{copy.label}</p>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-navy mb-5">{copy.title}</h1>
          <p className="text-sm text-navy/55 leading-relaxed mb-8">{copy.description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={this.handleRetry} className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs tracking-widest rounded-sm">
              <RefreshCw size={14} aria-hidden="true" />
              <span>{copy.retry}</span>
            </button>
            <a href="/" className="inline-flex items-center gap-2 px-6 py-3 text-xs tracking-widest rounded-sm border border-navy/20 text-navy/65 hover:border-gold/50 hover:text-navy transition-colors">
              <Home size={14} aria-hidden="true" />
              {copy.home}
            </a>
          </div>
          <p className="text-[11px] text-navy/35 mt-8">
            {copy.incident}: <code className="font-mono text-navy/50">{this.state.errorId}</code>
          </p>
        </div>
      </main>
    );
  }
}
