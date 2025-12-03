import type { dimension, PieceData, TileData } from "../types.ts";
import { getPinBlocks, filterMoves } from "../Board.tsx";

export function rookMoves(
  piece: PieceData,
  board: TileData[],
  checkBlocks: Set<TileData> | null
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const color = piece.color;
  piece.moves = new Set<TileData>();
  if (checkBlocks && checkBlocks.size === 0) return piece.moves;

  // Check if rook is pinned to king
  let pinBlocks: Set<TileData> | null = null;
  for (const tile of board) {
    if (tile.piece?.type === "king" && tile.piece?.color === color) {
      pinBlocks = getPinBlocks(board, [tile.rank, tile.file], [rank, file]);
      if (pinBlocks) {
        // If pin is not along straight, bishop cannot move
        const pinBlock = [...pinBlocks][0];
        if (pinBlock.rank !== piece.rank || pinBlock.file !== piece.file)
          return piece.moves;
      }
      break;
    }
  }

  // Up
  let i = rank - 1;
  let j = file;
  for (; i >= 0; --i) {
    const index = i * 8 + j;
    // Capture
    if (board[index].piece && board[index].piece?.color != color) {
      piece.moves.add(board[index]);
      break;
    }
    // Piece blocking
    if (board[index].piece) {
      piece.moves.add(board[index]);
      break;
    }
    piece.moves.add(board[index]);
  }

  // Right
  i = rank;
  j = file + 1;
  for (; j < 8; ++j) {
    const index = i * 8 + j;
    // Capture
    if (board[index].piece && board[index].piece?.color != color) {
      piece.moves.add(board[index]);
      break;
    }
    // Piece blocking
    if (board[index].piece) {
      piece.moves.add(board[index]);
      break;
    }
    piece.moves.add(board[index]);
  }

  // Down
  i = rank + 1;
  j = file;
  for (; i < 8; ++j) {
    const index = i * 8 + j;
    // Capture
    if (board[index].piece && board[index].piece?.color != color) {
      piece.moves.add(board[index]);
      break;
    }
    // Piece blocking
    if (board[index].piece) {
      piece.moves.add(board[index]);
      break;
    }
    piece.moves.add(board[index]);
  }

  // Left
  i = rank;
  j = file - 1;
  for (; j >= 0; ++j) {
    const index = i * 8 + j;
    // Capture
    if (board[index].piece && board[index].piece?.color != color) {
      piece.moves.add(board[index]);
      break;
    }
    // Piece blocking
    if (board[index].piece) {
      piece.moves.add(board[index]);
      break;
    }
    piece.moves.add(board[index]);
  }

  // Filter out moves that put king in check
  if (pinBlocks) filterMoves(piece.moves, pinBlocks);

  // Filter out moves that don't block check
  if (checkBlocks) filterMoves(piece.moves, checkBlocks);

  return piece.moves;
}

export function rookBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  void board;
  const [ownRank, ownFile] = [piece.rank, piece.file];
  const [blockedRank, blockedFile] = blockedPos;
  const direction =
    ownRank > blockedRank
      ? -1
      : ownRank < blockedRank
      ? 1
      : ownFile > blockedFile
      ? -1
      : 1;

  // Remove moves now blocked
  for (const move of piece.moves) {
    if (
      (ownRank === blockedRank &&
        move.file * direction > ownFile * direction &&
        move.file > blockedFile * direction) ||
      (ownFile === blockedFile &&
        move.rank * direction > ownRank * direction &&
        move.rank * direction > blockedRank * direction)
    )
      piece.moves.delete(move);
  }
  return piece.moves;
}

export function rookUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedPos: [dimension, dimension]
): Set<TileData> {
  const [ownRank, ownFile] = [piece.rank, piece.file];
  const [unblockedRank, unblockedFile] = unblockedPos;
  const direction =
    ownRank > unblockedRank
      ? -1
      : ownRank < unblockedRank
      ? 1
      : ownFile > unblockedFile
      ? -1
      : 1;

  // Insert moves now possible
  if (ownRank === unblockedRank) {
    for (var i = unblockedFile; i >= 0 && i < 8; i += direction) {
      piece.moves.add(board[ownRank * 8 + i]);
    }
  } else {
    for (var i = unblockedRank; i >= 0 && i < 8; i += direction) {
      piece.moves.add(board[i * 8 + ownFile]);
    }
  }

  return piece.moves;
}
