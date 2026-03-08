import type {
  PieceData,
  TileData,
  type,
  color,
  dimension,
} from "../components/types.ts";

export const BOARD: TileData[] = new Array(64);
for (let i = 0; i < 64; ++i) {
  const rank = Math.floor(i / 8) as dimension;
  const file = (i % 8) as dimension;
  const color = (rank + file) % 2 === 0 ? "white" : "black";
  BOARD[i] = {
    id: "" + i,
    rank,
    file,
    color,
    piece: null,
    attackers: new Set(),
  };
}
export var ID = 0;

/**
 * Instantiates a PieceType object given the parameters. Returned with an empty moveset.
 * @param type [type]
 * @param color [color]
 * @param rank [dimension]
 * @param file [dimension]
 * @returns PieceData object
 */
export function makePiece(
  type: type,
  color: color,
  rank: dimension,
  file: dimension,
): PieceData {
  const params = new Map();
  switch (type) {
    case "pawn":
      params.set("movedTwo", false);
      return {
        id: "" + ID++,
        color,
        type: "pawn",
        rank,
        file,
        moves: new Map<string, Set<TileData>>(),
        params,
      };
    case "rook":
      params.set("hasMoved", false);
      return {
        id: "" + ID++,
        color: color,
        type: "rook",
        rank: rank,
        file: file,
        moves: new Map<string, Set<TileData>>(),
        params,
      };
    case "knight":
      return {
        id: "" + ID++,
        color: color,
        type: "knight",
        rank: rank,
        file: file,
        moves: new Map<string, Set<TileData>>(),
        params,
      };
    case "bishop":
      return {
        id: "" + ID++,
        color: color,
        type: "bishop",
        rank: rank,
        file: file,
        moves: new Map<string, Set<TileData>>(),
        params,
      };
    case "king":
      params.set("hasMoved", false);
      return {
        id: "" + ID++,
        color: color,
        type: "king",
        rank: rank,
        file: file,
        moves: new Map<string, Set<TileData>>(),
        params,
      };
    default: // queen
      return {
        id: "" + ID++,
        color: color,
        type: "queen",
        rank: rank,
        file: file,
        moves: new Map<string, Set<TileData>>(),
        params,
      };
  }
}

/**
 * Places a piece with given parameters on the board. Does NOT calculate legal moves for the new piece.
 * @param type [type]
 * @param color [color]
 * @param rank [dimension]
 * @param file [dimension]
 * @returns false if there is already a piece on the tile with the given rank & file, true otherwise.
 */
export function placePiece(
  type: type,
  color: color,
  rank: dimension,
  file: dimension,
): boolean {
  const piece = makePiece(type, color, rank, file);
  const tile = board(rank, file);
  if (tile.piece) return false;
  tile.piece = piece;
  return true;
}

/**
 * Returns the TileData object in the board with the given rank & file.
 * @param rank [dimension]
 * @param file [dimension]
 * @returns TileData object
 */
export function board(rank: dimension, file: dimension): TileData {
  return BOARD[rank * 8 + file];
}

/**
 * Compares two sets element by element to check if they are equal.
 * @param A [Set<T>]
 * @param B [Set<T>]
 * @returns true if the sets contain the exact same elements, false otherwise.
 */
export function setsEqual<T>(A: Set<T>, B: Set<T>): boolean {
  if (A.size !== B.size) return false;
  for (const val of A) {
    if (!B.has(val)) return false;
  }
  return true;
}

/**
 * Compares all the moves in a moveset with the complete set of expected moves, verifying correctness.
 * @param expected Complete collection of expected moves
 * @param moveset Moveset for a PieceData object
 * @returns true if the moves are correct, false otherwise
 */
export function verifyMoves(
  expected: Set<TileData>,
  moveset: Map<string, Set<TileData>>,
): boolean {
  const all = new Set<TileData>();
  for (const moves of moveset.values()) {
    for (const move of moves) all.add(move);
  }
  return setsEqual(expected, all);
}
