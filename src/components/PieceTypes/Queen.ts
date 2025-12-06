import type { dimension, PieceData, TileData } from "../types.ts";
import { bishopMoves, bishopBlock, bishopUnblock } from "./Bishop.ts";
import { rookMoves, rookBlock, rookUnblock } from "./Rook.ts";

export function queenMoves(
  piece: PieceData,
  board: TileData[],
  checkBlocks: Set<TileData> | null
): Set<TileData> {
  piece.moves = new Set<TileData>([
    ...bishopMoves(piece, board, checkBlocks),
    ...rookMoves(piece, board, checkBlocks),
  ]);
  return piece.moves;
}

export function queenBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  // straight
  if (rank === blockedPos[0] || file === blockedPos[1])
    return rookBlock(piece, board, blockedPos);
  // diagonal
  else if (Math.abs(blockedPos[0] - rank) === Math.abs(blockedPos[1] - file))
    return bishopBlock(piece, board, blockedPos);

  // TODO error
  return new Set<TileData>();
}

export function queenUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedPos: [dimension, dimension]
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  // straight
  if (rank === unblockedPos[0] || file === unblockedPos[1])
    return rookUnblock(piece, board, unblockedPos);
  // diagonal
  else if (
    Math.abs(unblockedPos[0] - rank) === Math.abs(unblockedPos[1] - file)
  )
    return bishopUnblock(piece, board, unblockedPos);

  // TODO error
  return new Set<TileData>();
}
