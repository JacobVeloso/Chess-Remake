import type { dimension, PieceData, TileData } from "../types.ts";

export function knightMoves(
  piece: PieceData,
  board: TileData[]
): Set<TileData> {
  piece.moves = new Set<TileData>();
  const [rank, file] = [piece.rank, piece.file];

  // // Check if check can be avoided via blocking
  // if (checkBlocks && checkBlocks.size === 0) return piece.moves;

  // // Check if knight is pinned to king
  // for (const tile of board) {
  //   if (tile.piece?.type === "king" && tile.piece?.color === color) {
  //     if (getPinBlocks(board, [tile.rank, tile.file], [rank, file]))
  //       return piece.moves;
  //     break;
  //   }
  // }

  const directions = [
    [rank - 2, file + 1],
    [rank - 1, file + 2],
    [rank + 1, file + 2],
    [rank + 2, file + 1],
    [rank + 2, file - 1],
    [rank + 1, file - 2],
    [rank - 1, file - 2],
    [rank - 2, file - 1],
  ];

  for (const direction of directions) {
    const [i, j] = direction;
    if (i >= 0 && i < 8 && j >= 0 && j < 8) piece.moves.add(board[i * 8 + j]);
  }

  // // Restrict moves if king is in check
  // if (checkBlocks) filterMoves(piece.moves, checkBlocks);

  return piece.moves;
}

export function knightBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  const attacker = board[blockedPos[0] * 8 + blockedPos[1]].piece!;
  if (attacker.color === piece.color) {
    for (const move of piece.moves) {
      if (move.rank === blockedPos[0] && move.file === blockedPos[1]) {
        piece.moves.delete(move);
        return new Set<TileData>([move]);
      }
    }
  }
  return new Set();
}
