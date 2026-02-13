import type { dimension, PieceData, TileData, Move } from "../types.ts";
import { deleteMoves } from "../Piece.tsx";
import { addStraightMoves } from "./Queen.ts";

/**
 * Calculates all rook moves and stores them in piece's moveset. Move types:
 * - "N-S": Moves in vertical direction
 * - "N-W": Moves in horizontal direction
 * @param piece PieecData object
 * @param board Array of 64 TileData objects representing board
 * @param lastMove Piece's previous position, if applicable
 * @returns Set of all possible moves
 */
export function rookMoves(
  piece: PieceData,
  board: TileData[],
  lastMove: Move | null = null,
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  // Ensure move types exist
  if (!piece.moves.has("N-S")) piece.moves.set("N-S", new Set<TileData>());
  if (!piece.moves.has("W-E")) piece.moves.set("W-E", new Set<TileData>());

  const moved = lastMove !== null;

  // Determine which axis rook moved along
  const sourceTile = lastMove ? board[+lastMove.from] : null;
  const [prevRank, prevFile] = [
    sourceTile?.rank ?? rank,
    sourceTile?.file ?? file,
  ];
  if (!moved || prevFile !== file) {
    if (moved) {
      // Remove current position
      piece.moves.get("W-E")?.delete(board[rank * 8 + file]);
      board[rank * 8 + file].attackers.delete(piece);

      // Add previous position
      piece.moves.get("W-E")?.add(board[prevRank * 8 + prevFile]);
      moves.add(board[prevRank * 8 + prevFile]);

      // Remove all vertical moves
      deleteMoves(piece, "N-S");
    }

    // Add new upward moves
    if (rank > 0)
      addStraightMoves(
        board,
        piece,
        -1,
        0,
        piece.moves.get("N-S") ?? new Set<TileData>(),
        moves,
      );

    // Add new downward moves
    if (rank < 7)
      addStraightMoves(
        board,
        piece,
        1,
        0,
        piece.moves.get("N-S") ?? new Set<TileData>(),
        moves,
      );

    // Add left moves (after capture)
    if (file > 0 && lastMove?.capture && prevFile > file)
      addStraightMoves(
        board,
        piece,
        0,
        -1,
        piece.moves.get("W-E") ?? new Set<TileData>(),
        moves,
      );

    // Add right moves (after capture)
    if (file < 7 && lastMove?.capture && prevFile < file)
      addStraightMoves(
        board,
        piece,
        0,
        1,
        piece.moves.get("W-E") ?? new Set<TileData>(),
        moves,
      );
  }

  if (!moved || prevRank !== rank) {
    if (moved) {
      // Remove current position
      piece.moves.get("N-S")?.delete(board[rank * 8 + file]);
      board[rank * 8 + file].attackers.delete(piece);

      // Add previous position
      piece.moves.get("N-S")?.add(board[prevRank * 8 + prevFile]);
      moves.add(board[prevRank * 8 + prevFile]);

      // Delete all horizontal moves
      deleteMoves(piece, "W-E");
    }

    // Add new left moves
    if (file > 0)
      addStraightMoves(
        board,
        piece,
        0,
        -1,
        piece.moves.get("W-E") ?? new Set<TileData>(),
        moves,
      );

    // Add new right moves
    if (file < 7)
      addStraightMoves(
        board,
        piece,
        0,
        1,
        piece.moves.get("W-E") ?? new Set<TileData>(),
        moves,
      );

    // Add upward moves (after capture)
    if (rank > 0 && lastMove?.capture && prevRank > rank)
      addStraightMoves(
        board,
        piece,
        -1,
        0,
        piece.moves.get("N-S") ?? new Set<TileData>(),
        moves,
      );

    // Add downward moves (after capture)
    if (rank < 7 && lastMove?.capture && prevRank < rank)
      addStraightMoves(
        board,
        piece,
        1,
        0,
        piece.moves.get("N-S") ?? new Set<TileData>(),
        moves,
      );
  }
  return moves;
}

/**
 * Calculates all rook moves when rook is moved due to a castle.
 * @param piece PieecData object
 * @param board Array of 64 TileData objects representing board
 * @returns Set of all possible moves
 */
export function rookMovesAfterCastle(
  piece: PieceData,
  board: TileData[],
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();
  const verticalDir = piece.color === "white" ? -1 : 1;
  const horizontalDir = piece.file === 3 ? 1 : -1;

  // Clear all moves
  deleteMoves(piece, "N-S");
  deleteMoves(piece, "W-E");

  // Calculate moves for open vertical
  addStraightMoves(
    board,
    piece,
    verticalDir,
    0,
    piece.moves.get("N-S") ?? new Set<TileData>(),
    moves,
  );

  // Calculate moves for open horizontal
  addStraightMoves(
    board,
    piece,
    0,
    horizontalDir,
    piece.moves.get("W-E") ?? new Set<TileData>(),
    moves,
  );

  // Add move in direction of king
  piece.moves.get("W-E")?.add(board[rank * 8 + file - (file === 3 ? 1 : -1)]);

  return moves;
}

/**
 * Calculates all moves that are no longer possible for a rook due to another piece blocking, and removes them from the piece's moveset.
 * @param piece PieceData object
 * @param blockedRank
 * @param blockedFile
 * @returns Set of moves no longer possible
 */
export function rookBlock(
  piece: PieceData,
  blockedRank: dimension,
  blockedFile: dimension,
): Set<TileData> {
  // Check if position actually blocks moves
  if (blockedRank !== piece.rank && blockedFile !== piece.file)
    return new Set();

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

/**
 * Calculates all moves that are now possible for a rook due to another unblocking, and adds them to the piece's moveset.
 * @param piece PieceData object
 * @param unblockedRank
 * @param unblockedFile
 * @returns Set of moves now possible
 */
export function rookUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedRank: dimension,
  unblockedFile: dimension,
): Set<TileData> {
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
