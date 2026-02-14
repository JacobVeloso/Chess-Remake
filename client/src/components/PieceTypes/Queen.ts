import type { dimension, PieceData, TileData, Move } from "../types.ts";
import { bishopBlock, bishopUnblock } from "./Bishop.ts";
import { rookBlock, rookUnblock } from "./Rook.ts";

export function addStraightMoves(
  board: TileData[],
  piece: PieceData,
  rankDirection: -1 | 0 | 1,
  fileDirection: -1 | 0 | 1,
  pieceMoves: Set<TileData>,
  allMoves: Set<TileData>,
): void {
  const [rank, file] = [piece.rank, piece.file];
  let i = rank + rankDirection;
  let j = file + fileDirection;
  do {
    const index = i * 8 + j;
    pieceMoves.add(board[index]);
    allMoves.add(board[index]);
    i += rankDirection;
    j += fileDirection;
  } while (
    i >= 0 &&
    i < 8 &&
    j >= 0 &&
    j < 8 &&
    !board[(i - rankDirection) * 8 + (j - fileDirection)].piece
  );
}

/**
 * Calculates all queen moves and stores them in piece's moveset. Move types:
 * - "N-S": Moves in vertical direction
 * - "W-E": Moves in horizontal direction
 * - "NW-SE": Moves along upper left and lower right diagonal
 * - "NE-SW": Moves along upper right and lower left diagonal
 * @param piece PieecData object
 * @param board Array of 64 TileData objects representing board
 * @param lastMove Piece's previous position, if applicable
 * @returns Set of all possible moves
 */
