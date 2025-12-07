import { describe, it, expect } from "vitest";
import { board, getTile, makePiece, placePiece, setsEqual } from "../utilities";

describe("kingMoves", () => {
  it("simple king moves", () => {
    const king = makePiece("king", "white", 3, 3);

    getTile(3, 3).piece = king;

    const expected = new Set([
      getTile(2, 2),
      getTile(2, 3),
      getTile(2, 4),
      getTile(3, 2),
      getTile(3, 4),
      getTile(4, 2),
      getTile(4, 3),
      getTile(4, 4),
    ]);

    king.calcMoves(king, board);
    //expect(king.moves).toBeFalsy();
    expect(setsEqual(expected, king.moves)).toBeTruthy();
  });

  it("king moves off board", () => {
    const king = makePiece("king", "white", 0, 0);

    getTile(0, 0).piece = king;

    const expected = new Set([getTile(0, 1), getTile(1, 1), getTile(1, 0)]);

    king.calcMoves(king, board);

    expect(setsEqual(expected, king.moves)).toBeTruthy();
  });

  it("king castling", () => {});
});

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

    expect(setsEqual(expected, king.moves)).toBeTruthy();
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

    expect(setsEqual(expected, king.moves)).toBeTruthy();
  });
});
