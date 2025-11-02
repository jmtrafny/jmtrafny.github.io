/**
 * useGameState Hook
 *
 * Centralized game state management replacing scattered useState calls in App.tsx.
 * Manages position, history, game mode, player side, and game status.
 */

import { useState, useCallback, useEffect } from 'react';
import type { Position, Side } from '../engine';
import {
  decode,
  encode,
  applyMove,
  terminal,
  legalMoves,
  detectRepetition,
  moveToAlgebraic,
  EMPTY,
  DEFAULT_RULES,
} from '../engine';
import { clearTT } from '../solver';
import type { GameMode } from '../config/GameModeConfig';
import type { RuleSet } from '../config/GameModeConfig';

/**
 * Get rules from a game mode, falling back to defaults
 */
function getRulesFromMode(mode: GameMode | null): RuleSet {
  return mode?.rules || DEFAULT_RULES;
}

/**
 * Game mode types
 */
export type GameModeType = '1player' | '2player' | null;

/**
 * Drag state for piece being dragged
 */
export interface DragState {
  square: number;      // Index of square being dragged from
  screenX: number;     // Current screen X coordinate
  screenY: number;     // Current screen Y coordinate
}

/**
 * Game state interface
 */
export interface GameState {
  position: Position;
  history: string[];
  historyIndex: number;
  selectedSquare: number | null;
  targetSquares: number[];
  gameMode: GameModeType;
  playerSide: Side | null;
  currentMode: GameMode | null;
  gameOver: boolean;
  gameResult: string;
  moveLog: string[];
  repetitionDetected: boolean;
  aiThinking: boolean;
  draggedPiece: DragState | null;
}

/**
 * Game actions interface
 */
export interface GameActions {
  selectSquare: (index: number) => void;
  makeMove: (from: number, to: number) => void;
  undo: () => void;
  redo: () => void;
  newGame: (mode: GameMode, gameMode: GameModeType, playerSide: Side | null) => void;
  restart: () => void;
  loadPosition: (positionCode: string) => void;
  resign: () => void;
  claimDraw: () => void;
  setAIThinking: (thinking: boolean) => void;
  startDrag: (square: number, screenX: number, screenY: number) => void;
  updateDrag: (screenX: number, screenY: number) => void;
  endDrag: (targetSquare: number | null) => void;
}

/**
 * Create initial state from a game mode
 *
 * Returns partial state with position, history, and UI state.
 * Uses Omit to exclude gameMode, playerSide, and currentMode which are
 * set separately by the newGame action to avoid circular dependencies.
 */
function createInitialState(mode: GameMode | null): Omit<GameState, 'gameMode' | 'playerSide' | 'currentMode'> {
  if (!mode) {
    // Return a minimal default state
    return {
      position: decode('x:w', '1xN', 1, 1),
      history: [],
      historyIndex: 0,
      selectedSquare: null,
      targetSquares: [],
      gameOver: false,
      gameResult: '',
      moveLog: [],
      repetitionDetected: false,
      aiThinking: false,
      draggedPiece: null,
    };
  }

  const position = decode(
    mode.startPosition,
    mode.variant,
    mode.boardHeight,
    mode.boardWidth
  );

  return {
    position,
    history: [encode(position)],
    historyIndex: 0,
    selectedSquare: null,
    targetSquares: [],
    gameOver: false,
    gameResult: '',
    moveLog: [],
    repetitionDetected: false,
    aiThinking: false,
    draggedPiece: null,
  };
}

/**
 * Hook for managing game state
 */
