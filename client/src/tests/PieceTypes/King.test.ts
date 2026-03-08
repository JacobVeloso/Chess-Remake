import { describe, it, expect } from "vitest";
import { board, BOARD, makePiece, setsEqual, verifyMoves } from "../utilities";
import { kingMoves, checkBlocks } from "../../components/PieceTypes/King";
import { calculateMoves } from "../../components/MoveCalculation";

describe("kingMoves", () => {
  it("simple king moves", () => {
    const king = makePiece("king", "white", 3, 3);

    board(3, 3).piece = king;

    const expected = new Set([
      board(2, 2),
      board(2, 3),
      board(2, 4),
      board(3, 2),
      board(3, 4),
      board(4, 2),
      board(4, 3),
      board(4, 4),
    ]);

    kingMoves(king, BOARD);
    //expect(king.moves).toBeFalsy();
    expect(verifyMoves(expected, king.moves)).toBeTruthy();
  });

  it("king moves off board", () => {
    const king = makePiece("king", "white", 0, 0);

    board(0, 0).piece = king;

    const expected = new Set([board(0, 1), board(1, 1), board(1, 0)]);

    kingMoves(king, BOARD);

    expect(verifyMoves(expected, king.moves)).toBeTruthy();
  });

  it("king castling", () => {
    const king = makePiece("king", "white", 7, 4);
    board(7, 4).piece = king;

    const leftRook = makePiece("rook", "white", 7, 0);
    board(7, 0).piece = leftRook;

    const rightRook = makePiece("rook", "white", 7, 7);
    board(7, 7).piece = rightRook;

    const expected = new Set([
      board(6, 3),
      board(6, 4),
      board(6, 5),
      board(7, 3),
      board(7, 5),
      board(7, 2),
      board(7, 6),
    ]);

    kingMoves(king, BOARD);
    expect(verifyMoves(expected, king.moves)).toBeTruthy();
  });
});

describe("checkBlocks", () => {
  it("calculate check blocks", () => {
    const rook = makePiece("rook", "white", 3, 3);
    board(3, 3).piece = rook;
    const king = makePiece("king", "black", 3, 6);
    board(3, 6).piece = king;

    calculateMoves(rook, BOARD);
    calculateMoves(king, BOARD);

    const expectedBlocks = new Set([board(3, 3), board(3, 4), board(3, 5)]);

    const blocks = checkBlocks(BOARD, 3, 6);

    expect(blocks).toBeTruthy();
    expect(setsEqual(expectedBlocks, blocks!)).toBeTruthy();
  });
});
