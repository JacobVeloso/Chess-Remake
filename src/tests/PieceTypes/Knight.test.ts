import { describe, it, expect } from "vitest";
import { BOARD, makePiece, placePiece, setsEqual } from "../utilities";
import { board } from "../utilities";

describe("knightMoves", () => {
  it("simple knight moves", () => {
    const knight = makePiece("knight", "white", 3, 3);
    board(3, 3).piece = knight;

    const expected = new Set([
      board(4, 1),
      board(5, 2),
      board(5, 4),
      board(4, 5),
      board(2, 5),
      board(1, 4),
      board(1, 2),
      board(2, 1),
    ]);

    knight.calcMoves(knight, BOARD);

    expect(setsEqual(expected, knight.moves)).toBeTruthy();
  });

  it("knight moves off board", () => {
    const knight = makePiece("knight", "white", 7, 6);
    board(7, 6).piece = knight;

    const expected = new Set([board(5, 5), board(5, 7), board(6, 4)]);

    knight.calcMoves(knight, BOARD);

    expect(setsEqual(expected, knight.moves)).toBeTruthy();
  });
});

describe("knightBlock", () => {
  it("block knight", () => {
    const knight = makePiece("knight", "white", 3, 3);
    knight.moves.add(board(4, 1));
    knight.moves.add(board(5, 2));
    knight.moves.add(board(5, 4));
    knight.moves.add(board(4, 5));
    knight.moves.add(board(3, 5));
    knight.moves.add(board(1, 4));
    knight.moves.add(board(1, 2));
    knight.moves.add(board(2, 1));

    placePiece("pawn", "white", 4, 5);
    placePiece("pawn", "white", 1, 2);

    const expectedMoves = new Set([
      board(4, 1),
      board(5, 2),
      board(5, 4),
      board(3, 5),
      board(1, 4),
      board(2, 1),
    ]);

    const expectedBlock1 = new Set([board(4, 5)]);
    const expectedBlock2 = new Set([board(1, 2)]);

    expect(
      setsEqual(expectedBlock1, knight.block(knight, BOARD, [4, 5]))
    ).toBeTruthy();
    expect(
      setsEqual(expectedBlock2, knight.block(knight, BOARD, [1, 2]))
    ).toBeTruthy();

    expect(setsEqual(expectedMoves, knight.moves)).toBeTruthy();
  });
});
