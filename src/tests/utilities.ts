import pieces from "../assets/index";

import type {
  PieceData,
  TileData,
  type,
  color,
  dimension,
} from "../components/types.ts";
import {
  pawnMoves,
  pawnBlock,
  pawnUnblock,
} from "../components/PieceTypes/Pawn.ts";
import {
  rookMoves,
  rookBlock,
  rookUnblock,
} from "../components/PieceTypes/Rook.ts";
import {
  knightMoves,
  knightBlock,
  knightUnblock,
} from "../components/PieceTypes/Knight.ts";
import {
  bishopMoves,
  bishopBlock,
  bishopUnblock,
} from "../components/PieceTypes/Bishop.ts";
import {
  queenMoves,
  queenBlock,
  queenUnblock,
} from "../components/PieceTypes/Queen.ts";
import {
  kingMoves,
  kingBlock,
  kingUnblock,
} from "../components/PieceTypes/King.ts";

export const board: TileData[] = new Array(64);
export var ID = 0;

export function makePiece(
  type: type,
  color: color,
  rank: dimension,
  file: dimension
): PieceData {
  const params = new Map();
  switch (type) {
    case "pawn":
      params.set("movedTwo", false);
      return {
        id: "" + ID++,
        color,
        type: "pawn",
        src: color === "white" ? pieces.whitePawn : pieces.blackPawn,
        rank,
        file,
        moves: new Set(),
        calcMoves: pawnMoves,
        block: pawnBlock,
        unblock: pawnUnblock,
        params,
      };
    case "rook":
      params.set("hasMoved", false);
      return {
        id: "" + ID++,
        color: color,
        type: "rook",
        src: color === "white" ? pieces.whiteRook : pieces.blackRook,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: rookMoves,
        block: rookBlock,
        unblock: rookUnblock,
        params,
      };
    case "knight":
      return {
        id: "" + ID++,
        color: color,
        type: "knight",
        src: color === "white" ? pieces.whiteKnight : pieces.blackKnight,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: knightMoves,
        block: knightBlock,
        unblock: knightUnblock,
        params,
      };
    case "bishop":
      return {
        id: "" + ID++,
        color: color,
        type: "bishop",
        src: color === "white" ? pieces.whiteBishop : pieces.blackBishop,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: bishopMoves,
        block: bishopBlock,
        unblock: bishopUnblock,
        params,
      };
    case "king":
      params.set("hasMoved", false);
      return {
        id: "" + ID++,
        color: color,
        type: "king",
        src: color === "white" ? pieces.whiteKing : pieces.blackKing,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: kingMoves,
        block: kingBlock,
        unblock: kingUnblock,
        params,
      };
    default: // queen
      return {
        id: "" + ID++,
        color: color,
        type: "queen",
        src: color === "white" ? pieces.whiteQueen : pieces.blackQueen,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: queenMoves,
        block: queenBlock,
        unblock: queenUnblock,
        params,
      };
  }
}

export function placePiece(
  type: type,
  color: color,
  rank: dimension,
  file: dimension
): boolean {
  const piece = makePiece(type, color, rank, file);
  const tile = getTile(rank, file);
  if (tile.piece) return false;
  tile.piece = piece;
  return true;
}

export function getTile(rank: dimension, file: dimension): TileData {
  return board[rank * 8 + file];
}

export function setsEqual<T>(A: Set<T>, B: Set<T>): boolean {
  if (A.size !== B.size) return false;
  for (const val of A) {
    if (!B.has(val)) return false;
  }
  return true;
}
