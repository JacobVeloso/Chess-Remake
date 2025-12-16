import { describe, it, expect } from "vitest";
import { board, makePiece, placePiece, BOARD, setsEqual } from "./utilities.ts";
import type { TileData } from "../components/types.ts";
import {
  getPinBlocks,
  filterMoves,
  blockingMoves,
  removeAttacks,
  calculateAllMoves,
  filterBlocked,
  checkFilter,
  pinFilter,
} from "../components/Board.tsx";
import { checkBlocks } from "../components/PieceTypes/King.ts";

describe("pinBlocks", () => {
  it("Horizontal pin", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 0, 2);
    placePiece("rook", "black", 0, 6);
    const result = getPinBlocks(BOARD, [0, 0], [0, 2]);
    const expected: Set<TileData> = new Set([
      board(0, 1),
      board(0, 3),
      board(0, 4),
      board(0, 5),
      board(0, 6),
    ]);
    expect(result).toBeTruthy();
    expect(setsEqual(expected, result as Set<TileData>)).toBeTruthy();
  });

  it("Horizontal no pin", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 0, 2);
    const result = getPinBlocks(BOARD, [0, 0], [0, 2]);
    expect(result).toBeFalsy();
  });

  it("Horizontal blocked attacker side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 0, 2);
    placePiece("pawn", "white", 0, 4);
    placePiece("rook", "black", 0, 6);
    const result = getPinBlocks(BOARD, [0, 0], [0, 2]);
    expect(result).toBeFalsy();
  });

  it("Horizontal blocked king side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 0, 1);
    placePiece("pawn", "white", 0, 2);
    placePiece("rook", "black", 0, 6);
    const result = getPinBlocks(BOARD, [0, 0], [0, 2]);
    expect(result).toBeFalsy();
  });

  it("Vertical pin", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 0);
    placePiece("rook", "black", 6, 0);
    const result = getPinBlocks(BOARD, [0, 0], [2, 0]);
    const expected: Set<TileData> = new Set([
      board(1, 0),
      board(3, 0),
      board(4, 0),
      board(5, 0),
      board(6, 0),
    ]);
    expect(result).toBeTruthy();
    expect(setsEqual(expected, result as Set<TileData>)).toBeTruthy();
  });

  it("Vertical no pin", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 0);
    const result = getPinBlocks(BOARD, [0, 0], [2, 0]);
    expect(result).toBeFalsy();
  });

  it("Vertical blocked attacker side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 0);
    placePiece("pawn", "white", 4, 0);
    placePiece("rook", "black", 6, 0);
    const result = getPinBlocks(BOARD, [0, 0], [2, 0]);
    expect(result).toBeFalsy();
  });

  it("Vertical blocked king side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 1, 0);
    placePiece("pawn", "white", 2, 0);
    placePiece("rook", "black", 6, 0);
    const result = getPinBlocks(BOARD, [0, 0], [2, 0]);
    expect(result).toBeFalsy();
  });

  it("Diagonal pin", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 2);
    placePiece("bishop", "black", 6, 6);
    const result = getPinBlocks(BOARD, [0, 0], [2, 2]);
    const expected: Set<TileData> = new Set([
      board(1, 1),
      board(3, 3),
      board(4, 4),
      board(5, 5),
      board(6, 6),
    ]);
    expect(result).toBeTruthy();
    expect(setsEqual(expected, result as Set<TileData>)).toBeTruthy();
  });

  it("Diagonal no pin", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 2);
    const result = getPinBlocks(BOARD, [0, 0], [2, 2]);
    expect(result).toBeFalsy();
  });

  it("Diagonal blocked attacker side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 2, 2);
    placePiece("pawn", "white", 4, 4);
    placePiece("rook", "black", 6, 6);
    const result = getPinBlocks(BOARD, [0, 0], [2, 2]);
    expect(result).toBeFalsy();
  });

  it("Diagonal blocked king side", () => {
    placePiece("king", "white", 0, 0);
    placePiece("pawn", "white", 1, 1);
    placePiece("pawn", "white", 2, 2);
    placePiece("rook", "black", 6, 6);
    const result = getPinBlocks(BOARD, [0, 0], [2, 2]);
    expect(result).toBeFalsy();
  });
});

