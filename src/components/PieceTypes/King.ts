import type { dimension, PieceData, TileData, Move } from "../types.ts";
import { isAttacked } from "../Tile.tsx";
import { blockingMoves } from "../Chess.ts";
import { rookMovesAfterCastle } from "./Rook.ts";

export function kingMoves(piece: PieceData, board: TileData[]): Set<TileData> {
  piece.moves.get("standard")?.forEach((move) => {
    move.attackers.delete(piece);
  });
  piece.moves.get("standard")?.clear();
  piece.moves.get("leftCastle")?.forEach((move) => {
    move.attackers.delete(piece);
  });
  piece.moves.get("leftCastle")?.clear();
  piece.moves.get("rightCastle")?.forEach((move) => {
    move.attackers.delete(piece);
  });
  piece.moves.get("rightCastle")?.clear();
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  for (let i = rank - 1; i <= rank + 1; ++i) {
    if (i < 0 || i >= 8) continue;
    for (let j = file - 1; j <= file + 1; ++j) {
      if (j < 0 || j >= 8 || (i === rank && j === file)) continue;
      piece.moves.get("standard")?.add(board[i * 8 + j]);
      moves.add(board[i * 8 + j]);
    }
  }

  // Add castling moves
  if (piece.type === "king" && !piece.params.get("hasMoved")) {
    piece.moves.get("leftCastle")?.add(board[rank * 8 + file - 2]);
    moves.add(board[rank * 8 + file - 2]);
    piece.moves.get("rightCastle")?.add(board[rank * 8 + file + 2]);
    moves.add(board[rank * 8 + file + 2]);
  }

  return moves;
}

export function checkBlocks(
  board: TileData[],
  rank: dimension,
  file: dimension
): Set<TileData> | null {
  const tile = board[rank * 8 + file];
  if (
    !tile.piece || // check if tile has a piece
    tile.piece.type !== "king" || // check if the piece is a king
    !isAttacked(tile, tile.piece.color) // check if anything is attacking the king
  )
    return null;

  const king = tile.piece!;

  // Check if king is attacked by multiple pieces
  const attackers = Array.from(tile.attackers).filter(
    (attacker: PieceData) => attacker.color !== king.color
  );
  if (attackers.length > 1)
    return king.moves.get("standard") ?? new Set<TileData>();

  // Calculate block filter
  return new Set([
    ...blockingMoves(
      board,
      [king.rank, king.file],
      [attackers[0].rank, attackers[0].file]
    ),
    ...(king.moves.get("standard") ?? new Set<TileData>()),
  ]);
}

export function checkCastlingMoves(
  board: TileData[],
  king: PieceData
): Set<TileData> {
  if (king.type !== "king") return new Set<TileData>();

  const deletions = new Set<TileData>();

  const rank = king.rank;

  // Check left castle
  if (king.moves.get("leftCastle")!.size > 0) {
    const leftCastle = king.moves.get("leftCastle")!.values().next().value!;
    const leftRook = board[king.rank * 8].piece;
    if (
      (leftRook && leftRook.params.get("hasMoved")) ||
      board[rank * 8 + 3].piece ||
      isAttacked(board[rank * 8 + 3], king.color) ||
      board[rank * 8 + 2].piece ||
      isAttacked(board[rank * 8 + 2], king.color) ||
      board[rank * 8 + 1].piece ||
      isAttacked(board[rank * 8 + 1], king.color)
    )
      deletions.add(leftCastle);
  }

  // Check right castle
  if (king.moves.get("rightCastle")!.size > 0) {
    const rightCastle = king.moves.get("rightCastle")!.values().next().value!;
    const rightRook = board[king.rank * 8 + 7].piece;
    if (
      (rightRook && rightRook.params.get("hasMoved")) ||
      board[rank * 8 + 5].piece ||
      isAttacked(board[rank * 8 + 5], king.color) ||
      board[rank * 8 + 6].piece ||
      isAttacked(board[rank * 8 + 6], king.color)
    )
      deletions.add(rightCastle);
  }
  return deletions;
}

export function removeCastlingMove(
  board: TileData[],
  king: PieceData,
  direction: "left" | "right"
): void {
  if (king.type !== "king") return;

  if (direction === "left") {
    king.moves.get("leftCastle")?.clear();
    board[king.rank * 8 + king.file - 2].attackers.delete(king);
  } else {
    king.moves.get("rightCastle")?.clear();
    board[king.rank * 8 + king.file + 2].attackers.delete(king);
  }
}

export function castle(board: TileData[], move: Move): void {
  const king = move.piece;
  if (king.type !== "king" || king.params.get("hasMoved")) return;
  const rook =
    +move.to < +move.from
      ? board[king.rank * 8].piece
      : board[king.rank * 8 + 7].piece;
  if (!rook || rook.type !== "rook" || rook.params.get("hasMoved")) return;

  // Tiles interacted with
  const kingSourceTile = board[king.rank * 8 + king.file];
  const kingTargetTile =
    +move.to < +move.from
      ? board[king.rank * 8 + king.file - 2]
      : board[king.rank * 8 + king.file + 2];
  const rookSourceTile = board[rook.rank * 8 + rook.file];
  const rookTargetTile =
    +move.to < +move.from ? board[king.rank * 8 + 3] : board[king.rank * 8 + 5];

  // Move pieces and update positions
  kingSourceTile.piece = null;
  kingTargetTile.piece = king;
  rookSourceTile.piece = null;
  rookTargetTile.piece = rook;
  king.file = +move.to < +move.from ? 2 : 6;
  rook.file = +move.to < +move.from ? 3 : 5;
  king.params.set("hasMoved", true);
  rook.params.set("hasMoved", true);

  // Recalculate moves
  kingMoves(king, board).forEach((move) => board[+move.id].attackers.add(king));
  rookMovesAfterCastle(rook, board).forEach((move) =>
    board[+move.id].attackers.add(rook)
  );
}
