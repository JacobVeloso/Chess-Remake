import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

import { BOARD } from "./utilities.ts";

afterEach(() => {
  cleanup(); // runs a clean after each test case (e.g. clearing jsdom)
  BOARD.forEach((tile) => {
    tile.piece = null;
    tile.attackers.clear();
  });
});
