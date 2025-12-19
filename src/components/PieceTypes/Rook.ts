import type { dimension, PieceData, TileData } from "../types.ts";

export function rookMoves(piece: PieceData, board: TileData[]): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  // const color = piece.color;
  const moves = new Set<TileData>();

  // Up
  if (rank > 0) {
    let i = rank - 1;
    let j = file;
    do {
      const index = i * 8 + j;
      moves.add(board[index]);
      --i;
    } while (i >= 0 && !board[(i - 1) * 8 + j].piece);
  }

  // Right
  if (file < 7) {
    let i = rank;
    let j = file + 1;
    do {
      const index = i * 8 + j;
      moves.add(board[index]);
      ++j;
    } while (j < 8 && !board[i * 8 + (j - 1)].piece);
  }

  // Down
  if (rank < 7) {
    let i = rank + 1;
    let j = file;
    do {
      const index = i * 8 + j;
      moves.add(board[index]);
      ++i;
    } while (i < 8 && !board[(i - 1) * 8 + j].piece);
  }

  // Left
  if (file > 0) {
    let i = rank;
    let j = file - 1;
    do {
      const index = i * 8 + j;
      moves.add(board[index]);
      --j;
    } while (j >= 0 && !board[i * 8 + (j + 1)].piece);
  }

  return moves;
}

export function rookBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  void board;
  const [blockedRank, blockedFile] = blockedPos;
  const direction =
    piece.rank > blockedRank
      ? -1
      : piece.rank < blockedRank
      ? 1
      : piece.file > blockedFile
      ? -1
      : 1;

  const blockedMoves = new Set<TileData>();
  // Remove moves now blocked
  for (const move of piece.moves) {
    if (
      (piece.rank === blockedRank &&
        move.file * direction > blockedFile * direction) ||
      (piece.file === blockedFile &&
        move.rank * direction > blockedRank * direction)
    ) {
      blockedMoves.add(move);
    }
  }
  return blockedMoves;
}

export function rookUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedPos: [dimension, dimension]
): Set<TileData> {
  const [unblockedRank, unblockedFile] = unblockedPos;
  const direction =
    piece.rank > unblockedRank
      ? -1
      : piece.rank < unblockedRank
      ? 1
      : piece.file > unblockedFile
      ? -1
      : 1;

  const unblockedMoves = new Set<TileData>();

  // Insert moves now possible
  if (piece.rank === unblockedRank) {
    for (
      let i = unblockedFile + direction;
      i >= 0 && i < 8 && !board[piece.rank * 8 + (i - direction)].piece;
      i += direction
    ) {
      unblockedMoves.add(board[piece.rank * 8 + i]);
    }
  } else {
    for (
      let i = unblockedRank + direction;
      i >= 0 && i < 8 && !board[(i - direction) * 8 + piece.file];
      i += direction
    ) {
      unblockedMoves.add(board[i * 8 + piece.file]);
    }
  }

  return unblockedMoves;
}
