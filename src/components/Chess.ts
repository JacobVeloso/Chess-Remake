import { useState } from "react";
import type {
  PieceData,
  TileData,
  BoardState,
  Move,
  color,
  dimension,
} from "./types";
import {
  checkBlocks,
  checkCastlingMoves,
  removeCastlingMove,
} from "./PieceTypes/King";
import { checkPawnCaptures } from "./PieceTypes/Pawn";
import { calculateMoves, blockMoves, unblockMoves } from "./MoveCalculation";

/**
 * Checks if the piece at piecePos is pinned to their king at kingPos and determines all moves that can block the pin.
 * @param board : TileData[]
 * @param kingPos : [dimension, dimension]
 * @param piecePos : [dimension, dimension]
 * @returns Set<TileData> | null : Collection of all moves that that can block the pin (including capturing the attacker itself), or null if piece is not pinned.
 */
export function getPinBlocks(
  board: TileData[],
  kingPos: [dimension, dimension],
  piecePos: [dimension, dimension]
): Set<TileData> | null {
  // Check that a king is at kingPos
  const [kingRank, kingFile] = kingPos;
  if (
    !board[kingRank * 8 + kingFile].piece ||
    board[kingRank * 8 + kingFile].piece!.type !== "king"
  ) {
    return null;
  }

  // Check that a piece of the same color is at piecePos
  const color = board[kingRank * 8 + kingFile].piece!.color;
  const [pieceRank, pieceFile] = piecePos;
  if (
    !board[kingRank * 8 + kingFile].piece ||
    board[kingRank * 8 + kingFile].piece!.color !== color
  ) {
    return null;
  }

  // Check if piece is the king
  if (pieceRank === kingRank && pieceFile === kingFile) return null;

  const pinBlocks = new Set<TileData>();
  let pinPresent = false;

  // file axis
  if (kingFile === pieceFile) {
    const direction = pieceRank > kingRank ? 1 : -1;

    // Check for an opposing rook or queen
    for (let i = pieceRank + direction; i >= 0 && i < 8; i += direction) {
      pinBlocks.add(board[i * 8 + pieceFile]);
      const piece = board[i * 8 + pieceFile].piece;
      if (
        (piece?.type === "rook" || piece?.type === "queen") &&
        piece?.color !== color
      ) {
        pinPresent = true;
        break;
      } else if (board[i * 8 + pieceFile].piece) {
        return null; // Different piece
      }
    }
    // rook/queen not found
    if (!pinPresent) return null;

    // Check if another piece is between piece and king
    for (let i = kingRank + direction; i !== pieceRank; i += direction) {
      pinBlocks.add(board[i * 8 + pieceFile]);
      if (board[i * 8 + pieceFile].piece) return null;
    }

    return pinBlocks;
  }

  // rank axis
  else if (kingRank === pieceRank) {
    const direction = pieceFile > kingFile ? 1 : -1;

    // Check for an opposing rook or queen
    for (let i = pieceFile + direction; i >= 0 && i < 8; i += direction) {
      pinBlocks.add(board[pieceRank * 8 + i]);
      const piece = board[pieceRank * 8 + i].piece;
      if (
        (piece?.type === "rook" || piece?.type === "queen") &&
        piece?.color !== color
      ) {
        pinPresent = true;
        break;
      } else if (board[pieceRank * 8 + i].piece) {
        return null; // Different piece
      }
    }
    // rook/queen not found
    if (!pinPresent) return null;

    // Check if another piece is between piece and king
    for (let i = kingFile + direction; i !== pieceFile; i += direction) {
      pinBlocks.add(board[pieceRank * 8 + i]);
      if (board[pieceRank * 8 + i].piece) return null;
    }

    return pinBlocks;
  }

  // diagnoal
  else if (Math.abs(kingRank - pieceRank) === Math.abs(kingFile - pieceFile)) {
    const rankDirection = pieceRank > kingRank ? 1 : -1;
    const fileDirection = pieceFile > kingFile ? 1 : -1;

    // Check for an opposing bishop or queen
    let i = pieceRank + rankDirection;
    let j = pieceFile + fileDirection;
    while (i >= 0 && i < 8 && j >= 0 && j < 8) {
      pinBlocks.add(board[i * 8 + j]);
      const piece = board[i * 8 + j].piece;
      if (
        (piece?.type === "bishop" || piece?.type === "queen") &&
        piece?.color !== color
      ) {
        pinPresent = true;
        break;
      } else if (board[i * 8 + j].piece) {
        return null; // Different piece
      }
      i += rankDirection;
      j += fileDirection;
    }
    // bishop/queen not found
    if (!pinPresent) return null;

    // Check if another piece is between piece and king
    i = kingRank + rankDirection;
    j = kingFile + fileDirection;
    while (i !== pieceRank || j !== pieceFile) {
      pinBlocks.add(board[i * 8 + j]);
      if (board[i * 8 + j].piece) return null;
      i += rankDirection;
      j += fileDirection;
    }

    return pinBlocks;
  }

  // piece not pinned
  else return null;
}

