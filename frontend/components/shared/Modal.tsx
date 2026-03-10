"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  maxWidth?: string; // legacy compat
}

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

  const sizeClass =
    maxWidth ||
    {
      sm: "max-w-sm",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
    }[size];

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="modal-overlay"
    >
      <div className={`modal-box ${sizeClass} w-full`}>
        <div
          className="flex items-center justify-between p-6 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--text)" }}
          >
            {title}
          </h2>
          <button onClick={onClose} className="btn-icon w-8 h-8 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
