import { describe, it, expect } from "vitest";
import { board, getTile, makePiece, placePiece, setsEqual } from "../utilities";

describe("queenMoves", () => {
  it("simple queen moves", () => {
    const queen = makePiece("queen", "white", 3, 3);
    getTile(3, 3).piece = queen;

    const expected = new Set([
      getTile(2, 3),
      getTile(1, 3),
      getTile(0, 3),
      getTile(2, 4),
      getTile(1, 5),
      getTile(0, 6),
      getTile(3, 4),
      getTile(3, 5),
      getTile(3, 6),
      getTile(3, 7),
      getTile(4, 4),
      getTile(5, 5),
      getTile(6, 6),
      getTile(7, 7),
      getTile(4, 3),
      getTile(5, 3),
      getTile(6, 3),
      getTile(7, 3),
      getTile(4, 2),
      getTile(5, 1),
      getTile(6, 0),
      getTile(3, 2),
      getTile(3, 1),
      getTile(3, 0),
      getTile(2, 2),
      getTile(1, 1),
      getTile(0, 0),
    ]);

    queen.calcMoves(queen, board);

    expect(setsEqual(expected, queen.moves)).toBeTruthy();
  });

  it("queen moves off board", () => {
    const queen = makePiece("queen", "white", 0, 0);
    getTile(0, 0).piece = queen;

    const expected = new Set([
      getTile(0, 1),
      getTile(0, 2),
      getTile(0, 3),
      getTile(0, 4),
      getTile(0, 5),
      getTile(0, 6),
      getTile(0, 7),
      getTile(1, 1),
      getTile(2, 2),
      getTile(3, 3),
      getTile(4, 4),
      getTile(5, 5),
      getTile(6, 6),
      getTile(7, 7),
      getTile(1, 0),
      getTile(2, 0),
      getTile(3, 0),
      getTile(4, 0),
      getTile(5, 0),
      getTile(6, 0),
      getTile(7, 0),
    ]);

    queen.calcMoves(queen, board);

    expect(setsEqual(expected, queen.moves)).toBeTruthy();
  });
});

describe("queenBlock", () => {
  it("block queen", () => {
    const queen = makePiece("queen", "white", 3, 0);
    getTile(3, 0).piece = queen;
    queen.moves.add(getTile(2, 1));
    queen.moves.add(getTile(1, 2));
    queen.moves.add(getTile(0, 3));
    queen.moves.add(getTile(3, 1));
    queen.moves.add(getTile(3, 2));
    queen.moves.add(getTile(3, 3));
    queen.moves.add(getTile(3, 4));
    queen.moves.add(getTile(3, 5));
    queen.moves.add(getTile(3, 6));
    queen.moves.add(getTile(3, 7));
    queen.moves.add(getTile(4, 1));
    queen.moves.add(getTile(5, 2));
    queen.moves.add(getTile(6, 3));
    queen.moves.add(getTile(7, 4));

    placePiece("pawn", "black", 1, 2);
    placePiece("pawn", "black", 3, 4);
    placePiece("pawn", "black", 5, 2);

    const expected = new Set([
      getTile(2, 1),
      getTile(1, 2),
      getTile(3, 1),
      getTile(3, 2),
      getTile(3, 3),
      getTile(3, 4),
      getTile(4, 1),
      getTile(5, 2),
    ]);

    queen.block(queen, board, [1, 2]);
    queen.block(queen, board, [3, 4]);
    queen.block(queen, board, [5, 2]);

    expect(setsEqual(expected, queen.moves)).toBeTruthy();
  });

  it("queen blocked one side", () => {
    const queen = makePiece("queen", "white", 0, 0);
    getTile(3, 3).piece = queen;
    queen.moves.add(getTile(0, 0));
    queen.moves.add(getTile(1, 1));
    queen.moves.add(getTile(2, 2));
    queen.moves.add(getTile(4, 4));
    queen.moves.add(getTile(5, 5));
    queen.moves.add(getTile(6, 6));
    queen.moves.add(getTile(7, 7));

    placePiece("pawn", "black", 5, 5);

    const expected = new Set([
      getTile(0, 0),
      getTile(1, 1),
      getTile(2, 2),
      getTile(4, 4),
      getTile(5, 5),
    ]);

    queen.block(queen, board, [5, 5]);

    expect(setsEqual(expected, queen.moves)).toBeTruthy();
  });
});

describe("queenUnblock", () => {
  it("unblock queen", () => {
    const queen = makePiece("queen", "white", 3, 0);
    getTile(3, 0).piece = queen;
    queen.moves.add(getTile(2, 1));
    queen.moves.add(getTile(1, 2));
    queen.moves.add(getTile(3, 1));
    queen.moves.add(getTile(3, 2));
    queen.moves.add(getTile(3, 3));
    queen.moves.add(getTile(3, 4));
    queen.moves.add(getTile(4, 1));
    queen.moves.add(getTile(5, 2));

    const expected = new Set([
      getTile(2, 1),
      getTile(1, 2),
      getTile(0, 3),
      getTile(3, 1),
      getTile(3, 2),
      getTile(3, 3),
      getTile(3, 4),
      getTile(3, 5),
      getTile(3, 6),
      getTile(3, 7),
      getTile(4, 1),
      getTile(5, 2),
      getTile(6, 3),
      getTile(7, 4),
    ]);

    queen.unblock(queen, board, [1, 2]);
    queen.unblock(queen, board, [3, 4]);
    queen.unblock(queen, board, [5, 2]);

    expect(setsEqual(expected, queen.moves)).toBeTruthy();
  });

  it("queen unblocked one side", () => {
    const queen = makePiece("queen", "white", 0, 0);
    getTile(3, 3).piece = queen;
    queen.moves.add(getTile(0, 0));
    queen.moves.add(getTile(1, 1));
    queen.moves.add(getTile(2, 2));
    queen.moves.add(getTile(4, 4));
    queen.moves.add(getTile(5, 5));

    const expected = new Set([
      getTile(0, 0),
      getTile(1, 1),
      getTile(2, 2),
      getTile(4, 4),
      getTile(5, 5),
      getTile(6, 6),
      getTile(7, 7),
    ]);

    queen.unblock(queen, board, [5, 5]);

    expect(setsEqual(expected, queen.moves)).toBeTruthy();
  });
});
