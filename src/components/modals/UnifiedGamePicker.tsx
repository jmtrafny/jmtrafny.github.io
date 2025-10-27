/**
 * UnifiedGamePicker Modal Component
 *
 * Single-step modal for selecting game mode, type, and color
 */

import { useState } from 'react';
import type { GameMode, GameModeCategory } from '../../config/GameModeConfig';
import type { Side } from '../../engine';

interface UnifiedGamePickerProps {
  categories: GameModeCategory[];
  modes: GameMode[];
  onStartGame: (modeId: string, gameType: '1player' | '2player', playerSide: Side | null) => void;
  onShowHelp: (modeId: string) => void;
  onBack: () => void;
}

export function UnifiedGamePicker({
  categories,
  modes,
  onStartGame,
  onShowHelp,
  onBack,
}: UnifiedGamePickerProps) {
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [gameType, setGameType] = useState<'1player' | '2player'>('1player');
  const [playerSide, setPlayerSide] = useState<Side>('w');

  const handleStartGame = () => {
    if (!selectedModeId) return;
    onStartGame(selectedModeId, gameType, gameType === '1player' ? playerSide : null);
  };

  const getModesByCategory = (categoryId: string) => {
    return modes.filter(mode => mode.categoryId === categoryId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal unified-game-picker">
        <h2>New Game</h2>

        <div className="unified-picker-content">
          {/* Left side: Mode selection */}
          <div className="mode-selection-area">
            {categories.map((category) => {
              const categoryModes = getModesByCategory(category.id);
              if (categoryModes.length === 0) return null;

              return (
                <div key={category.id} className="category-section">
                  <h3 className="category-header">
                    <span className="category-icon">{category.icon}</span>
                    {category.name}
                  </h3>
                  <div className="category-description">{category.description}</div>

                  <div className="mode-grid-unified">
                    {categoryModes.map((mode) => (
                      <div key={mode.id} className="mode-card-wrapper">
                        <label className="mode-card-radio">
                          <input
                            type="radio"
                            name="mode"
                            value={mode.id}
                            checked={selectedModeId === mode.id}
                            onChange={() => setSelectedModeId(mode.id)}
                          />
                          <div className={`mode-card ${selectedModeId === mode.id ? 'selected' : ''}`}>
                            <div className="mode-header">
                              <span className="mode-icon">{mode.icon}</span>
                              <span className="mode-difficulty-stars">
                                {'⭐'.repeat(mode.difficultyStars)}
                              </span>
                            </div>
                            <div className="mode-name">{mode.name}</div>
                            <div className="mode-description">{mode.description}</div>
                            <div className="mode-type-badge">{mode.difficulty}</div>
                          </div>
                        </label>
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
                </div>
              );
            })}
          </div>

          {/* Right side: Game options */}
          <div className="game-options-sidebar">
            <div className="options-row">
              <div className="options-section">
                <h4>Game Type</h4>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="gameType"
                      value="1player"
                      checked={gameType === '1player'}
                      onChange={() => setGameType('1player')}
                    />
                    <span className="radio-label">
                      <span className="radio-title">1 Player</span>
                    </span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="gameType"
                      value="2player"
                      checked={gameType === '2player'}
                      onChange={() => setGameType('2player')}
                    />
                    <span className="radio-label">
                      <span className="radio-title">2 Player</span>
                    </span>
                  </label>
                </div>
              </div>

              {gameType === '1player' && (
                <div className="options-section">
                  <h4>Your Color</h4>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="playerSide"
                        value="w"
                        checked={playerSide === 'w'}
                        onChange={() => setPlayerSide('w')}
                      />
                      <span className="radio-label">
                        <span className="radio-title">♔ White</span>
                      </span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="playerSide"
                        value="b"
                        checked={playerSide === 'b'}
                        onChange={() => setPlayerSide('b')}
                      />
                      <span className="radio-label">
                        <span className="radio-title">♚ Black</span>
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              className="start-game-btn"
              onClick={handleStartGame}
              disabled={!selectedModeId}
            >
              Start Game
            </button>
          </div>
        </div>

        <button className="modal-btn back-btn" onClick={onBack}>
          ← Cancel
        </button>
      </div>
    </div>
  );
}
