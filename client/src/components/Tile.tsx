import "./Tile.css";
import Piece from "./Piece";
import { useDroppable } from "@dnd-kit/core";
import type {
  PieceData,
  PieceState,
  TileData,
  TileState,
  color,
} from "./types";
import { memo } from "react";

/**
 * Determines if an opposing piece could capture a player's own piece on a given tile during the opponent's next turn.
 * @param tile TileData object
 * @param pieceColor Own player's color (opposite to color of opponent)
 * @returns True if an opposing piece is attacking the tile, false otherwise
 */
export function isAttacked(tile: TileData, pieceColor: color): boolean {
  for (const attacker of tile.attackers) {
    if (attacker.color !== pieceColor) {
      // Pawns cannot capture if moving forward, only diagonally
      if (attacker.type !== "pawn" || attacker.file !== tile.file) return true;
    }
  }
  return false;
}

const FILES = "abcdefgh";

/**
 * Converts a TileData object to its algebraic notation.
 * @param tile TileData object to encode.
 * @returns tile name e.g. 'e4'
 */
export function encodeTile(tile: TileData): string {
  const rank = 8 - tile.rank;
  const file = FILES[tile.file];
  return file + rank;
}

/**
 * Converts a pair of TileData objects to its move name in UCI's long algebraic notation.
 * @param source TileData object moved from
 * @param target TileData object moved to
 * @returns move name e.g. 'e2e4'
 */
export function encodeMove(source: TileData, target: TileData): string {
  return encodeTile(source) + encodeTile(target);
}

/**
 * Converts a tile name to its ID in the board (TileData array).
 * @param tile tile name in algebraic notation e.g. 'a7'
 * @returns ID of corresponding TileData object e.g. '8'
 */
export function decodeTile(tile: string): string {
  // Format checking
  if (
    tile.length !== 2 ||
    !FILES.includes(tile[0]) ||
    +tile[1] < 1 ||
    +tile[1] > 8
  )
    return "";

  const rank = 8 - +tile.charAt(1);
  const file = FILES.indexOf(tile.charAt(0));
  return (rank * 8 + file).toString();
}

/**
 * Converts a move to the IDs of the source and target tiles in the board (TileData array).
 * @param move move name in UCI's long algebraic notation.
 * @returns pair of strings containing the IDs of the source and target tiles respectively.
 */
export function decodeMove(move: string): [string, string] {
  if (move.length !== 4 && move.length !== 5) return ["", ""];
  return [decodeTile(move.substring(0, 2)), decodeTile(move.substring(2, 4))];
}

interface Props {
  tileState: TileState;
  active: boolean;
  last: boolean;
  selectPiece: (
    piece: PieceState | null,
    moves: Map<PieceData["id"], Set<TileData["id"]>>,
  ) => undefined;
  handleTileClick: (tileID: TileData["id"]) => undefined;
}

const Tile = memo(
  ({ tileState, active, last, selectPiece, handleTileClick }: Props) => {
    const { setNodeRef } = useDroppable({
      id: tileState.id,
    });
    const piece = tileState.piece;
    return (
      <div
        ref={setNodeRef}
        className={
          "square-" +
          tileState.color[0] +
          " tile" +
          (active ? " attacked" : "") +
          (last ? " last" : "")
        }
        id={FILES[tileState.file] + tileState.rank}
        onClick={() => handleTileClick(tileState.id)}
      >
        {piece ? (
          <Piece
            id={piece!.id}
            color={piece!.color}
            type={piece!.type}
            src={tileState.piece?.src ?? ""}
            selectPiece={selectPiece}
          />
        ) : null}
      </div>
    );
  },
);

export default Tile;
