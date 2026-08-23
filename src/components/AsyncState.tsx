import { AlertCircle, RefreshCw } from 'lucide-react';

export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando contenido">
      <span className="sr-only">Cargando contenido</span>
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="animate-pulse bg-white border border-navy/8 rounded-sm p-6 md:p-8">
          <div className="h-3 w-28 bg-navy/10 rounded mb-5" />
          <div className="h-6 w-3/4 bg-navy/10 rounded mb-4" />
          <div className="h-3 w-full bg-navy/8 rounded mb-2" />
          <div className="h-3 w-5/6 bg-navy/8 rounded" />
        </div>
      ))}
    </div>
  );
}

export function PageError({
  title,
  description,
  retry,
  retryLabel = 'Intentar de nuevo',
}: {
  title: string;
  description: string;
  retry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div role="alert" className="text-center py-20 border border-red-200 bg-red-50/50 rounded-sm px-6">
      <AlertCircle size={28} className="mx-auto text-red-600 mb-4" aria-hidden="true" />
      <h2 className="font-serif text-2xl text-navy mb-2">{title}</h2>
      <p className="text-sm text-navy/70 leading-relaxed max-w-md mx-auto">{description}</p>
      {retry && (
        <button type="button" onClick={retry} className="mt-6 inline-flex items-center gap-2 border border-navy/25 text-navy px-5 py-2.5 text-xs tracking-widest rounded-sm hover:border-gold hover:text-gold transition-colors">
          <RefreshCw size={13} aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