describe("filterMoves", () => {
  it("allowedMoves subset of allMoves", () => {
    const allMoves = new Set([board(0, 0), board(1, 2), board(3, 4)]);
    const allowedMoves = new Set([board(1, 2)]);
    const expected = new Set([board(1, 2)]);
    filterMoves(allMoves, allowedMoves);
    expect(setsEqual(expected, allMoves)).toBeTruthy();
  });

  it("Common and unique moves", () => {
    const allMoves = new Set([board(0, 0), board(1, 2), board(3, 4)]);
    const allowedMoves = new Set([board(1, 2), board(5, 6)]);
    const expected = new Set([board(1, 2)]);
    filterMoves(allMoves, allowedMoves);
    expect(setsEqual(expected, allMoves)).toBeTruthy();
  });

  it("No common moves", () => {
    const allMoves = new Set([board(0, 0), board(1, 2), board(3, 4)]);
    const allowedMoves = new Set([board(5, 6), board(6, 7)]);
    filterMoves(allMoves, allowedMoves);
    expect(allMoves.size).toBe(0);
  });

  it("allMoves subset of allowedMoves", () => {
    const allMoves = new Set([board(0, 0), board(1, 2)]);
    const allowedMoves = new Set([board(0, 0), board(1, 2), board(3, 4)]);
    const expected = new Set([board(0, 0), board(1, 2)]);
    filterMoves(allMoves, allowedMoves);
    expect(setsEqual(expected, allMoves)).toBeTruthy();
  });
});

describe("blockingMoves", () => {
  it("Horizontal blocking", () => {
    const result = blockingMoves(BOARD, [0, 0], [0, 4]);
    const expected: Set<TileData> = new Set([
      board(0, 1),
      board(0, 2),
      board(0, 3),
      board(0, 4),
    ]);
    expect(setsEqual(expected, result)).toBeTruthy();
  });

  it("Diagonal blocking", () => {
    const result = blockingMoves(BOARD, [0, 0], [4, 4]);
    const expected: Set<TileData> = new Set([
      board(1, 1),
      board(2, 2),
      board(3, 3),
      board(4, 4),
    ]);
    expect(setsEqual(expected, result)).toBeTruthy();
  });

  it("Not targeted", () => {
    const result = blockingMoves(BOARD, [0, 0], [2, 1]);
    const expected: Set<TileData> = new Set([board(2, 1)]);
    expect(result.size).toBe(1);
    expect(setsEqual(expected, result)).toBeTruthy();
  });
});

describe("removeAttacks", () => {
  it("remove all attackers", () => {
    const attacker = makePiece("queen", "white", 0, 0);
    board(0, 1).attackers.add(attacker);
    board(0, 4).attackers.add(attacker);
    board(0, 7).attackers.add(attacker);
    board(1, 0).attackers.add(attacker);
    board(4, 0).attackers.add(attacker);
    board(7, 0).attackers.add(attacker);
    board(1, 1).attackers.add(attacker);
    board(4, 4).attackers.add(attacker);
    board(7, 7).attackers.add(attacker);

    removeAttacks(BOARD, attacker);

    BOARD.forEach((tile) => {
      expect(tile.attackers.size).toBe(0);
    });
  });
});

