import "./Tile.css";
import Piece from "./Piece";
import { useDroppable } from "@dnd-kit/core";
import type { TileData, TileState, color } from "./types";
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
}

const Tile = memo(({ tileState, active }: Props) => {
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
    >
      {piece ? (
        <Piece
          id={piece!.id}
          color={piece!.color}
          type={piece!.type}
          src={tileState.piece?.src ?? ""}
        />
      ) : null}
    </div>
  );
});

export default Tile;

// piece?: React.ReactNode;
