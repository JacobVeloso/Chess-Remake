import { pawnMoves, pawnBlock, pawnUnblock } from "./PieceTypes/Pawn";
import { knightMoves } from "./PieceTypes/Knight";
import { rookMoves, rookBlock, rookUnblock } from "./PieceTypes/Rook";
import { bishopMoves, bishopBlock, bishopUnblock } from "./PieceTypes/Bishop";
import { queenMoves, queenBlock, queenUnblock } from "./PieceTypes/Queen";
import { kingMoves } from "./PieceTypes/King";
import type { PieceData, TileData, dimension } from "./types";

export function calculateMoves(
  piece: PieceData,
  board: TileData[],
  prevPos: [dimension, dimension]
): Set<TileData> {
  let moves: Set<TileData>;
  switch (piece.type) {
    case "pawn":
      moves = pawnMoves(piece, board);
      break;
    case "knight":
      moves = knightMoves(piece, board);
      break;
    case "rook":
      moves = rookMoves(piece, board, prevPos);
      break;
    case "bishop":
      moves = bishopMoves(piece, board, prevPos);
      break;
    case "queen":
      moves = queenMoves(piece, board, prevPos);
      break;
    case "king":
      moves = kingMoves(piece, board);
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Add moves to board
  moves.forEach((move) =>
    board[move.rank * 8 + move.file].attackers.add(piece)
  );
  return moves;
}

export function blockMoves(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  let blockedMoves: Set<TileData>;
  switch (piece.type) {
    case "pawn":
      blockedMoves = pawnBlock(piece, blockedPos);
      break;
    case "knight":
      blockedMoves = new Set<TileData>();
      break;
    case "rook":
      blockedMoves = rookBlock(piece, blockedPos);
      break;
    case "bishop":
      blockedMoves = bishopBlock(piece, blockedPos);
      break;
    case "queen":
      blockedMoves = queenBlock(piece, blockedPos);
      break;
    case "king":
      blockedMoves = new Set<TileData>();
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Remove blocked moves from piece and board
  blockedMoves.forEach((move) =>
    board[move.rank * 8 + move.file].attackers.delete(piece)
  );
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
      unblockedMoves = new Set<TileData>();
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
      unblockedMoves = new Set<TileData>();
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Add blocked moves to piece and board
  unblockedMoves.forEach((move) =>
    board[move.rank * 8 + move.file].attackers.add(piece)
  );
  return unblockedMoves;
}
