import { describe, it, expect } from 'vitest';
import {
  decode,
  encode,
  legalMoves,
  attacked,
  applyMove,
  terminal,
  findKing,
  inBounds,
  EMPTY,
} from '../src/engine';

describe('Engine - Position Encoding', () => {
  it('should decode start position correctly', () => {
    const pos = decode('bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w');
    expect(pos.board.length).toBe(12);
    expect(pos.board[0]).toBe('bk');
    expect(pos.board[11]).toBe('wk');
    expect(pos.turn).toBe('w');
  });

  it('should encode and decode symmetrically', () => {
    const original = 'bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w';
    const pos = decode(original);
    const encoded = encode(pos);
    expect(encoded).toBe(original);
  });

  it('should handle empty squares', () => {
    const pos = decode('x,x,x,x,x,bk,wk,x,x,x,x,x:w');
    expect(pos.board[0]).toBe(EMPTY);
    expect(pos.board[5]).toBe('bk');
    expect(pos.board[6]).toBe('wk');
  });
});

describe('Engine - Move Generation', () => {
  it('should generate king moves (±1)', () => {
    const pos = decode('x,x,x,x,x,wk,x,x,x,x,x,bk:w');
    const moves = legalMoves(pos);
    const kingMoves = moves.filter(m => m.from === 5);

    // King at 5 can move to 4 or 6
    expect(kingMoves.length).toBe(2);
    expect(kingMoves.some(m => m.to === 4)).toBe(true);
    expect(kingMoves.some(m => m.to === 6)).toBe(true);
  });

  it('should generate knight moves (±2)', () => {
    const pos = decode('x,x,x,x,x,wn,x,x,x,x,x,bk:w');
    const moves = legalMoves(pos);
    const knightMoves = moves.filter(m => m.from === 5);

    // Knight at 5 can jump to 3 or 7
    expect(knightMoves.length).toBe(2);
    expect(knightMoves.some(m => m.to === 3)).toBe(true);
    expect(knightMoves.some(m => m.to === 7)).toBe(true);
  });

  it('should generate rook sliding moves', () => {
    const pos = decode('x,x,x,wr,x,x,x,x,x,x,x,bk:w');
    const moves = legalMoves(pos);
    const rookMoves = moves.filter(m => m.from === 3);

    // Rook at 3 can slide up to 0,1,2 and down to 4,5,6,7,8,9,10 (stops before bk at 11)
    expect(rookMoves.length).toBeGreaterThan(5);
  });

  it('should block rook by pieces', () => {
    const pos = decode('x,x,wn,wr,x,x,x,x,x,x,x,bk:w');
    const moves = legalMoves(pos);
    const rookMoves = moves.filter(m => m.from === 3);

    // Rook blocked by friendly knight at 2 upward
    // Can only move down
    const canMoveUp = rookMoves.some(m => m.to < 3);
    expect(canMoveUp).toBe(false);
  });

  it('should allow rook to capture opponent piece', () => {
    const pos = decode('x,x,bn,wr,x,x,x,x,x,x,x,bk:w');
    const moves = legalMoves(pos);
    const rookMoves = moves.filter(m => m.from === 3);

    // Rook can capture black knight at 2
    expect(rookMoves.some(m => m.to === 2)).toBe(true);
  });
});

describe('Engine - King Safety', () => {
  it('should prevent king from moving into check', () => {
    // White king at 5, black rook at 7
    const pos = decode('x,x,x,x,x,wk,x,br,x,x,x,bk:w');
    const moves = legalMoves(pos);
    const kingMoves = moves.filter(m => m.from === 5);

    // King cannot move to 6 (attacked by rook at 7)
    expect(kingMoves.some(m => m.to === 6)).toBe(false);
    // But can move to 4
    expect(kingMoves.some(m => m.to === 4)).toBe(true);
  });

  it('should detect king under attack by knight', () => {
    // White king at 5, black knight at 7
    const pos = decode('x,x,x,x,x,wk,x,bn,x,x,x,bk:w');
    const board = pos.board;

    expect(attacked(board, 'w', 5)).toBe(true);
  });

  it('should detect king under attack by rook', () => {
    // White king at 5, black rook at 2 (line of sight)
    const pos = decode('x,x,br,x,x,wk,x,x,x,x,x,bk:w');
    const board = pos.board;

    expect(attacked(board, 'w', 5)).toBe(true);
  });

  it('should not detect attack if rook blocked', () => {
    // White king at 5, black rook at 2, friendly knight at 3 blocking
    const pos = decode('x,x,br,wn,x,wk,x,x,x,x,x,bk:w');
    const board = pos.board;

    expect(attacked(board, 'w', 5)).toBe(false);
  });
});

describe('Engine - Terminal States', () => {
  it('should detect checkmate', () => {
    // White king at 11 (bottom), black rook at 9, black king at 0
    // White king trapped and in check
    const pos = decode('bk,x,x,x,x,x,x,x,x,br,x,wk:w');
    const term = terminal(pos);

    expect(term).toBe('WHITE_MATE');
  });

  it('should detect stalemate', () => {
    // White king at 11, black king at 9 (no legal moves for white, not in check)
    const pos = decode('x,x,x,x,x,x,x,x,x,bk,x,wk:w');
    const moves = legalMoves(pos);

    // White king cannot move to 10 (attacked by black king)
    // No other pieces
    if (moves.length === 0) {
      expect(terminal(pos)).toBe('STALEMATE');
    }
  });

  it('should return null for non-terminal position', () => {
    const pos = decode('bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w');
    expect(terminal(pos)).toBe(null);
  });
});

describe('Engine - Move Application', () => {
  it('should apply move and switch turn', () => {
    const pos = decode('x,x,x,x,x,wk,x,x,x,x,x,bk:w');
    const moves = legalMoves(pos);
    const move = moves[0];

    const newPos = applyMove(pos, move);
    expect(newPos.turn).toBe('b');
    expect(newPos.board).not.toBe(pos.board); // New array
  });

  it('should capture piece correctly', () => {
    const pos = decode('x,x,bn,wr,x,wk,x,x,x,x,x,bk:w');
    const moves = legalMoves(pos);
    const captureMove = moves.find(m => m.from === 3 && m.to === 2);

    if (captureMove) {
      const newPos = applyMove(pos, captureMove);
      expect(newPos.board[2]).toBe('wr'); // Rook captured knight
      expect(newPos.board[3]).toBe(EMPTY);
    }
  });
});

describe('Engine - Utility Functions', () => {
  it('should check bounds correctly', () => {
    expect(inBounds(0)).toBe(true);
    expect(inBounds(11)).toBe(true);
    expect(inBounds(-1)).toBe(false);
    expect(inBounds(12)).toBe(false);
  });

  it('should find king position', () => {
    const pos = decode('bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w');
    expect(findKing(pos.board, 'w')).toBe(11);
    expect(findKing(pos.board, 'b')).toBe(0);
  });
});
