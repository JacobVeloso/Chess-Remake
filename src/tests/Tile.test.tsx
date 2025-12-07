import { describe, it, expect } from "vitest";
import { isAttacked } from "../components/Tile.tsx";
import { getTile, makePiece } from "./utilities.ts";

describe("isAttacked", () => {
  it("attacked", () => {
    const tile = getTile(0, 0);
    tile.attackers.add(makePiece("queen", "black", 2, 2));
    tile.attackers.add(makePiece("rook", "white", 0, 2));
    tile.attackers.add(makePiece("rook", "white", 2, 0));
    expect(isAttacked(tile, "white")).toBeTruthy();
  });

  it("not attacked", () => {
    const tile = getTile(0, 0);
    tile.attackers.add(makePiece("rook", "white", 0, 2));
    tile.attackers.add(makePiece("rook", "white", 2, 0));
    expect(isAttacked(tile, "white")).toBeFalsy();
  });
});
