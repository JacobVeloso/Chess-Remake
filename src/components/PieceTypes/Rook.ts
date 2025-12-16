import type { dimension, PieceData, TileData } from "../types.ts";

export function rookMoves(piece: PieceData, board: TileData[]): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  // const color = piece.color;
  piece.moves = new Set<TileData>();
  // if (checkBlocks && checkBlocks.size === 0) return piece.moves;

  // // Check if rook is pinned to king
  // let pinBlocks: Set<TileData> | null = null;
  // for (const tile of board) {
  //   if (tile.piece?.type === "king" && tile.piece?.color === color) {
  //     pinBlocks = getPinBlocks(board, [tile.rank, tile.file], [rank, file]);
  //     if (pinBlocks) {
  //       // If pin is not along straight, bishop cannot move
  //       const pinBlock = [...pinBlocks][0];
  //       if (pinBlock.rank !== piece.rank || pinBlock.file !== piece.file)
  //         return piece.moves;
  //     }
  //     break;
  //   }
  // }

  // Up
  let i = rank - 1;
  let j = file;
  for (; i >= 0; --i) {
    const index = i * 8 + j;
    // // Capture
    // if (board[index].piece && board[index].piece?.color != color) {
    //   piece.moves.add(board[index]);
    //   break;
    // }
    // // Piece blocking
    // if (board[index].piece) {
    //   piece.moves.add(board[index]);
    //   break;
    // }
    piece.moves.add(board[index]);
  }

  // Right
  i = rank;
  j = file + 1;
  for (; j < 8; ++j) {
    const index = i * 8 + j;
    // // Capture
    // if (board[index].piece && board[index].piece?.color != color) {
    //   piece.moves.add(board[index]);
    //   break;
    // }
    // // Piece blocking
    // if (board[index].piece) {
    //   piece.moves.add(board[index]);
    //   break;
    // }
    piece.moves.add(board[index]);
  }

  // Down
  i = rank + 1;
  j = file;
  for (; i < 8; ++i) {
    const index = i * 8 + j;
    // // Capture
    // if (board[index].piece && board[index].piece?.color != color) {
    //   piece.moves.add(board[index]);
    //   break;
    // }
    // // Piece blocking
    // if (board[index].piece) {
    //   piece.moves.add(board[index]);
    //   break;
    // }
    piece.moves.add(board[index]);
  }

  // Left
  i = rank;
  j = file - 1;
  for (; j >= 0; --j) {
    const index = i * 8 + j;
    // // Capture
    // if (board[index].piece && board[index].piece?.color != color) {
    //   piece.moves.add(board[index]);
    //   break;
    // }
    // // Piece blocking
    // if (board[index].piece) {
    //   piece.moves.add(board[index]);
    //   break;
    // }
    piece.moves.add(board[index]);
  }

  // // Filter out moves that put king in check
  // if (pinBlocks) filterMoves(piece.moves, pinBlocks);

  // // Filter out moves that don't block check
  // if (checkBlocks) filterMoves(piece.moves, checkBlocks);

  return piece.moves;
}

export function rookBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  void board;
  const [blockedRank, blockedFile] = blockedPos;
  const direction =
    piece.rank > blockedRank
      ? -1
      : piece.rank < blockedRank
      ? 1
      : piece.file > blockedFile
      ? -1
      : 1;

  const blockedMoves = new Set<TileData>();
  // Remove moves now blocked
  for (const move of piece.moves) {
    if (
      (piece.rank === blockedRank &&
        move.file * direction > blockedFile * direction) ||
      (piece.file === blockedFile &&
        move.rank * direction > blockedRank * direction)
    ) {
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
  const direction =
    piece.rank > unblockedRank
      ? -1
      : piece.rank < unblockedRank
      ? 1
      : piece.file > unblockedFile
      ? -1
      : 1;

  const unblockedMoves = new Set<TileData>();

  // Insert moves now possible
  if (piece.rank === unblockedRank) {
    for (
      let i = unblockedFile;
      i >= 0 &&
      i < 8 &&
      !board[(piece.rank - direction) * 8 + (i - direction)].piece;
      i += direction
    ) {
      unblockedMoves.add(board[piece.rank * 8 + i]);
    }
  } else {
    for (
      let i = unblockedRank;
      i >= 0 && i < 8 && !board[(i - direction) * 8 + (piece.file - direction)];
      i += direction
    ) {
      unblockedMoves.add(board[i * 8 + piece.file]);
    }
  }

  return unblockedMoves;
}
