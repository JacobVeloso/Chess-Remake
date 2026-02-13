import type { dimension, PieceData, TileData, type } from "../types.ts";
import { deleteMoves } from "../Piece.tsx";
import { calculateMoves } from "../MoveCalculation.ts";

/**
 * Calculates all pawn moves and stores them in piece's moveset. Move types:
 * - "forward": One tile move forward
 * - "two square": Two tile move forward, only possible on first pawn move
 * - "left capture": Diagonal capture on left
 * - "right capture": Diagonal capture on right
 * @param piece PieecData object
 * @param board Array of 64 TileData objects representing board
 * @returns Set of all possible moves
 */
export function pawnMoves(piece: PieceData, board: TileData[]): Set<TileData> {
  // Ensure move types exist and clear all moves
  if (piece.moves.has("forward")) deleteMoves(piece, "forward");
  else piece.moves.set("forward", new Set<TileData>());
  if (piece.moves.has("two square")) deleteMoves(piece, "two square");
  else piece.moves.set("two square", new Set<TileData>());
  if (piece.moves.has("left capture")) deleteMoves(piece, "left capture");
  else piece.moves.set("left capture", new Set<TileData>());
  if (piece.moves.has("right capture")) deleteMoves(piece, "right capture");
  else piece.moves.set("right capture", new Set<TileData>());

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
    piece.moves.get("forward")?.add(board[(rank + direction) * 8 + file]);
    moves.add(board[(rank + direction) * 8 + file]);

    // Add two square move if pawn is on start rank
    if (rank == startRank && !board[(rank + direction) * 8 + file].piece) {
      piece.moves
        .get("two square")
        ?.add(board[(rank + 2 * direction) * 8 + file]);
      moves.add(board[(rank + 2 * direction) * 8 + file]);
    }

    // Add left & right captures, regardless of if an oppsing piece is on target squares
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
  blockedRank: dimension,
  blockedFile: dimension,
): Set<TileData> {
  const canMoveTwo =
    (piece.color === "white" && piece.rank === 6) ||
    (piece.color === "black" && piece.rank === 1);

  let blockedMoves = new Set<TileData>();

  // Remove two square move if applicable
  if (
    canMoveTwo && // check if pawn can move two
    piece.file === blockedFile && // check that tile is in front of pawn
    Math.abs(piece.rank - blockedRank) === 1 // check that tile in front of pawn is blocked
  ) {
    blockedMoves = new Set<TileData>(piece.moves.get("two square")!);
    piece.moves.get("two square")?.clear();
  }

  return blockedMoves;
}

export function pawnUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedRank: dimension,
  unblockedFile: dimension,
): Set<TileData> {
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
  pawn: PieceData,
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
  newType: type,
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
  calculateMoves(piece, board);
}
