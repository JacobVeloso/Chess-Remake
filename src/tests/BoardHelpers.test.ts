import { describe, it, expect } from "vitest";
import {
  board,
  makePiece,
  placePiece,
  getTile,
  setsEqual,
} from "./utilities.ts";
import type { TileData } from "../components/types.ts";
import {
  getPinBlocks,
  filterMoves,
  blockingMoves,
  removeAttacks,
} from "../components/Board.tsx";

describe("pinBlocks", () => {
  it("Horizontal pin", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 0, 2);
    placePiece("rook", "black", 0, 6);
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
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 0, 2);
    const result = getPinBlocks(board, [0, 0], [0, 2]);
    expect(result).toBeFalsy();
  });

  it("Horizontal blocked attacker side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 0, 2);
    placePiece("pawn", "white", 0, 4);
    placePiece("rook", "black", 0, 6);
    const result = getPinBlocks(board, [0, 0], [0, 2]);
    expect(result).toBeFalsy();
  });

  it("Horizontal blocked king side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 0, 1);
    placePiece("pawn", "white", 0, 2);
    placePiece("rook", "black", 0, 6);
    const result = getPinBlocks(board, [0, 0], [0, 2]);
    expect(result).toBeFalsy();
  });

  it("Vertical pin", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 0);
    placePiece("rook", "black", 6, 0);
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
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 0);
    const result = getPinBlocks(board, [0, 0], [2, 0]);
    expect(result).toBeFalsy();
  });

  it("Vertical blocked attacker side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 0);
    placePiece("pawn", "white", 4, 0);
    placePiece("rook", "black", 6, 0);
    const result = getPinBlocks(board, [0, 0], [2, 0]);
    expect(result).toBeFalsy();
  });

  it("Vertical blocked king side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 1, 0);
    placePiece("pawn", "white", 2, 0);
    placePiece("rook", "black", 6, 0);
    const result = getPinBlocks(board, [0, 0], [2, 0]);
    expect(result).toBeFalsy();
  });

  it("Diagonal pin", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 2);
    placePiece("bishop", "black", 6, 6);
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
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 2);
    const result = getPinBlocks(board, [0, 0], [2, 2]);
    expect(result).toBeFalsy();
  });

  it("Diagonal blocked attacker side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 2);
    placePiece("pawn", "white", 4, 4);
    placePiece("rook", "black", 6, 6);
    const result = getPinBlocks(board, [0, 0], [2, 2]);
    expect(result).toBeFalsy();
  });

  it("Diagonal blocked king side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 1, 1);
    placePiece("pawn", "white", 2, 2);
    placePiece("rook", "black", 6, 6);
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
