"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  maxWidth?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "modal-sm",
  md: "modal-md",
  lg: "modal-lg",
  xl: "modal-xl",
};

export default function Modal({
  title,
  onClose,
  children,
  size = "lg",
  maxWidth,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const sizeClass = maxWidth || SIZE_CLASSES[size] || SIZE_CLASSES.lg;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const modal = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="modal-overlay"
    >
      <div className={`modal-box ${sizeClass} w-full`}>
        {/* Mobile drag handle */}
        <div className="modal-drag-handle">
          <div className="modal-drag-pill" />
        </div>

        {/* Header */}
        <div
          className="modal-header"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8 rounded-lg flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(modal, document.body);
  }
  return modal;
}
