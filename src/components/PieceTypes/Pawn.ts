import type { dimension, PieceData, TileData } from "../types.ts";

export function pawnMoves(piece: PieceData, board: TileData[]): Set<TileData> {
  piece.moves = new Set<TileData>();
  const [rank, file] = [piece.rank, piece.file];
  const color = piece.color;
  // if (checkBlocks && checkBlocks.size === 0) return piece.moves;

  // // Check if pawn is pinned to king
  // for (const tile of board) {
  //   if (tile.piece?.type === "king" && tile.piece?.color === color) {
  //     const pinBlocks = getPinBlocks(
  //       board,
  //       [tile.rank, tile.file],
  //       [rank, file]
  //     );
  //     if (pinBlocks) {
  //       // if pin is not along same file, pawn cannot move
  //       if ([...pinBlocks][0].file !== file) return piece.moves;
  //     }
  //     break;
  //   }
  // }

  let startRank: 6 | 1;
  let enPassantRank: 3 | 4;
  let direction: -1 | 1;
  let rankLimit: 0 | 7;
  if (color === "white") {
    startRank = 6;
    enPassantRank = 3;
    direction = -1;
    rankLimit = 0;
  } else {
    startRank = 1;
    enPassantRank = 4;
    direction = 1;
    rankLimit = 7;
  }

  if (rank != rankLimit) {
    // one spot ahead
    piece.moves.add(board[(rank + direction) * 8 + file]);

    // two spots ahead
    if (rank == startRank)
      piece.moves.add(board[(rank + 2 * direction) * 8 + file]);

    // capture on right
    if (
      file < 7 &&
      board[(rank + direction) * 8 + file + 1].piece &&
      board[(rank + direction) * 8 + file + 1].piece!.color !== color
    )
      piece.moves.add(board[(rank + direction) * 8 + file + 1]);

    // capture on left
    if (
      file > 0 &&
      board[(rank + direction) * 8 + file - 1].piece &&
      board[(rank + direction) * 8 + file - 1].piece!.color !== color
    )
      piece.moves.add(board[(rank + direction) * 8 + file - 1]);

    // en passant on right
    if (
      rank == enPassantRank &&
      file < 7 &&
      board[rank * 8 + file + 1].piece?.type === "pawn" &&
      board[rank * 8 + file + 1].piece?.color !== color &&
      board[rank * 8 + file + 1].piece?.params.get("movedTwo")
    ) {
      piece.moves.add(board[(rank + direction) * 8 + file + 1]);
      piece.params.set("en passant", true);
    }

    // en passant on left
    if (
      rank == enPassantRank &&
      file > 0 &&
      board[rank * 8 + file - 1].piece?.type === "pawn" &&
      board[rank * 8 + file - 1].piece?.color !== color &&
      board[rank * 8 + file + 1].piece?.params.get("movedTwo")
    ) {
      piece.moves.add(board[(rank + direction) * 8 + file - 1]);
      piece.params.set("en passant", true);
    }
  }

  // // Restrict moves if king is in check
  // if (checkBlocks) filterMoves(piece.moves, checkBlocks);

  return piece.moves;
}

export function pawnBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  void board;
  const [blockedRank, blockedFile] = blockedPos;
  const color = piece.color;
  const canMoveTwo =
    (color === "white" && piece.rank === 6) ||
    (color === "black" && piece.rank === 1);

  const blockedMoves = new Set<TileData>();

  // Remove moves now blocked
  for (const move of piece.moves) {
    // Remove blocked tile
    if (move.file === blockedFile && move.rank === blockedRank) {
      piece.moves.delete(move);
      blockedMoves.add(move);
    }

    // Remove two square move if applicable
    else if (
      canMoveTwo && // check if pawn can move two
      move.file === blockedFile && // check that move is forward
      Math.abs(move.rank - piece.rank) === 2
    ) {
      piece.moves.delete(move);
      blockedMoves.add(move);
    }
  }

  return blockedMoves;
}

export function pawnUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedPos: [dimension, dimension]
): Set<TileData> {
  const [ownRank, ownFile] = [piece.rank, piece.file];
  const [unblockedRank, unblockedFile] = unblockedPos;
  const color = piece.color;
  const direction = color === "white" ? -1 : 1;
  const canMoveTwo =
    (color === "white" && ownRank === 6) ||
    (color === "black" && ownRank === 1);

  // Insert moves now possible
  if (unblockedFile === ownFile) {
    piece.moves.add(board[unblockedRank * 8 + unblockedFile]);
    if (canMoveTwo && Math.abs(ownRank - unblockedRank) === 1) {
      piece.moves.add(
        board[(unblockedRank + 1 * direction) * 8 + unblockedFile]
      );
    }
  }

  return piece.moves;
}
