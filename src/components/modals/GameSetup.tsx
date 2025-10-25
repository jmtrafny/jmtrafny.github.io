/**
 * GameSetup Modal Component
 *
 * Handles game mode selection (1-player vs 2-player) and color selection
 */

import type { Side } from '../../engine';

interface GameSetupProps {
  showColorPicker: boolean;
  onSelect1Player: () => void;
  onSelect2Player: () => void;
  onSelectColor: (side: Side) => void;
  onBack: () => void;
}

export function GameSetup({
  showColorPicker,
  onSelect1Player,
  onSelect2Player,
  onSelectColor,
  onBack,
}: GameSetupProps) {
  if (showColorPicker) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Choose Your Color</h2>
          <div className="modal-buttons">
            <button className="modal-btn" onClick={() => onSelectColor('w')}>
              ♔ White
              <div className="modal-subtitle">You move first</div>
            </button>
            <button className="modal-btn" onClick={() => onSelectColor('b')}>
              ♚ Black
              <div className="modal-subtitle">AI moves first</div>
            </button>
          </div>
          <button
            onClick={onBack}
            style={{
              marginTop: '12px',
              padding: '8px',
              background: 'transparent',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#9ca3af',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>New Game</h2>
        <div className="modal-buttons">
          <button className="modal-btn" onClick={onSelect1Player}>
            1 Player
            <div className="modal-subtitle">Play against AI</div>
          </button>
          <button className="modal-btn" onClick={onSelect2Player}>
            2 Player
            <div className="modal-subtitle">Local multiplayer</div>
          </button>
        </div>
      </div>
    </div>
  );
}
