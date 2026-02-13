import type { PieceData, TileData } from "../types.ts";
import { deleteMoves } from "../Piece.tsx";

/**
 * Calculates all knight moves and stores them in piece's moveset. Move types:
 * - "all": all possible knight moves (up to eight)
 * @param piece PieecData object
 * @param board Array of 64 TileData objects representing board
 * @returns Set of all possible moves
 */
export function knightMoves(
  piece: PieceData,
  board: TileData[],
): Set<TileData> {
  // Ensure move type exists and clear all moves
  if (piece.moves.has("all")) deleteMoves(piece, "all");
  else piece.moves.set("all", new Set<TileData>());

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

  // Add all moves that exist on board
  for (const direction of directions) {
    const [i, j] = direction;
    if (i >= 0 && i < 8 && j >= 0 && j < 8) {
      piece.moves.get("all")?.add(board[i * 8 + j]);
      moves.add(board[i * 8 + j]);
    }
  }

  return moves;
}
