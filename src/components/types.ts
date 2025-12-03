export type PieceData = {
  id: string;
  color: color;
  type: type;
  src: string;
  rank: dimension;
  file: dimension;
  moves: Set<TileData>
  calcMoves: (
    piece: PieceData,
    board: TileData[],
    checkBlocks: Set<TileData> | null
  ) => Set<TileData>;
  block: (
    piece: PieceData,
    board: TileData[],
    blockedPos: [dimension, dimension]
  ) => Set<TileData>;
  unblock: (
    piece: PieceData,
    board: TileData[],
    unblockedPos: [dimension, dimension]
  ) => Set<TileData>;
  params: Map<string, boolean>
}

export type TileData = {
  id: string;
  rank: dimension;
  file: dimension;
  color: color;
  piece: PieceData | null;
  attackers: Set<PieceData>;
};

export type type = "pawn" | "rook" | "knight" | "bishop" | "king" | "queen"

export type color = "white" | "black";

export type dimension = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;