import { describe, it, expect } from "vitest";
import { isAttacked } from "../components/Tile.tsx";
import { makePiece } from "./utilities.ts";
import { board } from "../components/Board.tsx";

describe("isAttacked", () => {
  it("not attacked", () => {
    const tile = board(0, 0);
    tile.attackers.add(makePiece("rook", "white", 0, 2));
    tile.attackers.add(makePiece("rook", "white", 2, 0));
    expect(isAttacked(tile, "white")).toBeFalsy();
  });

  it("attacked", () => {
    const tile = board(0, 0);
    tile.attackers.add(makePiece("queen", "black", 2, 2));
    tile.attackers.add(makePiece("rook", "white", 0, 2));
    tile.attackers.add(makePiece("rook", "white", 2, 0));
    expect(isAttacked(tile, "white")).toBeTruthy();
  });
});
