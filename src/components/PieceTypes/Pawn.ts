import type { dimension, PieceData, TileData, type } from "../types.ts";
import { calculateMoves } from "../MoveCalculation.ts";

export function pawnMoves(piece: PieceData, board: TileData[]): Set<TileData> {
  piece.moves.get("forward")?.forEach((move) => {
    move.attackers.delete(piece);
  });
  piece.moves.get("forward")?.clear();
  piece.moves.get("two square")?.forEach((move) => {
    move.attackers.delete(piece);
  });
  piece.moves.get("two square")?.clear();
  piece.moves.get("left capture")?.forEach((move) => {
    move.attackers.delete(piece);
  });
  piece.moves.get("left capture")?.clear();
  piece.moves.get("right capture")?.forEach((move) => {
    move.attackers.delete(piece);
  });
  piece.moves.get("right capture")?.clear();

  const moves = new Set<TileData>();
  const [rank, file] = [piece.rank, piece.file];
  const color = piece.color;

  let startRank: 6 | 1;
  let direction: -1 | 1;
  let rankLimit: 0 | 7;
  if (color === "white") {
    startRank = 6;
    direction = -1;
    rankLimit = 0;
  } else {
    startRank = 1;
    direction = 1;
    rankLimit = 7;
  }

  if (rank !== rankLimit) {
    // one spot ahead
    piece.moves.get("forward")?.add(board[(rank + direction) * 8 + file]);
    moves.add(board[(rank + direction) * 8 + file]);

    // two spots ahead
    if (rank == startRank && !board[(rank + direction) * 8 + file].piece) {
      piece.moves
        .get("two square")
        ?.add(board[(rank + 2 * direction) * 8 + file]);
      moves.add(board[(rank + 2 * direction) * 8 + file]);
    }

    // left & right captures
    if (file > 0) {
      piece.moves
        .get("left capture")
        ?.add(board[(rank + direction) * 8 + file - 1]);
      moves.add(board[(rank + direction) * 8 + file - 1]);
    }
    if (file < 7) {
      piece.moves
        .get("right capture")
        ?.add(board[(rank + direction) * 8 + file + 1]);
      moves.add(board[(rank + direction) * 8 + file + 1]);
    }
  }

  return moves;
}

export function pawnBlock(
  piece: PieceData,
  blockedPos: [dimension, dimension]
): Set<TileData> {
  const canMoveTwo =
    (piece.color === "white" && piece.rank === 6) ||
    (piece.color === "black" && piece.rank === 1);

  let blockedMoves = new Set<TileData>();

  // Remove two square move if applicable
  if (
    canMoveTwo && // check if pawn can move two
    piece.file === blockedPos[1] && // check that tile is in front of pawn
    Math.abs(piece.rank - blockedPos[0]) === 1 // check that tile in front of pawn is blocked
  ) {
    blockedMoves = new Set<TileData>(piece.moves.get("two square")!);
    piece.moves.get("two square")?.clear();
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
  ) {
    piece.moves
      .get("two square")
      ?.add(board[(unblockedRank + direction) * 8 + unblockedFile]);
    unblockedMoves.add(board[(unblockedRank + direction) * 8 + unblockedFile]);
  }

  return unblockedMoves;
}

export function checkPawnMoves(
  board: TileData[],
  pawn: PieceData
): Set<TileData> {
  if (pawn.type !== "pawn") return new Set<TileData>();

  const deletions = new Set<TileData>();

  const [rank, file] = [pawn.rank, pawn.file];

  // Check forward move
  const forward = pawn.moves.get("forward")!.values().next().value!;
  if (forward.piece) deletions.add(forward);

  // Check two square move
  if (pawn.moves.get("two square")!.size > 0) {
    const twoSquare = pawn.moves.get("two square")!.values().next().value!;
    if (twoSquare.piece) deletions.add(twoSquare);
  }

  // Check left move
  if (pawn.file !== 0 && pawn.moves.get("left capture")!.size > 0) {
    const left = pawn.moves.get("left capture")!.values().next().value!;
    if (
      // Regular capture
      (!left.piece || left.piece!.color === pawn.color) &&
      // en passant
      (!board[rank * 8 + file - 1].piece ||
        (board[rank * 8 + file - 1].piece &&
          !board[rank * 8 + file - 1].piece!.params.get("movedTwo")))
    )
      deletions.add(left);
  }

  // Check right move
  if (pawn.file !== 7 && pawn.moves.get("right capture")!.size > 0) {
    const right = pawn.moves.get("right capture")!.values().next().value!;
    if (
      // Regular capture
      (!right.piece || right.piece!.color === pawn.color) &&
      // en passant
      (!board[rank * 8 + file + 1].piece ||
        (board[rank * 8 + file + 1].piece &&
          !board[rank * 8 + file + 1].piece!.params.get("movedTwo")))
    )
      deletions.add(right);
  }
  return deletions;
}

export function promote(
  board: TileData[],
  piece: PieceData,
  newType: type
): void {
  if (piece.type !== "pawn") return;

  // Set new move types
  switch (newType) {
    case "queen":
      piece.moves.set("N-S", new Set<TileData>());
      piece.moves.set("W-E", new Set<TileData>());
      piece.moves.set("NW-SE", new Set<TileData>());
      piece.moves.set("NE-SW", new Set<TileData>());
      break;
    case "rook":
      piece.moves.set("N-S", new Set<TileData>());
      piece.moves.set("W-E", new Set<TileData>());
      break;
    case "bishop":
      piece.moves.set("NW-SE", new Set<TileData>());
      piece.moves.set("NE-SW", new Set<TileData>());
      break;
    case "knight":
      piece.moves.set("all", new Set<TileData>());
      break;
    default:
      return;
  }

  // Update type of piece
  piece.type = newType;

  // Remove pawn attributes
  for (const move of piece.moves.get("forward")!) move.attackers.delete(piece);
  piece.moves.delete("forward");
  for (const move of piece.moves.get("left capture")!)
    move.attackers.delete(piece);
  piece.moves.delete("left capture");
  for (const move of piece.moves.get("right capture")!)
    move.attackers.delete(piece);
  piece.moves.delete("right capture");
  piece.moves.delete("two square");
  piece.params.delete("movedTwo");

  // Recaulculate piece moves
  calculateMoves(piece, board, [piece.rank, piece.file]);
}
