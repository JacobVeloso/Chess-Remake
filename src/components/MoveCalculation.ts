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
  // Clear all current moves and calculate piece moves from scratch
  piece.moves.forEach((move) => {
    move.attackers.delete(piece);
  });
  piece.moves.clear();
  let moves: Set<TileData>;
  switch (piece.type) {
    case "pawn":
      moves = pawnMoves(piece, board);
      break;
    case "knight":
      moves = knightMoves(piece, board);
      break;
    case "rook":
      moves = rookMoves(piece, board);
      break;
    case "bishop":
      moves = bishopMoves(piece, board);
      break;
    case "queen":
      moves = queenMoves(piece, board);
      break;
    case "king":
      moves = kingMoves(piece, board);
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Add moves to piece and board
  moves.forEach((move) => {
    piece.moves.add(move);
    board[move.rank * 8 + move.file].attackers.add(piece);
  });
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
      blockedMoves = pawnBlock(piece, board, blockedPos);
      break;
    case "knight":
      blockedMoves = new Set();
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
      blockedMoves = new Set();
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Remove blocked moves from piece and board
  blockedMoves.forEach((move) => {
    piece.moves.delete(move);
    board[move.rank * 8 + move.file].attackers.delete(piece);
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
      unblockedMoves = structuredClone(piece.moves);
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
      unblockedMoves = structuredClone(piece.moves);
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Add blocked moves to piece and board
  unblockedMoves.forEach((move) => {
    piece.moves.add(move);
    board[move.rank * 8 + move.file].attackers.add(piece);
  });
  return unblockedMoves;
}