describe("calculateAllMoves", () => {
  it("no interactions - pawn, knight, king", () => {
    const pawn = makePiece("pawn", "white", 6, 5);
    board(6, 5).piece = pawn;
    const king = makePiece("king", "white", 0, 7);
    board(0, 7).piece = king;
    const knight = makePiece("knight", "black", 3, 2);
    board(3, 2).piece = knight;

    const pieces = new Set([pawn, king, knight]);

    const expectedPawnMoves = new Set([board(5, 5), board(4, 5)]);
    const expectedKingMoves = new Set([board(0, 6), board(1, 6), board(1, 7)]);
    const expectedKnightMoves = new Set([
      board(1, 3),
      board(2, 4),
      board(4, 4),
      board(5, 3),
      board(5, 1),
      board(4, 0),
      board(2, 0),
      board(1, 1),
    ]);

    calculateAllMoves(BOARD, pieces);

    expect(setsEqual(expectedPawnMoves, pawn.moves)).toBeTruthy();
    expect(setsEqual(expectedKingMoves, king.moves)).toBeTruthy();
    expect(setsEqual(expectedKnightMoves, knight.moves)).toBeTruthy();

    expectedPawnMoves.forEach((move) => {
      expect(move.attackers.has(pawn)).toBeTruthy();
    });
    expectedKingMoves.forEach((move) => {
      expect(move.attackers.has(king)).toBeTruthy();
    });
    expectedKnightMoves.forEach((move) => {
      expect(move.attackers.has(knight)).toBeTruthy();
    });
  });
});

describe("filterBlocked", () => {
  it("block rook", () => {
    const rook = makePiece("rook", "white", 3, 3);
    board(3, 3).piece = rook;
    const leftPawn = makePiece("pawn", "white", 3, 1);
    board(3, 1).piece = leftPawn;
    const rightPawn = makePiece("pawn", "white", 3, 5);
    board(3, 5).piece = rightPawn;

    calculateAllMoves(BOARD, new Set([rook, leftPawn, rightPawn]));

    const expectedMoves = new Set([
      board(3, 2),
      board(3, 4),
      board(0, 3),
      board(1, 3),
      board(2, 3),
      board(4, 3),
      board(5, 3),
      board(6, 3),
      board(7, 3),
    ]);

    filterBlocked(BOARD);

    expect(setsEqual(expectedMoves, rook.moves)).toBeTruthy();
    expect(board(3, 1).attackers.size).toBe(0);
    expect(board(3, 0).attackers.size).toBe(0);
    expect(board(3, 5).attackers.size).toBe(0);
    expect(board(3, 6).attackers.size).toBe(0);
    expect(board(3, 7).attackers.size).toBe(0);
  });
});

describe("checkFilter", () => {
  it("simple check filter", () => {
    const king = makePiece("king", "white", 5, 3);
    board(5, 3).piece = king;
    const rook = makePiece("rook", "white", 3, 1);
    board(3, 1).piece = rook;
    const queen = makePiece("queen", "black", 1, 3);
    board(1, 3).piece = queen;

    calculateAllMoves(BOARD, new Set([king, rook, queen]));

    const expectedMoves = new Set([board(3, 3)]);

    const blocks = checkBlocks(BOARD, 5, 3);
    if (blocks !== null) {
      checkFilter(BOARD, blocks, "white");
    } else {
      expect(false, "blocks was null").toBeTruthy();
      return;
    }
    expect(setsEqual(expectedMoves, rook.moves));
    expect(board(3, 2).attackers.size).toBe(0);
  });
});

describe("pinFilter", () => {
  it("simple pin filter", () => {
    const king = makePiece("king", "white", 3, 5);
    board(3, 5).piece = king;
    const rook = makePiece("rook", "white", 3, 3);
    board(3, 3).piece = rook;
    const queen = makePiece("queen", "black", 3, 1);
    board(3, 1).piece = queen;

    const pieces = new Set([king, rook, queen]);

    calculateAllMoves(BOARD, pieces);

    const expectedMoves = new Set([board(3, 1), board(3, 2), board(3, 4)]);

    pinFilter(BOARD, pieces, [3, 5]);

    expect(setsEqual(expectedMoves, rook.moves));
  });
});
