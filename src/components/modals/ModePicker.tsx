/**
 * ModePicker Modal Component
 *
 * Displays game mode selection within a category
 */

import type { GameMode, GameModeCategory } from '../../config/GameModeConfig';

interface ModePickerProps {
  category: GameModeCategory;
  modes: GameMode[];
  onSelectMode: (modeId: string) => void;
  onShowHelp: (modeId: string) => void;
  onBack: () => void;
}

export function ModePicker({
  category,
  modes,
  onSelectMode,
  onShowHelp,
  onBack,
}: ModePickerProps) {
  return (
    <div className="modal-overlay">
      <div className="modal mode-pack-modal">
        <h2>{category.name} - Choose Mode</h2>
        <div className="mode-grid">
          {modes.map((mode) => (
            <div key={mode.id} className="mode-card-wrapper">
              <button className="mode-card" onClick={() => onSelectMode(mode.id)}>
                <div className="mode-header">
                  <span className="mode-icon">{mode.icon}</span>
                  <span className="mode-difficulty-stars">
                    {'⭐'.repeat(mode.difficultyStars)}
                  </span>
                </div>
                <div className="mode-name">{mode.name}</div>
                <div className="mode-description">{mode.description}</div>
                <div className="mode-type-badge">{mode.difficulty}</div>
              </button>
              <button
                className="help-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowHelp(mode.id);
                }}
                title="Show help for this mode"
              >
                ?
              </button>
            </div>
          ))}
        </div>
        <button className="modal-btn back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
}
