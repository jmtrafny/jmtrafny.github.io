import { useState, useEffect } from 'react';
import {
  Position,
  decode,
  encode,
  START_POSITIONS,
  legalMoves,
  applyMove,
  terminal,
  detectRepetition,
  PIECE_IMAGES,
  EMPTY,
  sideOf,
  Piece,
  Side,
  VariantType,
  getConfig,
  indexToCoords,
  Move,
  SkinnyMode,
  SKINNY_MODE_PACK,
  ThinMode,
  THIN_MODE_PACK,
  MINI_BOARD_PUZZLES_PACK,
  MODE_HELP_CONTENT,
  moveToAlgebraic,
} from './engine';
import { solve, clearTT } from './solver';
import {
  initAudio,
  playMove,
  playCapture,
  playVictory,
  playDefeat,
  playDraw,
  toggleMute,
  getMuted,
} from './audio';
import './App.css';

type GameMode = '1player' | '2player' | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function App() {
  // Default to 1-D Chess mode
  const defaultMode = THIN_MODE_PACK[0]; // 1-D Chess
  const defaultPosition = decode(defaultMode.startPosition, 'thin', defaultMode.boardLength);

  // Variant selection
  const [gameVariant, setGameVariant] = useState<VariantType>('thin'); // Start with thin
  const [showVariantPicker, setShowVariantPicker] = useState(false); // Don't show on startup
  const [showThinModePicker, setShowThinModePicker] = useState(false); // Show 1-D Chess mode selector
  const [showSkinnyModePicker, setShowSkinnyModePicker] = useState(false); // Show Thin Chess challenges selector
  const [showPuzzleModePicker, setShowPuzzleModePicker] = useState(false); // Show Mini-Board Puzzles selector
  const [selectedThinMode, setSelectedThinMode] = useState<ThinMode | null>(defaultMode); // Start with 1-D Chess
  const [selectedSkinnyMode, setSelectedSkinnyMode] = useState<SkinnyMode | null>(null); // Currently selected Thin Chess mode
  const [selectedPuzzleMode, setSelectedPuzzleMode] = useState<ThinMode | SkinnyMode | null>(null); // Currently selected Puzzle mode

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpMode, setHelpMode] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(0); // 0 = no hints, 1 = hint1, 2 = hint2, 3 = solution

  // Resignation confirmation modal
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  const [pos, setPos] = useState<Position>(() => defaultPosition);
  const [history, setHistory] = useState<string[]>([encode(defaultPosition)]);
  const [hIndex, setHIndex] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [gameMode, setGameMode] = useState<GameMode | null>('1player'); // Start with 1-player mode
  const [playerSide, setPlayerSide] = useState<Side | null>('w'); // Player plays as white
  const [showModal, setShowModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<string>('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [soundMuted, setSoundMuted] = useState(() => getMuted());
  const [repetitionDetected, setRepetitionDetected] = useState(false);
  const [moveLog, setMoveLog] = useState<string[]>([]); // Track all moves in algebraic notation

  // Initialize audio on mount
  useEffect(() => {
    initAudio();
  }, []);

  // AI move handler
  const makeAIMove = (position: Position) => {
    if (aiThinking) return; // Prevent double-triggering

    setAiThinking(true);
    setTimeout(() => {
      try {
        let bestMove: Move | undefined;

        if (position.variant === 'skinny') {
          // For Skinny Chess, use random move selection (game tree too large to solve)
          const moves = legalMoves(position);
          if (moves.length > 0) {
            bestMove = moves[Math.floor(Math.random() * moves.length)];
            console.log('[AI] Skinny Chess - selected random move:', bestMove);
          }
        } else {
          // For Thin Chess, use full solver
          const result = solve(position);
          bestMove = result.best;
        }

        if (bestMove) {
          // Check if AI is capturing
          const isCapture = position.board[bestMove.to] !== EMPTY;

          // Generate move notation
          const moveNotation = moveToAlgebraic(position, bestMove);

          const newPos = applyMove(position, bestMove);
          setPos(newPos);
          setHistory(prev => {
            const newHistory = prev.slice(0, hIndex + 1);
            newHistory.push(encode(newPos));
            return newHistory;
          });
          setHIndex(prev => prev + 1);
          setMoveLog(prev => [...prev, moveNotation]);

          // Play appropriate sound
          if (isCapture) {
            playCapture();
          } else {
            playMove();
          }
        }
      } catch (error) {
        console.error('[AI] Error during move:', error);
      } finally {
        setAiThinking(false);
      }
    }, 500);
  };

  // Check for game over (stalemate/checkmate)
  useEffect(() => {
    const term = terminal(pos);
    if (term) {
      setGameOver(true);
      if (term === 'STALEMATE') {
        setGameResult('Draw - Stalemate');
        playDraw();
      } else if (term === 'WHITE_MATE') {
        setGameResult('Black Wins - White is checkmated');
        // Player victory/defeat based on their side (1-player mode)
        if (gameMode === '1player' && playerSide === 'b') {
          playVictory();
        } else if (gameMode === '1player' && playerSide === 'w') {
          playDefeat();
        } else {
          // 2-player mode: play victory for winner
          playVictory();
        }
      } else if (term === 'BLACK_MATE') {
        setGameResult('White Wins - Black is checkmated');
        // Player victory/defeat based on their side (1-player mode)
        if (gameMode === '1player' && playerSide === 'w') {
          playVictory();
        } else if (gameMode === '1player' && playerSide === 'b') {
          playDefeat();
        } else {
          // 2-player mode: play victory for winner
          playVictory();
        }
      }
    } else {
      setGameOver(false);
      setGameResult('');
    }
  }, [pos, gameMode, playerSide]);

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (gameMode === '1player' && playerSide !== null && pos.turn !== playerSide && !aiThinking && !gameOver) {
      makeAIMove(pos);
    }
  }, [gameMode, playerSide, pos.turn, aiThinking, gameOver]);

  // Detect position repetition
  useEffect(() => {
    const currentEncoded = encode(pos);
    const count = detectRepetition(history, currentEncoded);
    setRepetitionDetected(count >= 2); // Twofold repetition (position appeared 2+ times)
  }, [pos, history]);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

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
    if (aiThinking || gameOver) return; // Don't allow moves while AI is thinking or game is over

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
      // Check if this is a capture
      const isCapture = pos.board[i] !== EMPTY;

      // Generate move notation
      const moveNotation = moveToAlgebraic(pos, move);
      setMoveLog(prev => [...prev, moveNotation]);

      pushPos(applyMove(pos, move));

      // Play appropriate sound
      if (isCapture) {
        playCapture();
      } else {
        playMove();
      }
    }

    setSel(null);
    setTargets([]);
  };

  // Undo
  const handleUndo = () => {
    if (hIndex > 0) {
      // In 1-player mode, undo 2 moves (player + AI) to get back to player's turn
      // In 2-player mode, undo 1 move
      const stepsBack = gameMode === '1player' ? Math.min(2, hIndex) : 1;
      const newIndex = hIndex - stepsBack;

      setHIndex(newIndex);
      setPos(decode(history[newIndex], pos.variant));
      setSel(null);
      setTargets([]);

      // Remove corresponding moves from log
      setMoveLog(prev => prev.slice(0, prev.length - stepsBack));
    }
  };

  // Redo
  const handleRedo = () => {
    if (hIndex < history.length - 1) {
      // In 1-player mode, redo 2 moves (player + AI) to maintain turn consistency
      // In 2-player mode, redo 1 move
      const stepsForward = gameMode === '1player' ? Math.min(2, history.length - 1 - hIndex) : 1;
      const newIndex = hIndex + stepsForward;

      setHIndex(newIndex);
      setPos(decode(history[newIndex], pos.variant));
      setSel(null);
      setTargets([]);

      // Note: We don't restore moves to the log because they should already be there
      // If we're redoing, we just undid moves that are still in the moveLog
      // We need to track this differently - let's just slice to match hIndex
    }
  };

  // New Game - return to variant picker to allow changing variant/mode
  const handleNewGame = () => {
    setShowVariantPicker(true);
    setShowThinModePicker(false);
    setShowSkinnyModePicker(false);
    setShowPuzzleModePicker(false);
    setShowModal(false);
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

  // Handle variant selection - navigate to respective mode picker
  const selectVariant = (variant: VariantType) => {
    setGameVariant(variant);
    setShowVariantPicker(false);
    if (variant === 'thin') {
      setShowThinModePicker(true);
    } else {
      setShowSkinnyModePicker(true);
    }
  };

  // Handle 1-D Chess mode selection
  const selectThinMode = (mode: ThinMode) => {
    setGameVariant('thin');
    setSelectedThinMode(mode);
    setSelectedSkinnyMode(null);
    const startPos = decode(mode.startPosition, 'thin', mode.boardLength);
    setPos(startPos);
    setHistory([encode(startPos)]);
    setHIndex(0);
    setSel(null);
    setTargets([]);
    setGameOver(false);
    setGameResult('');
    setMoveLog([]); // Reset move log
    clearTT();
    setShowThinModePicker(false);
    setShowModal(true); // Show game mode picker (1 player vs 2 player)
  };

  // Handle Thin Chess challenge mode selection
  const selectSkinnyMode = (mode: SkinnyMode) => {
    setGameVariant('skinny');
    setSelectedSkinnyMode(mode);
    setSelectedThinMode(null);
    const startPos = decode(mode.startPosition, 'skinny', mode.boardLength, mode.boardWidth);
    setPos(startPos);
    setHistory([encode(startPos)]);
    setHIndex(0);
    setSel(null);
    setTargets([]);
    setGameOver(false);
    setGameResult('');
    setMoveLog([]); // Reset move log
    clearTT();
    setShowSkinnyModePicker(false);
    setShowModal(true); // Show game mode picker (1 player vs 2 player)
  };

  // Handle "Thin Chess" selection (standard starting position)
  const selectStandardThinChess = () => {
    setGameVariant('skinny');
    setSelectedSkinnyMode(null);
    setSelectedThinMode(null);
    const startPos = decode(START_POSITIONS.skinny, 'skinny');
    setPos(startPos);
    setHistory([encode(startPos)]);
    setHIndex(0);
    setSel(null);
    setTargets([]);
    setGameOver(false);
    setGameResult('');
    setMoveLog([]); // Reset move log
    clearTT();
    setShowSkinnyModePicker(false);
    setShowModal(true); // Show game mode picker
  };

  // Handle puzzle mode selection
  const selectPuzzleMode = (mode: ThinMode | SkinnyMode) => {
    // Determine if it's a 1-D or 2-D puzzle based on boardWidth
    const is2D = 'boardWidth' in mode && mode.boardWidth !== undefined;
    setGameVariant(is2D ? 'skinny' : 'thin');
    setSelectedPuzzleMode(mode);
    setSelectedThinMode(null);
    setSelectedSkinnyMode(null);

    const startPos = is2D
      ? decode(mode.startPosition, 'skinny', mode.boardLength, mode.boardWidth)
      : decode(mode.startPosition, 'thin', mode.boardLength);

    setPos(startPos);
    setHistory([encode(startPos)]);
    setHIndex(0);
    setSel(null);
    setTargets([]);
    setGameOver(false);
    setGameResult('');
    setMoveLog([]); // Reset move log
    clearTT();
    setShowPuzzleModePicker(false);
    setShowModal(true); // Show game mode picker (1 player vs 2 player)
  };

  // Start game with selected mode and optional player side
  const startGame = (mode: '1player' | '2player', side: Side | null) => {
    // Use selected mode position if available, otherwise use default variant position
    let startPos: Position;
    if (selectedThinMode) {
      startPos = decode(selectedThinMode.startPosition, 'thin', selectedThinMode.boardLength);
    } else if (selectedSkinnyMode) {
      startPos = decode(selectedSkinnyMode.startPosition, 'skinny', selectedSkinnyMode.boardLength, selectedSkinnyMode.boardWidth);
    } else if (selectedPuzzleMode) {
      const is2D = 'boardWidth' in selectedPuzzleMode && selectedPuzzleMode.boardWidth !== undefined;
      startPos = is2D
        ? decode(selectedPuzzleMode.startPosition, 'skinny', selectedPuzzleMode.boardLength, selectedPuzzleMode.boardWidth)
        : decode(selectedPuzzleMode.startPosition, 'thin', selectedPuzzleMode.boardLength);
    } else {
      startPos = decode(START_POSITIONS[gameVariant], gameVariant);
    }
    setPos(startPos);
    setHistory([encode(startPos)]);
    setHIndex(0);
    setSel(null);
    setTargets([]);
    setGameMode(mode);
    setPlayerSide(side);
    setShowModal(false);
    setShowColorPicker(false);
    setGameOver(false);
    setGameResult('');
    setMoveLog([]); // Reset move log
    clearTT();
  };

  // Handle PWA install
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  // Handle sound toggle
  const handleToggleSound = () => {
    const newMuted = toggleMute();
    setSoundMuted(newMuted);
  };

  // Handle peace treaty button (resign or claim draw)
  const handlePeaceTreaty = () => {
    if (repetitionDetected) {
      // Claim draw by repetition
      setGameOver(true);
      setGameResult('Draw by Repetition');
      playDraw();
    } else {
      // Show resignation confirmation modal
      setShowResignConfirm(true);
    }
  };

  // Confirm resignation
  const confirmResignation = () => {
    setShowResignConfirm(false);
    setGameOver(true);
    if (gameMode === '1player') {
      setGameResult('You resigned - AI wins');
      playDefeat();
    } else {
      // 2-player mode
      const resigner = pos.turn === 'w' ? 'White' : 'Black';
      const winner = pos.turn === 'w' ? 'Black' : 'White';
      setGameResult(`${resigner} resigned - ${winner} wins`);
      playDefeat();
    }
  };

  // Cancel resignation
  const cancelResignation = () => {
    setShowResignConfirm(false);
  };

  // Load position from code
  const handleLoad = () => {
    const input = (document.getElementById('posCode') as HTMLInputElement)?.value || '';
    try {
      const newPos = decode(input.trim(), pos.variant);
      setPos(newPos);
      setHistory([encode(newPos)]);
      setHIndex(0);
      setSel(null);
      setTargets([]);
      setPlayerSide(null); // Reset player side
      setMoveLog([]); // Reset move log
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

  // Help modal handlers
  const openHelp = (modeId: string) => {
    setHelpMode(modeId);
    setHintLevel(0);
    setShowHelpModal(true);
  };

  const closeHelp = () => {
    setShowHelpModal(false);
    setHelpMode(null);
    setHintLevel(0);
  };

  const revealHint = (level: number) => {
    setHintLevel(level);
  };

  return (
    <div className="app">
      {/* Variant Picker Modal */}
      {showVariantPicker && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Choose Game Variant</h2>
            <div className="modal-buttons">
              <button className="modal-btn" onClick={() => selectVariant('thin')}>
                1-D Chess
                <div className="modal-subtitle">Single-file chess on a line</div>
              </button>
              <button className="modal-btn" onClick={() => selectVariant('skinny')}>
                Thin Chess
                <div className="modal-subtitle">Narrow-board chess variant</div>
              </button>
              <button className="modal-btn" onClick={() => {
                setShowVariantPicker(false);
                setShowPuzzleModePicker(true);
              }}>
                Mini-Board Puzzles
                <div className="modal-subtitle">Tactical & endgame challenges</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-D Chess Mode Selector Modal */}
      {showThinModePicker && (
        <div className="modal-overlay">
          <div className="modal mode-pack-modal">
            <h2>1-D Chess - Choose Scenario</h2>
            <div className="mode-grid">
              {THIN_MODE_PACK.map((mode) => {
                const helpContent = MODE_HELP_CONTENT[mode.id];
                return (
                  <div key={mode.id} className="mode-card-wrapper">
                    <button
                      className="mode-card"
                      onClick={() => selectThinMode(mode)}
                    >
                      <div className="mode-header">
                        <span className="mode-icon">{helpContent.icon}</span>
                        <span className="mode-difficulty-stars">
                          {'⭐'.repeat(helpContent.difficultyStars)}
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
                        openHelp(mode.id);
                      }}
                      title="Show help for this mode"
                    >
                      ?
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              className="modal-btn back-btn"
              onClick={() => {
                setShowThinModePicker(false);
                setShowVariantPicker(true);
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Thin Chess Challenges Selector Modal */}
      {showSkinnyModePicker && (
        <div className="modal-overlay">
          <div className="modal mode-pack-modal">
            <h2>Thin Chess - Choose Mode</h2>
            <div className="mode-grid">
              {/* Standard Thin Chess Option */}
              <div className="mode-card-wrapper">
                <button
                  className="mode-card"
                  onClick={selectStandardThinChess}
                >
                  <div className="mode-header">
                    <span className="mode-icon">♟️</span>
                    <span className="mode-difficulty-stars">⭐⭐⭐</span>
                  </div>
                  <div className="mode-name">Thin Chess</div>
                  <div className="mode-description">Standard 2×10 starting position</div>
                  <div className="mode-type-badge">Baseline</div>
                </button>
              </div>

              {/* Challenge Modes */}
              {SKINNY_MODE_PACK.map((mode) => {
                const helpContent = MODE_HELP_CONTENT[mode.id];
                return (
                  <div key={mode.id} className="mode-card-wrapper">
                    <button
                      className="mode-card"
                      onClick={() => selectSkinnyMode(mode)}
                    >
                      <div className="mode-header">
                        <span className="mode-icon">{helpContent.icon}</span>
                        <span className="mode-difficulty-stars">
                          {'⭐'.repeat(helpContent.difficultyStars)}
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
                        openHelp(mode.id);
                      }}
                      title="Show help for this mode"
                    >
                      ?
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              className="modal-btn back-btn"
              onClick={() => {
                setShowSkinnyModePicker(false);
                setShowVariantPicker(true);
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Mini-Board Puzzles Selector Modal */}
      {showPuzzleModePicker && (
        <div className="modal-overlay">
          <div className="modal mode-pack-modal">
            <h2>Mini-Board Puzzles</h2>
            <div className="mode-grid">
              {MINI_BOARD_PUZZLES_PACK.map((mode) => {
                const helpContent = MODE_HELP_CONTENT[mode.id];
                return (
                  <div key={mode.id} className="mode-card-wrapper">
                    {helpContent && (
                      <button
                        className="help-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openHelp(mode.id);
                        }}
                        title="Show hints and strategy"
                      >
                        ?
                      </button>
                    )}
                    <button
                      className="mode-card"
                      onClick={() => selectPuzzleMode(mode)}
                    >
                      <div className="mode-header">
                        <span className="mode-icon">{helpContent?.icon || '🧩'}</span>
                        <span className="mode-difficulty-stars">
                          {'⭐'.repeat(helpContent?.difficultyStars || 3)}
                        </span>
                      </div>
                      <div className="mode-name">{mode.name}</div>
                      <div className="mode-description">{mode.description}</div>
                      <div className="mode-type-badge">{mode.difficulty}</div>
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              className="modal-btn back-btn"
              onClick={() => {
                setShowPuzzleModePicker(false);
                setShowVariantPicker(true);
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && helpMode && MODE_HELP_CONTENT[helpMode] && (
        <div className="modal-overlay" onClick={closeHelp}>
          <div className="modal help-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{SKINNY_MODE_PACK.find(m => m.id === helpMode)?.name || THIN_MODE_PACK.find(m => m.id === helpMode)?.name || MINI_BOARD_PUZZLES_PACK.find(m => m.id === helpMode)?.name}</h2>

            <div className="help-section">
              <h3>The Challenge</h3>
              <p>{MODE_HELP_CONTENT[helpMode].challenge}</p>
            </div>

            <div className="help-section">
              <div className="solvability-badge">{MODE_HELP_CONTENT[helpMode].solvabilityType.replace(/_/g, ' ')}</div>
            </div>

            {/* Progressive hints for puzzles */}
            {MODE_HELP_CONTENT[helpMode].hints.length > 0 && (
              <div className="help-section">
                <h3>Hints</h3>
                {hintLevel === 0 && (
                  <button className="hint-btn" onClick={() => revealHint(1)}>
                    💡 Show Hint 1
                  </button>
                )}
                {hintLevel >= 1 && (
                  <div className="hint-box">
                    <strong>Hint 1:</strong> {MODE_HELP_CONTENT[helpMode].hints[0]}
                  </div>
                )}
                {hintLevel >= 1 && MODE_HELP_CONTENT[helpMode].hints.length > 1 && hintLevel < 2 && (
                  <button className="hint-btn" onClick={() => revealHint(2)}>
                    💡 Show Hint 2
                  </button>
                )}
                {hintLevel >= 2 && MODE_HELP_CONTENT[helpMode].hints[1] && (
                  <div className="hint-box">
                    <strong>Hint 2:</strong> {MODE_HELP_CONTENT[helpMode].hints[1]}
                  </div>
                )}
                {hintLevel >= 2 && MODE_HELP_CONTENT[helpMode].solution && (
                  <button className="hint-btn solution-btn" onClick={() => revealHint(3)}>
                    🔓 Show Full Solution
                  </button>
                )}
                {hintLevel >= 3 && MODE_HELP_CONTENT[helpMode].solution && (
                  <div className="solution-box">
                    <strong>Solution:</strong>
                    <pre>{MODE_HELP_CONTENT[helpMode].solution}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Strategy guide for competitive modes */}
            {MODE_HELP_CONTENT[helpMode].strategy && (
              <div className="help-section">
                <h3>Strategic Approach</h3>
                <div className="strategy-section">
                  <h4>White's Plan</h4>
                  <p>{MODE_HELP_CONTENT[helpMode].strategy.whitePlan}</p>
                </div>
                <div className="strategy-section">
                  <h4>Black's Plan</h4>
                  <p>{MODE_HELP_CONTENT[helpMode].strategy.blackPlan}</p>
                </div>
                <div className="strategy-section">
                  <h4>Key Positions</h4>
                  <p>{MODE_HELP_CONTENT[helpMode].strategy.keyPositions}</p>
                </div>
              </div>
            )}

            <div className="help-section">
              <h3>Learning Objectives</h3>
              <ul>
                {MODE_HELP_CONTENT[helpMode].learningObjectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            <button className="modal-btn" onClick={closeHelp}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Resignation Confirmation Modal */}
      {showResignConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Resign Game?</h2>
            <p style={{ textAlign: 'center', margin: '20px 0' }}>
              Are you sure you want to resign?
            </p>
            <div className="modal-buttons">
              <button className="modal-btn" onClick={confirmResignation} style={{ background: 'var(--lose)' }}>
                Yes, Resign
              </button>
              <button className="modal-btn" onClick={cancelResignation}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="header">
          <h1 className="title">
            <span className="title-icon title-icon-white">
              <img src="/white-pawn.svg" alt="" />
            </span>
            {selectedThinMode ? `${selectedThinMode.name}` : selectedSkinnyMode ? `${selectedSkinnyMode.name}` : selectedPuzzleMode ? `${selectedPuzzleMode.name}` : gameVariant === 'thin' ? '1-D Chess' : 'Thin Chess'}
            {selectedThinMode && <span className="mode-badge">{selectedThinMode.difficulty}</span>}
            {selectedSkinnyMode && <span className="mode-badge">{selectedSkinnyMode.difficulty}</span>}
            {selectedPuzzleMode && <span className="mode-badge">{selectedPuzzleMode.difficulty}</span>}
          </h1>
          <div className="header-buttons">
            <a
              href="https://www.youtube.com/shorts/nAO0IsMxveA"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn"
              title="Watch on YouTube"
            >
              <img src="/youtube.svg" alt="YouTube" style={{ width: '24px', height: '24px' }} />
            </a>
            <button className="icon-btn" onClick={handleToggleSound} title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}>
              {soundMuted ? '🔇' : '🔊'}
            </button>
            {showInstallButton && (
              <button className="install-btn" onClick={handleInstall}>
                Install
              </button>
            )}
          </div>
        </div>

        <div className="game-container">
          {/* Move Log */}
          <div className="move-log">
            <div className="move-log-header">Moves</div>
            <div className="move-log-content">
              {moveLog.length === 0 ? (
                <div className="move-log-empty">No moves yet</div>
              ) : (
                <div className="move-list">
                  {Array.from({ length: Math.ceil(moveLog.length / 2) }, (_, i) => {
                    const moveNumber = i + 1;
                    const whiteMove = moveLog[i * 2];
                    const blackMove = moveLog[i * 2 + 1];
                    return (
                      <div key={i} className="move-pair">
                        <span className="move-number">{moveNumber}.</span>
                        <span className="move-white">{whiteMove}</span>
                        {blackMove && <span className="move-black">{blackMove}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="board-wrap">
          {gameVariant === 'thin' ? (
            // 1-D Chess: board with ranks to the right
            <>
              <div
                className={`board board-${gameVariant}`}
                style={{ gridTemplateRows: `repeat(${getConfig(pos).height}, var(--square-size))` }}
              >
                {pos.board.map((cell, i) => {
                  const config = getConfig(pos);
                  const [rank, file] = indexToCoords(i, config);
                  const isLight = (rank + file) % 2 === 0;

                  return (
                    <div
                      key={i}
                      className={`sq ${isLight ? 'light' : 'dark'} ${sel === i ? 'selected' : ''} ${
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
                  );
                })}
              </div>

              <div className="coords tiny">
                {Array.from({ length: getConfig(pos).height }, (_, i) => (
                  <div key={i} className="n">
                    {i + 1}
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Thin Chess: board with files below and ranks to the right
            <div className="coords-2d">
              <div
                className={`board board-${gameVariant}`}
                style={{
                  gridColumn: '1',
                  gridRow: '1',
                  gridTemplateColumns: `repeat(${getConfig(pos).width}, var(--square-size))`,
                  gridTemplateRows: `repeat(${getConfig(pos).height}, var(--square-size))`,
                }}
              >
                {pos.board.map((cell, i) => {
                  const config = getConfig(pos);
                  const [rank, file] = indexToCoords(i, config);
                  const isLight = (rank + file) % 2 === 0;

                  return (
                    <div
                      key={i}
                      className={`sq ${isLight ? 'light' : 'dark'} ${sel === i ? 'selected' : ''} ${
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
                  );
                })}
              </div>

              <div className="coords-files">
                {getConfig(pos).files.map(f => (
                  <div key={f} className="n">{f}</div>
                ))}
              </div>

              <div className="coords-ranks">
                {getConfig(pos).ranks.map(r => (
                  <div key={r} className="n">{r}</div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>

        {gameOver && (
          <div className="game-over-banner">
            {gameResult}
          </div>
        )}

        <div className="controls row">
          <button onClick={handleNewGame}>New Game</button>
          <button onClick={handleUndo} disabled={hIndex <= 0 || aiThinking || gameOver}>
            Undo
          </button>
          <button onClick={handleRedo} disabled={hIndex >= history.length - 1 || aiThinking || gameOver}>
            Redo
          </button>
          <button
            className={`peace-btn ${repetitionDetected ? 'active' : ''}`}
            onClick={handlePeaceTreaty}
            disabled={aiThinking || gameOver}
            title={repetitionDetected ? 'Position repeated - claim draw by repetition' : 'Resign this game (you lose)'}
          >
            <span className="peace-icon">{repetitionDetected ? '⚖️' : '🏳️'}</span>
            {repetitionDetected ? 'Draw' : 'Resign'}
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
