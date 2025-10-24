import { useState } from 'react';
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
  const [aiThinking, setAiThinking] = useState(false);

  // AI move handler
  const makeAIMove = (position: Position) => {
    setAiThinking(true);
    setTimeout(() => {
      const result = solve(position);
      if (result.best) {
        const newPos = applyMove(position, result.best);
        setPos(newPos);
        const newHistory = history.slice(0, hIndex + 1);
        newHistory.push(encode(newPos));
        setHistory(newHistory);
        setHIndex(hIndex + 1);
      }
      setAiThinking(false);
    }, 500);
  };

  // Push new position to history
  const pushPos = (newPos: Position, movedPiece?: Piece) => {
    setPos(newPos);
    const newHistory = history.slice(0, hIndex + 1);
    newHistory.push(encode(newPos));
    setHistory(newHistory);
    setHIndex(hIndex + 1);

    // In 1-player mode, determine player side on first move
    if (gameMode === '1player' && playerSide === null && movedPiece) {
      const side = sideOf(movedPiece);
      setPlayerSide(side);
    }

    // Trigger AI move if 1-player mode and it's AI's turn
    if (gameMode === '1player' && playerSide !== null && newPos.turn !== playerSide) {
      makeAIMove(newPos);
    }
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
      const movedPiece = pos.board[move.from] as Piece;
      pushPos(applyMove(pos, move), movedPiece);
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
  };

  // Start game with selected mode
  const startGame = (mode: '1player' | '2player') => {
    const startPos = decode(START_CODE);
    setPos(startPos);
    setHistory([encode(startPos)]);
    setHIndex(0);
    setSel(null);
    setTargets([]);
    setGameMode(mode);
    setPlayerSide(null);
    setShowModal(false);
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
            <h2>New Game</h2>
            <div className="modal-buttons">
              <button className="modal-btn" onClick={() => startGame('1player')}>
                1 Player
                <div className="modal-subtitle">Play against AI</div>
              </button>
              <button className="modal-btn" onClick={() => startGame('2player')}>
                2 Player
                <div className="modal-subtitle">Local multiplayer</div>
              </button>
            </div>
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
