import { useState, useRef } from "react";
import pieces from "../assets/index";
import type {
  PieceData,
  TileData,
  TileState,
  BoardData,
  Move,
  color,
  type,
  dimension,
} from "./types";
import {
  checkBlocks,
  checkCastlingMoves,
  removeCastlingMove,
} from "./PieceTypes/King";
import { checkPawnMoves } from "./PieceTypes/Pawn";
import { calculateMoves, blockMoves, unblockMoves } from "./MoveCalculation";
import { castle } from "./PieceTypes/King";

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

export function calculateLegalMoves(
  board: BoardData,
  turn: color
): Map<PieceData["id"], Set<TileData["id"]>> {
  const pieces = turn === "white" ? board.whitePieces : board.blackPieces;
  const king = Array.from(pieces).filter((piece) => piece.type === "king")[0];

  const blocks = checkBlocks(board.tiles, king.rank, king.file);

  const moves = new Map<PieceData["id"], Set<TileData["id"]>>();

  pieces.forEach((piece) => {
    let pieceMoves = new Set<TileData>();
    piece.moves.forEach((moveType, _) => {
      moveType.forEach((move) => {
        // Only add moves that do not capture own piece
        if (!move.piece || move.piece.color !== piece.color)
          pieceMoves.add(move);
      });
    });

    // Filter captures for pawns
    if (piece.type === "pawn") {
      const illegalMoves = checkPawnMoves(board.tiles, piece);
      illegalMoves.forEach((move) => pieceMoves.delete(move));
    }
    // Filter castling for king
    else if (piece.type === "king") {
      const illegalCastles = checkCastlingMoves(board.tiles, piece);
      illegalCastles.forEach((move) => pieceMoves.delete(move));
    }

    // Filter by moves that can block check (if applicable)
    if (blocks) pieceMoves = filterMoves(pieceMoves, blocks);

    // Filter by moves that keep piece pinned (if applicable)
    const pinBlocks = getPinBlocks(
      board.tiles,
      [king.rank, king.file],
      [piece.rank, piece.file]
    );
    if (pinBlocks) pieceMoves = filterMoves(pieceMoves, pinBlocks);

    // Record legal moves
    moves.set(
      piece.id,
      new Set<TileData["id"]>(Array.from(pieceMoves, (move) => move.id))
    );
  });

  return moves;
}

function deletePiece(board: BoardData, piece: PieceData): void {
  // Remove piece and all of its attacks from board
  board.tiles.forEach((tile) => {
    tile.attackers.delete(piece);
    if (tile.piece === piece) tile.piece = null;
  });

  // Remove piece from board's piece collections
  if (piece.color === "white") board.whitePieces.delete(piece);
  else board.blackPieces.delete(piece);
}

