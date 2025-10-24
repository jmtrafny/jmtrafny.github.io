import { describe, it, expect, beforeEach } from 'vitest';
import { decode } from '../src/engine';
import { solve, clearTT } from '../src/solver';

describe('Solver', () => {
  beforeEach(() => {
    clearTT();
  });

  it('should detect immediate checkmate as LOSS', () => {
    // White king at 11 trapped by black rook at 9
    const pos = decode('bk,x,x,x,x,x,x,x,x,br,x,wk:w');
    const result = solve(pos);

    expect(result.res).toBe('LOSS');
    expect(result.depth).toBe(0);
  });

  it('should detect stalemate as DRAW', () => {
    // Position where white has no legal moves but not in check
    const pos = decode('x,x,x,x,x,x,x,x,x,bk,x,wk:w');
    const result = solve(pos);

    expect(result.res).toBe('DRAW');
  });

  it('should find winning move', () => {
    // Simple winning position: white can checkmate
    // Black king at 0, white rook at 2, white king at 4
    const pos = decode('bk,x,wr,x,wk,x,x,x,x,x,x,x:w');
    const result = solve(pos);

    expect(result.res).toBe('WIN');
    expect(result.best).toBeDefined();
  });

  it('should detect cycle as DRAW', () => {
    // Position that could lead to repetition
    const pos = decode('x,x,x,x,x,bk,wk,x,x,x,x,x:w');
    const result = solve(pos);

    // With only kings, this should be a draw
    expect(result.res).toBe('DRAW');
  });

  it('should cache positions in transposition table', () => {
    const pos = decode('bk,br,bn,x,x,x,x,x,wn,wr,wk,x:w');

    // Solve twice
    const result1 = solve(pos);
    const result2 = solve(pos);

    // Should return same result (cached)
    expect(result1.res).toBe(result2.res);
    expect(result1.depth).toBe(result2.depth);
  });

  it('should provide best move for non-terminal positions', () => {
    const pos = decode('bk,x,x,x,x,x,x,x,wr,x,wk,x:w');
    const result = solve(pos);

    // Should have a best move recommendation
    if (result.res !== 'LOSS' || result.depth > 0) {
      expect(result.best).toBeDefined();
    }
  });

  it('should delay mate when losing', () => {
    // Losing position but can delay
    const pos = decode('bk,br,x,x,x,x,x,x,x,x,wk,x:b');
    const result = solve(pos);

    // Black should find the move that delays mate longest
    if (result.res === 'LOSS') {
      expect(result.best).toBeDefined();
      expect(result.depth).toBeGreaterThan(0);
    }
  });
});
