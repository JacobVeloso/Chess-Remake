import { describe, it, expect } from "vitest";
import {
  board,
  BOARD,
  makePiece,
  placePiece,
  setsEqual,
  verifyMoves,
} from "../utilities";
import { queenMoves, queenBlock } from "../../components/PieceTypes/Queen";

describe("queenMoves", () => {
  it("simple queen moves", () => {
    const queen = makePiece("queen", "white", 3, 3);
    board(3, 3).piece = queen;

    const expected = new Set([
      board(2, 3),
      board(1, 3),
      board(0, 3),
      board(2, 4),
      board(1, 5),
      board(0, 6),
      board(3, 4),
      board(3, 5),
      board(3, 6),
      board(3, 7),
      board(4, 4),
      board(5, 5),
      board(6, 6),
      board(7, 7),
      board(4, 3),
      board(5, 3),
      board(6, 3),
      board(7, 3),
      board(4, 2),
      board(5, 1),
      board(6, 0),
      board(3, 2),
      board(3, 1),
      board(3, 0),
      board(2, 2),
      board(1, 1),
      board(0, 0),
    ]);

    queenMoves(queen, BOARD);

    expect(verifyMoves(expected, queen.moves)).toBeTruthy();
  });

  it("queen moves off board", () => {
    const queen = makePiece("queen", "white", 0, 0);
    board(0, 0).piece = queen;

    const expected = new Set([
      board(0, 1),
      board(0, 2),
      board(0, 3),
      board(0, 4),
      board(0, 5),
      board(0, 6),
      board(0, 7),
      board(1, 1),
      board(2, 2),
      board(3, 3),
      board(4, 4),
      board(5, 5),
      board(6, 6),
      board(7, 7),
      board(1, 0),
      board(2, 0),
      board(3, 0),
      board(4, 0),
      board(5, 0),
      board(6, 0),
      board(7, 0),
    ]);

    queenMoves(queen, BOARD);

    expect(verifyMoves(expected, queen.moves)).toBeTruthy();
  });
});

describe("queenBlock", () => {
  it("block queen", () => {
    const queen = makePiece("queen", "white", 3, 0);
    board(3, 0).piece = queen;
    // queen.moves.add(board(2, 1));
    // queen.moves.add(board(1, 2));
    // queen.moves.add(board(0, 3));
    // queen.moves.add(board(3, 1));
    // queen.moves.add(board(3, 2));
    // queen.moves.add(board(3, 3));
    // queen.moves.add(board(3, 4));
    // queen.moves.add(board(3, 5));
    // queen.moves.add(board(3, 6));
    // queen.moves.add(board(3, 7));
    // queen.moves.add(board(4, 1));
    // queen.moves.add(board(5, 2));
    // queen.moves.add(board(6, 3));
    // queen.moves.add(board(7, 4));
    queenMoves(queen, BOARD);

    placePiece("pawn", "white", 1, 2);
    placePiece("pawn", "black", 3, 4);
    placePiece("pawn", "white", 5, 2);

    const expectedMoves = new Set([
      board(2, 0),
      board(1, 0),
      board(0, 0),
      board(2, 1),
      board(1, 2),
      board(3, 1),
      board(3, 2),
      board(3, 3),
      board(3, 4),
      board(4, 1),
      board(5, 2),
      board(4, 0),
      board(5, 0),
      board(6, 0),
      board(7, 0),
    ]);

    const expectedBlocks1 = new Set([board(0, 3)]);
    const expectedBlocks2 = new Set([board(3, 5), board(3, 6), board(3, 7)]);
    const expectedBlocks3 = new Set([board(6, 3), board(7, 4)]);

    expect(setsEqual(expectedBlocks1, queenBlock(queen, 1, 2))).toBeTruthy();
    expect(setsEqual(expectedBlocks2, queenBlock(queen, 3, 4))).toBeTruthy();
    expect(setsEqual(expectedBlocks3, queenBlock(queen, 5, 2))).toBeTruthy();
    expect(verifyMoves(expectedMoves, queen.moves)).toBeTruthy();
  });

  it("queen blocked one side", () => {
    const queen = makePiece("queen", "white", 0, 0);
    board(0, 0).piece = queen;
    // queen.moves.add(board(0, 0));
    // queen.moves.add(board(1, 1));
    // queen.moves.add(board(2, 2));
    // queen.moves.add(board(4, 4));
    // queen.moves.add(board(5, 5));
    // queen.moves.add(board(6, 6));
    // queen.moves.add(board(7, 7));
    queenMoves(queen, BOARD);

    placePiece("pawn", "white", 5, 5);

    const expectedMoves = new Set([
      board(1, 1),
      board(2, 2),
      board(3, 3),
      board(4, 4),
      board(5, 5),
      board(0, 1),
      board(0, 2),
      board(0, 3),
      board(0, 4),
      board(0, 5),
      board(0, 6),
      board(0, 7),
      board(1, 0),
      board(2, 0),
      board(3, 0),
      board(4, 0),
      board(5, 0),
      board(6, 0),
      board(7, 0),
    ]);

    const expectedBlocks = new Set([board(6, 6), board(7, 7)]);

    expect(setsEqual(expectedBlocks, queenBlock(queen, 5, 5))).toBeTruthy();
    expect(verifyMoves(expectedMoves, queen.moves)).toBeTruthy();
  });
});
