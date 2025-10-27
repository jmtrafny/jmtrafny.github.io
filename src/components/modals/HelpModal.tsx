/**
 * HelpModal Component
 *
 * Displays progressive hints and strategy guide for a game mode
 */

import type { GameMode } from '../../config/GameModeConfig';

interface HelpModalProps {
  mode: GameMode;
  hintLevel: number;
  onRevealHint: (level: number) => void;
  onClose: () => void;
}

export function HelpModal({ mode, hintLevel, onRevealHint, onClose }: HelpModalProps) {
  const { help } = mode;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal help-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{mode.name}</h2>

        <div className="help-section">
          <h3>The Challenge</h3>
          <p>{help.challenge}</p>
        </div>

        <div className="help-section">
          <div className="solvability-badge">
            {help.solvabilityType.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Progressive hints for puzzles */}
        {help.hints.length > 0 && (
          <div className="help-section">
            <h3>Hints</h3>
            {hintLevel === 0 && (
              <button className="hint-btn" onClick={() => onRevealHint(1)}>
                💡 Show Hint 1
              </button>
            )}
            {hintLevel >= 1 && (
              <div className="hint-box">
                <strong>Hint 1:</strong> {help.hints[0]}
              </div>
            )}
            {hintLevel >= 1 && help.hints.length > 1 && hintLevel < 2 && (
              <button className="hint-btn" onClick={() => onRevealHint(2)}>
                💡 Show Hint 2
              </button>
            )}
            {hintLevel >= 2 && help.hints[1] && (
              <div className="hint-box">
                <strong>Hint 2:</strong> {help.hints[1]}
              </div>
            )}
            {hintLevel >= 2 && help.solution && (
              <button className="hint-btn solution-btn" onClick={() => onRevealHint(3)}>
                🔓 Show Full Solution
              </button>
            )}
            {hintLevel >= 3 && help.solution && (
              <div className="solution-box">
                <strong>Solution:</strong>
                <pre>{help.solution}</pre>
              </div>
            )}
          </div>
        )}

        {/* Strategy guide for competitive modes */}
        {help.strategy && (
          <div className="help-section">
            <h3>Strategic Approach</h3>
            <div className="strategy-section">
              <h4>White's Plan</h4>
              <p>{help.strategy.whitePlan}</p>
            </div>
            <div className="strategy-section">
              <h4>Black's Plan</h4>
              <p>{help.strategy.blackPlan}</p>
            </div>
            <div className="strategy-section">
              <h4>Key Positions</h4>
              <p>{help.strategy.keyPositions}</p>
            </div>
          </div>
        )}

        {help.learningObjectives && help.learningObjectives.length > 0 && (
          <div className="help-section">
            <h3>Learning Objectives</h3>
            <ul>
              {help.learningObjectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>
        )}

        <button className="modal-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
