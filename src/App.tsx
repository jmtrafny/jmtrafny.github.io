import { useState, useEffect } from 'react';
import {
  Position,
  decode,
  encode,
  START_CODE,
  legalMoves,
  applyMove,
  PIECE_IMAGES,
  EMPTY,
  sideOf,
  Piece,
  Side,
} from './engine';
import { solve, clearTT } from './solver';
import './App.css';

type GameMode = '1player' | '2player' | null;

function App() {
  const [pos, setPos] = useState<Position>(() => decode(START_CODE));
  const [history, setHistory] = useState<string[]>([encode(decode(START_CODE))]);
  const [hIndex, setHIndex] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('1player'); // Default to 1-player
  const [playerSide, setPlayerSide] = useState<Side | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // AI move handler
  const makeAIMove = (position: Position) => {
    if (aiThinking) return; // Prevent double-triggering

    setAiThinking(true);
    setTimeout(() => {
      const result = solve(position);
      if (result.best) {
        const newPos = applyMove(position, result.best);
        setPos(newPos);
        setHistory(prev => {
          const newHistory = prev.slice(0, hIndex + 1);
          newHistory.push(encode(newPos));
          return newHistory;
        });
        setHIndex(prev => prev + 1);
      }
      setAiThinking(false);
    }, 500);
  };

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (gameMode === '1player' && playerSide !== null && pos.turn !== playerSide && !aiThinking) {
      makeAIMove(pos);
    }
  }, [gameMode, playerSide, pos.turn, aiThinking]);

  // Push new position to history
  const pushPos = (newPos: Position) => {
    setPos(newPos);
    const newHistory = history.slice(0, hIndex + 1);
    newHistory.push(encode(newPos));
    setHistory(newHistory);
    setHIndex(hIndex + 1);
  };

  // Handle square click
  const handleSquareClick = (i: number) => {
    if (aiThinking) return; // Don't allow moves while AI is thinking

    const p = pos.board[i];

    // If nothing selected, try to select this square
    if (sel === null) {
      if (p === EMPTY || sideOf(p) !== pos.turn) {
        setSel(null);
        setTargets([]);
        return;
      }
      // Select piece and show targets
      setSel(i);
      const legalTargets = legalMoves(pos)
        .filter((m) => m.from === i)
        .map((m) => m.to);
      setTargets(legalTargets);
      return;
    }

    // Deselect if clicking same square
    if (i === sel) {
      setSel(null);
      setTargets([]);
      return;
    }

    // Try to move
    const move = legalMoves(pos).find((m) => m.from === sel && m.to === i);
    if (move) {
      pushPos(applyMove(pos, move));
    }

    setSel(null);
    setTargets([]);
  };

  // Undo
  const handleUndo = () => {
    if (hIndex > 0) {
      setHIndex(hIndex - 1);
      setPos(decode(history[hIndex - 1]));
      setSel(null);
      setTargets([]);
    }
  };

  // Redo
  const handleRedo = () => {
    if (hIndex < history.length - 1) {
      setHIndex(hIndex + 1);
      setPos(decode(history[hIndex + 1]));
      setSel(null);
      setTargets([]);
    }
  };

  // New Game
  const handleNewGame = () => {
    setShowModal(true);
    setShowColorPicker(false);
  };

  // Handle mode selection
  const handleModeSelect = (mode: '1player' | '2player') => {
    if (mode === '1player') {
      setShowColorPicker(true);
    } else {
      startGame(mode, null);
    }
  };

  // Start game with selected mode and optional player side
  const startGame = (mode: '1player' | '2player', side: Side | null) => {
    const startPos = decode(START_CODE);
    setPos(startPos);
    setHistory([encode(startPos)]);
    setHIndex(0);
    setSel(null);
    setTargets([]);
    setGameMode(mode);
    setPlayerSide(side);
    setShowModal(false);
    setShowColorPicker(false);
    clearTT();
  };


  // Load position from code
  const handleLoad = () => {
    const input = (document.getElementById('posCode') as HTMLInputElement)?.value || '';
    try {
      const newPos = decode(input.trim());
      setPos(newPos);
      setHistory([encode(newPos)]);
      setHIndex(0);
      setSel(null);
      setTargets([]);
      setPlayerSide(null); // Reset player side
      clearTT();
    } catch (err) {
      alert(`Load error: ${(err as Error).message}`);
    }
  };

  // Copy position code
  const handleCopy = () => {
    const code = encode(pos);
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="app">
      {/* New Game Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {!showColorPicker ? (
              <>
                <h2>New Game</h2>
                <div className="modal-buttons">
                  <button className="modal-btn" onClick={() => handleModeSelect('1player')}>
                    1 Player
                    <div className="modal-subtitle">Play against AI</div>
                  </button>
                  <button className="modal-btn" onClick={() => handleModeSelect('2player')}>
                    2 Player
                    <div className="modal-subtitle">Local multiplayer</div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Choose Your Color</h2>
                <div className="modal-buttons">
                  <button className="modal-btn" onClick={() => startGame('1player', 'w')}>
                    ♔ White
                    <div className="modal-subtitle">You move first</div>
                  </button>
                  <button className="modal-btn" onClick={() => startGame('1player', 'b')}>
                    ♚ Black
                    <div className="modal-subtitle">AI moves first</div>
                  </button>
                </div>
                <button
                  onClick={() => setShowColorPicker(false)}
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
              </>
            )}
          </div>
        </div>
      )}

      <div className="panel">
        <h1 className="title">♟️ Thin Chess</h1>

        <div className="board-wrap">
          <div className="board">
            {pos.board.map((cell, i) => (
              <div
                key={i}
                className={`sq ${i % 2 === 0 ? 'dark' : 'light'} ${sel === i ? 'selected' : ''} ${
                  targets.includes(i) ? 'target' : ''
                } ${aiThinking ? 'disabled' : ''}`}
                onClick={() => handleSquareClick(i)}
              >
                {cell !== EMPTY && (
                  <img
                    src={PIECE_IMAGES[cell as Piece]}
                    alt={cell}
                    className="piece"
                    draggable={false}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="coords tiny">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="n">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="controls row">
          <button onClick={handleNewGame}>New Game</button>
          <button onClick={handleUndo} disabled={hIndex <= 0 || aiThinking}>
            Undo
          </button>
          <button onClick={handleRedo} disabled={hIndex >= history.length - 1 || aiThinking}>
            Redo
          </button>
        </div>

        <details className="row">
          <summary>
            <b>Share / Edit Position</b>
          </summary>
          <div className="tiny" style={{ margin: '.5rem 0 .25rem' }}>
            Position code (w=white, b=black, k/r/n pieces, x=empty)
          </div>
          <input id="posCode" type="text" className="mono" defaultValue={encode(pos)} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button onClick={handleLoad}>Load</button>
            <button onClick={handleCopy}>Copy</button>
          </div>
        </details>
      </div>
    </div>
  );
}

export default App;
