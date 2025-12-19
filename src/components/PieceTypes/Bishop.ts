import type { dimension, PieceData, TileData } from "../types.ts";

function addMoves(
  board: TileData[],
  moves: Set<TileData>,
  [i, j]: [dimension, dimension],
  [iDir, jDir]: [1 | -1, 1 | -1]
): void {
  while (
    i >= 0 &&
    i < 8 &&
    j >= 0 &&
    j < 8 &&
    !board[(i - 1) * 8 + (j - 1)].piece
  ) {
    const index = i * 8 + j;
    moves.add(board[index]);
    i += iDir;
    j += jDir;
  }
}

export function bishopMoves(
  piece: PieceData,
  board: TileData[]
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  // Upper right diagonal
  if (rank > 0 && file < 7)
    addMoves(
      board,
      moves,
      [(rank - 1) as dimension, (file + 1) as dimension],
      [-1, 1]
    );

  // Lower right diagonal
  if (rank < 7 && file < 7)
    addMoves(
      board,
      moves,
      [(rank + 1) as dimension, (file + 1) as dimension],
      [1, 1]
    );

  // Lower left diagonal
  if (rank < 7 && file > 0)
    addMoves(
      board,
      moves,
      [(rank + 1) as dimension, (file - 1) as dimension],
      [1, -1]
    );

  // Upper left diagonal
  if (rank > 0 && file > 0)
    addMoves(
      board,
      moves,
      [(rank - 1) as dimension, (file - 1) as dimension],
      [-1, -1]
    );

  return moves;
}

export function bishopBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  void board;
  const [blockedRank, blockedFile] = blockedPos;
  const rankDirection = blockedRank > piece.rank ? 1 : -1;
  const fileDirection = blockedFile > piece.file ? 1 : -1;

  const blockedMoves = new Set<TileData>();
  // Remove moves now blocked
  for (const move of piece.moves) {
    if (
      move.rank * rankDirection > blockedRank * rankDirection &&
      move.file * fileDirection > blockedFile * fileDirection
    )
      blockedMoves.add(move);
  }
  return blockedMoves;
}

export function bishopUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedPos: [dimension, dimension]
): Set<TileData> {
  const [ownRank, ownFile] = [piece.rank, piece.file];
  const [unblockedRank, unblockedFile] = unblockedPos;
  const rankDirection = unblockedRank > ownRank ? 1 : -1;
  const fileDirection = unblockedFile > ownFile ? 1 : -1;

  const unblockedMoves = new Set<TileData>();

  // Insert moves now possible
  let i = unblockedRank + rankDirection;
  let j = unblockedFile + fileDirection;
  while (
    i >= 0 &&
    i < 8 &&
    j >= 0 &&
    j < 8 &&
    !board[(i - rankDirection) * 8 + (j - fileDirection)].piece
  ) {
    unblockedMoves.add(board[i * 8 + j]);
    i += rankDirection;
    j += fileDirection;
  }
  return unblockedMoves;
}
