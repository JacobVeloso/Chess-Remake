import type { dimension, PieceData, TileData } from "../types.ts";
import { isAttacked } from "../Tile.tsx";
import { blockingMoves } from "../Chess.ts";

export function kingMoves(piece: PieceData, board: TileData[]): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  for (let i = rank - 1; i <= rank + 1; ++i) {
    if (i < 0 || i >= 8) continue;
    for (let j = file - 1; j <= file + 1; ++j) {
      if (j < 0 || j >= 8 || (i === rank && j === file)) continue;
      const tile = board[i * 8 + j];
      moves.add(tile);
    }
  }

  // Add castling moves
  if (piece.type === "king" && !piece.params.get("hasMoved")) {
    moves.add(board[rank * 8 + file - 2]);
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
  if (attackers.length > 1) return king.moves;

  // Calculate block filter
  return new Set([
    ...blockingMoves(
      board,
      [king.rank, king.file],
      [attackers[0].rank, attackers[0].file]
    ),
    ...king.moves,
  ]);
}

export function checkCastlingMoves(
  moves: Set<TileData>,
  board: TileData[],
  king: PieceData
): Set<TileData> {
  const filteredMoves = new Set<TileData>([...moves]);

  if (king.type !== "king") return filteredMoves;

  const [rank, file] = [king.rank, king.file];

  const left = board[rank * 8].piece;
  const right = board[rank * 8 + 7].piece;

  filteredMoves.forEach((move) => {
    if (Math.abs(move.file - file) === 2) {
      // Check left castle
      if (
        move.file < file &&
        (!left ||
          left.params.get("hasMoved") ||
          board[rank * 8 + 3].piece ||
          isAttacked(board[rank * 8 + 3], king.color) ||
          board[rank * 8 + 2].piece ||
          isAttacked(board[rank * 8 + 2], king.color) ||
          board[rank * 8 + 1].piece ||
          isAttacked(board[rank * 8 + 1], king.color))
      )
        filteredMoves.delete(move);
      // Check right castle
      else if (
        move.file > file &&
        (!right ||
          right.params.get("hasMoved") ||
          board[rank * 8 + 5].piece ||
          isAttacked(board[rank * 8 + 5], king.color) ||
          board[rank * 8 + 6].piece ||
          isAttacked(board[rank * 8 + 6], king.color))
      )
        filteredMoves.delete(move);
    }
  });
  return filteredMoves;
}

export function removeCastlingMove(
  board: TileData[],
  king: PieceData,
  direction: "left" | "right"
): void {
  if (king.type !== "king") return;

  for (const move of king.moves) {
    if (Math.abs(move.file - king.file) === 2) {
      if (direction === "left" && move.file < king.file) {
        king.moves.delete(move);
        board[king.rank * 8 + king.file - 2].attackers.delete(king);
      } else if (direction === "right" && move.file > king.file) {
        king.moves.delete(move);
        board[king.rank * 8 + king.file + 2].attackers.delete(king);
      }
      return;
    }
  }
}
