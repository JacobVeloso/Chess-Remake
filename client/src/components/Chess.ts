import { useRef } from "react";
import type {
  PieceData,
  TileData,
  BoardData,
  Move,
  color,
  type,
  dimension,
} from "./types";
import { encodeTile } from "./Tile.tsx";
import {
  checkBlocks,
  filterAttackedTiles,
  checkCastlingMoves,
  removeCastlingMove,
} from "./PieceTypes/King";
import { checkPawnMoves, promote } from "./PieceTypes/Pawn";
import { calculateMoves, blockMoves, unblockMoves } from "./MoveCalculation";
import { castle, getCastlingMoves } from "./PieceTypes/King";
import { isAttacked } from "./Tile";

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
  piecePos: [dimension, dimension],
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
  allowedMoves: Set<TileData>,
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
  attackerPos: [dimension, dimension],
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

  // If attacker is a knight/pawn, both cases fail - only blocking move is capturing knight itself

  return moves;
}

export function calculateLegalMoves(
  board: BoardData,
): Map<PieceData["id"], Set<TileData["id"]>> | null {
  const pieces = board.turn === "white" ? board.whitePieces : board.blackPieces;
  const king = Array.from(pieces).filter((piece) => piece.type === "king")[0];

  const blocks = checkBlocks(board.tiles, king.rank, king.file);

  const moves = new Map<PieceData["id"], Set<TileData["id"]>>();

  for (const piece of pieces) {
    let pieceMoves = new Set<TileData>();

    for (const [_, moveType] of piece.moves) {
      for (const move of moveType) {
        // Only add moves that do not capture own piece
        if (!move.piece || move.piece.color !== piece.color)
          pieceMoves.add(move);
      }
    }

    // Filter captures for pawns
    if (piece.type === "pawn") {
      const illegalMoves = checkPawnMoves(board.tiles, piece);
      illegalMoves.forEach((move) => pieceMoves.delete(move));
    } else if (piece.type === "king") {
      // Filter castle moves for king
      const illegalCastles = checkCastlingMoves(board.tiles, piece);
      illegalCastles.forEach((move) => pieceMoves.delete(move));

      // Filter out moves that would put king in check
      pieceMoves = filterAttackedTiles(board.tiles, piece, pieceMoves);
    }

    // Filter by moves that can block check (if applicable)
    if (blocks) pieceMoves = filterMoves(pieceMoves, blocks);

    // Filter by moves that keep piece pinned (if applicable)
    const pinBlocks = getPinBlocks(
      board.tiles,
      [king.rank, king.file],
      [piece.rank, piece.file],
    );
    if (pinBlocks) pieceMoves = filterMoves(pieceMoves, pinBlocks);

    // Record legal moves
    moves.set(
      piece.id,
      new Set<TileData["id"]>(Array.from(pieceMoves, (move) => move.id)),
    );
  }

  // Check if there is at least one legal move
  for (const moveSet of moves.values()) {
    if (moveSet.size > 0) return moves;
  }

  // Checkmate
  if (isAttacked(board.tiles[king.rank * 8 + king.file], board.turn))
    return null;

  // Stalemate
  return new Map();
}

function deletePiece(board: BoardData, piece: PieceData): void {
  // Remove piece and all of its attacks from board
  for (const tile of board.tiles) {
    tile.attackers.delete(piece);
    if (tile.piece === piece) tile.piece = null;
  }

  // Remove piece from board's piece collections
  if (piece.color === "white") board.whitePieces.delete(piece);
  else board.blackPieces.delete(piece);
}

export function applyMove(board: BoardData, move: Move): BoardData {
  const piece = move.piece;
  const sourceTile = board.tiles[+move.from];
  const targetTile = board.tiles[+move.to];
  const resetEP = board.epPawn;

  // Extra checks for kings
  if (piece.type === "king" && Math.abs(+move.from - +move.to) === 2) {
    castle(board.tiles, move);
  } else {
    if (piece.type === "king") piece.params.set("hasMoved", true);
    // Extra checks for pawns
    else if (piece.type === "pawn") {
      // Check if pawn captured via en passant
      if (targetTile.piece && targetTile.piece === board.epPawn)
        deletePiece(board, board.epPawn);

      // Check if pawn moved two squares
      if (Math.abs(+move.from - +move.to) === 16) {
        piece.params.set("movedTwo", true);
        board.epPawn = piece;
      } else piece.params.set("movedTwo", false);
    }
    // Extra check for rook
    else if (piece.type === "rook") {
      piece.params.set("hasMoved", true);

      // Remove castling move for king
      if (
        board.tiles[piece.rank * 8 + 4].piece &&
        board.tiles[piece.rank * 8 + 4].piece!.type === "king" &&
        !board.tiles[piece.rank * 8 + 4].piece!.params.get("hasMoved")
      ) {
        if (piece.file === 0)
          removeCastlingMove(
            board.tiles,
            board.tiles[piece.rank * 8 + 4].piece!,
            "left",
          );
        // piece.file === 7
        else
          removeCastlingMove(
            board.tiles,
            board.tiles[piece.rank * 8 + 4].piece!,
            "right",
          );
      }
    }

    // Check for a capture
    if (targetTile.piece) deletePiece(board, targetTile.piece!);

    sourceTile.piece = null;
    targetTile.piece = piece;

    // Update position of piece
    piece.rank = targetTile.rank;
    piece.file = targetTile.file;

    // Promote if pawn reached end of board
    if (
      (piece.type === "pawn" && piece.color === "white" && piece.rank === 0) ||
      (piece.color === "black" && piece.rank === 7)
    )
      promote(board.tiles, piece, "queen"); // TODO: Allow user to choose piece
    // Recalculate possible moves for piece
    else calculateMoves(piece, board.tiles, [sourceTile.rank, sourceTile.file]);
  }

  // Reset en passant pawn if necessary
  if (resetEP) board.epPawn = null;

  // Recalculate possible moves for pieces interacting with source & target tiles
  sourceTile.attackers.forEach((unblockedPiece) => {
    if (unblockedPiece !== piece)
      unblockMoves(unblockedPiece, board.tiles, [
        sourceTile.rank,
        sourceTile.file,
      ]);
  });

  targetTile.attackers.forEach((blockedPiece) =>
    blockMoves(blockedPiece, board.tiles, [targetTile.rank, targetTile.file]),
  );

  return board;
}

