/**
 * ResignConfirm Modal Component
 *
 * Confirmation dialog for resignation
 */

interface ResignConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResignConfirm({ onConfirm, onCancel }: ResignConfirmProps) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Resign Game?</h2>
        <p style={{ textAlign: 'center', margin: '20px 0' }}>
          Are you sure you want to resign?
        </p>
        <div className="modal-buttons">
          <button
            className="modal-btn"
            onClick={onConfirm}
            style={{ background: 'var(--lose)' }}
          >
            Yes, Resign
          </button>
          <button className="modal-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
