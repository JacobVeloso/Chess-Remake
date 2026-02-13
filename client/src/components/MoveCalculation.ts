import { pawnMoves, pawnBlock, pawnUnblock } from "./PieceTypes/Pawn";
import { knightMoves } from "./PieceTypes/Knight";
import { rookMoves, rookBlock, rookUnblock } from "./PieceTypes/Rook";
import { bishopMoves, bishopBlock, bishopUnblock } from "./PieceTypes/Bishop";
import { queenMoves, queenBlock, queenUnblock } from "./PieceTypes/Queen";
import { kingMoves } from "./PieceTypes/King";
import type { PieceData, TileData, dimension, Move } from "./types";

/**
 * Calculates all possible moves for a piece, adds the moves to the piece's moveset and the stores moves in the board.
 * @param piece PieceData object
 * @param board Array of 64 TileData objects representing board
 * @param lastMove Piece's previous position, if applicable
 * @returns Set of all possible moves
 */
export function calculateMoves(
  piece: PieceData,
  board: TileData[],
  lastMove: Move | null = null,
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
      moves = rookMoves(piece, board, lastMove);
      break;
    case "bishop":
      moves = bishopMoves(piece, board, lastMove);
      break;
    case "queen":
      moves = queenMoves(piece, board, lastMove);
      break;
    case "king":
      moves = kingMoves(piece, board);
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Add moves to board
  moves.forEach((move) =>
    board[move.rank * 8 + move.file].attackers.add(piece),
  );
  return moves;
}

/**
 * Calculates all moves no longer possible for a piece due to another piece blocking. Removes these moves from the piece's moveset and removes the piece's attacks on those tiles.
 * @param piece PieceData object getting blocked
 * @param board Array of 64 TileData objects representing board
 * @param blockedRank rank of blocked tile
 * @param blockedFile file of blocked tile
 * @returns Set of moves no longer possible
 */
export function blockMoves(
  piece: PieceData,
  board: TileData[],
  blockedRank: dimension,
  blockedFile: dimension,
): Set<TileData> {
  let blockedMoves: Set<TileData>;
  switch (piece.type) {
    case "pawn":
      blockedMoves = pawnBlock(piece, blockedRank, blockedFile);
      break;
    case "knight":
      blockedMoves = new Set<TileData>();
      break;
    case "rook":
      blockedMoves = rookBlock(piece, blockedRank, blockedFile);
      break;
    case "bishop":
      blockedMoves = bishopBlock(piece, blockedRank, blockedFile);
      break;
    case "queen":
      blockedMoves = queenBlock(piece, blockedRank, blockedFile);
      break;
    case "king":
      blockedMoves = new Set<TileData>();
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Remove blocked moves from piece and board
  blockedMoves.forEach((move) =>
    board[move.rank * 8 + move.file].attackers.delete(piece),
  );
  return blockedMoves;
}

/**
 * Calculates all moves now possible for a piece due to another piece moving away and unblocking. Adds these moves to the piece's moveset and adds the piece's attacks on those tiles.
 * @param piece PieceData object getting unblocked
 * @param board Array of 64 TileData objects representing board
 * @param unblockedRank rank of unblocked tile
 * @param unblockedFile file of unblocked tile
 * @returns Set of moves now possible
 */
export function unblockMoves(
  piece: PieceData,
  board: TileData[],
  unblockedRank: dimension,
  unblockedFile: dimension,
): Set<TileData> {
  let unblockedMoves: Set<TileData>;
  switch (piece.type) {
    case "pawn":
      unblockedMoves = pawnUnblock(piece, board, unblockedRank, unblockedFile);
      break;
    case "knight":
      unblockedMoves = new Set<TileData>();
      break;
    case "rook":
      unblockedMoves = rookUnblock(piece, board, unblockedRank, unblockedFile);
      break;
    case "bishop":
      unblockedMoves = bishopUnblock(
        piece,
        board,
        unblockedRank,
        unblockedFile,
      );
      break;
    case "queen":
      unblockedMoves = queenUnblock(piece, board, unblockedRank, unblockedFile);
      break;
    case "king":
      unblockedMoves = new Set<TileData>();
      break;
    default:
      throw new Error("unrecognised type");
  }
  // Add blocked moves to piece and board
  unblockedMoves.forEach((move) =>
    board[move.rank * 8 + move.file].attackers.add(piece),
  );
  return unblockedMoves;
}
