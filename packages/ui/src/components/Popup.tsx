'use client';

import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Back-compat: className now applies to the modal container (pixel-popup).
   * Use overlayClassName to style the overlay, and contentClassName for pixel-popup-inner.
   */
  className?: string;
  overlayClassName?: string;
  modalClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  title?: string;
  closeButtonText?: string;
  bg?: string;
  baseBg?: string;
  overlayBg?: string;
  textColor?: string;
  borderColor?: string;
}

/**
 * Popup
 *
 * Retro popup overlay with inner pixel-styled card.
 * - No font enforced; consumer controls typography inside.
 */
export const Popup = ({
  isOpen,
  onClose,
  className = "",
  overlayClassName = "",
  modalClassName,
  contentClassName = "",
  children,
  title,
  closeButtonText = "X",
  bg,
  baseBg,
  overlayBg,
  textColor,
  borderColor,
}: PopupProps) => {
  if (!isOpen) return null;

  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"8\" height=\"8\"><path d=\"M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z\" fill=\"${color}\"/></svg>`;
    return `url(\"data:image/svg+xml,${encodeURIComponent(svg)}\")`;
  }, [borderColor]);

  const customStyle = {
    "--popup-bg": bg,
    "--popup-base-bg": baseBg,
    "--popup-overlay-bg": overlayBg,
    "--popup-text": textColor,
    "--popup-border": borderColor,
    "--popup-border-svg": svgString,
  } as React.CSSProperties;

  // Lock body scroll and add ESC handler while open
  useEffect(() => {
    const body = document.body;
    const originalOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const content = (
    <div
      className={`pixel-popup-overlay ${overlayClassName}`}
      onClick={onClose}
      style={customStyle}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`pixel-popup ${modalClassName || className}`} onClick={(e) => e.stopPropagation()}>
        <div className={`pixel-popup-inner ${contentClassName}`}>
          {title && <h2 className="pixel-popup-title">{title}</h2>}
          <button className="pixel-popup-close-button" onClick={onClose} aria-label="Close dialog">
            {closeButtonText}
          </button>
          <div className="pixel-popup-content">{children}</div>
        </div>
      </div>
    </div>
  );

  // Render in a portal to avoid stacking-context and overflow issues
  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
};
