import { pawnMoves, pawnBlock, pawnUnblock } from "./PieceTypes/Pawn";
import { knightMoves, knightBlock } from "./PieceTypes/Knight";
import { rookMoves, rookBlock, rookUnblock } from "./PieceTypes/Rook";
import { bishopMoves, bishopBlock, bishopUnblock } from "./PieceTypes/Bishop";
import { queenMoves, queenBlock, queenUnblock } from "./PieceTypes/Queen";
import { kingMoves, kingBlock } from "./PieceTypes/King";
import type { PieceData, TileData, dimension } from "./types";

export function calculateMoves(
  piece: PieceData,
  board: TileData[]
): Set<TileData> {
  switch (piece.type) {
    case "pawn":
      return pawnMoves(piece, board);
    case "knight":
      return knightMoves(piece, board);
    case "rook":
      return rookMoves(piece, board);
    case "bishop":
      return bishopMoves(piece, board);
    case "queen":
      return queenMoves(piece, board);
    case "king":
      return kingMoves(piece, board);
    default:
      throw new Error("unrecognised type");
  }
}

export function blockMoves(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  let blockedMoves: Set<TileData>;
  switch (piece.type) {
    case "pawn":
      blockedMoves = pawnBlock(piece, board, blockedPos);
      break;
    case "knight":
      blockedMoves = knightBlock(piece, board, blockedPos);
      break;
    case "rook":
      blockedMoves = rookBlock(piece, board, blockedPos);
      break;
    case "bishop":
      blockedMoves = bishopBlock(piece, board, blockedPos);
      break;
    case "queen":
      blockedMoves = queenBlock(piece, board, blockedPos);
      break;
    case "king":
      blockedMoves = kingBlock(piece, board, blockedPos);
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Remove blocked moves from piece and board
  blockedMoves.forEach((move) => {
    piece.moves.delete(move);
    move.attackers.delete(piece);
  });
  return blockedMoves;
}

export function unblockMoves(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  let unblockedMoves: Set<TileData>;
  switch (piece.type) {
    case "pawn":
      unblockedMoves = pawnUnblock(piece, board, blockedPos);
      break;
    case "knight":
      unblockedMoves = piece.moves;
      break;
    case "rook":
      unblockedMoves = rookUnblock(piece, board, blockedPos);
      break;
    case "bishop":
      unblockedMoves = bishopUnblock(piece, board, blockedPos);
      break;
    case "queen":
      unblockedMoves = queenUnblock(piece, board, blockedPos);
      break;
    case "king":
      unblockedMoves = piece.moves;
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Add blocked moves to piece and board
  unblockedMoves.forEach((move) => {
    piece.moves.add(move);
    move.attackers.add(piece);
  });
  return unblockedMoves;
}