/**
 * Takes the set intersection of allMoves and allowedMoves, modifying allMoves in place
 * @param allMoves : Set<TileData>
 * @param allowedMoves : Set<TileData>
 */
export function filterMoves(
  allMoves: Set<TileData>,
  allowedMoves: Set<TileData>
): Set<TileData> {
  const filteredMoves = new Set<TileData>();
  for (const move of allMoves) {
    if (allowedMoves.has(move)) filteredMoves.add(move);
  }
  return filteredMoves;
}

/**
 * Determines all moves that can block a piece from attacking the king, regardless of the type of piece. Can also be used for any generic piece.
 * @param board : TileData[]
 * @param kingPos : [dimension, dimension]
 * @param attackerPos : [dimension, dimension]
 * @returns Set<TileData> : Collection of moves that are in between attacker and king.
 */
export function blockingMoves(
  board: TileData[],
  kingPos: [dimension, dimension],
  attackerPos: [dimension, dimension]
): Set<TileData> {
  const [kingRank, kingFile] = kingPos;
  const [attackerRank, attackerFile] = attackerPos;
  const moves = new Set<TileData>([board[attackerRank * 8 + attackerFile]]);

  // straight
  if (kingRank === attackerRank) {
    const direction = kingFile > attackerFile ? 1 : -1;
    for (let i = attackerFile + direction; i !== kingFile; i += direction) {
      moves.add(board[attackerRank * 8 + i]);
    }
  } else if (kingFile === attackerFile) {
    const direction = kingRank > attackerRank ? 1 : -1;
    for (let i = attackerRank + direction; i !== kingRank; i += direction) {
      moves.add(board[i * 8 + attackerFile]);
    }
  }

  // diagonal
  else if (
    Math.abs(kingRank - attackerRank) === Math.abs(kingFile - attackerFile)
  ) {
    const rankDirection = kingRank > attackerRank ? 1 : -1;
    const fileDirection = kingFile > attackerFile ? 1 : -1;
    let i = attackerRank + rankDirection;
    let j = attackerFile + fileDirection;
    while (i !== kingRank && j !== kingFile) {
      moves.add(board[i * 8 + j]);
      i += rankDirection;
      j += fileDirection;
    }
  }

  // If attacker is a knight, both cases fail - only blocking move is capturing knight itself

  return moves;
}

export function filterCaptures(
  moves: Set<TileData>,
  pieceColor: color
): Set<TileData> {
  const filteredMoves = new Set<TileData>();
  moves.forEach((move) => {
    if (move.piece?.color !== pieceColor) filteredMoves.add(move);
  });
  return filteredMoves;
}

export function calculateLegalMoves(
  board: BoardState,
  turn: color
): Map<PieceData["id"], Set<TileData["id"]>> {
  const pieces = turn === "white" ? board.whitePieces : board.blackPieces;
  const king = Array.from(pieces).filter((piece) => piece.type === "king")[0];

  const blocks = checkBlocks(board.tiles, king.rank, king.file);

  const moves = new Map<PieceData["id"], Set<TileData["id"]>>();

  pieces.forEach((piece) => {
    let pieceMoves = new Set<TileData>(piece.moves);

    // // Filter captures for pawns
    // if (piece.type === "pawn")
    //   pieceMoves = checkPawnCaptures(pieceMoves, board.tiles, piece);
    // // Filter castling for king
    // else if (piece.type === "king")
    //   pieceMoves = checkCastlingMoves(pieceMoves, board.tiles, piece);

    // const pinBlocks = getPinBlocks(
    //   board.tiles,
    //   [king.rank, king.file],
    //   [piece.rank, piece.file]
    // );
    // if (blocks) pieceMoves = filterMoves(pieceMoves, blocks);
    // if (pinBlocks) pieceMoves = filterMoves(pieceMoves, pinBlocks);
    // pieceMoves = filterCaptures(pieceMoves, turn);
    moves.set(
      piece.id,
      new Set<TileData["id"]>(Array.from(pieceMoves, (move) => move.id))
    );
  });

  return moves;
}

