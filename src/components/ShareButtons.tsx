import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";

import ShareMenu from "./ShareMenu";
import { canNativeShare, nativeShare } from "../utils/share";

type Props = {
  title: string;
  url?: string;
};

export default function ShareButtons({
  title,
  url,
}: Props) {
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cerrar al pulsar fuera
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  // Cerrar con ESC
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  async function handleClick() {
    // En móvil usamos directamente el menú nativo
    if (window.innerWidth < 768 && canNativeShare()) {
      await nativeShare({
        title,
        url,
      });

      return;
    }

    setOpen((prev) => !prev);
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <button
        type="button"
        onClick={handleClick}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Compartir artículo"
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          border
          border-navy/10
          bg-white
          px-4
          py-2.5
          text-sm
          text-navy/70
          shadow-sm
          transition-all
          duration-200
          hover:border-gold/40
          hover:bg-cream
          hover:text-gold
          hover:shadow-md
        "
      >
        <Share2 size={16} />

        Compartir
      </button>

      <div
        className={`
          absolute
          right-0
          top-full
          mt-3
          z-50
          origin-top-right
          transition-all
          duration-200
          ${
            open
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }
        `}
      >
        <ShareMenu
          title={title}
          url={url}
          onClose={() => setOpen(false)}
        />
      </div>
    </div>
  );
}