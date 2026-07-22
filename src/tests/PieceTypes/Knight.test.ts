import { describe, it, expect } from "vitest";
import { BOARD, makePiece } from "../utilities";
import { board, verifyMoves } from "../utilities";
import { knightMoves } from "../../components/PieceTypes/Knight";

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

    knightMoves(knight, BOARD);

    expect(verifyMoves(expected, knight.moves)).toBeTruthy();
  });

  it("knight moves off board", () => {
    const knight = makePiece("knight", "white", 7, 6);
    board(7, 6).piece = knight;

    const expected = new Set([board(5, 5), board(5, 7), board(6, 4)]);

    knightMoves(knight, BOARD);

    expect(verifyMoves(expected, knight.moves)).toBeTruthy();
  });
});
