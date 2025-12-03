import { beforeAll, describe, expect, test } from '@jest/globals';
import { getPinBlocks, filterMoves, blockingMoves, removeAttacks, recalculateMoves } from './components/Board';
import type { PieceData, TileData, dimension, color, type } from './components/types';
import { bishopMoves, bishopBlock, bishopUnblock } from "./components/PieceTypes/Bishop";
import { rookMoves, rookBlock, rookUnblock } from "./components/PieceTypes/Rook";
import { knightMoves, knightBlock, knightUnblock } from "./components/PieceTypes/Knight";
import { pawnMoves, pawnBlock, pawnUnblock } from "./components/PieceTypes/Pawn";
import { kingMoves, kingBlock, kingUnblock } from "./components/PieceTypes/King.tsx";
import { queenMoves, queenBlock, queenUnblock } from "./components/PieceTypes/Queen";

const board: TileData[] = new Array(64);

function setsEqual<T>(A: Set<T>, B: Set<T>): boolean {
    if (A.size !== B.size) return false;
    for (const val of A) {
        if (!B.has(val)) return false;
    }
    return true;
}

beforeAll(() => {
    for (let i = 0; i < 64; ++i) {
        const rank = i / 8 as dimension;
        const file = i % 8 as dimension;
        const color = (rank + file) % 2 === 0 ? "white" : "black" as color;
        board[i] = { id: "" + i, rank, file, color, piece: null, attackers: new Set()};
    }
})

describe('getPinBlocks', () => {
    test('rook pin basic', () => {
        // Initialise pieces
        const king: PieceData = { id: "0", color: "white", type: "king", src: "", rank: 0, file: 0, calcMoves: kingMoves, block: kingBlock, unblock: kingUnblock, params: new Map() }
        const rook: PieceData = { id: "1", color: "black", type: "rook", src: "", rank: 0, file: 4, calcMoves: rookMoves, block: rookBlock, unblock: rookUnblock, params: new Map() };

        // Place pieces
        board[0].piece = king;
        board[4].piece = rook;

        const result = getPinBlocks(board, [0, 0], [0, 4]);
        expect(result).toBeTruthy();
        expect(setsEqual(result!, new Set<TileData>([board[1], board[2], board[3]]))).toBeTruthy();
    })
})

/*
import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;*/

/** @type {import("jest").Config} **/
/*export default {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
};*/