export function generateFEN(board: BoardData): string {
  let boardFen = "";
  let emptySpaces = 0;
  for (const tile of board.tiles) {
    if (tile.piece) {
      // Notate number of empty spaces
      if (emptySpaces > 0) {
        boardFen += emptySpaces;
        emptySpaces = 0;
      }

      // Notate piece based on type and color
      switch (tile.piece.type) {
        case "pawn":
          boardFen += tile.piece.color === "white" ? "P" : "p";
          break;
        case "rook":
          boardFen += tile.piece.color === "white" ? "R" : "r";
          break;
        case "knight":
          boardFen += tile.piece.color === "white" ? "N" : "n";
          break;
        case "bishop":
          boardFen += tile.piece.color === "white" ? "B" : "b";
          break;
        case "queen":
          boardFen += tile.piece.color === "white" ? "Q" : "q";
          break;
        case "king":
          boardFen += tile.piece.color === "white" ? "K" : "k";
          break;
      }
    } else ++emptySpaces; // Count empty spaces between pieces

    // Notate next rank
    if (+tile.id % 8 === 7) {
      // Notate number of empty spaces
      if (emptySpaces > 0) {
        boardFen += emptySpaces;
        emptySpaces = 0;
      }

      if (tile.id !== "63") boardFen += "/";
    }
  }

  const turnFen = board.turn === "white" ? "w" : "b";

  function getCastlingFEN(king: PieceData): string {
    const moves = getCastlingMoves(board.tiles, king, false);
    // console.log([...moves]);
    let queenSide = false;
    let kingSide = false;
    for (const move of moves) {
      if (move.file < king.file) queenSide = true;
      else kingSide = true;
    }
    let fen = "";
    if (kingSide) fen += king.color === "white" ? "K" : "k";
    if (queenSide) fen += king.color === "white" ? "Q" : "q";
    return fen;
  }

  let castlingFen = "";

  for (const piece of board.whitePieces) {
    if (piece.type === "king") castlingFen += getCastlingFEN(piece);
  }

  for (const piece of board.blackPieces) {
    if (piece.type === "king") castlingFen += getCastlingFEN(piece);
  }

  function getEpTile(): string {
    if (!board.epPawn) return "-";
    const direction = board.epPawn.color === "white" ? 1 : -1;
    const epTarget =
      board.tiles[(board.epPawn.rank + direction) * 8 + board.epPawn.file];
    return encodeTile(epTarget);
  }

  const epFen = getEpTile();
  const halfFen = +board.halfmoves;
  const fullFen = +board.fullmoves;

  return (
    boardFen +
    " " +
    turnFen +
    " " +
    (castlingFen ? castlingFen : "-") +
    " " +
    epFen +
    " " +
    halfFen +
    " " +
    fullFen
  );
}

export function getHighlightedTiles(
  moves: Map<PieceData["id"], Set<TileData["id"]>>,
  pieceID: PieceData["id"],
): boolean[] {
  const tiles = Array(64).fill(false);
  moves.get(pieceID)?.forEach((move) => (tiles[+move] = true));
  return tiles;
}

function createBoard(): TileData[] {
  let tileID = 0;
  return Array.from({ length: 64 }, (_, index) => {
    const [rank, file]: [dimension, dimension] = [
      Math.floor(index / 8) as dimension,
      (index % 8) as dimension,
    ];
    const color: color = (rank + file) % 2 === 0 ? "white" : "black";

    return {
      id: "" + tileID++,
      rank,
      file,
      color,
      piece: null,
      attackers: new Set<PieceData>(),
    };
  });
}

