export type PieceData = {
  id: string;
  color: color;
  type: type;
  src: string;
  rank: dimension;
  file: dimension;
  moves: Set<TileData>;
  params: Map<string, boolean>;
};

export type TileData = {
  id: string;
  rank: dimension;
  file: dimension;
  color: color;
  piece: PieceData | null;
  attackers: Set<PieceData>;
};

export type BoardState = {
  tiles: TileData[];
  //moveHistory: Move[];
  whitePieces: Set<PieceData>;
  blackPieces: Set<PieceData>;
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
