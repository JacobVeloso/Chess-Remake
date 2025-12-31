import type { dimension, PieceData, TileData } from "../types.ts";
import { bishopMoves, bishopBlock } from "./Bishop.ts";
import { rookMoves, rookBlock } from "./Rook.ts";

export function queenMoves(
  piece: PieceData,
  board: TileData[],
  prevPos: [dimension, dimension]
): Set<TileData> {
  return new Set<TileData>([
    ...bishopMoves(piece, board, prevPos),
    ...rookMoves(piece, board, prevPos),
  ]);
}

export function queenBlock(
  piece: PieceData,
  blockedPos: [dimension, dimension]
): Set<TileData> {
  const [blockedRank, blockedFile] = blockedPos;
  // straight
  if (piece.rank === blockedRank || piece.file === blockedFile)
    return rookBlock(piece, blockedPos);
  // diagonal
  else if (
    Math.abs(blockedRank - piece.rank) === Math.abs(blockedFile - piece.file)
  )
    return bishopBlock(piece, blockedPos);

  // TODO error
  return new Set<TileData>();
}

export function queenUnblock(
  piece: PieceData,
  unblockedPos: [dimension, dimension]
): Set<TileData> {
  const [unblockedRank, unblockedFile] = unblockedPos;
  // straight
  if (piece.rank === unblockedRank || piece.file === unblockedFile)
    return rookBlock(piece, unblockedPos);
  // diagonal
  else if (
    Math.abs(unblockedRank - piece.rank) ===
    Math.abs(unblockedFile - piece.file)
  )
    return bishopBlock(piece, unblockedPos);

  // TODO error
  return new Set<TileData>();
}
