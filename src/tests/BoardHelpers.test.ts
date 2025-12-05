import { describe, it, expect } from "vitest";
import pieces from "../assets/index";
import {
  getPinBlocks,
  filterMoves,
  blockingMoves,
  removeAttacks,
} from "../components/Board.tsx";

import type {
  PieceData,
  TileData,
  type,
  color,
  dimension,
} from "../components/types.ts";
import {
  pawnMoves,
  pawnBlock,
  pawnUnblock,
} from "../components/PieceTypes/Pawn.tsx";
import {
  rookMoves,
  rookBlock,
  rookUnblock,
} from "../components/PieceTypes/Rook.tsx";
import {
  knightMoves,
  knightBlock,
  knightUnblock,
} from "../components/PieceTypes/Knight.tsx";
import {
  bishopMoves,
  bishopBlock,
  bishopUnblock,
} from "../components/PieceTypes/Bishop.tsx";
import {
  queenMoves,
  queenBlock,
  queenUnblock,
} from "../components/PieceTypes/Queen.tsx";
import {
  kingMoves,
  kingBlock,
  kingUnblock,
} from "../components/PieceTypes/King.tsx";

const board: TileData[] = new Array(64);
var ID = 0;

function makePiece(
  type: type,
  color: color,
  rank: dimension,
  file: dimension
): PieceData {
  switch (type) {
    case "pawn":
      return {
        id: "" + ID++,
        color: color,
        type: "pawn",
        src: color === "white" ? pieces.whitePawn : pieces.blackPawn,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: pawnMoves,
        block: pawnBlock,
        unblock: pawnUnblock,
        params: new Map(),
      };
    case "rook":
      return {
        id: "" + ID++,
        color: color,
        type: "rook",
        src: color === "white" ? pieces.whiteRook : pieces.blackRook,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: rookMoves,
        block: rookBlock,
        unblock: rookUnblock,
        params: new Map(),
      };
    case "knight":
      return {
        id: "" + ID++,
        color: color,
        type: "knight",
        src: color === "white" ? pieces.whiteKnight : pieces.blackKnight,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: bishopMoves,
        block: bishopBlock,
        unblock: bishopUnblock,
        params: new Map(),
      };
    case "bishop":
      return {
        id: "" + ID++,
        color: color,
        type: "bishop",
        src: color === "white" ? pieces.whiteBishop : pieces.blackBishop,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: bishopMoves,
        block: bishopBlock,
        unblock: bishopUnblock,
        params: new Map(),
      };
    case "king":
      return {
        id: "" + ID++,
        color: color,
        type: "king",
        src: color === "white" ? pieces.whiteKing : pieces.blackKing,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: kingMoves,
        block: kingBlock,
        unblock: kingUnblock,
        params: new Map(),
      };
    default: // queen
      return {
        id: "" + ID++,
        color: color,
        type: "queen",
        src: color === "white" ? pieces.whiteQueen : pieces.blackQueen,
        rank: rank,
        file: file,
        moves: new Set(),
        calcMoves: queenMoves,
        block: queenBlock,
        unblock: queenUnblock,
        params: new Map(),
      };
  }
}

function getTile(rank: dimension, file: dimension): TileData {
  return board[rank * 8 + file];
}

function setsEqual<T>(A: Set<T>, B: Set<T>): boolean {
  if (A.size !== B.size) return false;
  for (const val of A) {
    if (!B.has(val)) return false;
  }
  return true;
}

beforeAll(() => {
  for (let i = 0; i < 64; ++i) {
    const rank = (i / 8) as dimension;
    const file = (i % 8) as dimension;
    const color = (rank + file) % 2 === 0 ? "white" : "black";
    board[i] = {
      id: "" + i,
      rank,
      file,
      color,
      piece: null,
      attackers: new Set(),
    };
  }
  ID = 0;
});

beforeEach(() => {
  board.forEach((tile) => {
    tile.piece = null;
    tile.attackers.clear();
  });
});

