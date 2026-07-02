import { useState } from "react";
import {
  Check,
  Copy,
} from "lucide-react";

import {
  FaXTwitter,
  FaLinkedinIn,
  FaFacebookF,
  FaWhatsapp,
} from "react-icons/fa6";

import {
  copyLink,
  shareTo,
  socialNetworks,
} from "../utils/share";

type Props = {
  title: string;
  url?: string;
  onClose?: () => void;
};

export default function ShareMenu({
  title,
  url,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await copyLink(url);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

      onClose?.();
    } catch (err) {
      console.error(err);
    }
  }

  function icon(network: string) {
    switch (network) {
      case "x":
        return <FaXTwitter className="text-base" />;

      case "linkedin":
        return <FaLinkedinIn className="text-base" />;

      case "facebook":
        return <FaFacebookF className="text-base" />;

      case "whatsapp":
        return <FaWhatsapp className="text-base" />;

      default:
        return null;
    }
  }

  return (
    <div
      className="
        w-72
        rounded-2xl
        border
        border-navy/10
        bg-white
        shadow-xl
        overflow-hidden
      "
      role="menu"
    >
      <div className="px-5 pt-5 pb-4">

        <h3 className="font-serif text-xl text-navy">
          Compartir artículo
        </h3>

        <p className="text-sm text-navy/50 mt-1">
          Comparte este contenido donde prefieras.
        </p>

      </div>

      <div className="border-t border-navy/10" />

      <div className="p-2">

        {socialNetworks.map((network) => (

          <button
            key={network.id}
            type="button"
            onClick={() => {
              shareTo(network.id, {
                title,
                url,
              });

              onClose?.();
            }}
            className="
              w-full
              flex
              items-center
              gap-3
              rounded-xl
              px-4
              py-3
              text-left
              text-navy/70
              transition-all
              duration-200
              hover:bg-cream
              hover:text-gold
            "
          >

            <span className="w-5 flex justify-center">
              {icon(network.id)}
            </span>

            <span className="text-sm">
              {network.label}
            </span>

          </button>

        ))}

      </div>

      <div className="border-t border-navy/10 p-2">

        <button
          type="button"
          onClick={handleCopy}
          className="
            w-full
            flex
            items-center
            gap-3
            rounded-xl
            px-4
            py-3
            text-left
            text-navy/70
            transition-all
            duration-200
            hover:bg-cream
            hover:text-gold
          "
        >

          <span className="w-5 flex justify-center">

            {copied ? (
              <Check className="text-green-600" size={16} />
            ) : (
              <Copy size={16} />
            )}

          </span>

          <span className="text-sm">

            {copied
              ? "Enlace copiado"
              : "Copiar enlace"}

          </span>

        </button>

      </div>
    </div>
  );
}