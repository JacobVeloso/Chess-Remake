import "./Board.css";
import pieces from "../assets/index";
import Tile, { isAttacked } from "./Tile";
import type { PieceData, TileData, type, color, dimension } from "./types.ts";
import {
  bishopMoves,
  bishopBlock,
  bishopUnblock,
} from "./PieceTypes/Bishop.ts";
import { rookMoves, rookBlock, rookUnblock } from "./PieceTypes/Rook.ts";
import { knightMoves, knightBlock, knightUnblock } from "./PieceTypes/Knight";
import { pawnMoves, pawnBlock, pawnUnblock } from "./PieceTypes/Pawn.ts";
import { kingMoves, kingBlock, kingUnblock } from "./PieceTypes/King.ts";
import { queenMoves, queenBlock, queenUnblock } from "./PieceTypes/Queen";
import { useState, useEffect } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

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
): void {
  for (const move of allMoves) {
    if (!allowedMoves.has(move)) allMoves.delete(move);
  }
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

/**
 * Removes all attacks on the board by a given piece
 * @param board : TileData[]
 * @param piece : PieceData
 */
export function removeAttacks(board: TileData[], piece: PieceData): void {
  for (const tile of board) tile.attackers.delete(piece);
}

/**
 * Erases a piece's previous possible moves and recalculates them. Also determines if the piece is now attacking the opposing king.
 * @param board : TileData[]
 * @param piece : PieceData
 * @returns Set<TileData> | null : Collection of moves that can block the piece's attack on opposing king, or null if the piece is not attacking.
 */
export function recalculateMoves(
  board: TileData[],
  piece: PieceData
): Set<TileData> | null {
  let checkBlocks: Set<TileData> | null = null;
  removeAttacks(board, piece);
  const newMoves = piece.calcMoves(piece, board);
  for (const move of newMoves) {
    move.attackers.add(piece);

    // Check if piece attacks opposing king
    if (move.piece?.type === "king" && move.piece?.color !== piece.color) {
      checkBlocks = new Set([
        ...(checkBlocks ?? new Set()),
        ...blockingMoves(
          board,
          [move.rank, move.file],
          [piece.rank, piece.file]
        ),
      ]);
    }
  }
  return checkBlocks;
}

/**
 * Filters out illegal moves from a piece's set of all possible moves.
 * @param board : TileData[]
 * @param piece : PieceData
 * @returns Set<TileData>
 */
function legalMoves(board: TileData[], piece: PieceData): Set<TileData> {
  const moves = piece.moves;
  for (const move of moves) {
    // Piece can't move to a tile blocked by other piece of same color
    if (move.piece?.color === piece.color) moves.delete(move);
  }

  // Extra checks for pawns
  if (piece.type === "pawn") {
    const direction = piece.color === "white" ? -1 : 1;
    const startingRank = piece.color === "white" ? 6 : 1;
    const passantRank = piece.color === "white" ? 3 : 4;

    // Any piece blocking
    if (board[(piece.rank + direction) * 8 + piece.file].piece) {
      moves.delete(board[(piece.rank + direction) * 8 + piece.file]);

      // Two square move
      if (piece.rank === startingRank)
        moves.delete(board[(startingRank + 2 * direction) * 8 + piece.file]);
    }

    // Check diagonal captures
    // Right capture
    const i = piece.rank + direction;
    let j = piece.file + 1;
    if (i > 0 && j < 7) {
      // en passant
      if (
        piece.rank === passantRank &&
        board[piece.rank * 8 + j].piece?.params.get("movedTwo")
      ) {
      }

      // Regular capture
      else if (
        !board[i * 8 + j].piece ||
        board[i * 8 + j].piece!.color === piece.color
      )
        moves.delete(board[i * 8 + j]);
    }

    // Left capture
    j = piece.file - 1;
    if (i > 0 && j >= 0) {
      // en passant
      if (
        piece.rank === passantRank &&
        board[piece.rank * 8 + j].piece?.params.get("movedTwo")
      ) {
      }

      // Regular capture
      else if (
        !board[i * 8 + j].piece ||
        board[i * 8 + j].piece!.color === piece.color
      )
        moves.delete(board[i * 8 + j]);
    }
  }

  // Extra check for castling
  else if (piece.type === "king" && !piece.params.get("hasMoved")) {
    // Check right rook
    if (
      // Rook present or has moved
      board[piece.rank * 8 + 7].piece?.type !== "rook" ||
      board[piece.rank * 8 + 7].piece?.params.get("hasMoved") ||
      // Tiles between are empty or attacked
      board[piece.rank * 8 + 5].piece ||
      isAttacked(board[piece.rank * 8 + 5], piece.color) ||
      board[piece.rank * 8 + 6].piece ||
      isAttacked(board[piece.rank * 8 + 6], piece.color)
    ) {
      moves.delete(board[piece.rank * 8 + 6]);
    }

    // Check left look
    if (
      // Rook present or has moved
      board[piece.rank * 8].piece?.type !== "rook" ||
      board[piece.rank * 8].piece?.params.get("hasMoved") ||
      // Tiles between are empty or attacked
      board[piece.rank * 8 + 3].piece ||
      isAttacked(board[piece.rank * 8 + 3], piece.color) ||
      board[piece.rank * 8 + 2].piece ||
      isAttacked(board[piece.rank * 8 + 2], piece.color) ||
      board[piece.rank * 8 + 1].piece ||
      isAttacked(board[piece.rank * 8 + 1], piece.color)
    )
      moves.delete(board[piece.rank * 8 + 2]);
  }
  return moves;
}

export function board(rank: dimension, file: dimension): TileData {
  return TILES[rank * 8 + file];
}

let pieceID = 0;
let tileID = 0;

const PIECES: Set<PieceData> = new Set();

const TILES: TileData[] = Array.from({ length: 64 }, (_, index) => {
  const [rank, file]: [dimension, dimension] = [
    Math.floor(index / 8) as dimension,
    (index % 8) as dimension,
  ];
  const color: color = (rank + file) % 2 === 0 ? "white" : "black";

  let type: type | null = null;
  let src: string | null = null;
  let pieceColor: color | null = null;

  // black piece
  if (rank === 1) {
    pieceColor = "black";
    type = "pawn";
    src = pieces.blackPawn;
  } else if (rank === 0) {
    pieceColor = "black";
    if (file === 0 || file === 7) {
      type = "rook";
      src = pieces.blackRook;
    } else if (file === 1 || file === 6) {
      type = "knight";
      src = pieces.blackKnight;
    } else if (file === 2 || file === 5) {
      type = "bishop";
      src = pieces.blackBishop;
    } else if (file === 3) {
      type = "queen";
      src = pieces.blackQueen;
    } else if (file === 4) {
      type = "king";
      src = pieces.blackKing;
    }
  }

  // white piece
  else if (rank === 6) {
    pieceColor = "white";
    type = "pawn";
    src = pieces.whitePawn;
  } else if (rank === 7) {
    pieceColor = "white";
    if (file === 0 || file === 7) {
      type = "rook";
      src = pieces.whiteRook;
    } else if (file === 1 || file === 6) {
      type = "knight";
      src = pieces.whiteKnight;
    } else if (file === 2 || file === 5) {
      type = "bishop";
      src = pieces.whiteBishop;
    } else if (file === 3) {
      type = "queen";
      src = pieces.whiteQueen;
    } else if (file === 4) {
      type = "king";
      src = pieces.whiteKing;
    }
  }

  let piece: PieceData | null = null;
  if (type) {
    const params: Map<string, boolean> = new Map();
    switch (type) {
      case "pawn":
        params.set("movedTwo", false);
        piece = {
          id: "" + pieceID++,
          color: pieceColor!,
          type,
          src: src!,
          rank,
          file,
          moves: new Set<TileData>(),
          calcMoves: pawnMoves,
          block: pawnBlock,
          unblock: pawnUnblock,
          params,
        };
        break;
      case "rook":
        params.set("hasMoved", false);
        piece = {
          id: "" + pieceID++,
          color: pieceColor!,
          type,
          src: src!,
          rank,
          file,
          moves: new Set<TileData>(),
          calcMoves: rookMoves,
          block: rookBlock,
          unblock: rookUnblock,
          params,
        };
        break;
      case "bishop":
        piece = {
          id: "" + pieceID++,
          color: pieceColor!,
          type,
          src: src!,
          rank,
          file,
          moves: new Set<TileData>(),
          calcMoves: bishopMoves,
          block: bishopBlock,
          unblock: bishopUnblock,
          params,
        };
        break;
      case "knight":
        piece = {
          id: "" + pieceID++,
          color: pieceColor!,
          type,
          src: src!,
          rank,
          file,
          moves: new Set<TileData>(),
          calcMoves: knightMoves,
          block: knightBlock,
          unblock: knightUnblock,
          params,
        };
        break;
      case "king":
        params.set("hasMoved", false);
        piece = {
          id: "" + pieceID++,
          color: pieceColor!,
          type,
          src: src!,
          rank,
          file,
          moves: new Set<TileData>(),
          calcMoves: kingMoves,
          block: kingBlock,
          unblock: kingUnblock,
          params,
        };
        break;
      case "queen":
        piece = {
          id: "" + pieceID++,
          color: pieceColor!,
          type,
          src: src!,
          rank,
          file,
          moves: new Set<TileData>(),
          calcMoves: queenMoves,
          block: queenBlock,
          unblock: queenUnblock,
          params,
        };
        break;
      default:
        piece = null;
    }
    if (piece) PIECES.add(piece);
  }

  let tileData: TileData = {
    id: "" + tileID++,
    rank,
    file,
    color,
    piece,
    attackers: new Set(),
  };
  return tileData;
});

const ACTIVE: boolean[] = new Array(64).fill(false);

let whiteMovedPawn: PieceData | null = null;
let blackMovedPawn: PieceData | null = null;
let colorInCheck: color | null = null;

export let whiteCanMove = true;

const Board = () => {
  const setupAttackers = () => {
    // Set black pawns to attack forward tiles
    for (let i = 2; i <= 3; ++i) {
      for (let j = 0; j < 8; ++j) {
        const blackPawn = TILES[1 * 8 + j].piece!;
        TILES[i * 8 + j].attackers.add(blackPawn);
        blackPawn.moves.add(TILES[i * 8 + j]);
      }
    }

    // Set white pawns to attack forward tiles
    for (let i = 4; i <= 5; ++i) {
      for (let j = 0; j < 8; ++j) {
        const whitePawn = TILES[6 * 8 + j].piece!;
        TILES[i * 8 + j].attackers.add(whitePawn);
        whitePawn.moves.add(TILES[i * 8 + j]);
      }
    }

    // Set knights to attack tiles
    const leftBlackKnight = TILES[0 * 8 + 1].piece!;
    TILES[2 * 8 + 0].attackers.add(leftBlackKnight);
    TILES[2 * 8 + 2].attackers.add(leftBlackKnight);
    leftBlackKnight.moves.add(TILES[2 * 8 + 0]);
    leftBlackKnight.moves.add(TILES[2 * 8 + 2]);

    const rightBlackKnight = TILES[0 * 8 + 6].piece!;
    TILES[2 * 8 + 5].attackers.add(rightBlackKnight);
    TILES[2 * 8 + 7].attackers.add(rightBlackKnight);
    rightBlackKnight.moves.add(TILES[2 * 8 + 5]);
    rightBlackKnight.moves.add(TILES[2 * 8 + 7]);

    const leftWhiteKnight = TILES[7 * 8 + 1].piece!;
    TILES[5 * 8 + 0].attackers.add(leftWhiteKnight);
    TILES[5 * 8 + 2].attackers.add(leftWhiteKnight);
    leftWhiteKnight.moves.add(TILES[5 * 8 + 0]);
    leftWhiteKnight.moves.add(TILES[5 * 8 + 2]);

    const rightWhiteKnight = TILES[7 * 8 + 6].piece!;
    TILES[5 * 8 + 5].attackers.add(rightWhiteKnight);
    TILES[5 * 8 + 7].attackers.add(rightWhiteKnight);
    rightWhiteKnight.moves.add(TILES[5 * 8 + 5]);
    rightWhiteKnight.moves.add(TILES[5 * 8 + 7]);
  };

  useEffect(() => {
    setupAttackers();
  }, []);

  const [tiles, placePiece] = useState(TILES);
  const [actives, setActive] = useState(ACTIVE);
  const [whiteTurn, nextTurn] = useState(true);

  function handleDragStart(event: DragStartEvent) {
    const pieceId = event.active.id as string;
    /*
    for (const piece of PIECES) {
      // Check that it is that color's turn
      if (piece.id === pieceId) {
        if (piece.color !== turn) return;
        break;
      }
    }*/
    //const possibleMoves = legalMoves(tiles, tiles[+pieceId].piece!);

    setActive((prevActives) => {
      const newActives = [...prevActives];
      /*
      possibleMoves.forEach((move) => {
        newActives[move.rank * 8 + move.file] = true;
      });*/

      tiles.forEach((tile) => {
        for (const attacker of tile.attackers) {
          if (attacker.id === pieceId) {
            newActives[tile.rank * 8 + tile.file] = true;
            break;
          }
        }
      });
      return newActives;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActive(new Array(64).fill(false));
    const { active, over } = event;

    // Check if piece is hovering over a tile
    if (!over) return;

    // event IDs
    const targetTileId = over.id as string;
    const pieceId = active.id as string;

    // elements interacted with
    const targetTile = tiles[+targetTileId];
    let piece!: PieceData;

    // Check that piece can access the tile
    let canMove = false;
    for (const attacker of tiles[+targetTileId].attackers) {
      if (attacker.id === pieceId) {
        canMove = true;
        piece = attacker;
        break;
      }
    }
    if (!canMove) return;

    // Check that move is legal
    if (!legalMoves(tiles, piece).has(targetTile)) return;

    const sourceTile = tiles[piece.rank * 8 + piece.file];
    const color = piece.color;
    const targetRank = targetTile.rank;
    const targetFile = targetTile.file;
    let pieceToDelete: PieceData | null = null;

    // Check that tile is empty or can be captured
    if (targetTile.piece) {
      // Own piece blocking
      if (targetTile.piece.color === color) return;
      pieceToDelete = targetTile.piece;
    }

    // Extra checks for pawns
    if (piece.type === "pawn") {
      // Cannot move forward if any piece is blocking
      if (
        targetTile.piece ||
        // White pawn moving two with a piece directly in front
        (piece.color === "white" &&
          piece.rank === 6 &&
          tiles[(targetRank - 1) * 8 + targetFile].piece) ||
        // Black pawn moving two with a piece directly in front
        (piece.color === "black" &&
          piece.rank === 1 &&
          tiles[(targetRank + 1) * 8 + targetFile].piece)
      )
        return;

      // Set and store pawn if it moved two squares (to check for en passant on next turn)
      if (Math.abs(targetRank - piece.rank) === 2) {
        piece.params.set("movedTwo", true);
        if (piece.color === "white") whiteMovedPawn = piece;
        else blackMovedPawn = piece;
      }
    }

    placePiece((prevTiles) => {
      //console.log("placing");
      // Find the piece data from the previous tiles
      let oldTile: TileData | null = null;
      let newTile: TileData | null = null;
      for (const tile of prevTiles) {
        // Source tile
        if (tile.piece?.id === pieceId) {
          oldTile = tile;
        }
        // Target tile
        if (tile.id === targetTileId) {
          newTile = tile;
        }
      }
      // tile not found?
      if (!oldTile || !newTile) return prevTiles;

      // Check that source & target tiles are distinct
      //if (oldTile === newTile || newTile.piece) return prevTiles;
      oldTile.piece = null;
      //console.log("placed on " + targetRank + " " + targetFile);
      // Capture piece
      if (newTile.piece) {
        // Remove old piece and its attacks from board
        for (const tile of prevTiles) {
          tile.attackers.delete(newTile.piece);
        }
      }
      newTile.piece = piece;
      return prevTiles;
    });

    if (pieceToDelete) {
      PIECES.delete(pieceToDelete);
    }

    piece.rank = targetRank;
    piece.file = targetFile;
    colorInCheck = null;
    let checkBlocks: Set<TileData> | null = null;
    // Recalculate moves for piece
    checkBlocks = recalculateMoves(tiles, piece);

    // Check if opposing king is now in check
    if (checkBlocks) colorInCheck = piece.color === "white" ? "black" : "white";

    // Once a king or rook moves they cannot be used to castle
    if (piece.type === "king" || piece.type === "rook")
      piece.params.set("hasMoved", true);

    // Recalculate moves for other pieces of same color
    // If own king was in check, calculate moves for all of own pieces
    if (colorInCheck === piece.color) {
      for (const other of PIECES) {
        if (other.color === piece.color) {
          const blocks = recalculateMoves(tiles, other);
          if (blocks)
            checkBlocks = new Set([...(checkBlocks ?? new Set()), ...blocks]);
        }
      }
    }

    // Otherwise, calculate moves only for pieces that interact with tiles that moved piece did
    else {
      // Unblock pieces that interact with original tile
      for (const attacker of sourceTile.attackers) {
        const attackerMoves = attacker.unblock(attacker, tiles, [
          sourceTile.rank,
          sourceTile.file,
        ]);
        for (const move of attackerMoves) move.attackers.add(attacker);
      }

      // Block pieces that interact with new tile
      for (const attacker of targetTile.attackers) {
        const attackerMoves = attacker.block(attacker, tiles, [
          targetTile.rank,
          targetTile.file,
        ]);
        removeAttacks(tiles, piece);
        for (const move of attackerMoves) move.attackers.add(attacker);
      }
    }

    // Recalculate moves for opposing pieces
    for (const opp of PIECES) {
      if (opp.color !== piece.color) {
        removeAttacks(tiles, opp);
        const oppMoves = opp.calcMoves(opp, tiles);
        for (const move of oppMoves) {
          move.attackers.add(opp);
        }
      }
    }

    // TODO: Check that opponent still has legal moves

    // Reset a pawn that moved two squares last turn (cannot be captured via en passant anymore)
    if (piece.color === "white" && blackMovedPawn) {
      blackMovedPawn.params.set("movedTwo", false);
    } else if (piece.color === "black" && whiteMovedPawn) {
      whiteMovedPawn.params.set("movedTwo", false);
    }

    // Switch to other color's turn
    nextTurn(!whiteTurn);
    whiteCanMove = !whiteCanMove;
  }

  return (
    <div className="container">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {tiles.map((tileData) => {
          return (
            <Tile
              key={tileData.id}
              tileData={tileData}
              active={actives[tileData.rank * 8 + tileData.file]}
            />
          );
        })}
      </DndContext>
    </div>
  );
};

export default Board;
