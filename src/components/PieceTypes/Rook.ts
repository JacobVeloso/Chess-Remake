import type { dimension, PieceData, TileData } from "../types.ts";

export function rookMoves(
  piece: PieceData,
  board: TileData[],
  prevPos: [dimension, dimension]
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  // Determine which axis rook moved along
  const [prevRank, prevFile] = prevPos;
  if (prevFile !== piece.file) {
    piece.moves.get("N")?.forEach((move) => {
      move.attackers.delete(piece);
    });
    piece.moves.get("N")?.clear();
    piece.moves.get("S")?.forEach((move) => {
      move.attackers.delete(piece);
    });
    piece.moves.get("S")?.clear();

    // Up
    if (rank > 0) {
      let i = rank - 1;
      let j = file;
      do {
        const index = i * 8 + j;
        piece.moves.get("N")?.add(board[index]);
        moves.add(board[index]);
        --i;
      } while (i >= 0 && !board[(i - 1) * 8 + j].piece);
    }

    // Down
    if (rank < 7) {
      let i = rank + 1;
      let j = file;
      do {
        const index = i * 8 + j;
        piece.moves.get("S")?.add(board[index]);
        moves.add(board[index]);
        ++i;
      } while (i < 8 && !board[(i - 1) * 8 + j].piece);
    }

    // Add previous position
    moves.add(board[prevRank * 8 + prevFile]);
  }

  if (prevRank !== piece.rank) {
    piece.moves.get("W")?.forEach((move) => {
      move.attackers.delete(piece);
    });
    piece.moves.get("W")?.clear();
    piece.moves.get("E")?.forEach((move) => {
      move.attackers.delete(piece);
    });
    piece.moves.get("E")?.clear();

    // Left
    if (file > 0) {
      let i = rank;
      let j = file - 1;
      do {
        const index = i * 8 + j;
        piece.moves.get("W")?.add(board[index]);
        moves.add(board[index]);
        --j;
      } while (j >= 0 && !board[i * 8 + (j + 1)].piece);
    }

    // Right
    if (file < 7) {
      let i = rank;
      let j = file + 1;
      do {
        const index = i * 8 + j;
        piece.moves.get("E")?.add(board[index]);
        moves.add(board[index]);
        ++j;
      } while (j < 8 && !board[i * 8 + (j - 1)].piece);
    }

    // Add previous position
    moves.add(board[prevRank * 8 + prevFile]);
  }
  return moves;
}

export function rookMovesAfterCastle(
  piece: PieceData,
  board: TileData[]
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();
  const openVertical =
    piece.color === "white" ? piece.moves.get("N") : piece.moves.get("S");
  const blockedVertical =
    piece.color === "white" ? piece.moves.get("S") : piece.moves.get("N");
  const openHorizontal =
    piece.file === 3 ? piece.moves.get("W") : piece.moves.get("E");
  const blockedHorizontal =
    piece.file === 3 ? piece.moves.get("E") : piece.moves.get("W");

  const verticalDir = piece.color === "white" ? -1 : 1;
  const horizontalDir = piece.file === 3 ? 1 : -1;

  // Clear all moves
  openVertical?.forEach((move) => move.attackers.delete(piece));
  openVertical?.clear();
  blockedVertical?.forEach((move) => move.attackers.delete(piece));
  blockedVertical?.clear();
  openHorizontal?.forEach((move) => move.attackers.delete(piece));
  openHorizontal?.clear();
  blockedHorizontal?.forEach((move) => move.attackers.delete(piece));
  blockedHorizontal?.clear();

  // Recalculate moves for open vertical
  let i = rank + verticalDir;
  let j = file;
  do {
    const index = i * 8 + j;
    openVertical?.add(board[index]);
    i += verticalDir;
  } while (i >= 0 && i < 8 && !board[(i - verticalDir) * 8 + j].piece);

  // Recalculate moves for open horizontal
  i = rank;
  j += horizontalDir;
  do {
    const index = i * 8 + j;
    openHorizontal?.add(board[index]);
    j += horizontalDir;
  } while (j >= 0 && j < 8 && !board[i * 8 + (j - horizontalDir)].piece);

  // Add move in direction of king
  blockedHorizontal?.add(board[rank * 8 + file - (file === 3 ? 1 : -1)]);

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
    moves = piece.moves.get("N") ?? new Set<TileData>();
  } else if (piece.rank < blockedRank) {
    direction = 1;
    moves = piece.moves.get("S") ?? new Set<TileData>();
  } else if (piece.file > blockedFile) {
    direction = -1;
    moves = piece.moves.get("W") ?? new Set<TileData>();
  } else {
    direction = 1;
    moves = piece.moves.get("E") ?? new Set<TileData>();
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
    moves = piece.moves.get("N") ?? new Set<TileData>();
  } else if (piece.rank < unblockedRank) {
    direction = 1;
    moves = piece.moves.get("S") ?? new Set<TileData>();
  } else if (piece.file > unblockedFile) {
    direction = -1;
    moves = piece.moves.get("W") ?? new Set<TileData>();
  } else {
    direction = 1;
    moves = piece.moves.get("E") ?? new Set<TileData>();
  }

  const unblockedMoves = new Set<TileData>();

  // Insert moves now possible
  if (piece.rank === unblockedRank) {
    let i = unblockedFile + direction;
    do {
      moves.add(board[piece.rank * 8 + i]);
      unblockedMoves.add(board[piece.rank * 8 + i]);
      i += direction;
    } while (i >= 0 && i < 8 && !board[piece.rank * 8 + (i - direction)].piece);
  } else {
    let i = unblockedRank + direction;
    do {
      moves.add(board[i * 8 + piece.file]);
      unblockedMoves.add(board[i * 8 + piece.file]);
      i += direction;
    } while (i >= 0 && i < 8 && !board[(i - direction) * 8 + piece.file]);
  }

  return unblockedMoves;
}
