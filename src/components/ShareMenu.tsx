// src/components/ShareMenu.tsx
//
// CAMBIOS vs versión anterior:
// 1. Timer setTimeout protegido con useRef + cleanup en useEffect — evita memory leak.
// 2. Botones de red social con role="menuitem" — requerido cuando el padre tiene role="menu".
// 3. Iconos con aria-hidden="true" — evita que el lector de pantalla los anuncie dos veces.

import { useState, useRef, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { FaXTwitter, FaLinkedinIn, FaFacebookF, FaWhatsapp } from "react-icons/fa6";
import { copyLink, shareTo, socialNetworks } from "../utils/share";

type Props = {
  title: string;
  url?: string;
  onClose?: () => void;
};

// Etiquetas accesibles por red — el texto visible "X" no es suficiente para lectores de pantalla
const NETWORK_LABELS: Record<string, string> = {
  x:         "Compartir en X (Twitter)",
  linkedin:  "Compartir en LinkedIn",
  facebook:  "Compartir en Facebook",
  whatsapp:  "Compartir por WhatsApp",
};

export default function ShareMenu({ title, url, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  // FIX: useRef para limpiar el timer si el componente se desmonta
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await copyLink(url);
      setCopied(true);
      // FIX: cancelar timer anterior antes de crear uno nuevo
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
      onClose?.();
    } catch (err) {
      console.error(err);
    }
  }

  function icon(network: string) {
    // FIX: aria-hidden en todos los iconos — el aria-label del botón ya describe la acción
    switch (network) {
      case "x":        return <FaXTwitter  className="text-base" aria-hidden="true" />;
      case "linkedin": return <FaLinkedinIn className="text-base" aria-hidden="true" />;
      case "facebook": return <FaFacebookF  className="text-base" aria-hidden="true" />;
      case "whatsapp": return <FaWhatsapp   className="text-base" aria-hidden="true" />;
      default:         return null;
    }
  }

  return (
    <div
      className="w-72 rounded-2xl border border-navy/10 bg-white shadow-xl overflow-hidden"
      role="menu"
      aria-label="Compartir artículo"
    >
      <div className="px-5 pt-5 pb-4">
        <h3 className="font-serif text-xl text-navy">Compartir artículo</h3>
        <p className="text-sm text-navy/50 mt-1">Comparte este contenido donde prefieras.</p>
      </div>

      <div className="border-t border-navy/10" />

      <div className="p-2">
        {socialNetworks.map((network) => (
          <button
            key={network.id}
            type="button"
            role="menuitem"  // FIX: requerido cuando el padre tiene role="menu"
            aria-label={NETWORK_LABELS[network.id]}
            onClick={() => {
              shareTo(network.id, { title, url });
              onClose?.();
            }}
            className="
              w-full flex items-center gap-3
              rounded-xl px-4 py-3
              text-left text-navy/70
              transition-all duration-200
              hover:bg-cream hover:text-gold
            "
          >
            <span className="w-5 flex justify-center">{icon(network.id)}</span>
            <span className="text-sm">{network.label}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-navy/10 p-2">
        <button
          type="button"
          role="menuitem"  // FIX: también este botón necesita role="menuitem"
          onClick={handleCopy}
          aria-label={copied ? "Enlace copiado al portapapeles" : "Copiar enlace del artículo"}
          className="
            w-full flex items-center gap-3
            rounded-xl px-4 py-3
            text-left text-navy/70
            transition-all duration-200
            hover:bg-cream hover:text-gold
          "
        >
          <span className="w-5 flex justify-center">
            {copied
              ? <Check className="text-green-600" size={16} aria-hidden="true" />
              : <Copy size={16} aria-hidden="true" />
            }
          </span>
          <span className="text-sm">
            {copied ? "Enlace copiado" : "Copiar enlace"}
          </span>
        </button>
      </div>
    </div>
  );
}
