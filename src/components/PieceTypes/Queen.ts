import type { dimension, PieceData, TileData } from "../types.ts";
import { bishopMoves, bishopBlock } from "./Bishop.ts";
import { rookMoves, rookBlock } from "./Rook.ts";

export function queenMoves(piece: PieceData, board: TileData[]): Set<TileData> {
  piece.moves = new Set<TileData>([
    ...bishopMoves(piece, board),
    ...rookMoves(piece, board),
  ]);
  return piece.moves;
}

export function queenBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  const [blockedRank, blockedFile] = blockedPos;
  // straight
  if (piece.rank === blockedRank || piece.file === blockedFile)
    return rookBlock(piece, board, blockedPos);
  // diagonal
  else if (
    Math.abs(blockedRank - piece.rank) === Math.abs(blockedFile - piece.file)
  )
    return bishopBlock(piece, board, blockedPos);

  // TODO error
  return new Set<TileData>();
}

export function queenUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedPos: [dimension, dimension]
): Set<TileData> {
  const [unblockedRank, unblockedFile] = unblockedPos;
  // straight
  if (piece.rank === unblockedRank || piece.file === unblockedFile)
    return rookBlock(piece, board, unblockedPos);
  // diagonal
  else if (
    Math.abs(unblockedRank - piece.rank) ===
    Math.abs(unblockedFile - piece.file)
  )
    return bishopBlock(piece, board, unblockedPos);

  // TODO error
  return new Set<TileData>();
}
