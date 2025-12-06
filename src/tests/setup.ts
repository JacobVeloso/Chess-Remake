import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

import type { dimension } from "../components/types.ts";
import { board } from "./utilities.ts";

beforeAll(() => {
  for (let i = 0; i < 64; ++i) {
    const rank = Math.floor(i / 8) as dimension;
    const file = (i % 8) as dimension;
    const color = (rank + file) % 2 === 0 ? "white" : "black";
    board[i] = {
      id: "" + i,
      rank,
      file,
      color,
      piece: null,
      attackers: new Set(),
    };
  }
});

afterEach(() => {
  cleanup(); // runs a clean after each test case (e.g. clearing jsdom)
  board.forEach((tile) => {
    tile.piece = null;
    tile.attackers.clear();
  });
});
