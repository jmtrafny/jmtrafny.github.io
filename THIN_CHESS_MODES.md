# Thin Chess - Challenge Modes

This document describes the 5 curated challenge modes for Thin Chess (2×10 board variant).

---

## Mode 1: Top-Rank Guillotine

**Difficulty:** ⭐ Beginner
**Type:** Puzzle - Forced Win for White
**Goal:** Checkmate in 2-3 moves

### Starting Position
```
x,bk/x,x/x,x/x,x/x,x/x,x/wk,x/wr,x/x,x/x,x:w
```

Visual:
```
10: x  bk   (empty, black king)
 9: x  x
 8: x  x
 7: x  x
 6: x  x
 5: x  x
 4: x  x
 3: wk x    (white king, empty)
 2: wr x    (white rook, empty)
 1: x  x
    a  b
```

### Challenge
White has a rook and king versus a lone black king trapped near the top of the board. Deliver checkmate in 2–3 moves using the classic rook+king checkmating technique.

### Solution
1. **Kb2** – King steps up to support the rook. Black is forced to b9 or stays at b10.
2. **Rb3+** – Rook check drives king to the back rank.
   - If 1…Kb9 then 2.Kb3 Ka10 3.Ra3#
   - If 1…Ka10 then 2.Ra3#
3. **Checkmate** – King and rook trap the black king.

**Key Concepts:** Rook ladder, king support, edge checkmate

### Learning Objectives
- Master the fundamental K+R vs K checkmating technique
- Use the rook to cut off files
- Practice basic king opposition in endgames

---

## Mode 2: Mirror Towers

**Difficulty:** ⭐⭐⭐ Advanced
**Type:** Competitive Game
**Goal:** Outplay your opponent from the standard opening

### Starting Position
```
x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w
```

Visual:
```
10: x  bk   (empty, black king)
 9: x  bb   (empty, black bishop)
 8: x  bn   (empty, black knight)
 7: x  br   (empty, black rook)
 6: x  x
 5: x  x
 4: wr x    (white rook, empty)
 3: wn x    (white knight, empty)
 2: wb x    (white bishop, empty)
 1: wk x    (white king, empty)
    a  b
```

### Challenge
The standard Thin Chess opening position with all pieces vertically aligned on opposite files. This is a competitive game where you'll learn fundamental opening principles and piece development.

### White's Plan
- Advance the rook early to control central ranks (5–6 range)
- Use knight to attack black's pieces from unexpected angles
- Create threats that black's random moves may not address
- Look for forks between king and other pieces

### Black's Plan
- Develop pieces quickly to active squares
- Keep king safe from knight forks
- Use bishop to control diagonal escape routes
- Counter-attack when white overextends

### Key Positions
- Rook on 5th rank often dominates the center
- Knight on b-file can fork king+bishop
- Bishop controls one color complex entirely

### Learning Objectives
- Understand piece development in confined space
- Create and exploit tactical threats
- Practice planning 3–4 moves ahead
- Recognize fork patterns on a narrow board

---

## Mode 3: Pawn Corridors

**Difficulty:** ⭐⭐⭐ Intermediate
**Type:** Tactical Puzzle
**Goal:** Win by promoting your pawn first

### Starting Position
```
x,bk/x,bb/x,bn/x,br/x,x/x,bp/wp,x/wr,x/wn,x/wb,x/wk,x:w
```

Visual:
```
10: x  bk   (empty, black king)
 9: x  bb   (empty, black bishop)
 8: x  bn   (empty, black knight)
 7: x  br   (empty, black rook)
 6: x  x
 5: x  x
 4: x  bp   (empty, black pawn)
 3: wp x    (white pawn, empty)
 2: wr x    (white rook, empty)
 1: wn x    (white knight, empty)
    a  b   [note: positions shown might need verification]
```

**Note:** White pawn should be on a7, black pawn on b4 for the puzzle to work correctly:
```
x,bk/x,bb/x,bn/x,br/x,x/x,bp/wp,x/wr,x/wn,x/wb,x/wk,x:w
```

### Challenge
Both sides have one pawn racing toward promotion (white pawn on a7, black pawn on b4). This tactical puzzle tests your ability to calculate promotion races while defending with pieces.

### Solution
1. **a8=R or a8=Q** – Promote immediately. Black's pawn is only on b4 and needs several moves to promote.
2. **Use the new piece to support attack** – With extra material, coordinate rook/queen with existing pieces.
3. **Stop black's pawn if it advances** – Rook can shift to b-file (e.g., Ra8–Rb8 or Ra4–Rb4) after you secure promotion.