export function applyMove(currBoard: BoardState, move: Move): BoardState {
  const newBoard = { ...currBoard };
  const newPiece = { ...move.piece };
  const newPieces =
    newPiece.color === "white" ? newBoard.whitePieces : newBoard.blackPieces;
  for (const piece of newPieces) {
    if (piece.id === newPiece.id) {
      newPieces.delete(piece);
      break;
    }
  }
  newPieces.add(newPiece);

  // Extra checks for pawns
  if (newPiece.type === "pawn") {
    // Check if pawn captured via en passant
    const direction = newBoard.tiles[+move.to].file > newPiece.file ? -1 : 1;
    if (
      newBoard.tiles[
        newPiece.rank * 8 + newPiece.file + direction
      ].piece?.params.get("movedTwo")
    )
      newBoard.tiles[newPiece.rank * 8 + newPiece.file + direction].piece =
        null;
    // Check if pawn moved two squares
    else if (Math.abs(+move.from - +move.to) === 16)
      newPiece.params.set("movedTwo", true);
  }

  // Extra checks for kings
  else if (newPiece.type === "king") {
    newPiece.params.set("hasMoved", true);

    // Check if king castled
    if (Math.abs(+move.from - +move.to) === 2) {
      if (newPiece.color === "black" && +move.to < +move.from) {
        newBoard.tiles[3].piece = newBoard.tiles[0].piece;
        newBoard.tiles[0].piece = null;
      } else if (newPiece.color === "black" && +move.to > +move.from) {
        newBoard.tiles[5].piece = newBoard.tiles[7].piece;
        newBoard.tiles[7].piece = null;
      } else if (newPiece.color === "white" && +move.to < +move.from) {
        newBoard.tiles[59].piece = newBoard.tiles[56].piece;
        newBoard.tiles[56].piece = null;
      } else if (newPiece.color === "white" && +move.to > +move.from) {
        newBoard.tiles[61].piece = newBoard.tiles[63].piece;
        newBoard.tiles[63].piece = null;
      }
    }

    // Remove both castling moves for king
    removeCastlingMove(newBoard.tiles, newPiece, "left");
    removeCastlingMove(newBoard.tiles, newPiece, "right");

    // Extra check for rook
  } else if (newPiece.type === "rook") {
    newPiece.params.set("hasMoved", true);

    // Remove castling move for king
    if (
      newBoard.tiles[newPiece.rank * 8 + 4].piece &&
      newBoard.tiles[newPiece.rank * 8 + 4].piece!.type === "king" &&
      !newBoard.tiles[newPiece.rank * 8 + 4].piece!.params.get("hasMoved")
    ) {
      if (newPiece.file === 0)
        removeCastlingMove(
          newBoard.tiles,
          newBoard.tiles[newPiece.rank * 8 + 4].piece!,
          "left"
        );
      else
        removeCastlingMove(
          newBoard.tiles,
          newBoard.tiles[newPiece.rank * 8 + 4].piece!,
          "right"
        );
    }
  }

  // Move piece and record move
  const sourceTile = newBoard.tiles[+move.from];
  const targetTile = newBoard.tiles[+move.to];

  // Check for a capture
  if (targetTile.piece) {
    const pieces =
      newPiece.color === "white" ? newBoard.blackPieces : newBoard.whitePieces;
    pieces.delete(targetTile.piece);
  }
  sourceTile.piece = null;
  targetTile.piece = newPiece;
  //newBoard.moveHistory.push(move);

  // Update position of piece
  newPiece.rank = targetTile.rank;
  newPiece.file = targetTile.file;

  // Recalculate possible moves
  calculateMoves(newPiece, newBoard.tiles);

  // Recalculate possible moves for pieces interacting with source & target tiles
  sourceTile.attackers.forEach((piece) => {
    unblockMoves(piece, newBoard.tiles, [sourceTile.rank, sourceTile.file]);
  });

  targetTile.attackers.forEach((piece) => {
    blockMoves(piece, newBoard.tiles, [targetTile.rank, targetTile.file]);
  });

  return newBoard;
}

export function getHighlightedTiles(
  moves: Map<PieceData["id"], Set<TileData["id"]>>,
  pieceID: PieceData["id"]
): boolean[] {
  const tiles = Array(64).fill(false);
  moves.get(pieceID)?.forEach((move) => (tiles[+move] = true));
  return tiles;
}

function useChess(initialBoard: BoardState) {
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [actives, setActive] = useState<boolean[]>(new Array(64).fill(false));
  const [turn, nextTurn] = useState<color>("white");
  const [whitePawn, setWhitePawn] = useState<PieceData | null>(null);
  const [blackPawn, setBlackPawn] = useState<PieceData | null>(null);

  // Attempt to move piece on board and recalculate moves if successful
  const movePiece = (
    move: Move,
    legalMoves: Map<PieceData["id"], Set<TileData["id"]>>
  ) => {
    if (legalMoves.get(move.piece.id)?.has(move.to)) {
      //console.log("updating board...");
      setBoard(applyMove(board, move));
      //console.log("updated board!");

      // Reset pawn that moved two squares last turn
      if (turn === "white" && blackPawn) setBlackPawn(null);
      else if (turn === "black" && whitePawn) setWhitePawn(null);

      // Check if a pawn moved two squares this turn
      if (move.piece.params.get("movedTwo")) {
        if (turn === "white") setWhitePawn(move.piece);
        else setBlackPawn(move.piece);
      }

      nextTurn(turn === "white" ? "black" : "white");
      const moves = calculateLegalMoves(board, turn);
      //console.log("calc'd legal moves!");
      return moves;
    }
  };
  return { board, movePiece, actives, setActive, turn };
}

export default useChess;
