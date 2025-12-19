import type { dimension, PieceData, TileData } from "../types.ts";

export function knightMoves(
  piece: PieceData,
  board: TileData[]
): Set<TileData> {
  const moves = new Set<TileData>();
  const [rank, file] = [piece.rank, piece.file];

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
    if (i >= 0 && i < 8 && j >= 0 && j < 8) moves.add(board[i * 8 + j]);
  }

  return moves;
}

export function knightBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  // const attacker = board[blockedPos[0] * 8 + blockedPos[1]].piece!;
  // if (attacker.color === piece.color) {
  //   for (const move of piece.moves) {
  //     if (move.rank === blockedPos[0] && move.file === blockedPos[1]) {
  //       piece.moves.delete(move);
  //       return new Set<TileData>([move]);
  //     }
  //   }
  // }
  void piece;
  void board;
  void blockedPos;
  return new Set();
}
