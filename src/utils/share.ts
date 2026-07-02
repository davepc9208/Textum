export type ShareNetwork =
  | "x"
  | "linkedin"
  | "facebook"
  | "whatsapp";

export interface ShareData {
  title: string;
  url?: string;
}

function currentUrl(url?: string) {
  if (url) return url;

  if (typeof window !== "undefined") {
    return window.location.href;
  }

  return "";
}

export function canNativeShare() {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  );
}

export async function nativeShare({
  title,
  url,
}: ShareData): Promise<boolean> {
  if (!canNativeShare()) return false;

  try {
    await navigator.share({
      title,
      url: currentUrl(url),
    });

    return true;
  } catch {
    return false;
  }
}

export async function copyLink(url?: string) {
  const link = currentUrl(url);

  await navigator.clipboard.writeText(link);

  return true;
}

export function shareTo(
  network: ShareNetwork,
  { title, url }: ShareData
) {
  const link = encodeURIComponent(currentUrl(url));
  const text = encodeURIComponent(title);

  const shareUrls: Record<ShareNetwork, string> = {
    x: `https://twitter.com/intent/tweet?url=${link}&text=${text}`,

    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${link}`,

    facebook: `https://www.facebook.com/sharer/sharer.php?u=${link}`,

    whatsapp: `https://wa.me/?text=${text}%20${link}`,
  };

  window.open(
    shareUrls[network],
    "_blank",
    "noopener,noreferrer,width=640,height=720"
  );
}

export const socialNetworks = [
  {
    id: "x" as const,
    label: "X",
  },
  {
    id: "linkedin" as const,
    label: "LinkedIn",
  },
  {
    id: "facebook" as const,
    label: "Facebook",
  },
  {
    id: "whatsapp" as const,
    label: "WhatsApp",
  },
];