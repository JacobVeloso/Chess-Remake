export type PieceData = {
  id: string;
  color: color;
  type: type;
  rank: dimension;
  file: dimension;
  moves: Map<string, Set<TileData>>;
  params: Map<string, boolean>;
};

export type PieceState = {
  id: PieceData["id"];
  color: color;
  type: type;
  src: string;
};

export type TileData = {
  id: string;
  rank: dimension;
  file: dimension;
  color: color;
  piece: PieceData | null;
  attackers: Set<PieceData>;
};

export type TileState = {
  id: TileData["id"];
  color: color;
  rank: dimension;
  file: dimension;
  piece: PieceState | null;
};

export type BoardData = {
  tiles: TileData[];
  whitePieces: Set<PieceData>;
  blackPieces: Set<PieceData>;
  turn: color;
  halfmoves: number;
  fullmoves: number;
  epPawn: PieceData | null;
  promotingPawn: PieceData | null;
};

export type Move = {
  from: TileData["id"];
  to: TileData["id"];
  piece: PieceData;
  capture?: PieceData;
};

export type type = "pawn" | "rook" | "knight" | "bishop" | "king" | "queen";

export type color = "white" | "black";

export type dimension = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const FENData = new Map<string, [string, string]>([
  ["P", ["white", "pawn"]],
  ["p", ["black", "pawn"]],
  ["R", ["white", "rook"]],
  ["r", ["black", "rook"]],
  ["N", ["white", "knight"]],
  ["n", ["black", "knight"]],
  ["B", ["white", "bishop"]],
  ["b", ["black", "bishop"]],
  ["Q", ["white", "queen"]],
  ["q", ["black", "queen"]],
  ["K", ["white", "king"]],
  ["k", ["black", "king"]],
]);
