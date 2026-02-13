import type { dimension, PieceData, TileData, Move } from "../types.ts";
import { addStraightMoves } from "./Queen.ts";

/**
 * Calculates all bishop moves and stores them in piece's moveset. Move types:
 * - "NW-SE": Moves along upper left and lower right diagonal
 * - "NE-SW": Moves along upper right and lower left diagonal
 * @param piece PieecData object
 * @param board Array of 64 TileData objects representing board
 * @param lastMove Piece's previous position, if applicable
 * @returns Set of all possible moves
 */
export function bishopMoves(
  piece: PieceData,
  board: TileData[],
  lastMove: Move | null,
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  // Ensure move types exist
  if (!piece.moves.has("NW-SE")) piece.moves.set("NW-SE", new Set<TileData>());
  if (!piece.moves.has("NE-SW")) piece.moves.set("NE-SW", new Set<TileData>());

  const moved = lastMove !== null;

  // Determine which axis rook moved along
  const sourceTile = lastMove ? board[+lastMove.from] : null;
  const [prevRank, prevFile] = [
    sourceTile?.rank ?? rank,
    sourceTile?.file ?? file,
  ];

  if (
    !moved ||
    (prevRank > rank && prevFile < file) ||
    (prevRank < rank && prevFile > file)
  ) {
    if (moved) {
      // Remove current position
      piece.moves.get("NE-SW")?.delete(board[rank * 8 + file]);
      board[rank * 8 + file].attackers.delete(piece);

      // Add previous position
      piece.moves.get("NE-SW")?.add(board[prevRank * 8 + prevFile]);
      moves.add(board[prevRank * 8 + prevFile]);

      // Remove all moves along NW-SE diagonal
      piece.moves.get("NW-SE")?.forEach((move) => move.attackers.delete(piece));
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
        moves,
      );

    // Lower right diagonal
    if (rank < 7 && file < 7)
      addStraightMoves(
        board,
        piece,
        1,
        1,
        piece.moves.get("NW-SE") ?? new Set<TileData>(),
        moves,
      );

    // Upper right diagonal (after capture)
    if (
      rank > 0 &&
      file < 7 &&
      lastMove?.capture &&
      prevRank > rank &&
      prevFile < file
    )
      addStraightMoves(
        board,
        piece,
        -1,
        1,
        piece.moves.get("NE-SW") ?? new Set<TileData>(),
        moves,
      );

    // Lower left diagonal (after capture)
    if (
      rank < 7 &&
      file > 0 &&
      lastMove?.capture &&
      prevRank < rank &&
      prevFile > file
    )
      addStraightMoves(
        board,
        piece,
        1,
        -1,
        piece.moves.get("NE-SW") ?? new Set<TileData>(),
        moves,
      );
  }

  if (
    !moved ||
    (prevRank > rank && prevFile > file) ||
    (prevRank < rank && prevFile < file)
  ) {
    if (moved) {
      // Remove current position
      piece.moves.get("NW-SE")?.delete(board[rank * 8 + file]);
      board[rank * 8 + file].attackers.delete(piece);

      // Add previous position
      piece.moves.get("NW-SE")?.add(board[prevRank * 8 + prevFile]);
      moves.add(board[prevRank * 8 + prevFile]);

      // Remove all moves along NE-SW diagonal
      piece.moves.get("NE-SW")?.forEach((move) => move.attackers.delete(piece));
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
        moves,
      );

    // Lower left diagonal
    if (rank < 7 && file > 0)
      addStraightMoves(
        board,
        piece,
        1,
        -1,
        piece.moves.get("NE-SW") ?? new Set<TileData>(),
        moves,
      );

    // Upper left diagonal (after capture)
    if (
      rank > 0 &&
      file > 0 &&
      lastMove?.capture &&
      prevRank > rank &&
      prevFile > file
    )
      addStraightMoves(
        board,
        piece,
        -1,
        -1,
        piece.moves.get("NW-SE") ?? new Set<TileData>(),
        moves,
      );

    // Lower right diagonal (after capture)
    if (
      rank < 7 &&
      file < 7 &&
      lastMove?.capture &&
      prevRank < rank &&
      prevFile < file
    )
      addStraightMoves(
        board,
        piece,
        1,
        1,
        piece.moves.get("NW-SE") ?? new Set<TileData>(),
        moves,
      );
  }
  return moves;
}

export function bishopBlock(
  piece: PieceData,
  blockedRank: dimension,
  blockedFile: dimension,
): Set<TileData> {
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
  unblockedRank: dimension,
  unblockedFile: dimension,
): Set<TileData> {
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
