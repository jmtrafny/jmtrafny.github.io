interface SupportModalProps {
  onClose: () => void;
}

export function SupportModal({ onClose }: SupportModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal support-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Support This Project</h2>
        <p style={{ textAlign: 'center', marginBottom: '24px', opacity: 0.9 }}>
          If you enjoy playing, consider supporting development!
        </p>
        <div className="modal-buttons">
          <a
            href="https://ko-fi.com/thinchess"
            target="_blank"
            rel="noopener noreferrer"
            className="support-btn kofi-btn"
          >
            <span className="support-icon">☕</span>
            <div>
              <div className="support-name">Ko-fi</div>
              <div className="modal-subtitle">Buy me a coffee</div>
            </div>
          </a>
          <a
            href="https://paypal.me/JamesTrafny"
            target="_blank"
            rel="noopener noreferrer"
            className="support-btn paypal-btn"
          >
            <span className="support-icon">💳</span>
            <div>
              <div className="support-name">PayPal</div>
              <div className="modal-subtitle">One-time donation</div>
            </div>
          </a>
        </div>
        <button className="modal-btn back-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
