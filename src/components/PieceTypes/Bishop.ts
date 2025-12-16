import type { dimension, PieceData, TileData } from "../types.ts";

function addMoves(
  board: TileData[],
  piece: PieceData,
  [i, j]: [dimension, dimension],
  [iDir, jDir]: [1 | -1, 1 | -1]
): void {
  while (i >= 0 && i < 8 && j >= 0 && j < 8) {
    const index = i * 8 + j;
    piece.moves.add(board[index]);
    // // Piece blocking
    // if (board[index].piece) {
    //   break;
    // }
    i += iDir;
    j += jDir;
  }
}

export function bishopMoves(
  piece: PieceData,
  board: TileData[]
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  piece.moves = new Set<TileData>();

  // Upper right diagonal
  addMoves(
    board,
    piece,
    [(rank - 1) as dimension, (file + 1) as dimension],
    [-1, 1]
  );

  // Lower right diagonal
  addMoves(
    board,
    piece,
    [(rank + 1) as dimension, (file + 1) as dimension],
    [1, 1]
  );

  // Lower left diagonal
  addMoves(
    board,
    piece,
    [(rank + 1) as dimension, (file - 1) as dimension],
    [1, -1]
  );

  // Upper left diagonal
  addMoves(
    board,
    piece,
    [(rank - 1) as dimension, (file - 1) as dimension],
    [-1, -1]
  );

  // // Filter out moves that put king in check
  // if (pinBlocks) filterMoves(piece.moves, pinBlocks);

  // // Filter out moves that don't block check
  // if (checkBlocks) filterMoves(piece.moves, checkBlocks);

  return piece.moves;
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
  let i = unblockedRank;
  let j = unblockedFile;
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
