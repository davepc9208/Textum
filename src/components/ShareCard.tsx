// src/components/ShareCard.tsx
//
// CAMBIOS vs versión anterior:
// 1. Timer setTimeout protegido con useRef + cleanup en useEffect — evita memory leak
//    si el componente se desmonta mientras el "Enlace copiado" está visible.
// 2. Botones de red social con aria-label descriptivo — accesibilidad lectores de pantalla.
// 3. Iconos de red social con aria-hidden="true" — evita duplicado con el aria-label.

import { useState, useRef, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";

import { copyLink, shareTo } from "../utils/share";

type Props = {
  title: string;
  url?: string;
};

export default function ShareCard({ title, url }: Props) {
  const [copied, setCopied] = useState(false);

  // FIX: useRef para guardar el timer y limpiarlo si el componente se desmonta
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX: cleanup del timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    await copyLink(url);
    setCopied(true);
    // FIX: cancelar timer anterior antes de crear uno nuevo (doble clic rápido)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  const buttonClass = `
    flex
    items-center
    justify-center
    gap-2
    rounded-xl
    border
    border-navy/10
    bg-white
    px-5
    py-3
    text-sm
    text-navy/70
    transition-all
    duration-200
    hover:border-gold/40
    hover:bg-cream
    hover:text-gold
    hover:shadow-sm
  `;

  return (
    <section className="mt-20">
      <div className="rounded-3xl border border-navy/10 bg-white px-8 py-10 shadow-sm">
        <div className="max-w-xl mx-auto text-center">

          <h2 className="font-serif text-3xl text-navy mb-3">
            ¿Te ha resultado útil este artículo?
          </h2>

          <p className="text-navy/60 leading-relaxed mb-8">
            Si crees que puede ayudar a otros estudiantes, investigadores o
            profesionales, compártelo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* FIX: aria-label en cada botón + aria-hidden en el icono */}
            <button
              onClick={() => shareTo("x", { title, url })}
              aria-label="Compartir en X (Twitter)"
              className={buttonClass}
            >
              <FaXTwitter aria-hidden="true" />
              X
            </button>

            <button
              onClick={() => shareTo("linkedin", { title, url })}
              aria-label="Compartir en LinkedIn"
              className={buttonClass}
            >
              <FaLinkedinIn aria-hidden="true" />
              LinkedIn
            </button>

            <button
              onClick={() => shareTo("facebook", { title, url })}
              aria-label="Compartir en Facebook"
              className={buttonClass}
            >
              <FaFacebookF aria-hidden="true" />
              Facebook
            </button>

            <button
              onClick={() => shareTo("whatsapp", { title, url })}
              aria-label="Compartir por WhatsApp"
              className={buttonClass}
            >
              <FaWhatsapp aria-hidden="true" />
              WhatsApp
            </button>

          </div>

          <button
            onClick={handleCopy}
            aria-label={copied ? "Enlace copiado al portapapeles" : "Copiar enlace del artículo"}
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-navy/10
              bg-cream
              px-5
              py-3
              text-sm
              text-navy/70
              transition-all
              duration-200
              hover:border-gold/40
              hover:text-gold
            "
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-600" aria-hidden="true" />
                Enlace copiado
              </>
            ) : (
              <>
                <Copy size={16} aria-hidden="true" />
                Copiar enlace
              </>
            )}
          </button>

        </div>
      </div>
    </section>
  );
}
