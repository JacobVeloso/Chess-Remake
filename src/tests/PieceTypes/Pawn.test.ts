import { describe, it, expect } from "vitest";
import { board, BOARD, makePiece, placePiece, setsEqual } from "../utilities";

describe("pawnMoves", () => {
  it("simple white pawn moves", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    board(3, 3).piece = pawn;

    const expected = new Set([board(2, 3)]);

    pawn.calcMoves(pawn, BOARD);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("simple black pawn moves", () => {
    const pawn = makePiece("pawn", "black", 3, 3);
    board(3, 3).piece = pawn;

    const expected = new Set([board(4, 3)]);

    pawn.calcMoves(pawn, BOARD);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn moves two squares", () => {
    const pawn = makePiece("pawn", "white", 6, 3);
    board(6, 3).piece = pawn;

    const expected = new Set([board(5, 3), board(4, 3)]);

    pawn.calcMoves(pawn, BOARD);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn capture", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    board(3, 3).piece = pawn;
    placePiece("pawn", "black", 2, 2);

    const expected = new Set([board(2, 3), board(2, 2)]);

    pawn.calcMoves(pawn, BOARD);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn with same color on diagonal", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    board(3, 3).piece = pawn;
    placePiece("pawn", "white", 2, 4);

    const expected = new Set([board(2, 3)]);

    pawn.calcMoves(pawn, BOARD);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn en passant", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    board(3, 3).piece = pawn;
    const oppPawn = makePiece("pawn", "black", 3, 4);
    board(3, 4).piece = oppPawn;
    oppPawn.params.set("movedTwo", true);

    const expected = new Set([board(2, 3), board(2, 4)]);

    pawn.calcMoves(pawn, BOARD);

    expect(setsEqual(expected, pawn.moves)).toBeTruthy();
  });
});

describe("pawnBlock", () => {
  it("simple pawn block", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    pawn.moves.add(board(2, 3));

    placePiece("pawn", "black", 2, 3);

    expect(
      setsEqual(new Set([board(2, 3)]), pawn.block(pawn, BOARD, [2, 3]))
    ).toBeTruthy();

    expect(pawn.moves.size).toBe(0);
  });

  it("pawn block two squares ahead", () => {
    const pawn = makePiece("pawn", "white", 6, 3);
    pawn.moves.add(board(5, 3));
    pawn.moves.add(board(4, 3));

    placePiece("pawn", "black", 4, 3);

    expect(
      setsEqual(new Set([board(4, 3)]), pawn.block(pawn, BOARD, [4, 3]))
    ).toBeTruthy();

    expect(setsEqual(new Set([board(5, 3)]), pawn.moves)).toBeTruthy();
  });

  it("pawn block one square ahead", () => {
    const pawn = makePiece("pawn", "white", 6, 3);
    pawn.moves.add(board(5, 3));
    pawn.moves.add(board(4, 3));

    placePiece("pawn", "black", 6, 3);

    const expectedBlocks = new Set([board(5, 3), board(4, 3)]);

    expect(
      setsEqual(expectedBlocks, pawn.block(pawn, BOARD, [5, 3]))
    ).toBeTruthy();

    expect(pawn.moves.size).toBe(0);
  });
});