**Key Concepts:** Pawn promotion, tempo calculation, piece coordination

### Learning Objectives
- Calculate promotion races accurately
- Understand tempo advantage
- Decide when to promote vs. when to defend

---

## Mode 4: Bishop Duel

**Difficulty:** ⭐⭐⭐⭐ Advanced
**Type:** Competitive - Drawish
**Goal:** Break through fortress positions or hold a draw

### Starting Position
```
x,bk/x,bb/x,x/x,br/x,x/x,x/wr,x/x,x/wb,x/wk,x:w
```

Visual:
```
10: x  bk   (empty, black king)
 9: x  bb   (empty, black bishop)
 8: x  x
 7: x  br   (empty, black rook)
 6: x  x
 5: x  x
 4: x  x
 3: wr x    (white rook, empty)
 2: x  x
 1: x  wb   (empty, white bishop)
    a  b   [positions need verification]
```

### Challenge
A strategic endgame with K+R+B versus K+R+B and no knights. This position explores color-complex warfare where each bishop controls only one color, creating fortress and zugzwang possibilities.

### White's Breakthrough Plan
- Activate your rook to the 7th rank if possible
- Use bishop to control key squares your opponent's bishop cannot
- Create threats on squares matching your bishop's color
- Hunt for zugzwang positions that force concessions

### Black's Fortress Plan
- Establish a defensive fortress with bishop controlling critical squares
- Keep rook active; trade if white's rook invades
- Maintain king centralization
- Avoid self-blockades

### Key Positions
- Bishop blockades on promotion squares
- Rook on the 7th rank with bishop support = dangerous
- King+bishop battery controlling the key color complex

### Learning Objectives
- Manage color-complex strategy (opposite-color bishops)
- Build and break fortresses
- Recognize zugzwang patterns
- Practice patient maneuvering

---

## Mode 5: Flip-Fork

**Difficulty:** ⭐⭐⭐ Intermediate
**Type:** Tactical Puzzle
**Goal:** Win material via knight fork

### Starting Position
```
x,bk/x,bb/x,x/x,br/x,x/x,x/wr,x/x,x/wb,x/wk,wn:w
```

Visual:
```
10: x  bk   (empty, black king)
 9: x  bb   (empty, black bishop)
 8: x  x
 7: x  br   (empty, black rook)
 6: x  x
 5: x  x
 4: x  x
 3: wr x    (white rook, empty)
 2: x  x
 1: x  wb   (empty, white bishop)
    a  b

White knight at b1 [needs verification]
```

### Challenge
White has an unusual knight position at b1. Your goal is to exploit this knight's mobility to win material through a tactical fork sequence within 3–4 moves.

### Solution
1. **Na3** – Knight jumps to a3, eyeing Nb5.
   - If …Kb9 (or any waiting move)
2. **Nb5** – Fork! Knight attacks both king on b10 and bishop on b9.
3. **…Ka8/Ka10** – King must move.
4. **N×(target)** – Capture the bishop (or rook) and convert the material edge.

**Alternative:** 1.Nd2 aiming for Nc4–Ne5 fork motifs.

**Key Concepts:** Knight forks, forcing moves, double attacks

### Learning Objectives
- Spot and execute knight-fork tactics
- Calculate forcing sequences
- Understand knight mobility on a narrow board

---

## General Tips for Thin Chess

### Piece Coordination
With only 2 files, pieces must work together efficiently. A single misplaced piece can block your entire army.

### Color Complexity
Each side has only ONE bishop, controlling only ONE color (light or dark squares). This creates unique strategic imbalances not present in standard chess.

### Tactical Awareness
The narrow board creates more forks, pins, and skewers than standard chess. Always check for double attacks!

### Endgame Technique
Many positions that would be drawn in standard chess (K+R+B vs K+R+B) can be won or lost in Thin Chess due to the limited escape squares.

---

## Position Format

All positions use the notation:
```
file_a,file_b/file_a,file_b/.../file_a,file_b:side_to_move
```

- `/` separates ranks (from rank 10 down to rank 1)
- `,` separates the two files (a and b)
- `x` = empty square
- Pieces: `wk`, `wr`, `wn`, `wb`, `wp` (white), `bk`, `br`, `bn`, `bb`, `bp` (black)
- `:w` or `:b` = which side moves next

---

## Play These Modes

All 5 modes are available in the game:
1. Click "Thin Chess Challenges" from the main menu
2. Click any mode card to start playing
3. Click the "?" button on any mode for progressive hints and full solutions

Happy puzzling! ♟️
