import type { dimension, PieceData, TileData } from "../types.ts";
import { addStraightMoves } from "./Queen.ts";

export function rookMoves(
  piece: PieceData,
  board: TileData[],
  prevPos: [dimension, dimension]
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  // Determine which axis rook moved along
  const [prevRank, prevFile] = prevPos;

  if (!piece.moves.has("N-S")) piece.moves.set("N-S", new Set<TileData>());
  if (!piece.moves.has("W-E")) piece.moves.set("W-E", new Set<TileData>());

  const moved = rank !== prevRank || file !== prevFile;

  if (prevFile !== piece.file || !moved) {
    if (moved) {
      // Remove current position
      piece.moves.get("W-E")?.delete(board[rank * 8 + file]);
      board[rank * 8 + file].attackers.delete(piece);

      // Add previous position
      piece.moves.get("W-E")?.add(board[prevRank * 8 + prevFile]);
      moves.add(board[prevRank * 8 + prevFile]);

      // Remove all vertical moves
      piece.moves.get("N-S")?.forEach((move) => {
        move.attackers.delete(piece);
      });
      piece.moves.get("N-S")?.clear();
    }

    // Add new upward moves
    if (rank > 0)
      addStraightMoves(
        board,
        piece,
        -1,
        0,
        piece.moves.get("N-S") ?? new Set<TileData>(),
        moves
      );

    // Add new downward moves
    if (rank < 7)
      addStraightMoves(
        board,
        piece,
        1,
        0,
        piece.moves.get("N-S") ?? new Set<TileData>(),
        moves
      );
  }

  if (prevRank !== piece.rank || !moved) {
    if (moved) {
      // Remove current position
      piece.moves.get("N-S")?.delete(board[rank * 8 + file]);
      board[rank * 8 + file].attackers.delete(piece);

      // Add previous position
      piece.moves.get("N-S")?.add(board[prevRank * 8 + prevFile]);
      moves.add(board[prevRank * 8 + prevFile]);

      // Delete all horizontal moves
      piece.moves.get("W-E")?.forEach((move) => {
        move.attackers.delete(piece);
      });
      piece.moves.get("W-E")?.clear();
    }

    // Add new left moves
    if (file > 0)
      addStraightMoves(
        board,
        piece,
        0,
        -1,
        piece.moves.get("W-E") ?? new Set<TileData>(),
        moves
      );

    // Add new right moves
    if (file < 7)
      addStraightMoves(
        board,
        piece,
        0,
        1,
        piece.moves.get("W-E") ?? new Set<TileData>(),
        moves
      );
  }
  return moves;
}

export function rookMovesAfterCastle(
  piece: PieceData,
  board: TileData[]
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  const verticalDir = piece.color === "white" ? -1 : 1;
  const horizontalDir = piece.file === 3 ? 1 : -1;

  // Clear all moves
  piece.moves.get("N-S")?.forEach((move) => move.attackers.delete(piece));
  piece.moves.get("N-S")?.clear();
  piece.moves.get("W-E")?.forEach((move) => move.attackers.delete(piece));
  piece.moves.get("W-E")?.clear();

  // Recalculate moves for open vertical
  addStraightMoves(
    board,
    piece,
    verticalDir,
    0,
    piece.moves.get("N-S") ?? new Set<TileData>(),
    moves
  );

  // Recalculate moves for open horizontal
  addStraightMoves(
    board,
    piece,
    0,
    horizontalDir,
    piece.moves.get("W-E") ?? new Set<TileData>(),
    moves
  );

  // Add move in direction of king
  piece.moves.get("W-E")?.add(board[rank * 8 + file - (file === 3 ? 1 : -1)]);

  return moves;
}

export function rookBlock(
  piece: PieceData,
  blockedPos: [dimension, dimension]
): Set<TileData> {
  const [blockedRank, blockedFile] = blockedPos;

  let direction: -1 | 1;
  let moves: Set<TileData>;
  if (piece.rank > blockedRank) {
    direction = -1;
    moves = piece.moves.get("N-S") ?? new Set<TileData>();
  } else if (piece.rank < blockedRank) {
    direction = 1;
    moves = piece.moves.get("N-S") ?? new Set<TileData>();
  } else if (piece.file > blockedFile) {
    direction = -1;
    moves = piece.moves.get("W-E") ?? new Set<TileData>();
  } else {
    direction = 1;
    moves = piece.moves.get("W-E") ?? new Set<TileData>();
  }

  const blockedMoves = new Set<TileData>();
  // Remove moves now blocked
  for (const move of moves) {
    if (
      (piece.rank === blockedRank &&
        move.file * direction > blockedFile * direction) ||
      (piece.file === blockedFile &&
        move.rank * direction > blockedRank * direction)
    ) {
      moves.delete(move);
      blockedMoves.add(move);
    }
  }
  return blockedMoves;
}

export function rookUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedPos: [dimension, dimension]
): Set<TileData> {
  const [unblockedRank, unblockedFile] = unblockedPos;
  let direction: -1 | 1;
  let moves: Set<TileData>;
  if (piece.rank > unblockedRank) {
    direction = -1;
    moves = piece.moves.get("N-S") ?? new Set<TileData>();
  } else if (piece.rank < unblockedRank) {
    direction = 1;
    moves = piece.moves.get("N-S") ?? new Set<TileData>();
  } else if (piece.file > unblockedFile) {
    direction = -1;
    moves = piece.moves.get("W-E") ?? new Set<TileData>();
  } else {
    direction = 1;
    moves = piece.moves.get("W-E") ?? new Set<TileData>();
  }

  const unblockedMoves = new Set<TileData>();

  // Insert moves now possible
  if (
    piece.rank === unblockedRank &&
    ((direction === 1 && unblockedFile < 7) ||
      (direction === -1 && unblockedFile > 0))
  ) {
    let i = unblockedFile + direction;
    do {
      moves.add(board[piece.rank * 8 + i]);
      unblockedMoves.add(board[piece.rank * 8 + i]);
      i += direction;
    } while (i >= 0 && i < 8 && !board[piece.rank * 8 + (i - direction)].piece);
  } else if (
    piece.file === unblockedFile &&
    ((direction === 1 && unblockedRank < 7) ||
      (direction === -1 && unblockedRank > 0))
  ) {
    let i = unblockedRank + direction;
    do {
      moves.add(board[i * 8 + piece.file]);
      unblockedMoves.add(board[i * 8 + piece.file]);
      i += direction;
    } while (i >= 0 && i < 8 && !board[(i - direction) * 8 + piece.file].piece);
  }

  return unblockedMoves;
}
