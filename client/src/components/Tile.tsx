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

export function isAttacked(tile: TileData, pieceColor: color): boolean {
  for (const attacker of tile.attackers) {
    if (attacker.color !== pieceColor) return true;
  }
  return false;
}

const FILES = "abcdefgh";

export function encodeTile(tile: TileData): string {
  const rank = 8 - tile.rank;
  const file = FILES[tile.file];
  return file + rank;
}

export function encodeMove(source: TileData, target: TileData): string {
  return encodeTile(source) + encodeTile(target);
}

function decodeTile(tile: string): string {
  if (
    tile.length !== 2 ||
    !FILES.includes(tile[0]) ||
    +tile[1] < 1 ||
    +tile[1] > 8
  )
    return "";
  const rank = 8 - +tile.charAt(1);
  const file = FILES.indexOf(tile.charAt(0));

  // console.log(tile, rank, file, rank * 8 + file);

  return (rank * 8 + file).toString();
}

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