export function applyMove(board: BoardData, move: Move): BoardData {
  const piece = move.piece;
  const sourceTile = board.tiles[+move.from];
  const targetTile = board.tiles[+move.to];

  // // Rook move for castling
  // let castlingRookMove: Move | null = null;

  // Extra checks for kings
  if (piece.type === "king" && Math.abs(+move.from - +move.to) === 2) {
    castle(board.tiles, move);

    // TODO: recalculate moves + position for rook
    // Check if king castled
    // if (Math.abs(+move.from - +move.to) === 2) {
    //   if (piece.color === "black" && +move.to < +move.from) {
    //     // board.tiles[3].piece = board.tiles[0].piece;
    //     // board.tiles[0].piece = null;
    //     castlingRookMove = { from: "0", to: "3", piece: board.tiles[0].piece! };
    //   } else if (piece.color === "black" && +move.to > +move.from) {
    //     // board.tiles[5].piece = board.tiles[7].piece;
    //     // board.tiles[7].piece = null;
    //     castlingRookMove = { from: "7", to: "5", piece: board.tiles[7].piece! };
    //   } else if (piece.color === "white" && +move.to < +move.from) {
    //     // board.tiles[59].piece = board.tiles[56].piece;
    //     // board.tiles[56].piece = null;
    //     castlingRookMove = {
    //       from: "56",
    //       to: "59",
    //       piece: board.tiles[56].piece!,
    //     };
    //   } else if (piece.color === "white" && +move.to > +move.from) {
    //     // board.tiles[61].piece = board.tiles[63].piece;
    //     // board.tiles[63].piece = null;
    //     castlingRookMove = {
    //       from: "63",
    //       to: "61",
    //       piece: board.tiles[63].piece!,
    //     };
    //   }

    // }

    // // Remove both castling moves for king
    // removeCastlingMove(board.tiles, piece, "left");
    // removeCastlingMove(board.tiles, piece, "right");
  } else {
    if (piece.type === "king") piece.params.set("hasMoved", true);
    // Extra checks for pawns
    else if (piece.type === "pawn") {
      const direction = targetTile.file > piece.file ? 1 : -1;
      const potentialPawn =
        board.tiles[piece.rank * 8 + piece.file + direction].piece;

      // Check if pawn captured via en passant
      if (potentialPawn?.params.get("movedTwo"))
        deletePiece(board, potentialPawn);
      // Check if pawn moved two squares
      else if (Math.abs(+move.from - +move.to) === 16)
        piece.params.set("movedTwo", true);
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
            "left"
          );
        // piece.file === 7
        else
          removeCastlingMove(
            board.tiles,
            board.tiles[piece.rank * 8 + 4].piece!,
            "right"
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

    // Recalculate possible moves for piece
    calculateMoves(piece, board.tiles, [sourceTile.rank, sourceTile.file]);

    console.log(piece.type + " " + piece.rank + " " + piece.file);
    for (const moveType of piece.moves.values()) {
      for (const move of moveType) {
        console.log(move.rank + " " + move.file);
      }
    }
  }

  // Recalculate possible moves for pieces interacting with source & target tiles
  sourceTile.attackers.forEach((piece) =>
    unblockMoves(piece, board.tiles, [sourceTile.rank, sourceTile.file])
  );

  targetTile.attackers.forEach((piece) =>
    blockMoves(piece, board.tiles, [targetTile.rank, targetTile.file])
  );

  return board;
}

export function getHighlightedTiles(
  moves: Map<PieceData["id"], Set<TileData["id"]>>,
  pieceID: PieceData["id"]
): boolean[] {
  const tiles = Array(64).fill(false);
  moves.get(pieceID)?.forEach((move) => (tiles[+move] = true));
  return tiles;
}

function setupInitialBoard(): BoardData {
  const WHITE_PIECES: Set<PieceData> = new Set();
  const BLACK_PIECES: Set<PieceData> = new Set();
  let pieceID = 0;
  let tileID = 0;
  // Initialise tiles array
  const TILES: TileData[] = Array.from({ length: 64 }, (_, index) => {
    const [rank, file]: [dimension, dimension] = [
      Math.floor(index / 8) as dimension,
      (index % 8) as dimension,
    ];
    const color: color = (rank + file) % 2 === 0 ? "white" : "black";

    let type: type | null = null;
    let pieceColor: color | null = null;

    // black piece
    if (rank === 1) {
      pieceColor = "black";
      type = "pawn";
    } else if (rank === 0) {
      pieceColor = "black";
      if (file === 0 || file === 7) {
        type = "rook";
      } else if (file === 1 || file === 6) {
        type = "knight";
      } else if (file === 2 || file === 5) {
        type = "bishop";
      } else if (file === 3) {
        type = "queen";
      } else if (file === 4) {
        type = "king";
      }
    }

    // white piece
    else if (rank === 6) {
      pieceColor = "white";
      type = "pawn";
    } else if (rank === 7) {
      pieceColor = "white";
      if (file === 0 || file === 7) {
        type = "rook";
      } else if (file === 1 || file === 6) {
        type = "knight";
      } else if (file === 2 || file === 5) {
        type = "bishop";
      } else if (file === 3) {
        type = "queen";
      } else if (file === 4) {
        type = "king";
      }
    }

    let piece: PieceData | null = null;
    if (type) {
      const params = new Map<string, boolean>();
      const moves = new Map<string, Set<TileData>>();
      switch (type) {
        case "pawn":
          params.set("movedTwo", false);
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            rank,
            file,
            moves,
            params,
          };
          break;
        case "rook":
          params.set("hasMoved", false);
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            rank,
            file,
            moves,
            params,
          };
          break;
        case "bishop":
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            rank,
            file,
            moves,
            params,
          };
          break;
        case "knight":
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            rank,
            file,
            moves,
            params,
          };
          break;
        case "king":
          params.set("hasMoved", false);
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            rank,
            file,
            moves,
            params,
          };
          break;
        case "queen":
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            rank,
            file,
            moves,
            params,
          };
          break;
        default:
          piece = null;
      }
      if (piece) {
        if (piece.color === "white") WHITE_PIECES.add(piece);
        else BLACK_PIECES.add(piece);
      }
    }

    let tileData: TileData = {
      id: "" + tileID++,
      rank,
      file,
      color,
      piece,
      attackers: new Set<PieceData>(),
    };
    return tileData;
  });

  // Set black & white pawn moves
  for (let j = 0; j < 8; ++j) {
    const blackPawn = TILES[1 * 8 + j].piece!;
    blackPawn.moves.set("forward", new Set<TileData>([TILES[2 * 8 + j]]));
    TILES[2 * 8 + j].attackers.add(blackPawn);
    blackPawn.moves.set("two square", new Set<TileData>([TILES[3 * 8 + j]]));
    TILES[3 * 8 + j].attackers.add(blackPawn);
    if (j !== 0) {
      blackPawn.moves.set(
        "left capture",
        new Set<TileData>([TILES[2 * 8 + (j - 1)]])
      );
      TILES[2 * 8 + (j - 1)].attackers.add(blackPawn);
    }
    if (j !== 7) {
      blackPawn.moves.set(
        "right capture",
        new Set<TileData>([TILES[2 * 8 + (j + 1)]])
      );
      TILES[2 * 8 + (j + 1)].attackers.add(blackPawn);
    }

    const whitePawn = TILES[6 * 8 + j].piece!;
    whitePawn.moves.set("forward", new Set<TileData>([TILES[5 * 8 + j]]));
    TILES[5 * 8 + j].attackers.add(whitePawn);
    whitePawn.moves.set("two square", new Set<TileData>([TILES[4 * 8 + j]]));
    TILES[4 * 8 + j].attackers.add(whitePawn);
    if (j !== 0) {
      whitePawn.moves.set(
        "left capture",
        new Set<TileData>([TILES[5 * 8 + (j - 1)]])
      );
      TILES[5 * 8 + (j - 1)].attackers.add(whitePawn);
    }
    if (j !== 7) {
      whitePawn.moves.set(
        "right capture",
        new Set<TileData>([TILES[5 * 8 + (j + 1)]])
      );
      TILES[5 * 8 + (j + 1)].attackers.add(whitePawn);
    }
  }

  // Set rook moves
  const leftBlackRook = TILES[0 * 8 + 0].piece!;
  leftBlackRook.moves.set("N", new Set<TileData>());
  leftBlackRook.moves.set("E", new Set<TileData>([TILES[0 * 8 + 1]]));
  TILES[0 * 8 + 1].attackers.add(leftBlackRook);
  leftBlackRook.moves.set("S", new Set<TileData>([TILES[1 * 8 + 0]]));
  TILES[1 * 8 + 0].attackers.add(leftBlackRook);
  leftBlackRook.moves.set("W", new Set<TileData>());

  const rightBlackRook = TILES[0 * 8 + 7].piece!;
  rightBlackRook.moves.set("N", new Set<TileData>());
  rightBlackRook.moves.set("E", new Set<TileData>());
  rightBlackRook.moves.set("S", new Set<TileData>([TILES[1 * 8 + 7]]));
  TILES[1 * 8 + 7].attackers.add(rightBlackRook);
  rightBlackRook.moves.set("W", new Set<TileData>([TILES[0 * 8 + 6]]));
  TILES[0 * 8 + 6].attackers.add(rightBlackRook);

  const leftWhiteRook = TILES[7 * 8 + 0].piece!;
  leftWhiteRook.moves.set("N", new Set<TileData>([TILES[6 * 8 + 0]]));
  TILES[6 * 8 + 0].attackers.add(leftWhiteRook);
  leftWhiteRook.moves.set("E", new Set<TileData>([TILES[7 * 8 + 1]]));
  TILES[7 * 8 + 1].attackers.add(leftWhiteRook);
  leftWhiteRook.moves.set("S", new Set<TileData>());
  leftWhiteRook.moves.set("W", new Set<TileData>());

  const rightWhiteRook = TILES[7 * 8 + 7].piece!;
  rightWhiteRook.moves.set("N", new Set<TileData>([TILES[6 * 8 + 7]]));
  TILES[6 * 8 + 7].attackers.add(rightWhiteRook);
  rightWhiteRook.moves.set("E", new Set<TileData>());
  rightWhiteRook.moves.set("S", new Set<TileData>());
  rightWhiteRook.moves.set("W", new Set<TileData>([TILES[7 * 8 + 6]]));
  TILES[7 * 8 + 6].attackers.add(rightWhiteRook);

  // Set knight moves
  const leftBlackKnight = TILES[0 * 8 + 1].piece!;
  leftBlackKnight.moves.set(
    "all",
    new Set<TileData>([TILES[2 * 8 + 0], TILES[2 * 8 + 2], TILES[1 * 8 + 3]])
  );
  TILES[2 * 8 + 0].attackers.add(leftBlackKnight);
  TILES[2 * 8 + 2].attackers.add(leftBlackKnight);
  TILES[1 * 8 + 3].attackers.add(leftBlackKnight);

  const rightBlackKnight = TILES[0 * 8 + 6].piece!;
  rightBlackKnight.moves.set(
    "all",
    new Set<TileData>([TILES[2 * 8 + 5], TILES[2 * 8 + 7], TILES[1 * 8 + 4]])
  );
  TILES[2 * 8 + 5].attackers.add(rightBlackKnight);
  TILES[2 * 8 + 7].attackers.add(rightBlackKnight);
  TILES[1 * 8 + 4].attackers.add(rightBlackKnight);

  const leftWhiteKnight = TILES[7 * 8 + 1].piece!;
  leftWhiteKnight.moves.set(
    "all",
    new Set<TileData>([TILES[5 * 8 + 0], TILES[5 * 8 + 2], TILES[6 * 8 + 3]])
  );
  TILES[5 * 8 + 0].attackers.add(leftWhiteKnight);
  TILES[5 * 8 + 2].attackers.add(leftWhiteKnight);
  TILES[6 * 8 + 3].attackers.add(leftWhiteKnight);

  const rightWhiteKnight = TILES[7 * 8 + 6].piece!;
  rightWhiteKnight.moves.set(
    "all",
    new Set<TileData>([TILES[5 * 8 + 5], TILES[5 * 8 + 7], TILES[6 * 8 + 4]])
  );
  TILES[5 * 8 + 5].attackers.add(rightWhiteKnight);
  TILES[5 * 8 + 7].attackers.add(rightWhiteKnight);
  TILES[6 * 8 + 4].attackers.add(rightWhiteKnight);

  // Set bishop moves
  const leftBlackBishop = TILES[0 * 8 + 2].piece!;
  leftBlackBishop.moves.set("NW", new Set<TileData>());
  leftBlackBishop.moves.set("NE", new Set<TileData>());
  leftBlackBishop.moves.set("SW", new Set<TileData>([TILES[1 * 8 + 1]]));
  TILES[1 * 8 + 1].attackers.add(leftBlackBishop);
  leftBlackBishop.moves.set("SE", new Set<TileData>([TILES[1 * 8 + 3]]));
  TILES[1 * 8 + 3].attackers.add(leftBlackBishop);

  const rightBlackBishop = TILES[0 * 8 + 5].piece!;
  rightBlackBishop.moves.set("NW", new Set<TileData>());
  rightBlackBishop.moves.set("NE", new Set<TileData>());
  rightBlackBishop.moves.set("SW", new Set<TileData>([TILES[1 * 8 + 4]]));
  TILES[1 * 8 + 4].attackers.add(rightBlackBishop);
  rightBlackBishop.moves.set("SE", new Set<TileData>([TILES[1 * 8 + 6]]));
  TILES[1 * 8 + 6].attackers.add(rightBlackBishop);

  const leftWhiteBishop = TILES[7 * 8 + 2].piece!;
  leftWhiteBishop.moves.set("NW", new Set<TileData>([TILES[6 * 8 + 1]]));
  TILES[6 * 8 + 1].attackers.add(leftWhiteBishop);
  leftWhiteBishop.moves.set("NE", new Set<TileData>([TILES[6 * 8 + 3]]));
  TILES[6 * 8 + 3].attackers.add(leftWhiteBishop);
  leftWhiteBishop.moves.set("SW", new Set<TileData>());
  leftWhiteBishop.moves.set("SE", new Set<TileData>());

  const rightWhiteBishop = TILES[7 * 8 + 5].piece!;
  rightWhiteBishop.moves.set("NW", new Set<TileData>([TILES[6 * 8 + 4]]));
  TILES[6 * 8 + 4].attackers.add(rightWhiteBishop);
  rightWhiteBishop.moves.set("NE", new Set<TileData>([TILES[6 * 8 + 6]]));
  TILES[6 * 8 + 6].attackers.add(rightWhiteBishop);
  rightWhiteBishop.moves.set("SW", new Set<TileData>());
  rightWhiteBishop.moves.set("SE", new Set<TileData>());

  // Set queen moves
  const blackQueen = TILES[0 * 8 + 3].piece!;
  blackQueen.moves.set("NE", new Set<TileData>());
  blackQueen.moves.set("N", new Set<TileData>());
  blackQueen.moves.set("NW", new Set<TileData>());
  blackQueen.moves.set("W", new Set<TileData>([TILES[0 * 8 + 2]]));
  TILES[0 * 8 + 2].attackers.add(blackQueen);
  blackQueen.moves.set("SW", new Set<TileData>([TILES[1 * 8 + 2]]));
  TILES[1 * 8 + 2].attackers.add(blackQueen);
  blackQueen.moves.set("S", new Set<TileData>([TILES[1 * 8 + 3]]));
  TILES[1 * 8 + 3].attackers.add(blackQueen);
  blackQueen.moves.set("SE", new Set<TileData>([TILES[1 * 8 + 4]]));
  TILES[1 * 8 + 4].attackers.add(blackQueen);
  blackQueen.moves.set("E", new Set<TileData>([TILES[0 * 8 + 4]]));
  TILES[0 * 8 + 4].attackers.add(blackQueen);

  const whiteQueen = TILES[7 * 8 + 3].piece!;
  whiteQueen.moves.set("W", new Set<TileData>([TILES[7 * 8 + 2]]));
  TILES[7 * 8 + 2].attackers.add(whiteQueen);
  whiteQueen.moves.set("NW", new Set<TileData>([TILES[6 * 8 + 2]]));
  TILES[6 * 8 + 2].attackers.add(whiteQueen);
  whiteQueen.moves.set("N", new Set<TileData>([TILES[6 * 8 + 3]]));
  TILES[6 * 8 + 3].attackers.add(whiteQueen);
  whiteQueen.moves.set("NE", new Set<TileData>([TILES[6 * 8 + 4]]));
  TILES[6 * 8 + 4].attackers.add(whiteQueen);
  whiteQueen.moves.set("E", new Set<TileData>([TILES[7 * 8 + 4]]));
  TILES[7 * 8 + 4].attackers.add(whiteQueen);
  whiteQueen.moves.set("SE", new Set<TileData>());
  whiteQueen.moves.set("S", new Set<TileData>());
  whiteQueen.moves.set("SW", new Set<TileData>());

  // Set king moves
  const blackKing = TILES[0 * 8 + 4].piece!;
  blackKing.moves.set("NE", new Set<TileData>());
  blackKing.moves.set("N", new Set<TileData>());
  blackKing.moves.set("NW", new Set<TileData>());
  blackKing.moves.set("W", new Set<TileData>([TILES[0 * 8 + 3]]));
  TILES[0 * 8 + 3].attackers.add(blackKing);
  blackKing.moves.set("SW", new Set<TileData>([TILES[1 * 8 + 3]]));
  TILES[1 * 8 + 3].attackers.add(blackKing);
  blackKing.moves.set("S", new Set<TileData>([TILES[1 * 8 + 4]]));
  TILES[1 * 8 + 4].attackers.add(blackKing);
  blackKing.moves.set("SE", new Set<TileData>([TILES[1 * 8 + 5]]));
  TILES[1 * 8 + 5].attackers.add(blackKing);
  blackKing.moves.set("E", new Set<TileData>([TILES[0 * 8 + 5]]));
  TILES[0 * 8 + 5].attackers.add(blackKing);
  blackKing.moves.set("leftCastle", new Set<TileData>([TILES[0 * 8 + 2]]));
  blackKing.moves.set("rightCastle", new Set<TileData>([TILES[0 * 8 + 6]]));

  const whiteKing = TILES[7 * 8 + 4].piece!;
  whiteKing.moves.set("W", new Set<TileData>([TILES[7 * 8 + 3]]));
  TILES[7 * 8 + 3].attackers.add(whiteKing);
  whiteKing.moves.set("NW", new Set<TileData>([TILES[6 * 8 + 3]]));
  TILES[6 * 8 + 3].attackers.add(whiteKing);
  whiteKing.moves.set("N", new Set<TileData>([TILES[6 * 8 + 4]]));
  TILES[6 * 8 + 4].attackers.add(whiteKing);
  whiteKing.moves.set("NE", new Set<TileData>([TILES[6 * 8 + 5]]));
  TILES[6 * 8 + 5].attackers.add(whiteKing);
  whiteKing.moves.set("E", new Set<TileData>([TILES[7 * 8 + 5]]));
  TILES[7 * 8 + 5].attackers.add(whiteKing);
  whiteKing.moves.set("SE", new Set<TileData>());
  whiteKing.moves.set("S", new Set<TileData>());
  whiteKing.moves.set("SW", new Set<TileData>());
  whiteKing.moves.set("leftCastle", new Set<TileData>([TILES[7 * 8 + 2]]));
  whiteKing.moves.set("rightCastle", new Set<TileData>([TILES[7 * 8 + 6]]));

  return {
    tiles: TILES,
    whitePieces: WHITE_PIECES,
    blackPieces: BLACK_PIECES,
  };
}

