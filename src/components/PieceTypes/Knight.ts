import type { PieceData, TileData } from "../types.ts";

export function knightMoves(
  piece: PieceData,
  board: TileData[]
): Set<TileData> {
  piece.moves.get("all")?.forEach((move) => {
    move.attackers.delete(piece);
  });
  piece.moves.get("all")?.clear();
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
    if (i >= 0 && i < 8 && j >= 0 && j < 8) {
      piece.moves.get("all")?.add(board[i * 8 + j]);
      moves.add(board[i * 8 + j]);
    }
  }

  return moves;
}