export function useGameState(): [GameState, GameActions] {
  const [state, setState] = useState<GameState>(() => ({
    ...createInitialState(null),
    gameMode: null,
    playerSide: null,
    currentMode: null,
    draggedPiece: null,
  }));

  // Detect position repetition
  useEffect(() => {
    const currentEncoded = encode(state.position);
    const count = detectRepetition(state.history, currentEncoded);
    setState((prev) => ({
      ...prev,
      repetitionDetected: count >= 2,
    }));
  }, [state.position, state.history]);

  // Check for game over
  useEffect(() => {
    // Skip check if no game mode is set (initial state before game loads)
    // or if position is invalid or game already over
    if (!state.currentMode || !state.position || !state.position.board || state.gameOver) return;

    const rules = getRulesFromMode(state.currentMode);
    const term = terminal(state.position, rules);
    if (term) {
      let result = '';
      if (term === 'STALEMATE') {
        result = 'Draw - Stalemate';
        console.log('[GameState] Stalemate detected:', state.position);
      } else if (term === 'WHITE_MATE') {
        result = 'Black Wins - White is checkmated';
      } else if (term === 'BLACK_MATE') {
        result = 'White Wins - Black is checkmated';
      } else if (term === 'DRAW_FIFTY') {
        result = 'Draw - Fifty-move rule';
      } else if (term === 'DRAW_THREEFOLD') {
        result = 'Draw - Threefold repetition';
      } else if (term === 'WHITE_MATERIAL_WIN') {
        result = 'White Wins - More pieces remaining';
      } else if (term === 'BLACK_MATERIAL_WIN') {
        result = 'Black Wins - More pieces remaining';
      } else if (term === 'DRAW_MATERIAL_TIE') {
        result = 'Draw - Equal pieces remaining';
      } else if (term === 'WHITE_RACE_WIN') {
        result = 'White Wins - Piece reached back rank!';
      } else if (term === 'BLACK_RACE_WIN') {
        result = 'Black Wins - Piece reached back rank!';
      }

      setState((prev) => ({
        ...prev,
        gameOver: true,
        gameResult: result,
      }));
    }
  }, [state.position, state.gameOver, state.currentMode]);

  const actions: GameActions = {
    selectSquare: useCallback((index: number) => {
      setState((prev) => {
        if (prev.aiThinking || prev.gameOver) return prev;

        const piece = prev.position.board[index];
        const rules = getRulesFromMode(prev.currentMode);

        // Deselect if clicking same square
        if (index === prev.selectedSquare) {
          return {
            ...prev,
            selectedSquare: null,
            targetSquares: [],
          };
        }

        // If nothing selected, try to select this square
        if (prev.selectedSquare === null) {
          if (piece === EMPTY || piece[0] !== prev.position.turn) {
            return prev; // Can't select empty or opponent's piece
          }

          // Select piece and show legal move targets
          const targets = legalMoves(prev.position, rules)
            .filter((m) => m.from === index)
            .map((m) => m.to);

          return {
            ...prev,
            selectedSquare: index,
            targetSquares: targets,
          };
        }

        // Try to make a move
        const move = legalMoves(prev.position, rules).find(
          (m) => m.from === prev.selectedSquare && m.to === index
        );

        if (move) {
          const moveNotation = moveToAlgebraic(prev.position, move);
          const newPosition = applyMove(prev.position, move, rules);
          const newHistory = prev.history.slice(0, prev.historyIndex + 1);
          newHistory.push(encode(newPosition));

          return {
            ...prev,
            position: newPosition,
            history: newHistory,
            historyIndex: prev.historyIndex + 1,
            selectedSquare: null,
            targetSquares: [],
            moveLog: [...prev.moveLog, moveNotation],
          };
        }

        // Clicked on different piece of same color - select it
        if (piece !== EMPTY && piece[0] === prev.position.turn) {
          const targets = legalMoves(prev.position, rules)
            .filter((m) => m.from === index)
            .map((m) => m.to);

          return {
            ...prev,
            selectedSquare: index,
            targetSquares: targets,
          };
        }

        return prev;
      });
    }, []),

    makeMove: useCallback((from: number, to: number) => {
      setState((prev) => {
        // Only block if game is over (AI can make moves while aiThinking is true)
        if (prev.gameOver) return prev;

        const rules = getRulesFromMode(prev.currentMode);
        const moves = legalMoves(prev.position, rules);

        const move = moves.find(
          (m) => m.from === from && m.to === to
        );

        if (!move) {
          return prev;
        }

        const moveNotation = moveToAlgebraic(prev.position, move);
        const newPosition = applyMove(prev.position, move, rules);
        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        newHistory.push(encode(newPosition));

        return {
          ...prev,
          position: newPosition,
          history: newHistory,
          historyIndex: prev.historyIndex + 1,
          moveLog: [...prev.moveLog, moveNotation],
          selectedSquare: null,
          targetSquares: [],
        };
      });
    }, []),

    undo: useCallback(() => {
      setState((prev) => {
        if (prev.historyIndex <= 0 || prev.aiThinking || prev.gameOver) {
          return prev;
        }

        // In 1-player mode, undo 2 moves (player + AI) to return to player's turn
        const stepsBack = prev.gameMode === '1player' ? Math.min(2, prev.historyIndex) : 1;
        const newIndex = prev.historyIndex - stepsBack;

        return {
          ...prev,
          position: decode(prev.history[newIndex], prev.position.variant),
          historyIndex: newIndex,
          selectedSquare: null,
          targetSquares: [],
          moveLog: prev.moveLog.slice(0, prev.moveLog.length - stepsBack),
        };
      });
    }, []),

    redo: useCallback(() => {
      setState((prev) => {
        if (prev.historyIndex >= prev.history.length - 1 || prev.aiThinking || prev.gameOver) {
          return prev;
        }

        // In 1-player mode, redo 2 moves (player + AI) to maintain turn consistency
        const stepsForward = prev.gameMode === '1player'
          ? Math.min(2, prev.history.length - 1 - prev.historyIndex)
          : 1;
        const newIndex = prev.historyIndex + stepsForward;

        return {
          ...prev,
          position: decode(prev.history[newIndex], prev.position.variant),
          historyIndex: newIndex,
          selectedSquare: null,
          targetSquares: [],
        };
      });
    }, []),

    newGame: useCallback((mode: GameMode, gameMode: GameModeType, playerSide: Side | null) => {
      clearTT();
      const initialState = createInitialState(mode);

      setState({
        ...initialState,
        gameMode,
        playerSide,
        currentMode: mode,
      });
    }, []),

    restart: useCallback(() => {
      setState((prev) => {
        if (!prev.currentMode) return prev;

        clearTT();
        const initialState = createInitialState(prev.currentMode);

        return {
          ...initialState,
          gameMode: prev.gameMode,
          playerSide: prev.playerSide,
          currentMode: prev.currentMode,
        };
      });
    }, []),

    loadPosition: useCallback((positionCode: string) => {
      setState((prev) => {
        try {
          const trimmed = positionCode.trim();
          // Auto-detect variant from position code format
          // 1xN format: no slashes (e.g., "wk,x,x,bk:w")
          // NxM format: has slashes (e.g., "wk,wr/bk,br:b")
          const detectedVariant = trimmed.split(':')[0].includes('/') ? 'NxM' : '1xN';

          const newPosition = decode(trimmed, detectedVariant);
          clearTT();

          return {
            ...prev,
            position: newPosition,
            history: [encode(newPosition)],
            historyIndex: 0,
            selectedSquare: null,
            targetSquares: [],
            moveLog: [],
            gameOver: false,
            gameResult: '',
          };
        } catch (error) {
          console.error('Failed to load position:', error);
          alert(`Failed to load position: ${error instanceof Error ? error.message : 'Invalid format'}`);
          return prev;
        }
      });
    }, []),

    resign: useCallback(() => {
      setState((prev) => {
        if (prev.gameOver) return prev;

        let result = '';
        if (prev.gameMode === '1player') {
          result = 'You resigned - AI wins';
        } else {
          const resigner = prev.position.turn === 'w' ? 'White' : 'Black';
          const winner = prev.position.turn === 'w' ? 'Black' : 'White';
          result = `${resigner} resigned - ${winner} wins`;
        }

        return {
          ...prev,
          gameOver: true,
          gameResult: result,
        };
      });
    }, []),

    claimDraw: useCallback(() => {
      setState((prev) => ({
        ...prev,
        gameOver: true,
        gameResult: 'Draw by Repetition',
      }));
    }, []),

    setAIThinking: useCallback((thinking: boolean) => {
      setState((prev) => ({
        ...prev,
        aiThinking: thinking,
      }));
    }, []),

    startDrag: useCallback((square: number, screenX: number, screenY: number) => {
      setState((prev) => {
        if (prev.aiThinking || prev.gameOver) return prev;

        const piece = prev.position.board[square];
        const rules = getRulesFromMode(prev.currentMode);

        // Can only drag player's pieces
        if (piece === EMPTY || piece[0] !== prev.position.turn) {
          return prev;
        }

        // Calculate legal move targets for this piece
        const targets = legalMoves(prev.position, rules)
          .filter((m) => m.from === square)
          .map((m) => m.to);

        return {
          ...prev,
          draggedPiece: { square, screenX, screenY },
          selectedSquare: square,
          targetSquares: targets,
        };
      });
    }, []),

    updateDrag: useCallback((screenX: number, screenY: number) => {
      setState((prev) => {
        if (!prev.draggedPiece) return prev;

        return {
          ...prev,
          draggedPiece: {
            ...prev.draggedPiece,
            screenX,
            screenY,
          },
        };
      });
    }, []),

    endDrag: useCallback((targetSquare: number | null) => {
      setState((prev) => {
        if (!prev.draggedPiece) return prev;

        const fromSquare = prev.draggedPiece.square;

        // Clear drag state
        const newState = {
          ...prev,
          draggedPiece: null,
        };

        // If dropped on a legal target, make the move
        if (targetSquare !== null && prev.targetSquares.includes(targetSquare)) {
          const rules = getRulesFromMode(prev.currentMode);
          const move = legalMoves(prev.position, rules).find(
            (m) => m.from === fromSquare && m.to === targetSquare
          );

          if (move) {
            const moveNotation = moveToAlgebraic(prev.position, move);
            const newPosition = applyMove(prev.position, move, rules);
            const newHistory = prev.history.slice(0, prev.historyIndex + 1);
            newHistory.push(encode(newPosition));

            return {
              ...newState,
              position: newPosition,
              history: newHistory,
              historyIndex: prev.historyIndex + 1,
              selectedSquare: null,
              targetSquares: [],
              moveLog: [...prev.moveLog, moveNotation],
            };
          }
        }

        // Invalid drop - just clear selection and targets
        return {
          ...newState,
          selectedSquare: null,
          targetSquares: [],
        };
      });
    }, []),
  };

  return [state, actions];
}
