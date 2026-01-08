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

interface Props {
  tileState: TileState;
  active: boolean;
  selectPiece: (
    piece: PieceState | null,
    moves: Map<PieceData["id"], Set<TileData["id"]>>
  ) => undefined;
  handleTileClick: (tileID: TileData["id"]) => undefined;
}

const Tile = memo(
  ({ tileState, active, selectPiece, handleTileClick }: Props) => {
    const { setNodeRef } = useDroppable({
      id: tileState.id,
    });
    const piece = tileState.piece;
    return (
      <div
        ref={setNodeRef}
        className={
          "square-" + tileState.color[0] + " tile" + (active ? " attacked" : "")
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
  }
);

export default Tile;
