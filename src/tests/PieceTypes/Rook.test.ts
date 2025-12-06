import { describe, it, expect } from "vitest";
import { board, getTile, makePiece, placePiece, setsEqual } from "../utilities";

describe("rookBlock", () => {
  it("block rook", () => {
    const rook = makePiece("rook", "white", 0, 0);
    getTile(0, 0).piece = rook;
    rook.moves.add(getTile(1, 0));
    rook.moves.add(getTile(2, 0));
    rook.moves.add(getTile(3, 0));
    rook.moves.add(getTile(4, 0));
    rook.moves.add(getTile(5, 0));
    rook.moves.add(getTile(6, 0));
    rook.moves.add(getTile(7, 0));
    rook.moves.add(getTile(0, 1));
    rook.moves.add(getTile(0, 2));
    rook.moves.add(getTile(0, 3));
    rook.moves.add(getTile(0, 4));
    rook.moves.add(getTile(0, 5));
    rook.moves.add(getTile(0, 6));
    rook.moves.add(getTile(0, 7));

    placePiece("pawn", "black", 4, 0);
    placePiece("pawn", "black", 0, 4);

    const expected = new Set([
      getTile(1, 0),
      getTile(2, 0),
      getTile(3, 0),
      getTile(4, 0),
      getTile(0, 1),
      getTile(0, 2),
      getTile(0, 3),
      getTile(0, 4),
    ]);

    rook.block(rook, board, [4, 0]);
    rook.block(rook, board, [0, 4]);

    expect(setsEqual(expected, rook.moves)).toBeTruthy();
  });

  it("rook blocked one side", () => {
    const rook = makePiece("rook", "white", 0, 0);
    getTile(3, 0).piece = rook;
    rook.moves.add(getTile(0, 0));
    rook.moves.add(getTile(1, 0));
    rook.moves.add(getTile(2, 0));
    rook.moves.add(getTile(4, 0));
    rook.moves.add(getTile(5, 0));
    rook.moves.add(getTile(6, 0));
    rook.moves.add(getTile(7, 0));

    placePiece("pawn", "black", 5, 0);

    const expected = new Set([
      getTile(0, 0),
      getTile(1, 0),
      getTile(2, 0),
      getTile(4, 0),
      getTile(5, 0),
    ]);

    rook.block(rook, board, [5, 0]);

    expect(setsEqual(expected, rook.moves)).toBeTruthy();
  });
});

describe("rookUnblock", () => {
  it("unblock rook", () => {
    const rook = makePiece("rook", "white", 0, 0);
    getTile(0, 0).piece = rook;
    rook.moves.add(getTile(1, 0));
    rook.moves.add(getTile(2, 0));
    rook.moves.add(getTile(3, 0));
    rook.moves.add(getTile(4, 0));
    rook.moves.add(getTile(0, 1));
    rook.moves.add(getTile(0, 2));
    rook.moves.add(getTile(0, 3));
    rook.moves.add(getTile(0, 4));

    const expected = new Set([
      getTile(1, 0),
      getTile(2, 0),
      getTile(3, 0),
      getTile(4, 0),
      getTile(5, 0),
      getTile(6, 0),
      getTile(7, 0),
      getTile(0, 1),
      getTile(0, 2),
      getTile(0, 3),
      getTile(0, 4),
      getTile(0, 5),
      getTile(0, 6),
      getTile(0, 7),
    ]);

    rook.unblock(rook, board, [4, 0]);
    rook.unblock(rook, board, [0, 4]);

    expect(setsEqual(expected, rook.moves)).toBeTruthy();
  });

  it("rook unblocked one side", () => {
    const rook = makePiece("rook", "white", 0, 0);
    getTile(3, 0).piece = rook;
    rook.moves.add(getTile(0, 0));
    rook.moves.add(getTile(1, 0));
    rook.moves.add(getTile(2, 0));
    rook.moves.add(getTile(4, 0));
    rook.moves.add(getTile(5, 0));

    placePiece("pawn", "black", 5, 0);

    const expected = new Set([
      getTile(0, 0),
      getTile(1, 0),
      getTile(2, 0),
      getTile(4, 0),
      getTile(5, 0),
      getTile(6, 0),
      getTile(7, 0),
    ]);

    rook.unblock(rook, board, [5, 0]);

    expect(setsEqual(expected, rook.moves)).toBeTruthy();
  });
});
