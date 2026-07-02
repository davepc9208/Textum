import { useState } from "react";
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

export default function ShareCard({
  title,
  url,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyLink(url);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  const buttonClass =
    `
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

      <div
        className="
          rounded-3xl
          border
          border-navy/10
          bg-white
          px-8
          py-10
          shadow-sm
        "
      >

        <div className="max-w-xl mx-auto text-center">

          <h2 className="font-serif text-3xl text-navy mb-3">
            ¿Te ha resultado útil este artículo?
          </h2>

          <p className="text-navy/60 leading-relaxed mb-8">
            Si crees que puede ayudar a otros
            estudiantes, investigadores o profesionales,
            compártelo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <button
              onClick={() =>
                shareTo("x", {
                  title,
                  url,
                })
              }
              className={buttonClass}
            >
              <FaXTwitter />
              X
            </button>

            <button
              onClick={() =>
                shareTo("linkedin", {
                  title,
                  url,
                })
              }
              className={buttonClass}
            >
              <FaLinkedinIn />
              LinkedIn
            </button>

            <button
              onClick={() =>
                shareTo("facebook", {
                  title,
                  url,
                })
              }
              className={buttonClass}
            >
              <FaFacebookF />
              Facebook
            </button>

            <button
              onClick={() =>
                shareTo("whatsapp", {
                  title,
                  url,
                })
              }
              className={buttonClass}
            >
              <FaWhatsapp />
              WhatsApp
            </button>

          </div>

          <button
            onClick={handleCopy}
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
                <Check
                  size={16}
                  className="text-green-600"
                />

                Enlace copiado
              </>
            ) : (
              <>
                <Copy size={16} />

                Copiar enlace
              </>
            )}

          </button>

        </div>

      </div>

    </section>
  );
}