describe("pinBlocks", () => {
  it("Horizontal pin", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(0, 2).piece = makePiece("pawn", "white", 0, 2);
    getTile(0, 6).piece = makePiece("rook", "black", 0, 6);
    const result = getPinBlocks(board, [0, 0], [0, 2]);
    const expected: Set<TileData> = new Set([
      getTile(0, 1),
      getTile(0, 3),
      getTile(0, 4),
      getTile(0, 5),
      getTile(0, 6),
    ]);
    expect(result).toBeTruthy();
    expect(setsEqual(expected, result as Set<TileData>)).toBeTruthy();
  });

  it("Horizontal no pin", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(0, 2).piece = makePiece("pawn", "white", 0, 2);
    const result = getPinBlocks(board, [0, 0], [0, 2]);
    expect(result).toBeFalsy();
  });

  it("Horizontal blocked attacker side", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(0, 2).piece = makePiece("pawn", "white", 0, 2);
    getTile(0, 4).piece = makePiece("pawn", "white", 0, 4);
    getTile(0, 6).piece = makePiece("rook", "black", 0, 6);
    const result = getPinBlocks(board, [0, 0], [0, 2]);
    expect(result).toBeFalsy();
  });

  it("Horizontal blocked king side", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(0, 1).piece = makePiece("pawn", "white", 0, 1);
    getTile(0, 2).piece = makePiece("pawn", "white", 0, 2);
    getTile(0, 6).piece = makePiece("rook", "black", 0, 6);
    const result = getPinBlocks(board, [0, 0], [0, 2]);
    expect(result).toBeFalsy();
  });

  it("Vertical pin", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(2, 0).piece = makePiece("pawn", "white", 2, 0);
    getTile(6, 0).piece = makePiece("rook", "black", 6, 0);
    const result = getPinBlocks(board, [0, 0], [2, 0]);
    const expected: Set<TileData> = new Set([
      getTile(1, 0),
      getTile(3, 0),
      getTile(4, 0),
      getTile(5, 0),
      getTile(6, 0),
    ]);
    expect(result).toBeTruthy();
    expect(setsEqual(expected, result as Set<TileData>)).toBeTruthy();
  });

  it("Vertical no pin", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(2, 0).piece = makePiece("pawn", "white", 2, 0);
    const result = getPinBlocks(board, [0, 0], [2, 0]);
    expect(result).toBeFalsy();
  });

  it("Vertical blocked attacker side", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(2, 0).piece = makePiece("pawn", "white", 2, 0);
    getTile(4, 0).piece = makePiece("pawn", "white", 4, 0);
    getTile(6, 0).piece = makePiece("rook", "black", 6, 0);
    const result = getPinBlocks(board, [0, 0], [2, 0]);
    expect(result).toBeFalsy();
  });

  it("Vertical blocked king side", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(1, 0).piece = makePiece("pawn", "white", 1, 0);
    getTile(2, 0).piece = makePiece("pawn", "white", 2, 0);
    getTile(6, 0).piece = makePiece("rook", "black", 6, 0);
    const result = getPinBlocks(board, [0, 0], [2, 0]);
    expect(result).toBeFalsy();
  });

  it("Diagonal pin", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(2, 2).piece = makePiece("pawn", "white", 2, 2);
    getTile(6, 6).piece = makePiece("bishop", "black", 6, 6);
    const result = getPinBlocks(board, [0, 0], [2, 2]);
    const expected: Set<TileData> = new Set([
      getTile(1, 1),
      getTile(3, 3),
      getTile(4, 4),
      getTile(5, 5),
      getTile(6, 6),
    ]);
    expect(result).toBeTruthy();
    expect(setsEqual(expected, result as Set<TileData>)).toBeTruthy();
  });

  it("Diagonal no pin", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(2, 2).piece = makePiece("pawn", "white", 2, 2);
    const result = getPinBlocks(board, [0, 0], [2, 2]);
    expect(result).toBeFalsy();
  });

  it("Diagonal blocked attacker side", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(2, 2).piece = makePiece("pawn", "white", 2, 2);
    getTile(4, 4).piece = makePiece("pawn", "white", 4, 4);
    getTile(6, 6).piece = makePiece("rook", "black", 6, 6);
    const result = getPinBlocks(board, [0, 0], [2, 2]);
    expect(result).toBeFalsy();
  });

  it("Diagonal blocked king side", () => {
    getTile(0, 0).piece = makePiece("king", "white", 0, 0);
    getTile(1, 1).piece = makePiece("pawn", "white", 1, 1);
    getTile(2, 2).piece = makePiece("pawn", "white", 2, 2);
    getTile(6, 6).piece = makePiece("rook", "black", 6, 6);
    const result = getPinBlocks(board, [0, 0], [2, 2]);
    expect(result).toBeFalsy();
  });
});

