import type { dimension, PieceData, TileData } from "../types.ts";

export function bishopMoves(
  piece: PieceData,
  board: TileData[],
  prevPos: [dimension, dimension]
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  // Determine which axis bishop moved along
  const [prevRank, prevFile] = prevPos;
  if (
    (prevRank > piece.rank && prevFile < piece.file) ||
    (prevRank < piece.rank && prevFile > piece.file)
  ) {
    piece.moves.get("NW")?.forEach((move) => {
      move.attackers.delete(piece);
    });
    piece.moves.get("NW")?.clear();
    piece.moves.get("SE")?.forEach((move) => {
      move.attackers.delete(piece);
    });
    piece.moves.get("SE")?.clear();

    // Upper left diagonal
    if (rank > 0 && file > 0) {
      let i = rank - 1;
      let j = file - 1;
      do {
        piece.moves.get("NW")?.add(board[i * 8 + j]);
        moves.add(board[i * 8 + j]);
        i -= 1;
        j -= 1;
      } while (i >= 0 && j >= 0 && !board[(i + 1) * 8 + (j + 1)].piece);
    }

    // Lower right diagonal
    if (rank < 7 && file < 7) {
      let i = rank + 1;
      let j = file + 1;
      do {
        piece.moves.get("SE")?.add(board[i * 8 + j]);
        moves.add(board[i * 8 + j]);
        i += 1;
        j += 1;
      } while (i < 8 && j < 8 && !board[(i - 1) * 8 + (j - 1)].piece);
    }

    // Add previous position
    moves.add(board[prevRank * 8 + prevFile]);
  }

  if (
    (prevRank > piece.rank && prevFile > piece.file) ||
    (prevRank < piece.rank && prevFile < piece.file)
  ) {
    piece.moves.get("NE")?.forEach((move) => {
      move.attackers.delete(piece);
    });
    piece.moves.get("NE")?.clear();
    piece.moves.get("SW")?.forEach((move) => {
      move.attackers.delete(piece);
    });
    piece.moves.get("SW")?.clear();

    // Upper right diagonal
    if (rank > 0 && file < 7) {
      let i = rank - 1;
      let j = file + 1;
      do {
        piece.moves.get("NE")?.add(board[i * 8 + j]);
        moves.add(board[i * 8 + j]);
        i -= 1;
        j += 1;
      } while (i >= 0 && j < 8 && !board[(i + 1) * 8 + (j - 1)].piece);
    }

    // Lower left diagonal
    if (rank < 7 && file > 0) {
      let i = rank + 1;
      let j = file - 1;
      do {
        piece.moves.get("SW")?.add(board[i * 8 + j]);
        moves.add(board[i * 8 + j]);
        i += 1;
        j -= 1;
      } while (i < 8 && j >= 0 && !board[(i - 1) * 8 + (j + 1)].piece);
    }

    // Add previous position
    moves.add(board[prevRank * 8 + prevFile]);
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
    moves = piece.moves.get("NW") ?? new Set<TileData>();
  } else if (piece.rank > blockedRank && piece.file < blockedFile) {
    rankDirection = -1;
    fileDirection = 1;
    moves = piece.moves.get("NE") ?? new Set<TileData>();
  } else if (piece.rank < blockedRank && piece.file < blockedFile) {
    rankDirection = 1;
    fileDirection = 1;
    moves = piece.moves.get("SE") ?? new Set<TileData>();
  } else {
    rankDirection = 1;
    fileDirection = -1;
    moves = piece.moves.get("SW") ?? new Set<TileData>();
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
    moves = piece.moves.get("NW") ?? new Set<TileData>();
  } else if (piece.rank > unblockedRank && piece.file < unblockedFile) {
    rankDirection = -1;
    fileDirection = 1;
    moves = piece.moves.get("NE") ?? new Set<TileData>();
  } else if (piece.rank < unblockedRank && piece.file < unblockedFile) {
    rankDirection = 1;
    fileDirection = 1;
    moves = piece.moves.get("SE") ?? new Set<TileData>();
  } else {
    rankDirection = 1;
    fileDirection = -1;
    moves = piece.moves.get("SW") ?? new Set<TileData>();
  }

  const unblockedMoves = new Set<TileData>();

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
  return unblockedMoves;
}
