import type { dimension, PieceData, TileData } from "../types.ts";

export function pawnMoves(piece: PieceData, board: TileData[]): Set<TileData> {
  const moves = new Set<TileData>();
  const [rank, file] = [piece.rank, piece.file];
  const color = piece.color;

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

  if (rank !== rankLimit) {
    // one spot ahead
    moves.add(board[(rank + direction) * 8 + file]);

    // two spots ahead
    if (rank == startRank && !board[(rank + direction) * 8 + file].piece)
      moves.add(board[(rank + 2 * direction) * 8 + file]);

    // left & right captures
    if (file > 0) moves.add(board[(rank + direction) * 8 + file - 1]);
    if (file < 7) moves.add(board[(rank + direction) * 8 + file + 1]);

    // // capture on right
    // if (
    //   file < 7 &&
    //   board[(rank + direction) * 8 + file + 1].piece &&
    //   board[(rank + direction) * 8 + file + 1].piece!.color !== color
    // )
    //   moves.add(board[(rank + direction) * 8 + file + 1]);

    // // capture on left
    // if (
    //   file > 0 &&
    //   board[(rank + direction) * 8 + file - 1].piece &&
    //   board[(rank + direction) * 8 + file - 1].piece!.color !== color
    // )
    //   moves.add(board[(rank + direction) * 8 + file - 1]);

    // // en passant on right
    // if (
    //   rank == enPassantRank &&
    //   file < 7 &&
    //   board[rank * 8 + file + 1].piece?.type === "pawn" &&
    //   board[rank * 8 + file + 1].piece?.color !== color &&
    //   board[rank * 8 + file + 1].piece?.params.get("movedTwo")
    // ) {
    //   moves.add(board[(rank + direction) * 8 + file + 1]);
    //   piece.params.set("en passant", true);
    // }

    // // en passant on left
    // if (
    //   rank == enPassantRank &&
    //   file > 0 &&
    //   board[rank * 8 + file - 1].piece?.type === "pawn" &&
    //   board[rank * 8 + file - 1].piece?.color !== color &&
    //   board[rank * 8 + file + 1].piece?.params.get("movedTwo")
    // ) {
    //   moves.add(board[(rank + direction) * 8 + file - 1]);
    //   piece.params.set("en passant", true);
    // }
  }

  return moves;
}

export function pawnBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  void board;
  const [blockedRank, blockedFile] = blockedPos;
  const canMoveTwo =
    (piece.color === "white" && piece.rank === 6) ||
    (piece.color === "black" && piece.rank === 1);

  const blockedMoves = new Set<TileData>();

  // Remove moves now blocked
  for (const move of piece.moves) {
    // Remove two square move if applicable
    if (
      canMoveTwo && // check if pawn can move two
      move.file === blockedFile && // check that move is forward
      Math.abs(piece.rank - blockedRank) === 1
    )
      blockedMoves.add(move);
  }

  return blockedMoves;
}

export function pawnUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedPos: [dimension, dimension]
): Set<TileData> {
  const [unblockedRank, unblockedFile] = unblockedPos;
  const direction = piece.color === "white" ? -1 : 1;
  const canMoveTwo =
    (piece.color === "white" && piece.rank === 6) ||
    (piece.color === "black" && piece.rank === 1);

  const unblockedMoves = new Set<TileData>();

  // Insert two square move if possible
  if (
    canMoveTwo &&
    piece.file === unblockedFile &&
    Math.abs(piece.rank - unblockedRank) === 1
  )
    unblockedMoves.add(board[(unblockedRank + direction) * 8 + unblockedFile]);

  return unblockedMoves;
}

export function checkPawnCaptures(
  moves: Set<TileData>,
  board: TileData[],
  pawn: PieceData
): Set<TileData> {
  if (pawn.type !== "pawn") return new Set([...moves]);

  const filteredMoves = new Set<TileData>();

  // Add forward move(s)
  moves.forEach((move) => {
    if (board[+move.id].file === pawn.file) filteredMoves.add(board[+move.id]);
  });

  const [rank, file] = [pawn.rank, pawn.file];
  const color = pawn.color === "white" ? "black" : "white";
  const direction = pawn.color === "white" ? -1 : 1;
  const leftTile = file === 0 ? null : board[(rank + direction) * 8 + file - 1];
  const leftPassant = file === 0 ? null : board[rank * 8 + file - 1];
  const rightTile =
    file === 7 ? null : board[(rank + direction) * 8 + file + 1];
  const rightPassant = file === 7 ? null : board[rank * 8 + file + 1];

  // check left capture
  if (
    leftTile?.piece?.color === color ||
    // check left en passant
    leftPassant?.piece?.params.get("movedTwo")
  )
    filteredMoves.add(leftTile!);

  // check right capture
  if (
    rightTile?.piece?.color === color ||
    // check right en passant
    rightPassant?.piece?.params.get("movedTwo")
  )
    filteredMoves.add(rightTile!);

  return filteredMoves;
}
