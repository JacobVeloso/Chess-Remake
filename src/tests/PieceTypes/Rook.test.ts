import { describe, it, expect } from "vitest";
import { BOARD, board, makePiece, placePiece, setsEqual } from "../utilities";

describe("rookMoves", () => {
  it("simple rook moves", () => {
    const rook = makePiece("rook", "white", 3, 3);
    board(3, 3).piece = rook;

    const expected = new Set([
      board(2, 3),
      board(1, 3),
      board(0, 3),
      board(3, 4),
      board(3, 5),
      board(3, 6),
      board(3, 7),
      board(4, 3),
      board(5, 3),
      board(6, 3),
      board(7, 3),
      board(3, 2),
      board(3, 1),
      board(3, 0),
    ]);

    rook.calcMoves(rook, BOARD);

    expect(setsEqual(expected, rook.moves)).toBeTruthy();
  });

  it("rook moves off board", () => {
    const rook = makePiece("rook", "white", 7, 7);
    board(7, 7).piece = rook;

    const expected = new Set([
      board(6, 7),
      board(5, 7),
      board(4, 7),
      board(3, 7),
      board(2, 7),
      board(1, 7),
      board(0, 7),
      board(7, 6),
      board(7, 5),
      board(7, 4),
      board(7, 3),
      board(7, 2),
      board(7, 1),
      board(7, 0),
    ]);

    rook.calcMoves(rook, BOARD);

    expect(setsEqual(expected, rook.moves)).toBeTruthy();
  });
});

describe("rookBlock", () => {
  it("block rook", () => {
    const rook = makePiece("rook", "white", 0, 0);
    board(0, 0).piece = rook;
    rook.moves.add(board(1, 0));
    rook.moves.add(board(2, 0));
    rook.moves.add(board(3, 0));
    rook.moves.add(board(4, 0));
    rook.moves.add(board(5, 0));
    rook.moves.add(board(6, 0));
    rook.moves.add(board(7, 0));
    rook.moves.add(board(0, 1));
    rook.moves.add(board(0, 2));
    rook.moves.add(board(0, 3));
    rook.moves.add(board(0, 4));
    rook.moves.add(board(0, 5));
    rook.moves.add(board(0, 6));
    rook.moves.add(board(0, 7));

    placePiece("pawn", "white", 4, 0);
    placePiece("pawn", "black", 0, 4);

    const expectedMoves = new Set([
      board(1, 0),
      board(2, 0),
      board(3, 0),
      board(0, 1),
      board(0, 2),
      board(0, 3),
      board(0, 4),
    ]);

    const expectedBlock1 = new Set([
      board(4, 0),
      board(5, 0),
      board(6, 0),
      board(7, 0),
    ]);
    const expectedBlock2 = new Set([board(0, 5), board(0, 6), board(0, 7)]);

    expect(
      setsEqual(expectedBlock1, rook.block(rook, BOARD, [4, 0]))
    ).toBeTruthy();
    expect(
      setsEqual(expectedBlock2, rook.block(rook, BOARD, [0, 4]))
    ).toBeTruthy();

    expect(setsEqual(expectedMoves, rook.moves)).toBeTruthy();
  });

  it("rook blocked one side", () => {
    const rook = makePiece("rook", "white", 3, 0);
    board(3, 0).piece = rook;
    rook.moves.add(board(0, 0));
    rook.moves.add(board(1, 0));
    rook.moves.add(board(2, 0));
    rook.moves.add(board(4, 0));
    rook.moves.add(board(5, 0));
    rook.moves.add(board(6, 0));
    rook.moves.add(board(7, 0));

    placePiece("pawn", "black", 5, 0);

    const expectedMoves = new Set([
      board(0, 0),
      board(1, 0),
      board(2, 0),
      board(4, 0),
      board(5, 0),
    ]);

    const expectedBlocks = new Set([board(6, 0), board(7, 0)]);

    expect(
      setsEqual(expectedBlocks, rook.block(rook, BOARD, [5, 0]))
    ).toBeTruthy();

    expect(setsEqual(expectedMoves, rook.moves)).toBeTruthy();
  });
});

describe("rookUnblock", () => {
  it("unblock rook", () => {
    const rook = makePiece("rook", "white", 0, 0);
    board(0, 0).piece = rook;
    rook.moves.add(board(1, 0));
    rook.moves.add(board(2, 0));
    rook.moves.add(board(3, 0));
    rook.moves.add(board(4, 0));
    rook.moves.add(board(0, 1));
    rook.moves.add(board(0, 2));
    rook.moves.add(board(0, 3));
    rook.moves.add(board(0, 4));

    const expected = new Set([
      board(1, 0),
      board(2, 0),
      board(3, 0),
      board(4, 0),
      board(5, 0),
      board(6, 0),
      board(7, 0),
      board(0, 1),
      board(0, 2),
      board(0, 3),
      board(0, 4),
      board(0, 5),
      board(0, 6),
      board(0, 7),
    ]);

    rook.unblock(rook, BOARD, [4, 0]);
    rook.unblock(rook, BOARD, [0, 4]);

    expect(setsEqual(expected, rook.moves)).toBeTruthy();
  });

  it("rook unblocked one side", () => {
    const rook = makePiece("rook", "white", 0, 0);
    board(3, 0).piece = rook;
    rook.moves.add(board(0, 0));
    rook.moves.add(board(1, 0));
    rook.moves.add(board(2, 0));
    rook.moves.add(board(4, 0));
    rook.moves.add(board(5, 0));

    placePiece("pawn", "black", 5, 0);

    const expected = new Set([
      board(0, 0),
      board(1, 0),
      board(2, 0),
      board(4, 0),
      board(5, 0),
      board(6, 0),
      board(7, 0),
    ]);

    rook.unblock(rook, BOARD, [5, 0]);

    expect(setsEqual(expected, rook.moves)).toBeTruthy();
  });
});