export function queenMoves(
  piece: PieceData,
  board: TileData[],
  lastMove: Move | null = null,
): Set<TileData> {
  const [rank, file] = [piece.rank, piece.file];
  const moves = new Set<TileData>();

  // Ensure move types exist
  if (!piece.moves.has("N-S")) piece.moves.set("N-S", new Set<TileData>());
  if (!piece.moves.has("W-E")) piece.moves.set("W-E", new Set<TileData>());
  if (!piece.moves.has("NW-SE")) piece.moves.set("NW-SE", new Set<TileData>());
  if (!piece.moves.has("NE-SW")) piece.moves.set("NE-SW", new Set<TileData>());

  // Determine axis queen moved along
  const sourceTile = lastMove ? board[+lastMove.from] : null;
  const [prevRank, prevFile] = [
    sourceTile?.rank ?? rank,
    sourceTile?.file ?? file,
  ];

  const moveAxis =
    // Horizontal direction
    rank === prevRank && file !== prevFile
      ? piece.moves.get("W-E")
      : // Vertical direction
        rank !== prevRank && file === prevFile
        ? piece.moves.get("N-S")
        : // Upper left / lower right diagonal
          (rank > prevRank && file > prevFile) ||
            (rank < prevRank && file < prevFile)
          ? piece.moves.get("NW-SE")
          : // Upper right / lower left diagonal
            (rank > prevRank && file < prevFile) ||
              (rank < prevRank && file > prevFile)
            ? piece.moves.get("NE-SW")
            : // No last move
              null;

  if (moveAxis) {
    // Remove current position
    moveAxis.delete(board[rank * 8 + file]);
    board[rank * 8 + file].attackers.delete(piece);

    // Add previous position
    moveAxis.add(board[prevRank * 8 + prevFile]);
    moves.add(board[prevRank * 8 + prevFile]);

    // Delete all other moves
    for (const [_, moveType] of piece.moves) {
      if (moveType !== moveAxis) {
        for (const move of moveType) move.attackers.delete(piece);
        moveType.clear();
      }
    }
  }

  const movedN = prevRank > rank && prevFile === file;
  const movedS = prevRank < rank && prevFile === file;
  const movedE = prevRank === rank && prevFile < file;
  const movedW = prevRank === rank && prevFile > file;

  // Add upward moves
  if (
    rank > 0 &&
    (!(movedN || movedS) || !lastMove || (lastMove.capture && movedN))
  )
    addStraightMoves(
      board,
      piece,
      -1,
      0,
      piece.moves.get("N-S") ?? new Set<TileData>(),
      moves,
    );

  // Add downward moves
  if (
    rank < 7 &&
    (!(movedN || movedS) || !lastMove || (lastMove.capture && movedN))
  )
    addStraightMoves(
      board,
      piece,
      1,
      0,
      piece.moves.get("N-S") ?? new Set<TileData>(),
      moves,
    );

  // Add left moves
  if (
    file > 0 &&
    (!(movedE || movedW) || !lastMove || (lastMove.capture && movedW))
  )
    addStraightMoves(
      board,
      piece,
      0,
      -1,
      piece.moves.get("W-E") ?? new Set<TileData>(),
      moves,
    );

  // Add right moves
  if (
    file < 7 &&
    (!(movedE || movedW) || !lastMove || (lastMove.capture && movedE))
  )
    addStraightMoves(
      board,
      piece,
      0,
      1,
      piece.moves.get("W-E") ?? new Set<TileData>(),
      moves,
    );

  const movedNW = prevRank > rank && prevFile > file;
  const movedSE = prevRank < rank && prevFile < file;
  const movedNE = prevRank > rank && prevFile < file;
  const movedSW = prevRank < rank && prevFile > file;

  // Add upper left diagonal
  if (
    rank > 0 &&
    file > 0 &&
    (!(movedNW || movedSE) || !lastMove || (lastMove.capture && movedNW))
  )
    addStraightMoves(
      board,
      piece,
      -1,
      -1,
      piece.moves.get("NW-SE") ?? new Set<TileData>(),
      moves,
    );

  // Add lower right diagonal
  if (
    rank < 7 &&
    file < 7 &&
    (!(movedNW || movedSE) || !lastMove || (lastMove.capture && movedSE))
  )
    addStraightMoves(
      board,
      piece,
      1,
      1,
      piece.moves.get("NW-SE") ?? new Set<TileData>(),
      moves,
    );

  // Add upper right diagonal
  if (
    rank > 0 &&
    file < 7 &&
    (!(movedNE || movedSW) || !lastMove || (lastMove.capture && movedNE))
  )
    addStraightMoves(
      board,
      piece,
      -1,
      1,
      piece.moves.get("NE-SW") ?? new Set<TileData>(),
      moves,
    );

  // Add lower left diagonal
  if (
    rank < 7 &&
    file > 0 &&
    (!(movedNE || movedSW) || !lastMove || (lastMove.capture && movedSW))
  )
    addStraightMoves(
      board,
      piece,
      1,
      -1,
      piece.moves.get("NE-SW") ?? new Set<TileData>(),
      moves,
    );
  return moves;
}

export function queenBlock(
  piece: PieceData,
  blockedRank: dimension,
  blockedFile: dimension,
): Set<TileData> {
  // straight
  if (piece.rank === blockedRank || piece.file === blockedFile)
    return rookBlock(piece, blockedRank, blockedFile);
  // diagonal
  else if (
    Math.abs(blockedRank - piece.rank) === Math.abs(blockedFile - piece.file)
  )
    return bishopBlock(piece, blockedRank, blockedFile);

  // TODO error
  return new Set<TileData>();
}

export function queenUnblock(
  piece: PieceData,
  board: TileData[],
  unblockedRank: dimension,
  unblockedFile: dimension,
): Set<TileData> {
  // straight
  if (piece.rank === unblockedRank || piece.file === unblockedFile)
    return rookUnblock(piece, board, unblockedRank, unblockedFile);
  // diagonal
  else if (
    Math.abs(unblockedRank - piece.rank) ===
    Math.abs(unblockedFile - piece.file)
  )
    return bishopUnblock(piece, board, unblockedRank, unblockedFile);

  // TODO error
  return new Set<TileData>();
}
