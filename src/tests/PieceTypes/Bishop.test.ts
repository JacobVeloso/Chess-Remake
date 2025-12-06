import { describe, it, expect } from "vitest";
import { board, getTile, makePiece, placePiece, setsEqual } from "../utilities";

describe("bishopBlock", () => {
  it("block bishop", () => {
    const bishop = makePiece("bishop", "white", 3, 0);
    getTile(3, 0).piece = bishop;
    bishop.moves.add(getTile(2, 1));
    bishop.moves.add(getTile(1, 2));
    bishop.moves.add(getTile(0, 3));
    bishop.moves.add(getTile(4, 1));
    bishop.moves.add(getTile(5, 2));
    bishop.moves.add(getTile(6, 3));
    bishop.moves.add(getTile(7, 4));

    placePiece("pawn", "black", 1, 2);
    placePiece("pawn", "black", 5, 2);

    const expected = new Set([
      getTile(2, 1),
      getTile(1, 2),
      getTile(4, 1),
      getTile(5, 2),
    ]);

    bishop.block(bishop, board, [1, 2]);
    bishop.block(bishop, board, [5, 2]);

    expect(setsEqual(expected, bishop.moves)).toBeTruthy();
  });

  it("bishop blocked one side", () => {
    const bishop = makePiece("bishop", "white", 0, 0);
    getTile(3, 3).piece = bishop;
    bishop.moves.add(getTile(0, 0));
    bishop.moves.add(getTile(1, 1));
    bishop.moves.add(getTile(2, 2));
    bishop.moves.add(getTile(4, 4));
    bishop.moves.add(getTile(5, 5));
    bishop.moves.add(getTile(6, 6));
    bishop.moves.add(getTile(7, 7));

    placePiece("pawn", "black", 5, 5);

    const expected = new Set([
      getTile(0, 0),
      getTile(1, 1),
      getTile(2, 2),
      getTile(4, 4),
      getTile(5, 5),
    ]);

    bishop.block(bishop, board, [5, 5]);

    expect(setsEqual(expected, bishop.moves)).toBeTruthy();
  });
});

describe("bishopUnblock", () => {
  it("unblock bishop", () => {
    const bishop = makePiece("bishop", "white", 3, 0);
    getTile(3, 0).piece = bishop;
    bishop.moves.add(getTile(2, 1));
    bishop.moves.add(getTile(1, 2));
    bishop.moves.add(getTile(4, 1));
    bishop.moves.add(getTile(5, 2));

    const expected = new Set([
      getTile(2, 1),
      getTile(1, 2),
      getTile(0, 3),
      getTile(4, 1),
      getTile(5, 2),
      getTile(6, 3),
      getTile(7, 4),
    ]);

    bishop.unblock(bishop, board, [1, 2]);
    bishop.unblock(bishop, board, [5, 2]);

    expect(setsEqual(expected, bishop.moves)).toBeTruthy();
  });

  it("bishop unblocked one side", () => {
    const bishop = makePiece("bishop", "white", 0, 0);
    getTile(3, 3).piece = bishop;
    bishop.moves.add(getTile(0, 0));
    bishop.moves.add(getTile(1, 1));
    bishop.moves.add(getTile(2, 2));
    bishop.moves.add(getTile(4, 4));
    bishop.moves.add(getTile(5, 5));

    const expected = new Set([
      getTile(0, 0),
      getTile(1, 1),
      getTile(2, 2),
      getTile(4, 4),
      getTile(5, 5),
      getTile(6, 6),
      getTile(7, 7),
    ]);

    bishop.unblock(bishop, board, [5, 5]);

    expect(setsEqual(expected, bishop.moves)).toBeTruthy();
  });
});