function getSrc(type: type, color: color): string {
  switch (type) {
    case "pawn":
      return color === "white" ? pieces.whitePawn : pieces.blackPawn;
    case "rook":
      return color === "white" ? pieces.whiteRook : pieces.blackRook;
    case "knight":
      return color === "white" ? pieces.whiteKnight : pieces.blackKnight;
    case "bishop":
      return color === "white" ? pieces.whiteBishop : pieces.blackBishop;
    case "queen":
      return color === "white" ? pieces.whiteQueen : pieces.blackQueen;
    case "king":
      return color === "white" ? pieces.whiteKing : pieces.blackKing;
    default:
      return "";
  }
}

function extractBoardState(tiles: TileData[]): TileState[] {
  return Array.from({ length: 64 }, (_, index) => {
    const piece = tiles[index].piece;
    return {
      id: "" + index,
      color: tiles[index].color,
      rank: tiles[index].rank,
      file: tiles[index].file,
      piece: piece
        ? {
            id: piece.id,
            color: piece.color,
            type: piece.type,
            src: getSrc(piece.type, piece.color),
          }
        : null,
    };
  });
}

function useChess() {
  const boardData = useRef<BoardData>(setupInitialBoard());
  const [board, setBoard] = useState<TileState[]>(
    extractBoardState(boardData.current.tiles)
  );
  const [actives, setActive] = useState<boolean[]>(new Array(64).fill(false));
  const turn = useRef<color>("white");
  const whitePawn = useRef<PieceData | null>(null);
  const blackPawn = useRef<PieceData | null>(null);

  // Attempt to move piece on board and recalculate moves if successful
  const movePiece = (
    from: TileData["id"],
    to: TileData["id"],
    legalMoves: Map<PieceData["id"], Set<TileData["id"]>>
  ): Map<string, Set<string>> => {
    const piece = boardData.current.tiles[+from].piece;
    if (piece && legalMoves.get(piece.id)?.has(to)) {
      // Apply the move to the board
      const capture = boardData.current.tiles[+to].piece ?? undefined;
      applyMove(boardData.current, { from, to, piece, capture });

      // Reset pawn that moved two squares last turn
      if (turn.current === "white" && blackPawn.current) {
        blackPawn.current.params.set("movedTwo", false);
        blackPawn.current = null;
      } else if (turn.current === "black" && whitePawn.current) {
        whitePawn.current.params.set("movedTwo", false);
        whitePawn.current = null;
      }

      // Check if a pawn moved two squares this turn
      if (piece.params.get("movedTwo")) {
        if (turn.current === "white") whitePawn.current = piece;
        else blackPawn.current = piece;
      }

      // Switch turns
      turn.current = turn.current === "white" ? "black" : "white";

      // Calculate legal moves for new current color
      const moves = calculateLegalMoves(boardData.current, turn.current);

      // Update board state and trigger re-render
      setBoard(extractBoardState(boardData.current.tiles));

      return moves;
    }
    return new Map<string, Set<string>>();
  };
  return { board, boardData, movePiece, actives, setActive, turn };
}

export default useChess;
