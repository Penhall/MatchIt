import React from 'react';
import { COLORS, SPACING, BORDERS, EFFECTS, ANIMATIONS } from '../../src/styleConstants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  // Estilos base usando constantes
  const overlayStyles = [
    'fixed inset-0 flex items-center justify-center z-50 p-4',
    `bg-[${COLORS.BLACK_70}] backdrop-blur-[${EFFECTS.BACKDROP_BLUR}]`,
    `animation: fadeIn 150ms ease-in-out`
  ].join(' ');

  const modalStyles = [
    `bg-[${COLORS.DARK_CARD}] border border-[${BORDERS.COLOR}]`,
    `rounded-[${BORDERS.RADIUS_MD}] shadow-[${EFFECTS.GLOW_BLUE}]`,
    `p-[${SPACING.MODAL_PADDING}] w-full max-w-md relative`
  ].join(' ');

  const closeButtonStyles = [
    'absolute top-3 right-3',
    `text-[${COLORS.GRAY_400}] hover:text-[${COLORS.NEON_BLUE}]`,
    EFFECTS.TRANSITION_COLORS
  ].join(' ');

  const titleStyles = [
    'text-2xl font-bold mb-4 text-center',
    `text-[${COLORS.NEON_BLUE}]`
  ].join(' ');

  const contentStyles = `text-[${COLORS.GRAY_300}]`;

  return (
    <div className={overlayStyles}>
      <style>{ANIMATIONS.FADE_IN}</style>
      <div className={modalStyles}>
        <button
          onClick={onClose}
          className={closeButtonStyles}
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-7 h-7"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className={titleStyles}>{title}</h2>
        <div className={contentStyles}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
