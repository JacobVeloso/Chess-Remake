import { useState, useEffect, useCallback } from "react";
import type {
  PieceData,
  TileData,
  BoardState,
  Move,
  color,
  dimension,
} from "./types";
import { checkBlocks } from "./PieceTypes/King";
import { isAttacked } from "./Tile";
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

export function joinMoves(
  allMoves: Set<TileData>,
  addedMoves: Set<TileData>
): void {
  for (const move of addedMoves) allMoves.add(move);
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
// export function recalculateMoves(
//   board: TileData[],
//   piece: PieceData
// ): Set<TileData> | null {
//   let checkBlocks: Set<TileData> | null = null;
//   removeAttacks(board, piece);
//   const newMoves = piece.calcMoves(piece, board);
//   for (const move of newMoves) {
//     move.attackers.add(piece);

//     // Check if piece attacks opposing king
//     if (move.piece?.type === "king" && move.piece?.color !== piece.color) {
//       checkBlocks = new Set([
//         ...(checkBlocks ?? new Set()),
//         ...blockingMoves(
//           board,
//           [move.rank, move.file],
//           [piece.rank, piece.file]
//         ),
//       ]);
//     }
//   }
//   return checkBlocks;
// }

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
    const pinBlocks = getPinBlocks(
      board.tiles,
      [king.rank, king.file],
      [piece.rank, piece.file]
    );
    if (blocks) pieceMoves = filterMoves(pieceMoves, blocks);
    if (pinBlocks) pieceMoves = filterMoves(pieceMoves, pinBlocks);
    pieceMoves = filterCaptures(pieceMoves, turn);
    // console.log("Moves for piece " + piece.id);
    // pieceMoves.forEach((move) => console.log(move.id));
    moves.set(
      piece.id,
      new Set<TileData["id"]>(Array.from(pieceMoves, (move) => move.id))
    );
  });

  //   for (const key of moves.keys()) {
  //     console.log(key + ": " + moves.get(key));
  //     moves.get(key)?.forEach((move) => {
  //       console.log("move: " + move);
  //     });
  //   }

  return moves;
}

export function applyMove(board: BoardState, move: Move): BoardState {
  const updatedBoard = { ...board };
  const updatedPiece = { ...move.piece };
  const updatedPieces =
    updatedPiece.color === "white"
      ? updatedBoard.whitePieces
      : updatedBoard.blackPieces;
  for (const piece of updatedPieces) {
    if (piece.id === updatedPiece.id) {
      updatedPieces.delete(piece);
      break;
    }
  }
  updatedPieces.add(updatedPiece);
  // updated.tiles.forEach((tile) => {
  //   tile.attackers.clear();
  // });

  // TODO: check for en passant or castling

  // Move piece and record move
  const sourceTile = updatedBoard.tiles[+move.from];
  const targetTile = updatedBoard.tiles[+move.to];
  updatedBoard.tiles[+move.from].piece = null;
  targetTile.piece = updatedPiece;
  updatedBoard.moveHistory.push(move);

  // Update position of piece and recalculate possible moves
  updatedPiece.rank = targetTile.rank;
  updatedPiece.file = targetTile.file;
  calculateMoves(updatedPiece, updatedBoard.tiles);

  // Recalculate possible moves for pieces interacting with source & target tiles
  sourceTile.attackers.forEach((piece) => {
    unblockMoves(piece, updatedBoard.tiles, [sourceTile.rank, sourceTile.file]);
  });

  targetTile.attackers.forEach((piece) => {
    blockMoves(piece, updatedBoard.tiles, [targetTile.rank, targetTile.file]);
  });

  // console.log("NEW PIECE MOVES " + updatedPiece.id);
  // updatedPiece.moves.forEach((move) => {
  //   console.log(move.id);
  // });
  // console.log("SOURCE TILE ATTACKERS " + sourceTile.id);
  // sourceTile.attackers.forEach((piece) => {
  //   console.log(piece.id);
  // });
  // console.log("TARGET TILE ATTACKERS " + targetTile.id);
  // targetTile.attackers.forEach((piece) => {
  //   console.log(piece.id);
  // });

  return updatedBoard;
}

/**
 * Calculates all possible moves for all pieces on board, ignoring blocked tiles, pins and checks. Stores tiles in piece.moves and adds each piece to tile.attackers
 * @param board : TileData[]
 * @param pieces : Set<PieceData>
 */
export function calculateAllMoves(
  board: TileData[],
  pieces: Set<PieceData>
): Map<PieceData["id"], Set<TileData["id"]>> {
  const allMoves = new Map<PieceData["id"], Set<TileData["id"]>>();
  pieces.forEach((piece) => {
    const moves = calculateMoves(piece, board);
    const moveIds = new Set<TileData["id"]>();
    moves.forEach((move) => {
      board[move.rank * 8 + move.file].attackers.add(piece);
      moveIds.add(move.id);
    });
    allMoves.set(piece.id, moveIds);
  });
  return allMoves;
}

/**
 * Removes all moves that are impossible due to to pieces blocking tiles. Updates all piece.moves and tile.attackers collections accordingly
 * @param board : TileData[]
 */
