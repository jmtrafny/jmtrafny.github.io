interface BugReportModalProps {
  onClose: () => void;
}

export function BugReportModal({ onClose }: BugReportModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Report a Bug</h2>
        <p style={{ textAlign: 'left', marginBottom: '24px', opacity: 0.9, lineHeight: 1.6 }}>
          Found something broken? Help improve the game by reporting issues on GitHub or email:
        </p>
        <div className="modal-buttons">
          <div className="modal-btn" style={{ cursor: 'text' }}>
            contact@thinchess.com
          </div>
          <a
            href="https://github.com/jmtrafny/jmtrafny.github.io/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="modal-btn"
            style={{ textDecoration: 'none' }}
          >
            Report on GitHub
          </a>
          <button className="modal-btn back-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