describe("filterMoves", () => {
  it("allowedMoves subset of allMoves", () => {
    const allMoves = new Set([getTile(0, 0), getTile(1, 2), getTile(3, 4)]);
    const allowedMoves = new Set([getTile(1, 2)]);
    const expected = new Set([getTile(1, 2)]);
    filterMoves(allMoves, allowedMoves);
    expect(setsEqual(expected, allMoves)).toBeTruthy();
  });

  it("Common and unique moves", () => {
    const allMoves = new Set([getTile(0, 0), getTile(1, 2), getTile(3, 4)]);
    const allowedMoves = new Set([getTile(1, 2), getTile(5, 6)]);
    const expected = new Set([getTile(1, 2)]);
    filterMoves(allMoves, allowedMoves);
    expect(setsEqual(expected, allMoves)).toBeTruthy();
  });

  it("No common moves", () => {
    const allMoves = new Set([getTile(0, 0), getTile(1, 2), getTile(3, 4)]);
    const allowedMoves = new Set([getTile(5, 6), getTile(6, 7)]);
    filterMoves(allMoves, allowedMoves);
    expect(allMoves.size).toBe(0);
  });

  it("allMoves subset of allowedMoves", () => {
    const allMoves = new Set([getTile(0, 0), getTile(1, 2)]);
    const allowedMoves = new Set([getTile(0, 0), getTile(1, 2), getTile(3, 4)]);
    const expected = new Set([getTile(0, 0), getTile(1, 2)]);
    filterMoves(allMoves, allowedMoves);
    expect(setsEqual(expected, allMoves)).toBeTruthy();
  });
});

describe("blockingMoves", () => {
  it("Horizontal blocking", () => {
    const result = blockingMoves(board, [0, 0], [0, 4]);
    const expected: Set<TileData> = new Set([
      getTile(0, 1),
      getTile(0, 2),
      getTile(0, 3),
      getTile(0, 4),
    ]);
    expect(setsEqual(expected, result)).toBeTruthy();
  });

  it("Diagonal blocking", () => {
    const result = blockingMoves(board, [0, 0], [4, 4]);
    const expected: Set<TileData> = new Set([
      getTile(1, 1),
      getTile(2, 2),
      getTile(3, 3),
      getTile(4, 4),
    ]);
    expect(setsEqual(expected, result)).toBeTruthy();
  });

  it("Not targeted", () => {
    const result = blockingMoves(board, [0, 0], [2, 1]);
    const expected: Set<TileData> = new Set([getTile(2, 1)]);
    expect(result.size).toBe(1);
    expect(setsEqual(expected, result)).toBeTruthy();
  });
});

describe("removeAttacks", () => {
  it("remove all attackers", () => {
    const attacker = makePiece("queen", "white", 0, 0);
    getTile(0, 1).attackers.add(attacker);
    getTile(0, 4).attackers.add(attacker);
    getTile(0, 7).attackers.add(attacker);
    getTile(1, 0).attackers.add(attacker);
    getTile(4, 0).attackers.add(attacker);
    getTile(7, 0).attackers.add(attacker);
    getTile(1, 1).attackers.add(attacker);
    getTile(4, 4).attackers.add(attacker);
    getTile(7, 7).attackers.add(attacker);

    removeAttacks(board, attacker);

    board.forEach((tile) => {
      expect(tile.attackers.size).toBe(0);
    });
  });
});