export function filterBlocked(
  board: TileData[],
  moves: Map<PieceData["id"], Set<TileData["id"]>>
): Map<PieceData["id"], Set<TileData["id"]>> {
  board.forEach((tile) => {
    if (tile.piece) {
      tile.attackers.forEach((attacker) => {
        const blockedMoves = blockMoves(attacker, board, [
          tile.rank,
          tile.file,
        ]);
        blockedMoves.forEach((move) => {
          board[move.rank * 8 + move.file].attackers.delete(attacker);
          moves.get(attacker.id)?.delete(move.id);
        });
      });
    }
  });
  return moves;
}

export function checkFilter(
  board: TileData[],
  blocks: Set<TileData>,
  turn: color,
  moves: Map<PieceData["id"], Set<TileData["id"]>>
): Map<PieceData["id"], Set<TileData["id"]>> {
  board.forEach((tile) => {
    if (!blocks.has(tile)) {
      tile.attackers.forEach((attacker) => {
        if (attacker.color === turn) {
          attacker.moves.delete(tile);
          tile.attackers.delete(attacker);
          moves.get(attacker.id)?.delete(tile.id);
        }
      });
    }
  });
  return moves;
}

export function pinFilter(
  board: TileData[],
  pieces: Set<PieceData>,
  kingPos: [dimension, dimension],
  moves: Map<PieceData["id"], Set<TileData["id"]>>
): Map<PieceData["id"], Set<TileData["id"]>> {
  pieces.forEach((piece) => {
    const blocks = getPinBlocks(board, kingPos, [piece.rank, piece.file]);
    if (blocks) {
      removeAttacks(board, piece);
      const pieceMoves = moves.get(piece.id)!;
      pieceMoves.clear();
      filterMoves(piece.moves, blocks);
      piece.moves.forEach((move) => {
        board[move.rank * 8 + move.file].attackers.add(piece);
        pieceMoves.add(move.id);
      });
      moves.set(piece.id, pieceMoves);
    }
  });
  return moves;
}

/**
 * Calculates all legal moves for all pieces, modifying move collections and tile attacker collections accordingly.
 * @param board : TileData[]
 */
export function nextGameState(
  board: TileData[],
  pieces: Set<PieceData>,
  turn: color
): Map<PieceData["id"], Set<TileData["id"]>> {
  const ownPieces = new Set<PieceData>();
  const oppPieces = new Set<PieceData>();
  pieces.forEach((piece) => {
    if (piece.color === turn) ownPieces.add(piece);
    else oppPieces.add(piece);
  });

  const king = board.find(
    (tile) => tile.piece?.type === "king" && tile.piece?.color === turn
  )!.piece;
  if (!king) return new Map(); // TODO raise error

  // Calculate all possible moves
  let moves = calculateAllMoves(board, pieces);

  // Filter out blocked moves
  moves = filterBlocked(board, moves);

  // Determine if king is in check
  const blocks = checkBlocks(board, king.rank, king.file);
  if (blocks) {
    checkFilter(board, blocks, turn, moves);
  }

  // Filter out moves for pieces pinned to king
  pinFilter(board, ownPieces, [king.rank, king.file], moves);

  return moves;
}

// export function board(rank: dimension, file: dimension): TileData {
//   return TILES[rank * 8 + file];
// }

export function getHighlightedTiles(
  moves: Map<PieceData["id"], Set<TileData["id"]>>,
  pieceID: PieceData["id"]
): boolean[] {
  const tiles = Array(64).fill(false);
  moves.get(pieceID)?.forEach((move) => (tiles[+move] = true));
  return tiles;
}

function getInitialMoves(): Map<PieceData["id"], Set<TileData["id"]>> {
  const moves = new Map<PieceData["id"], Set<TileData["id"]>>();
  // white pawns
  moves.set("16", new Set(["40", "32"]));
  moves.set("17", new Set(["41", "33"]));
  moves.set("18", new Set(["42", "34"]));
  moves.set("19", new Set(["43", "35"]));
  moves.set("20", new Set(["44", "36"]));
  moves.set("21", new Set(["45", "37"]));
  moves.set("22", new Set(["46", "38"]));
  moves.set("23", new Set(["47", "39"]));

  // white knights
  moves.set("25", new Set(["40", "42"]));
  moves.set("30", new Set(["45", "47"]));

  return moves;
}

function useChess(initialBoard: BoardState) {
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [actives, setActive] = useState<boolean[]>(new Array(64).fill(false));
  const [turn, nextTurn] = useState<color>("white");

  // Attempt to move piece on board and recalculate moves if successful
  const movePiece = (
    move: Move,
    legalMoves: Map<PieceData["id"], Set<TileData["id"]>>
  ) => {
    //   for (const key of moves.keys()) {
    //     console.log(key + ": " + moves.get(key));
    //     moves.get(key)?.forEach((move) => {
    //       console.log("move: " + move);
    //     });
    //   }
    if (legalMoves.get(move.piece.id)?.has(move.to)) {
      // console.log("gonna move the piece now!!");
      setBoard(applyMove(board, move));
      nextTurn(turn === "white" ? "black" : "white");
      return calculateLegalMoves(board, turn);
    }
  };
  return { board, movePiece, actives, setActive, turn };
}

export default useChess;