function setup(
  pieces: [
    Set<{ type: type; rank: dimension; file: dimension }>,
    Set<{ type: type; rank: dimension; file: dimension }>,
  ],
): BoardData {
  const board = {
    tiles: createBoard(),
    whitePieces: new Set<PieceData>(),
    blackPieces: new Set<PieceData>(),
    turn: "white" as color,
    halfmoves: 0,
    fullmoves: 0,
    epPawn: null,
  };

  let pieceID = 0;

  const [whitePieces, blackPieces] = pieces;
  for (const pieceData of whitePieces) {
    const piece = {
      id: "" + pieceID++,
      color: "white" as color,
      type: pieceData.type,
      rank: pieceData.rank,
      file: pieceData.file,
      moves: new Map<string, Set<TileData>>(),
      params: new Map<string, boolean>(),
    };
    if (pieceData.type === "pawn") piece.params.set("movedTwo", false);
    else if (pieceData.type === "king" || pieceData.type === "rook")
      piece.params.set("hasMoved", false);

    board.tiles[pieceData.rank * 8 + pieceData.file].piece = piece;
    board.whitePieces.add(piece);
  }

  for (const pieceData of blackPieces) {
    const piece = {
      id: "" + pieceID++,
      color: "black" as color,
      type: pieceData.type,
      rank: pieceData.rank,
      file: pieceData.file,
      moves: new Map<string, Set<TileData>>(),
      params: new Map<string, boolean>(),
    };
    if (pieceData.type === "pawn") piece.params.set("movedTwo", false);
    else if (pieceData.type === "king" || pieceData.type === "rook")
      piece.params.set("hasMoved", false);

    board.tiles[pieceData.rank * 8 + pieceData.file].piece = piece;
    board.blackPieces.add(piece);
  }

  for (const piece of board.whitePieces)
    calculateMoves(piece, board.tiles, [piece.rank, piece.file]);
  for (const piece of board.blackPieces)
    calculateMoves(piece, board.tiles, [piece.rank, piece.file]);
  return board;
}

function defaultStartPosition(): [
  Set<{ type: type; rank: dimension; file: dimension }>,
  Set<{ type: type; rank: dimension; file: dimension }>,
] {
  return [
    new Set<{ type: type; rank: dimension; file: dimension }>([
      { type: "pawn", rank: 6, file: 0 },
      { type: "pawn", rank: 6, file: 1 },
      { type: "pawn", rank: 6, file: 2 },
      { type: "pawn", rank: 6, file: 3 },
      { type: "pawn", rank: 6, file: 4 },
      { type: "pawn", rank: 6, file: 5 },
      { type: "pawn", rank: 6, file: 6 },
      { type: "pawn", rank: 6, file: 7 },
      { type: "rook", rank: 7, file: 0 },
      { type: "knight", rank: 7, file: 1 },
      { type: "bishop", rank: 7, file: 2 },
      { type: "queen", rank: 7, file: 3 },
      { type: "king", rank: 7, file: 4 },
      { type: "bishop", rank: 7, file: 5 },
      { type: "knight", rank: 7, file: 6 },
      { type: "rook", rank: 7, file: 7 },
    ]),
    new Set<{ type: type; rank: dimension; file: dimension }>([
      { type: "rook", rank: 0, file: 0 },
      { type: "knight", rank: 0, file: 1 },
      { type: "bishop", rank: 0, file: 2 },
      { type: "queen", rank: 0, file: 3 },
      { type: "king", rank: 0, file: 4 },
      { type: "bishop", rank: 0, file: 5 },
      { type: "knight", rank: 0, file: 6 },
      { type: "rook", rank: 0, file: 7 },
      { type: "pawn", rank: 1, file: 0 },
      { type: "pawn", rank: 1, file: 1 },
      { type: "pawn", rank: 1, file: 2 },
      { type: "pawn", rank: 1, file: 3 },
      { type: "pawn", rank: 1, file: 4 },
      { type: "pawn", rank: 1, file: 5 },
      { type: "pawn", rank: 1, file: 6 },
      { type: "pawn", rank: 1, file: 7 },
    ]),
  ];
}

function useChess() {
  const boardData = useRef<BoardData>(setup(defaultStartPosition()));

  // Attempt to move piece on board and recalculate moves if successful
  const movePiece = (
    from: TileData["id"],
    to: TileData["id"],
    legalMoves: Map<PieceData["id"], Set<TileData["id"]>>,
  ): Map<string, Set<string>> | null => {
    const piece = boardData.current.tiles[+from].piece;
    if (piece && legalMoves.get(piece.id)?.has(to)) {
      // Apply the move to the board
      const capture = boardData.current.tiles[+to].piece ?? undefined;
      applyMove(boardData.current, { from, to, piece, capture });

      // Switch turns
      boardData.current.turn =
        boardData.current.turn === "white" ? "black" : "white";
      boardData.current.halfmoves++;
      if (boardData.current.turn === "white") boardData.current.fullmoves++;

      // Calculate legal moves for new current color
      const moves = calculateLegalMoves(boardData.current);

      return moves;
    }
    return new Map<string, Set<string>>();
  };

  return {
    boardData,
    movePiece,
  };
}

export default useChess;
