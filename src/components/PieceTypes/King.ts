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
      // // Check that tile is empty and not attacked
      // if (!tile.piece && !isAttacked(tile, piece.color))
      moves.add(tile);
    }
  }

  // Add castling moves where applicable
  piece.moves = new Set([...moves, ...castlingMoves(board, piece)]);
  return piece.moves;
}

export function kingBlock(
  piece: PieceData,
  board: TileData[],
  blockedPos: [dimension, dimension]
): Set<TileData> {
  // const [blockedRank, blockedFile] = blockedPos;
  // void board;

  // const blockedMoves = new Set<TileData>();
  // // Remove move now blocked
  // for (const move of piece.moves) {
  //   if (move.rank === blockedRank && move.file === blockedFile) {
  //     piece.moves.delete(move);
  //     blockedMoves.add(move);
  //     break;
  //   }
  // }

  // return piece.moves;

  const attacker = board[blockedPos[0] * 8 + blockedPos[1]].piece!;
  if (attacker.color === piece.color) {
    for (const move of piece.moves) {
      if (move.rank === blockedPos[0] && move.file === blockedPos[1]) {
        piece.moves.delete(move);
        return new Set<TileData>([move]);
      }
    }
  }
  return new Set();
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

function castlingMoves(board: TileData[], king: PieceData): Set<TileData> {
  const rank = king.color === "white" ? 7 : 0;
  const castleMoves = new Set<TileData>();
  if (
    king.type !== "king" ||
    king.params.get("hasMoved") ||
    checkBlocks(board, rank, 4)
  )
    return castleMoves;

  const right = board[rank * 8 + 7].piece;
  const left = board[rank * 8].piece;

  // check right rook
  if (
    right && // check if tile has a piece
    right.type === "rook" && // check if the piece is a rook
    !right.params.get("hasMoved") && // check if rook has moved
    !board[rank * 8 + 5].piece && // check if all tiles between are empty
    !isAttacked(board[rank * 8 + 5], king.color) && // check if any tiles are attacked
    !board[rank * 8 + 6].piece &&
    !isAttacked(board[rank * 8 + 6], king.color)
  ) {
    castleMoves.add(board[rank * 8 + 6]);
  }

  // check left rook
  if (
    left &&
    left.type === "rook" &&
    !left.params.get("hasMoved") &&
    !board[rank * 8 + 3].piece &&
    !isAttacked(board[rank * 8 + 3], king.color) &&
    !board[rank * 8 + 2].piece &&
    !isAttacked(board[rank * 8 + 2], king.color) &&
    !board[rank * 8 + 1].piece &&
    !isAttacked(board[rank * 8 + 1], king.color)
  ) {
    castleMoves.add(board[rank * 8 + 2]);
  }

  return castleMoves;
}
