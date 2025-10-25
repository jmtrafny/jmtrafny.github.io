/**
 * Main Application Component (Version 2.0 - Configuration-Driven Architecture)
 *
 * Refactored to use:
 * - Centralized game-modes.json configuration
 * - Custom hooks for state management
 * - Extracted modal components
 * - Simplified state and logic
 */

import { useState, useEffect, useRef } from 'react';
import {
  PIECE_IMAGES,
  EMPTY,
  getConfig,
  indexToCoords,
  encode,
  legalMoves,
  type Piece,
  type Side,
  type Move,
} from './engine';
import { solve } from './solver';
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
  VariantPicker,
  ModePicker,
  HelpModal,
  GameSetup,
  ResignConfirm,
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
    getModesByCategory,
    getMode,
    getCategory,
  } = useGameModes();

  // Game state
  const [gameState, gameActions] = useGameState();
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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const lastGameResultRef = useRef<string>('');

  // Initialize audio
  useEffect(() => {
    initAudio();
  }, []);

  // Initialize default game (1-D Chess: Full Set, user as white)
  useEffect(() => {
    if (!configLoading && !configError && config && gameState.gameMode === null) {
      const defaultMode = getMode('1D12_CLASSIC') || config.modes[0];
      if (defaultMode) {
        gameActionsRef.current.newGame(defaultMode, '1player', 'w');
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
  useEffect(() => {
    if (!gameState.gameOver || !gameState.gameResult) return;

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

    const timeoutId = setTimeout(() => {
      try {
        let bestMove: Move | undefined;

        if (gameState.position.variant === 'skinny') {
          // Random move for Thin Chess
          const moves = legalMoves(gameState.position);
          if (moves.length > 0) {
            bestMove = moves[Math.floor(Math.random() * moves.length)];
          }
        } else {
          // Solver for 1-D Chess
          const result = solve(gameState.position);
          bestMove = result.best;
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
    // Check if this will be a move BEFORE calling selectSquare
    const wasMove = gameState.selectedSquare !== null && gameState.targetSquares.includes(index);
    const isCapture = wasMove ? gameState.position.board[index] !== EMPTY : false;

    gameActions.selectSquare(index);

    // Play move sound after state update is queued
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

  const handleSelectCategory = (categoryId: string) => {
    const modes = getModesByCategory(categoryId);

    // If category has no modes, go back
    if (modes.length === 0) {
      modalActions.showVariantPicker();
      return;
    }

    modalActions.showModePicker(categoryId);
  };

  const handleSelectMode = (modeId: string) => {
    const mode = getMode(modeId);
    if (!mode) return;

    modalActions.showGameSetup(modeId);
    setShowColorPicker(false);
  };

  const handleSelect1Player = () => {
    setShowColorPicker(true);
  };

  const handleSelect2Player = () => {
    const mode = getMode(modalState.selectedModeId || '');
    if (!mode) return;

    gameActions.newGame(mode, '2player', null);
    modalActions.closeModal();
  };

  const handleSelectColor = (side: Side) => {
    const mode = getMode(modalState.selectedModeId || '');
    if (!mode) return;

    gameActions.newGame(mode, '1player', side);
    modalActions.closeModal();
    setShowColorPicker(false);
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

  const handleLoad = () => {
    const input = (document.getElementById('posCode') as HTMLInputElement)?.value || '';
    gameActions.loadPosition(input);
  };

  const handleCopy = () => {
    const code = encode(gameState.position);
    navigator.clipboard.writeText(code);
  };

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

  const boardConfig = getConfig(gameState.position);

  return (
    <div className="app">
      {/* Modals */}
      {modalState.currentModal === 'variant-picker' && (
        <VariantPicker categories={categories} onSelectCategory={handleSelectCategory} />
      )}

      {modalState.currentModal === 'mode-picker' && modalState.selectedCategoryId && (
        <ModePicker
          category={getCategory(modalState.selectedCategoryId)!}
          modes={getModesByCategory(modalState.selectedCategoryId)}
          onSelectMode={handleSelectMode}
          onShowHelp={modalActions.showHelp}
          onBack={modalActions.showVariantPicker}
        />
      )}

      {modalState.currentModal === 'game-setup' && modalState.selectedModeId && (
        <GameSetup
          showColorPicker={showColorPicker}
          onSelect1Player={handleSelect1Player}
          onSelect2Player={handleSelect2Player}
          onSelectColor={handleSelectColor}
          onBack={() => setShowColorPicker(false)}
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

      {/* Main UI */}
      <div className="panel">
        <div className="header">
          <h1 className="title">
            <span className="title-icon title-icon-white">
              <img src="/svg/white-pawn.svg" alt="" />
            </span>
            {gameState.currentMode
              ? gameState.currentMode.name
              : gameState.position.variant === 'thin'
              ? '1-D Chess'
              : 'Thin Chess'}
            {gameState.currentMode && (
              <span className="mode-badge">{gameState.currentMode.difficulty}</span>
            )}
          </h1>
          <div className="header-buttons">
            <a
              href="https://www.youtube.com/shorts/nAO0IsMxveA"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn"
              title="Watch on YouTube"
            >
              <img
                src="/svg/youtube.svg"
                alt="YouTube"
                style={{ width: '24px', height: '24px' }}
              />
            </a>
            <button
              className="icon-btn"
              onClick={handleToggleSound}
              title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
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
            {gameState.position.variant === 'thin' ? (
              // 1-D Chess board
              <>
                <div
                  className="board board-thin"
                  style={{
                    gridTemplateRows: `repeat(${boardConfig.height}, var(--square-size))`,
                  }}
                >
                  {gameState.position.board.map((cell, i) => {
                    const [rank, file] = indexToCoords(i, boardConfig);
                    const isLight = (rank + file) % 2 === 0;

                    return (
                      <div
                        key={i}
                        className={`sq ${isLight ? 'light' : 'dark'} ${
                          gameState.selectedSquare === i ? 'selected' : ''
                        } ${gameState.targetSquares.includes(i) ? 'target' : ''} ${
                          gameState.aiThinking ? 'disabled' : ''
                        }`}
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
                  {Array.from({ length: boardConfig.height }, (_, i) => (
                    <div key={i} className="n">
                      {i + 1}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Thin Chess board
              <div className="coords-2d">
                <div
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

                    return (
                      <div
                        key={i}
                        className={`sq ${isLight ? 'light' : 'dark'} ${
                          gameState.selectedSquare === i ? 'selected' : ''
                        } ${gameState.targetSquares.includes(i) ? 'target' : ''} ${
                          gameState.aiThinking ? 'disabled' : ''
                        }`}
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
        </div>

        {/* Game Over Banner */}
        {gameState.gameOver && (
          <button className="game-over-banner" onClick={gameActions.restart}>
            {gameState.gameResult}
            <img src="/svg/restart.svg" alt="Restart" className="restart-icon" />
          </button>
        )}

        {/* Controls */}
        <div className="controls row">
          <button onClick={handleNewGame}>New Game</button>
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

        {/* Position Editor */}
        <details className="row">
          <summary>
            <b>Share / Edit Position</b>
          </summary>
          <div className="tiny" style={{ margin: '.5rem 0 .25rem' }}>
            Position code (w=white, b=black, k/r/n pieces, x=empty)
          </div>
          <input
            id="posCode"
            type="text"
            className="mono"
            defaultValue={encode(gameState.position)}
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
