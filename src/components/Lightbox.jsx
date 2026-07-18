import React, { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

/**
 * Lightbox — fullscreen image viewer
 * Props:
 *   src      : string  — image URL / base64
 *   caption  : string  — label shown at bottom (e.g. "Premarket Analysis")
 *   onClose  : fn      — close callback
 */
export default function Lightbox({ src, caption, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.18s ease-out',
        cursor: 'zoom-out',
      }}
    >
      {/* Close btn */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: '20px', right: '24px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '50%', width: '40px', height: '40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      >
        <X size={20} />
      </button>

      {/* Image */}
      <img
        src={src}
        alt={caption}
        onClick={e => e.stopPropagation()} // don't close when clicking image itself
        style={{
          maxWidth: '94vw',
          maxHeight: '88vh',
          objectFit: 'contain',
          borderRadius: '8px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
          animation: 'lightboxScale 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'default',
        }}
      />

      {/* Caption */}
      {caption && (
        <div style={{
          marginTop: '16px',
          fontSize: '12px',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {caption}
        </div>
      )}

      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.2)',
      }}>
        Tekan ESC atau klik di luar untuk menutup
      </div>

      {/* Keyframe injected via style tag */}
      <style>{`
        @keyframes lightboxScale {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
