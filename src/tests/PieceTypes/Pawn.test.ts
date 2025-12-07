import { describe, it, expect } from "vitest";
import { board, getTile, makePiece, placePiece, setsEqual } from "../utilities";

describe("pawnMoves", () => {
  it("simple white pawn moves", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    getTile(3, 3).piece = pawn;

    const expected = new Set([getTile(2, 3)]);

    pawn.calcMoves(pawn, board);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("simple black pawn moves", () => {
    const pawn = makePiece("pawn", "black", 3, 3);
    getTile(3, 3).piece = pawn;

    const expected = new Set([getTile(4, 3)]);

    pawn.calcMoves(pawn, board);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn moves two squares", () => {
    const pawn = makePiece("pawn", "white", 6, 3);
    getTile(6, 3).piece = pawn;

    const expected = new Set([getTile(5, 3), getTile(4, 3)]);

    pawn.calcMoves(pawn, board);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn capture", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    getTile(3, 3).piece = pawn;
    placePiece("pawn", "black", 2, 4);

    const expected = new Set([getTile(2, 3), getTile(2, 4)]);

    pawn.calcMoves(pawn, board);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn with same color on diagonal", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    getTile(3, 3).piece = pawn;
    placePiece("pawn", "white", 2, 4);

    const expected = new Set([getTile(2, 3)]);

    pawn.calcMoves(pawn, board);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn en passant", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    getTile(3, 3).piece = pawn;
    const oppPawn = makePiece("pawn", "black", 3, 4);
    getTile(3, 4).piece = oppPawn;
    oppPawn.params.set("movedTwo", true);

    const expected = new Set([getTile(2, 3), getTile(2, 4)]);

    pawn.calcMoves(pawn, board);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });
});

describe("pawnBlock", () => {
  it("simple pawn block", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    pawn.moves.add(getTile(2, 3));

    placePiece("pawn", "black", 2, 3);

    pawn.block(pawn, board, [2, 3]);

    expect(pawn.moves.size).toBe(0);
  });

  it("pawn block two squares ahead", () => {
    const pawn = makePiece("pawn", "white", 6, 3);
    pawn.moves.add(getTile(5, 3));
    pawn.moves.add(getTile(4, 3));

    placePiece("pawn", "black", 4, 3);

    const expected = new Set([getTile(5, 3)]);

    pawn.block(pawn, board, [4, 3]);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn block one square ahead", () => {
    const pawn = makePiece("pawn", "white", 6, 3);
    pawn.moves.add(getTile(5, 3));
    pawn.moves.add(getTile(4, 3));

    placePiece("pawn", "black", 5, 3);

    pawn.block(pawn, board, [5, 3]);

    expect(pawn.moves.size).toBe(0);
  });
});

describe("pawnUnblock", () => {
  it("simple pawn unblock", () => {
    const pawn = makePiece("pawn", "white", 3, 3);

    const expected = new Set([getTile(2, 3)]);

    pawn.unblock(pawn, board, [2, 3]);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn unblock two squares ahead", () => {
    const pawn = makePiece("pawn", "white", 6, 3);
    pawn.moves.add(getTile(5, 3));

    const expected = new Set([getTile(5, 3), getTile(4, 3)]);

    pawn.unblock(pawn, board, [4, 3]);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn unblock one square ahead", () => {
    const pawn = makePiece("pawn", "white", 6, 3);

    const expected = new Set([getTile(5, 3), getTile(4, 3)]);

    pawn.unblock(pawn, board, [5, 3]);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });
});
