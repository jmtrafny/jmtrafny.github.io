/**
 * Main Application Component (Version 2.0 - Configuration-Driven Architecture)
 *
 * Refactored to use:
 * - Centralized game-modes.json configuration
 * - Custom hooks for state management
 * - Extracted modal components
 * - Simplified state and logic
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PIECE_IMAGES,
  EMPTY,
  getConfig,
  indexToCoords,
  coordsToIndex,
  encode,
  DEFAULT_RULES,
  type Piece,
  type Side,
} from './engine';
import { solveHybrid } from './solver';
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
import { useGameModes } from './hooks/useGameModes';
import { useGameState } from './hooks/useGameState';
import { useModalState } from './hooks/useModalState';
import {
  UnifiedGamePicker,
  HelpModal,
  ResignConfirm,
  SupportModal,
  BugReportModal,
} from './components/modals';
import './App.css';

// PWA Install Prompt Interface
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function App() {
  // Configuration and modes
  const {
    config,
    loading: configLoading,
    error: configError,
    categories,
    getMode,
  } = useGameModes();

  // Game state
  const [gameState, gameActions] = useGameState();

  // Maintain stable reference to gameActions to avoid dependency cycles in AI effect
  const gameActionsRef = useRef(gameActions);
  useEffect(() => {
    gameActionsRef.current = gameActions;
  }, [gameActions]);

  // Modal state
  const [modalState, modalActions] = useModalState();

  // UI state
  const [soundMuted, setSoundMuted] = useState(() => getMuted());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [positionInput, setPositionInput] = useState('');

  // Track last game result to prevent duplicate sound playback on re-renders
  const lastGameResultRef = useRef<string>('');
  // Track the last synced encoded position to detect actual changes
  const lastSyncedPositionRef = useRef<string>('');

  // Initialize audio
  useEffect(() => {
    initAudio();
  }, []);

  // Initialize default game from configuration
  useEffect(() => {
    if (!configLoading && !configError && config && gameState.gameMode === null) {
      // Use configured default game, or fall back to first mode
      const defaultConfig = config.defaultGame;
      const defaultMode = defaultConfig
        ? getMode(defaultConfig.modeId)
        : config.modes[0];

      if (defaultMode) {
        const gameType = defaultConfig?.gameType || '1player';
        const playerSide = defaultConfig?.playerSide || 'w';
        gameActionsRef.current.newGame(defaultMode, gameType, playerSide);
      } else {
        console.error('No default game mode available in configuration');
      }
    }
  }, [configLoading, configError, config, gameState.gameMode, getMode]);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Play sounds for game outcomes
  // Determines win/loss/draw from game result and plays appropriate sound effect.
  // Uses ref to prevent duplicate playback on component re-renders.
  useEffect(() => {
    if (!gameState.gameOver || !gameState.gameResult) {
      // Reset ref when game is not over (e.g., new game started)
      if (!gameState.gameOver && lastGameResultRef.current) {
        lastGameResultRef.current = '';
      }
      return;
    }

    // Prevent playing the same sound multiple times for the same result
    if (lastGameResultRef.current === gameState.gameResult) return;
    lastGameResultRef.current = gameState.gameResult;

    if (gameState.gameResult.includes('Stalemate') || gameState.gameResult.includes('Draw')) {
      console.log('[Sound] Game over: draw');
      playDraw();
    } else if (gameState.gameResult.includes('resigned')) {
      console.log('[Sound] Game over: resigned (defeat)');
      playDefeat();
    } else if (gameState.gameMode === '1player') {
      // Determine if player won or lost
      const playerWon =
        (gameState.playerSide === 'w' && gameState.gameResult.includes('White Wins')) ||
        (gameState.playerSide === 'b' && gameState.gameResult.includes('Black Wins'));

      if (playerWon) {
        console.log('[Sound] Game over: player won (victory)');
        playVictory();
      } else {
        console.log('[Sound] Game over: player lost (defeat)');
        playDefeat();
      }
    } else {
      console.log('[Sound] Game over: 2-player (victory)');
      playVictory();
    }
  }, [gameState.gameOver, gameState.gameResult, gameState.gameMode, gameState.playerSide]);

  // AI move handler
  // Triggers AI move when it's the AI's turn in 1-player mode.
  // Uses 500ms delay to provide visual feedback before move appears.
  // Thin chess (skinny): Random move selection
  // 1-D chess (thin): Perfect-play solver
  useEffect(() => {
    // Skip if not AI's turn or already thinking
    if (
      gameState.gameMode !== '1player' ||
      gameState.playerSide === null ||
      gameState.position.turn === gameState.playerSide ||
      gameState.aiThinking ||
      gameState.gameOver
    ) {
      return;
    }

    // AI's turn
    console.log('[AI] Starting AI move for position:', gameState.history[gameState.historyIndex]);
    gameActionsRef.current.setAIThinking(true);

    // 500ms delay provides visual feedback that AI is "thinking"
    const timeoutId = setTimeout(() => {
      try {
        const rules = gameState.currentMode?.rules || DEFAULT_RULES;

        // Use hybrid solver for all variants (automatically chooses best tier)
        const result = solveHybrid(gameState.position, rules);
        const bestMove = result.best;

        // Log which tier was used
        if ('tier' in result) {
          console.log(`[AI] Used Tier ${result.tier}:`, 'res' in result ? result.res : `${result.score}cp`);
        }

        if (bestMove) {
          const isCapture = gameState.position.board[bestMove.to] !== EMPTY;
          gameActionsRef.current.makeMove(bestMove.from, bestMove.to);

          console.log('[Sound] AI move:', isCapture ? 'capture' : 'move');
          if (isCapture) {
            playCapture();
          } else {
            playMove();
          }
        }
      } catch (error) {
        console.error('[AI] Error during move:', error);
      } finally {
        gameActionsRef.current.setAIThinking(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameState.gameMode,
    gameState.playerSide,
    gameState.history[gameState.historyIndex], // Current position as string
    gameState.gameOver,
    // NOTE: aiThinking is NOT in deps to avoid canceling the timeout
  ]);

  // Handlers
  const handleSquareClick = (index: number) => {
    // Pre-check if this click will result in a move (before state updates)
    // This allows accurate sound playback timing before board changes
    const wasMove = gameState.selectedSquare !== null && gameState.targetSquares.includes(index);
    const isCapture = wasMove ? gameState.position.board[index] !== EMPTY : false;

    gameActions.selectSquare(index);

    // Play appropriate sound effect based on pre-checked move type
    if (wasMove) {
      console.log('[Sound] Human move:', isCapture ? 'capture' : 'move');
      if (isCapture) {
        playCapture();
      } else {
        playMove();
      }
    }
  };

  const handleNewGame = () => {
    modalActions.showVariantPicker();
  };

  const handleStartGame = (modeId: string, gameType: '1player' | '2player', playerSide: Side | null) => {
    const mode = getMode(modeId);
    if (!mode) return;

    gameActions.newGame(mode, gameType, playerSide);
    modalActions.closeModal();
  };

  const handleToggleSound = () => {
    const newMuted = toggleMute();
    setSoundMuted(newMuted);
  };

  const handlePeaceTreaty = () => {
    if (gameState.repetitionDetected) {
      console.log('[Sound] Draw claimed by repetition');
      gameActions.claimDraw();
      // Note: playDraw() will be called by the game outcome effect
    } else {
      modalActions.showResignConfirm();
    }
  };

  const handleResignConfirm = () => {
    gameActions.resign();
    modalActions.closeModal();
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  // Sync position input when game position ACTUALLY changes (not just re-renders)
  useEffect(() => {
    if (gameState.position) {
      const currentEncoded = encode(gameState.position);
      // Only update if the encoded position actually changed
      if (currentEncoded !== lastSyncedPositionRef.current) {
        lastSyncedPositionRef.current = currentEncoded;
        setPositionInput(currentEncoded);
      }
    }
  }, [gameState.position]);

  const handleLoad = () => {
    gameActions.loadPosition(positionInput);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(positionInput);
  };

  // Get board configuration for current position
  const boardConfig = getConfig(gameState.position);

  // Drag handlers
  const boardRef = useRef<HTMLDivElement>(null);

  // Get square index from screen coordinates
  const getSquareFromCoords = useCallback((clientX: number, clientY: number): number | null => {
    if (!boardRef.current) return null;

    // Compute board config dynamically to avoid stale closure
    const config = getConfig(gameState.position);
    const boardRect = boardRef.current.getBoundingClientRect();
    const relX = clientX - boardRect.left;
    const relY = clientY - boardRect.top;

    if (relX < 0 || relY < 0 || relX >= boardRect.width || relY >= boardRect.height) {
      return null;
    }

    if (config.variant === '1xN') {
      // 1-D Chess: vertical layout
      const squareHeight = boardRect.height / config.height;
      const rank = Math.floor(relY / squareHeight);
      return coordsToIndex(rank, 0, config);
    } else {
      // Thin Chess: 2D grid
      const squareWidth = boardRect.width / config.width;
      const squareHeight = boardRect.height / config.height;
      const file = Math.floor(relX / squareWidth);
      const rank = Math.floor(relY / squareHeight);
      return coordsToIndex(rank, file, config);
    }
  }, [gameState.position]);

  const handleMouseDown = useCallback((e: React.MouseEvent, square: number) => {
    e.preventDefault();
    const piece = gameState.position.board[square];

    // Only start drag if it's a piece that can be moved
    if (piece !== EMPTY && piece[0] === gameState.position.turn && !gameState.aiThinking && !gameState.gameOver) {
      gameActions.startDrag(square, e.clientX, e.clientY);
    }
  }, [gameState.position, gameState.aiThinking, gameState.gameOver, gameActions]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (gameState.draggedPiece) {
      e.preventDefault();
      gameActions.updateDrag(e.clientX, e.clientY);
    }
  }, [gameState.draggedPiece, gameActions]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (gameState.draggedPiece) {
      e.preventDefault();
      const targetSquare = getSquareFromCoords(e.clientX, e.clientY);

      // Check if move was made before clearing drag state
      const isLegalMove = targetSquare !== null && gameState.targetSquares.includes(targetSquare);
      const isCapture = isLegalMove ? gameState.position.board[targetSquare] !== EMPTY : false;

      gameActions.endDrag(targetSquare);

      // Play sound if move was made
      if (isLegalMove) {
        if (isCapture) {
          playCapture();
        } else {
          playMove();
        }
      }
    }
  }, [gameState.draggedPiece, gameState.targetSquares, gameState.position, gameActions, getSquareFromCoords]);

  const handleTouchStart = useCallback((e: React.TouchEvent, square: number) => {
    e.preventDefault();
    const piece = gameState.position.board[square];

    if (piece !== EMPTY && piece[0] === gameState.position.turn && !gameState.aiThinking && !gameState.gameOver) {
      const touch = e.touches[0];
      gameActions.startDrag(square, touch.clientX, touch.clientY);
    }
  }, [gameState.position, gameState.aiThinking, gameState.gameOver, gameActions]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (gameState.draggedPiece) {
      e.preventDefault();
      const touch = e.touches[0];
      gameActions.updateDrag(touch.clientX, touch.clientY);
    }
  }, [gameState.draggedPiece, gameActions]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (gameState.draggedPiece) {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const targetSquare = getSquareFromCoords(touch.clientX, touch.clientY);

      const isLegalMove = targetSquare !== null && gameState.targetSquares.includes(targetSquare);
      const isCapture = isLegalMove ? gameState.position.board[targetSquare] !== EMPTY : false;

      gameActions.endDrag(targetSquare);

      if (isLegalMove) {
        if (isCapture) {
          playCapture();
        } else {
          playMove();
        }
      }
    }
  }, [gameState.draggedPiece, gameState.targetSquares, gameState.position, gameActions, getSquareFromCoords]);

  // Attach global mouse/touch listeners for drag
  useEffect(() => {
    if (gameState.draggedPiece) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [gameState.draggedPiece, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Loading state
  if (configLoading) {
    return (
      <div className="app">
        <div className="panel">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Loading game modes...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (configError || !config) {
    return (
      <div className="app">
        <div className="panel">
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--lose)' }}>
            <div>Failed to load configuration</div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              {configError?.message || 'Unknown error'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Modals */}
      {modalState.currentModal === 'variant-picker' && (
        <UnifiedGamePicker
          categories={categories}
          modes={config.modes}
          onStartGame={handleStartGame}
          onShowHelp={modalActions.showHelp}
          onBack={modalActions.closeModal}
        />
      )}

      {modalState.currentModal === 'help' && modalState.helpModeId && getMode(modalState.helpModeId) && (
        <HelpModal
          mode={getMode(modalState.helpModeId)!}
          hintLevel={modalState.hintLevel}
          onRevealHint={modalActions.setHintLevel}
          onClose={modalActions.closeModal}
        />
      )}

      {modalState.currentModal === 'resign-confirm' && (
        <ResignConfirm onConfirm={handleResignConfirm} onCancel={modalActions.closeModal} />
      )}

      {showSupportModal && (
        <SupportModal onClose={() => setShowSupportModal(false)} />
      )}

      {showBugReportModal && (
        <BugReportModal onClose={() => setShowBugReportModal(false)} />
      )}

      {/* Main UI */}
      <div className="panel">
        <div className="header">
          <h1 className="title">
            {gameState.currentMode
              ? gameState.currentMode.name
              : gameState.position.variant === '1xN'
              ? '1-D Chess'
              : 'Thin Chess'}
          </h1>
          <div className="header-buttons">
            {gameState.currentMode && (
              <span className="mode-badge">{gameState.currentMode.difficulty}</span>
            )}
            <button
              className="icon-btn"
              onClick={handleToggleSound}
              title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {soundMuted ? '🔇' : '🔊'}
            </button>
            <button
              className="icon-btn"
              onClick={() => setShowBugReportModal(true)}
              title="Report a bug"
            >
              🪲
            </button>
            <button
              className="icon-btn"
              onClick={() => setShowSupportModal(true)}
              title="Support this project"
            >
              ❤️
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
              {gameState.moveLog.length === 0 ? (
                <div className="move-log-empty">No moves yet</div>
              ) : (
                <div className="move-list">
                  {Array.from({ length: Math.ceil(gameState.moveLog.length / 2) }, (_, i) => {
                    const moveNumber = i + 1;
                    const whiteMove = gameState.moveLog[i * 2];
                    const blackMove = gameState.moveLog[i * 2 + 1];
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

          {/* Board */}
          <div className="board-wrap">
            {gameState.position.variant === '1xN' ? (
              // 1-D Chess board
              <>
                <div
                  ref={boardRef}
                  className="board board-thin"
                  style={{
                    gridTemplateRows: `repeat(${boardConfig.height}, var(--square-size))`,
                  }}
                >
                  {gameState.position.board.map((cell, i) => {
                    const [rank, file] = indexToCoords(i, boardConfig);
                    const isLight = (rank + file) % 2 === 0;
                    const isDragging = gameState.draggedPiece?.square === i;

                    return (
                      <div
                        key={i}
                        className={`sq ${isLight ? 'light' : 'dark'} ${
                          gameState.selectedSquare === i ? 'selected' : ''
                        } ${gameState.targetSquares.includes(i) ? 'target' : ''} ${
                          gameState.aiThinking ? 'disabled' : ''
                        } ${isDragging ? 'dragging' : ''}`}
                        onClick={() => handleSquareClick(i)}
                        onMouseDown={(e) => handleMouseDown(e, i)}
                        onTouchStart={(e) => handleTouchStart(e, i)}
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
                  {Array.from({ length: boardConfig.height }, (_, i) => (
                    <div key={i} className="n">
                      {boardConfig.height - i}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Thin Chess board
              <div className="coords-2d">
                <div
                  ref={boardRef}
                  className="board board-skinny"
                  style={{
                    gridColumn: '1',
                    gridRow: '1',
                    gridTemplateColumns: `repeat(${boardConfig.width}, var(--square-size))`,
                    gridTemplateRows: `repeat(${boardConfig.height}, var(--square-size))`,
                  }}
                >
                  {gameState.position.board.map((cell, i) => {
                    const [rank, file] = indexToCoords(i, boardConfig);
                    const isLight = (rank + file) % 2 === 0;
                    const isDragging = gameState.draggedPiece?.square === i;

                    return (
                      <div
                        key={i}
                        className={`sq ${isLight ? 'light' : 'dark'} ${
                          gameState.selectedSquare === i ? 'selected' : ''
                        } ${gameState.targetSquares.includes(i) ? 'target' : ''} ${
                          gameState.aiThinking ? 'disabled' : ''
                        } ${isDragging ? 'dragging' : ''}`}
                        onClick={() => handleSquareClick(i)}
                        onMouseDown={(e) => handleMouseDown(e, i)}
                        onTouchStart={(e) => handleTouchStart(e, i)}
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
                  {boardConfig.files.map((f) => (
                    <div key={f} className="n">
                      {f}
                    </div>
                  ))}
                </div>
                <div className="coords-ranks">
                  {boardConfig.ranks.map((r) => (
                    <div key={r} className="n">
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating dragged piece */}
          {gameState.draggedPiece && (
            <div
              className="drag-overlay"
              style={{
                left: gameState.draggedPiece.screenX,
                top: gameState.draggedPiece.screenY,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <img
                src={PIECE_IMAGES[gameState.position.board[gameState.draggedPiece.square] as Piece]}
                alt="dragging"
                className="piece"
                draggable={false}
              />
            </div>
          )}
        </div>

        {/* Game Over Banner */}
        {gameState.gameOver && (
          <button className="game-over-banner" onClick={gameActions.restart}>
            {gameState.gameResult}
            <img src="/svg/restart.svg" alt="Restart" className="restart-icon" />
          </button>
        )}

        {/* Controls */}
        <div className="controls">
          <div className="controls-row">
            <button onClick={handleNewGame}>New Game/Variant</button>
            <button
              className={`peace-btn ${gameState.repetitionDetected ? 'active' : ''}`}
              onClick={handlePeaceTreaty}
              disabled={gameState.aiThinking || gameState.gameOver}
              title={
                gameState.repetitionDetected
                  ? 'Position repeated - claim draw by repetition'
                  : 'Resign this game (you lose)'
              }
            >
              <span className="peace-icon">{gameState.repetitionDetected ? '⚖️' : '🏳️'}</span>
              {gameState.repetitionDetected ? 'Draw' : 'Resign'}
            </button>
          </div>
          <div className="controls-row">
            <button
              onClick={gameActions.undo}
              disabled={gameState.historyIndex <= 0 || gameState.aiThinking || gameState.gameOver}
            >
              Undo
            </button>
            <button
              onClick={gameActions.redo}
              disabled={
                gameState.historyIndex >= gameState.history.length - 1 ||
                gameState.aiThinking ||
                gameState.gameOver
              }
            >
              Redo
            </button>
          </div>
        </div>

        {/* Position Editor */}
        <details className="row">
          <summary>
            <b>Share / Edit Position</b>
          </summary>

          <details style={{ margin: '.5rem 0' }}>
            <summary className="tiny" style={{ cursor: 'pointer', marginBottom: '.5rem' }}>
              Position Code Directions
            </summary>
            <div className="tiny" style={{ marginLeft: '1rem', lineHeight: '1.5' }}>
              <p><strong>Format:</strong> pieces:turn</p>

              <p><strong>Pieces:</strong></p>
              <ul style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                <li><strong>White pieces:</strong> wk (king), wq (queen), wr (rook), wb (bishop), wn (knight), wp (pawn)</li>
                <li><strong>Black pieces:</strong> bk (king), bq (queen), br (rook), bb (bishop), bn (knight), bp (pawn)</li>
                <li><strong>Empty square:</strong> x</li>
              </ul>

              <p><strong>Turn:</strong> w (white) or b (black)</p>

              <p><strong>Board Layout:</strong></p>
              <ul style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                <li><strong>1-D Chess:</strong> Comma-separated squares from bottom to top</li>
                <li><strong>Thin Chess:</strong> Ranks separated by / (bottom to top), squares within each rank separated by commas (left to right)</li>
              </ul>

              <p><strong>Examples:</strong></p>
              <ul style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                <li>1-D Chess: <code>wk,x,x,bk:w</code> (white king, 2 empty, black king; white to move)</li>
                <li>Thin Chess: <code>wk,wr/bk,br:b</code> (2 ranks; black to move)</li>
              </ul>
            </div>
          </details>

          <input
            id="posCode"
            type="text"
            className="mono"
            value={positionInput}
            onChange={(e) => setPositionInput(e.target.value)}
          />
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
