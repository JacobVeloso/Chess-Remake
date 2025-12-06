import { describe, it, expect } from "vitest";
import {
  knightMoves,
  knightBlock,
  knightUnblock,
} from "../../components/PieceTypes/Knight";
import { board, getTile, makePiece, placePiece, setsEqual } from "../utilities";

describe("knightBlock", () => {
  it("block knight", () => {
    const knight = makePiece("knight", "white", 3, 3);
    knight.moves.add(getTile(4, 1));
    knight.moves.add(getTile(5, 2));
    knight.moves.add(getTile(5, 4));
    knight.moves.add(getTile(4, 5));
    knight.moves.add(getTile(3, 5));
    knight.moves.add(getTile(1, 4));
    knight.moves.add(getTile(1, 2));
    knight.moves.add(getTile(2, 1));

    placePiece("pawn", "black", 4, 5);
    placePiece("pawn", "black", 1, 2);

    const expected = new Set([
      getTile(4, 1),
      getTile(5, 2),
      getTile(5, 4),
      getTile(4, 5),
      getTile(3, 5),
      getTile(1, 4),
      getTile(1, 2),
      getTile(2, 1),
    ]);

    knight.block(knight, board, [4, 5]);
    knight.block(knight, board, [1, 2]);

    expect(setsEqual(expected, knight.moves)).toBeTruthy();
  });
});

describe("knightUnblock", () => {
  it("unblock knight", () => {
    const knight = makePiece("knight", "white", 3, 3);
    knight.moves.add(getTile(4, 1));
    knight.moves.add(getTile(5, 2));
    knight.moves.add(getTile(5, 4));
    knight.moves.add(getTile(4, 5));
    knight.moves.add(getTile(3, 5));
    knight.moves.add(getTile(1, 4));
    knight.moves.add(getTile(1, 2));
    knight.moves.add(getTile(2, 1));

    const expected = new Set([
      getTile(4, 1),
      getTile(5, 2),
      getTile(5, 4),
      getTile(4, 5),
      getTile(3, 5),
      getTile(1, 4),
      getTile(1, 2),
      getTile(2, 1),
    ]);

    knight.unblock(knight, board, [4, 5]);
    knight.unblock(knight, board, [1, 2]);

    expect(setsEqual(expected, knight.moves)).toBeTruthy();
  });
});
