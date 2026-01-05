import type { dimension, PieceData, TileData } from "../types.ts";
import { addStraightMoves } from "./Queen.ts";

export function bishopMoves(
  piece: PieceData,
  board: TileData[],
  prevPos: [dimension, dimension]
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  // Determine which axis bishop moved along
  const [prevRank, prevFile] = prevPos;

  if (!piece.moves.has("NW-SE")) piece.moves.set("NW-SE", new Set<TileData>());
  if (!piece.moves.has("NE-SW")) piece.moves.set("NE-SW", new Set<TileData>());

  const moved = rank !== prevRank || file !== prevFile;

  if (
    (prevRank > piece.rank && prevFile < piece.file) ||
    (prevRank < piece.rank && prevFile > piece.file) ||
    !moved
  ) {
    if (moved) {
      // Remove current position
      piece.moves.get("NE-SW")?.delete(board[rank * 8 + file]);
      board[rank * 8 + file].attackers.delete(piece);

      // Add previous position
      piece.moves.get("NE-SW")?.add(board[prevRank * 8 + prevFile]);
      moves.add(board[prevRank * 8 + prevFile]);

      // Remove all moves along NW-SE diagonal
      piece.moves.get("NW-SE")?.forEach((move) => {
        move.attackers.delete(piece);
      });
      piece.moves.get("NW-SE")?.clear();
    }

    // Upper left diagonal
    if (rank > 0 && file > 0)
      addStraightMoves(
        board,
        piece,
        -1,
        -1,
        piece.moves.get("NW-SE") ?? new Set<TileData>(),
        moves
      );

    // Lower right diagonal
    if (rank < 7 && file < 7)
      addStraightMoves(
        board,
        piece,
        1,
        1,
        piece.moves.get("NW-SE") ?? new Set<TileData>(),
        moves
      );
  }

  if (
    (prevRank > piece.rank && prevFile > piece.file) ||
    (prevRank < piece.rank && prevFile < piece.file) ||
    !moved
  ) {
    if (moved) {
      // Remove current position
      piece.moves.get("NW-SE")?.delete(board[rank * 8 + file]);
      board[rank * 8 + file].attackers.delete(piece);

      // Add previous position
      piece.moves.get("NW-SE")?.add(board[prevRank * 8 + prevFile]);
      moves.add(board[prevRank * 8 + prevFile]);

      // Remove all moves along NE-SW diagonal
      piece.moves.get("NE-SW")?.forEach((move) => {
        move.attackers.delete(piece);
      });
      piece.moves.get("NE-SW")?.clear();
    }

    // Upper right diagonal
    if (rank > 0 && file < 7)
      addStraightMoves(
        board,
        piece,
        -1,
        1,
        piece.moves.get("NE-SW") ?? new Set<TileData>(),
        moves
      );

    // Lower left diagonal
    if (rank < 7 && file > 0)
      addStraightMoves(
        board,
        piece,
        1,
        -1,
        piece.moves.get("NE-SW") ?? new Set<TileData>(),
        moves
      );
  }
  return moves;
}

export function bishopBlock(
  piece: PieceData,
  blockedPos: [dimension, dimension]
): Set<TileData> {
  const [blockedRank, blockedFile] = blockedPos;
  let rankDirection: -1 | 1;
  let fileDirection: -1 | 1;
  let moves: Set<TileData>;
  if (piece.rank > blockedRank && piece.file > blockedFile) {
    rankDirection = -1;
    fileDirection = -1;
    moves = piece.moves.get("NW-SE") ?? new Set<TileData>();
  } else if (piece.rank > blockedRank && piece.file < blockedFile) {
    rankDirection = -1;
    fileDirection = 1;
    moves = piece.moves.get("NE-SW") ?? new Set<TileData>();
  } else if (piece.rank < blockedRank && piece.file < blockedFile) {
    rankDirection = 1;
    fileDirection = 1;
    moves = piece.moves.get("NW-SE") ?? new Set<TileData>();
  } else {
    rankDirection = 1;
    fileDirection = -1;
    moves = piece.moves.get("NE-SW") ?? new Set<TileData>();
  }

  const blockedMoves = new Set<TileData>();
  // Remove moves now blocked
  for (const move of moves) {
    if (
      move.rank * rankDirection > blockedRank * rankDirection &&
      move.file * fileDirection > blockedFile * fileDirection
    ) {
      moves.delete(move);
      blockedMoves.add(move);
    }
  }
  return blockedMoves;
}

export function bishopUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedPos: [dimension, dimension]
): Set<TileData> {
  const [unblockedRank, unblockedFile] = unblockedPos;
  let rankDirection: -1 | 1;
  let fileDirection: -1 | 1;
  let moves: Set<TileData>;
  if (piece.rank > unblockedRank && piece.file > unblockedFile) {
    rankDirection = -1;
    fileDirection = -1;
    moves = piece.moves.get("NW-SE") ?? new Set<TileData>();
  } else if (piece.rank > unblockedRank && piece.file < unblockedFile) {
    rankDirection = -1;
    fileDirection = 1;
    moves = piece.moves.get("NE-SW") ?? new Set<TileData>();
  } else if (piece.rank < unblockedRank && piece.file < unblockedFile) {
    rankDirection = 1;
    fileDirection = 1;
    moves = piece.moves.get("NW-SE") ?? new Set<TileData>();
  } else {
    rankDirection = 1;
    fileDirection = -1;
    moves = piece.moves.get("NE-SW") ?? new Set<TileData>();
  }

  const unblockedMoves = new Set<TileData>();

  if (
    (rankDirection === -1 &&
      fileDirection === -1 &&
      unblockedRank > 0 &&
      unblockedFile > 0) ||
    (rankDirection === -1 &&
      fileDirection === 1 &&
      unblockedRank > 0 &&
      unblockedFile < 7) ||
    (rankDirection === 1 &&
      fileDirection === 1 &&
      unblockedRank < 7 &&
      unblockedFile < 7) ||
    (rankDirection === 1 &&
      fileDirection === -1 &&
      unblockedRank < 7 &&
      unblockedFile > 0)
  ) {
    // Insert moves now possible
    let i = unblockedRank + rankDirection;
    let j = unblockedFile + fileDirection;
    do {
      moves.add(board[i * 8 + j]);
      unblockedMoves.add(board[i * 8 + j]);
      i += rankDirection;
      j += fileDirection;
    } while (
      i >= 0 &&
      i < 8 &&
      j >= 0 &&
      j < 8 &&
      !board[(i - rankDirection) * 8 + (j - fileDirection)].piece
    );
  }
  return unblockedMoves;
}
