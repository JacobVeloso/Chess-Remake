import { describe, it, expect } from "vitest";
import { board, getTile, makePiece, placePiece, setsEqual } from "../utilities";

describe("kingBlock", () => {
  it("block king", () => {
    const king = makePiece("king", "white", 3, 3);
    king.moves.add(getTile(2, 2));
    king.moves.add(getTile(3, 2));
    king.moves.add(getTile(4, 2));
    king.moves.add(getTile(2, 3));
    king.moves.add(getTile(4, 3));
    king.moves.add(getTile(2, 4));
    king.moves.add(getTile(3, 4));
    king.moves.add(getTile(4, 4));

    placePiece("rook", "black", 4, 2);
    placePiece("rook", "black", 2, 4);

    const expected = new Set([
      getTile(2, 2),
      getTile(3, 2),
      getTile(2, 3),
      getTile(4, 3),
      getTile(3, 4),
      getTile(4, 4),
    ]);

    king.block(king, board, [4, 2]);
    king.block(king, board, [2, 4]);

    expect(setsEqual(expected, king.moves));
  });
});

describe("kingUnblock", () => {
  it("unblock king", () => {
    const king = makePiece("king", "white", 3, 3);
    king.moves.add(getTile(2, 2));
    king.moves.add(getTile(3, 2));
    king.moves.add(getTile(2, 3));
    king.moves.add(getTile(4, 3));
    king.moves.add(getTile(3, 4));
    king.moves.add(getTile(4, 4));

    const expected = new Set([
      getTile(2, 2),
      getTile(3, 2),
      getTile(4, 2),
      getTile(2, 3),
      getTile(4, 3),
      getTile(2, 4),
      getTile(3, 4),
      getTile(4, 4),
    ]);

    king.unblock(king, board, [4, 2]);
    king.unblock(king, board, [2, 4]);

    expect(setsEqual(expected, king.moves));
  });
});
