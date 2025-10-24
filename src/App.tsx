import { useState } from 'react';
import {
  Position,
  decode,
  encode,
  START_CODE,
  legalMoves,
  applyMove,
  terminal,
  UNICODE,
  EMPTY,
  sideOf,
  Piece,
} from './engine';
import { solve, clearTT } from './solver';
import './App.css';

function App() {
  const [pos, setPos] = useState<Position>(() => decode(START_CODE));
  const [history, setHistory] = useState<string[]>([encode(decode(START_CODE))]);
  const [hIndex, setHIndex] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [statusText, setStatusText] = useState('Ready.');
  const [statusClass, setStatusClass] = useState('draw');

  // Update status message
  const updateStatus = (text: string, cls: 'win' | 'loss' | 'draw') => {
    setStatusText(text);
    setStatusClass(cls);
  };

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

  // Reset
  const handleReset = () => {
    const startPos = decode(START_CODE);
    setPos(startPos);
    setHistory([encode(startPos)]);
    setHIndex(0);
    setSel(null);
    setTargets([]);
    clearTT();
    updateStatus('Ready.', 'draw');
  };

  // Swap side
  const handleSwap = () => {
    const newPos: Position = {
      board: pos.board.slice(),
      turn: pos.turn === 'w' ? 'b' : 'w',
    };
    pushPos(newPos);
  };

  // Best Move
  const handleBestMove = () => {
    const res = solve(pos);
    const label = res.res === 'WIN' ? 'Winning' : res.res === 'LOSS' ? 'Losing' : 'Drawing';
    const who = pos.turn === 'w' ? 'White' : 'Black';
    updateStatus(
      `${label} for ${who} (d=${res.depth}).`,
      res.res === 'WIN' ? 'win' : res.res === 'LOSS' ? 'loss' : 'draw'
    );

    if (res.best) {
      pushPos(applyMove(pos, res.best));
    }
  };

  // Solve
  const handleSolve = () => {
    const res = solve(pos);
    const who = pos.turn === 'w' ? 'White' : 'Black';

    if (res.res === 'WIN') {
      updateStatus(`WIN for ${who} in ≤ ${res.depth} ply (perfect play).`, 'win');
    } else if (res.res === 'LOSS') {
      updateStatus(`LOSS for ${who} in ≤ ${res.depth} ply (perfect play).`, 'loss');
    } else {
      updateStatus(`DRAW with perfect play (cycle/fortress), frontier depth ≤ ${res.depth}.`, 'draw');
    }
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
      clearTT();
      updateStatus('Position loaded.', 'draw');
    } catch (err) {
      alert(`Load error: ${(err as Error).message}`);
    }
  };

  // Copy position code
  const handleCopy = () => {
    const code = encode(pos);
    navigator.clipboard.writeText(code);
    updateStatus('Copied position code to clipboard.', 'draw');
  };

  // Check terminal state for display
  const term = terminal(pos);
  let displayStatus = statusText;
  if (term === 'STALEMATE') {
    displayStatus = 'Draw (stalemate).';
  } else if (term === 'WHITE_MATE') {
    displayStatus = 'White is checkmated.';
  } else if (term === 'BLACK_MATE') {
    displayStatus = 'Black is checkmated.';
  } else if (statusText === 'Ready.') {
    displayStatus = 'Ready.';
  }

  return (
    <div className="app">
      <div className="panel">
        <h1 className="title">
          ♟️ Thin Chess <span className="tag">1×12</span>
        </h1>
        <div className="subtitle">
          R = slide any distance · N = jump ±2 · K = ±1 · Kings cannot move into check · Stalemate = draw · Current side shown below.
        </div>

        <div className="board-wrap">
          <div className="board">
            {pos.board.map((cell, i) => (
              <div
                key={i}
                className={`sq ${i % 2 === 0 ? 'dark' : 'light'} ${sel === i ? 'selected' : ''} ${
                  targets.includes(i) ? 'target' : ''
                }`}
                onClick={() => handleSquareClick(i)}
              >
                {cell !== EMPTY && UNICODE[cell as Piece]}
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

        <div className="row">
          <div className={`eval ${statusClass}`}>{displayStatus}</div>
          <div className="tiny">
            Side to move:{' '}
            <span
              className="tag"
              style={{ borderColor: pos.turn === 'w' ? '#2dd4bf' : '#60a5fa' }}
            >
              {pos.turn === 'w' ? 'White' : 'Black'}
            </span>
          </div>
        </div>

        <div className="controls row">
          <button onClick={handleUndo} disabled={hIndex <= 0}>
            Undo
          </button>
          <button onClick={handleRedo} disabled={hIndex >= history.length - 1}>
            Redo
          </button>
          <button onClick={handleBestMove}>Best Move</button>
          <button onClick={handleSolve}>Solve</button>
          <button onClick={handleReset}>Reset</button>
          <button onClick={handleSwap}>Swap Side</button>
        </div>

        <details className="row">
          <summary>
            <b>Share / Edit Position</b>
          </summary>
          <div className="tiny" style={{ margin: '.5rem 0 .25rem' }}>
            Position code (
            <span className="mono">
              w=white, b=black, k/r/n pieces, x blank; top→bottom; side appended as ":w" or ":b"
            </span>
            )
          </div>
          <input id="posCode" type="text" className="mono" defaultValue={encode(pos)} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button onClick={handleLoad}>Load</button>
            <button onClick={handleCopy}>Copy</button>
          </div>
        </details>

        <div className="footer">
          Built as a static PWA. Installable and works fully offline. —{' '}
          <a
            href="https://github.com/jmtrafny/jmtrafny.github.io"
            className="link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ margin: '0 0 8px' }}>How it works</h3>
        <ol style={{ margin: '0 0 12px 20px', lineHeight: '1.5' }}>
          <li>Click a piece to see legal targets; click a target to move.</li>
          <li>
            "Best Move" computes a perfect-play reply from the current position using a cached
            solver.
          </li>
          <li>"Solve" classifies the position as Win/Loss/Draw with a principal variation depth.</li>
          <li>Use the position code to share or modify setups quickly.</li>
        </ol>
        <div className="tiny">
          Notes: repetition in the search path is treated as a draw; solver uses tri-valued
          DF-search with a transposition table.
        </div>
      </div>
    </div>
  );
}

export default App;
