import { describe, it, expect } from "vitest";
import {
  board,
  BOARD,
  makePiece,
  placePiece,
  setsEqual,
  verifyMoves,
} from "../utilities";
import { pawnMoves, pawnBlock } from "../../components/PieceTypes/Pawn";

describe("pawnMoves", () => {
  it("simple white pawn moves", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    board(3, 3).piece = pawn;

    const expected = new Set([board(2, 2), board(2, 3), board(2, 4)]);

    pawnMoves(pawn, BOARD);

    expect(verifyMoves(expected, pawn.moves)).toBeTruthy();
  });

  it("simple black pawn moves", () => {
    const pawn = makePiece("pawn", "black", 3, 3);
    board(3, 3).piece = pawn;

    const expected = new Set([board(4, 2), board(4, 3), board(4, 4)]);

    pawnMoves(pawn, BOARD);

    expect(verifyMoves(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn moves two squares", () => {
    const pawn = makePiece("pawn", "white", 6, 3);
    board(6, 3).piece = pawn;

    const expected = new Set([
      board(5, 2),
      board(5, 3),
      board(5, 4),
      board(4, 3),
    ]);

    pawnMoves(pawn, BOARD);

    expect(verifyMoves(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn capture", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    board(3, 3).piece = pawn;
    placePiece("pawn", "black", 2, 2);

    const expected = new Set([board(2, 2), board(2, 3), board(2, 4)]);

    pawnMoves(pawn, BOARD);

    expect(verifyMoves(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn with same color on diagonal", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    board(3, 3).piece = pawn;
    placePiece("pawn", "white", 2, 4);

    const expected = new Set([board(2, 2), board(2, 3), board(2, 4)]);

    pawnMoves(pawn, BOARD);

    expect(verifyMoves(expected, pawn.moves)).toBeTruthy();
  });

  it("pawn en passant", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    board(3, 3).piece = pawn;
    const oppPawn = makePiece("pawn", "black", 3, 4);
    board(3, 4).piece = oppPawn;
    oppPawn.params.set("movedTwo", true);

    const expected = new Set([board(2, 2), board(2, 3), board(2, 4)]);

    pawnMoves(pawn, BOARD);

    expect(verifyMoves(expected, pawn.moves)).toBeTruthy();
  });
});

describe("pawnBlock", () => {
  it("simple pawn block", () => {
    const pawn = makePiece("pawn", "white", 3, 3);
    // pawn.moves.add(board(2, 3));
    pawnMoves(pawn, BOARD);

    placePiece("pawn", "black", 2, 3);

    const expectedBlocks = new Set();
    const expectedMoves = new Set([board(2, 2), board(2, 3), board(2, 4)]);

    expect(setsEqual(expectedBlocks, pawnBlock(pawn, 2, 3))).toBeTruthy();
    expect(verifyMoves(expectedMoves, pawn.moves)).toBeTruthy();
  });

  it("pawn block two squares ahead", () => {
    const pawn = makePiece("pawn", "white", 6, 3);
    // pawn.moves.add(board(5, 3));
    // pawn.moves.add(board(4, 3));
    pawnMoves(pawn, BOARD);

    placePiece("pawn", "black", 4, 3);

    const expectedBlocks = new Set();
    const expectedMoves = new Set([
      board(5, 2),
      board(5, 3),
      board(5, 4),
      board(4, 3),
    ]);

    expect(setsEqual(expectedBlocks, pawnBlock(pawn, 4, 3))).toBeTruthy();
    expect(verifyMoves(expectedMoves, pawn.moves)).toBeTruthy();
  });

  it("pawn block one square ahead", () => {
    const pawn = makePiece("pawn", "white", 6, 3);
    // pawn.moves.add(board(5, 3));
    // pawn.moves.add(board(4, 3));
    pawnMoves(pawn, BOARD);

    placePiece("pawn", "black", 6, 3);

    const expectedBlocks = new Set([board(4, 3)]);
    const expectedMoves = new Set([board(5, 2), board(5, 3), board(5, 4)]);

    expect(setsEqual(expectedBlocks, pawnBlock(pawn, 5, 3))).toBeTruthy();
    expect(verifyMoves(expectedMoves, pawn.moves)).toBeTruthy();
  });
});
