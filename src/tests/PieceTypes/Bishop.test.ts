import { describe, it, expect } from "vitest";
import { board, BOARD, makePiece, placePiece, setsEqual } from "../utilities";

describe("bishopMoves", () => {
  it("simple bishop moves", () => {
    const bishop = makePiece("bishop", "white", 3, 3);
    board(3, 3).piece = bishop;

    const expected = new Set([
      board(2, 4),
      board(1, 5),
      board(0, 6),
      board(4, 4),
      board(5, 5),
      board(6, 6),
      board(7, 7),
      board(4, 2),
      board(5, 1),
      board(6, 0),
      board(2, 2),
      board(1, 1),
      board(0, 0),
    ]);

    bishop.calcMoves(bishop, BOARD);

    expect(setsEqual(expected, bishop.moves)).toBeTruthy();
  });

  it("bishop moves off board", () => {
    const bishop = makePiece("bishop", "white", 0, 3);
    board(0, 3).piece = bishop;

    const expected = new Set([
      board(1, 4),
      board(2, 5),
      board(3, 6),
      board(4, 7),
      board(1, 2),
      board(2, 1),
      board(3, 0),
    ]);

    bishop.calcMoves(bishop, BOARD);

    expect(setsEqual(expected, bishop.moves)).toBeTruthy();
  });
});

describe("bishopBlock", () => {
  it("block bishop", () => {
    const bishop = makePiece("bishop", "white", 3, 0);
    board(3, 0).piece = bishop;
    bishop.moves.add(board(2, 1));
    bishop.moves.add(board(1, 2));
    bishop.moves.add(board(0, 3));
    bishop.moves.add(board(4, 1));
    bishop.moves.add(board(5, 2));
    bishop.moves.add(board(6, 3));
    bishop.moves.add(board(7, 4));

    placePiece("pawn", "white", 1, 2);
    placePiece("pawn", "black", 5, 2);

    const expectedMoves = new Set([board(2, 1), board(4, 1), board(5, 2)]);

    const expectedBlocks1 = new Set([board(1, 2), board(0, 3)]);
    const expectedBlocks2 = new Set([board(6, 3), board(7, 4)]);

    expect(
      setsEqual(expectedBlocks1, bishop.block(bishop, BOARD, [1, 2]))
    ).toBeTruthy();
    expect(
      setsEqual(expectedBlocks2, bishop.block(bishop, BOARD, [5, 2]))
    ).toBeTruthy();

    expect(setsEqual(expectedMoves, bishop.moves)).toBeTruthy();
  });

  it("bishop blocked one side", () => {
    const bishop = makePiece("bishop", "white", 0, 0);
    board(3, 3).piece = bishop;
    bishop.moves.add(board(0, 0));
    bishop.moves.add(board(1, 1));
    bishop.moves.add(board(2, 2));
    bishop.moves.add(board(4, 4));
    bishop.moves.add(board(5, 5));
    bishop.moves.add(board(6, 6));
    bishop.moves.add(board(7, 7));

    placePiece("pawn", "black", 5, 5);

    const expectedMoves = new Set([
      board(0, 0),
      board(1, 1),
      board(2, 2),
      board(4, 4),
      board(5, 5),
    ]);

    const expectedBlocks = new Set([board(6, 6), board(7, 7)]);

    expect(
      setsEqual(expectedBlocks, bishop.block(bishop, BOARD, [5, 5]))
    ).toBeTruthy();
    expect(setsEqual(expectedMoves, bishop.moves)).toBeTruthy();
  });
});
