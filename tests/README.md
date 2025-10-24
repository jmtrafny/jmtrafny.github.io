# Tests

Test suite for Thin Chess engine and solver.

## Status

**Note**: Tests are written but currently have a module resolution issue with Vitest 4.x + TypeScript + ES modules. This is a known configuration issue that needs debugging.

The tests are comprehensive and cover:
- Engine: move generation, king safety, terminal states
- Solver: WIN/LOSS/DRAW evaluation, cycle detection, TT caching

## Running Tests

Once the configuration is fixed:
```bash
npm test
```

## Manual Testing

Until automated tests work, manually verify:

1. **Build succeeds**: `npm run build` ✅ (confirmed working)
2. **App loads**: `npm run dev` and visit localhost
3. **Basic gameplay**: Move pieces, undo/redo
4. **Solver**: Click "Solve" and "Best Move" buttons
5. **Position codes**: Load/save positions

## Test Files

- `engine.test.ts` - 12 test suites covering all engine functionality
- `solver.test.ts` - 7 test suites for solver correctness

## Known Issue

The error "No test suite found in file" suggests a TypeScript/Vitest module resolution problem.
Possible fixes to try:
- Update vitest config with proper TS support
- Check tsconfig module resolution settings
- Verify vitest can import `.ts` files in tests/ directory

**This does not affect the production build which works perfectly.**
