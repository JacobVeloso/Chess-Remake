import "./Tile.css";
import Piece from "./Piece";
import { useDroppable } from "@dnd-kit/core";
import type { TileData, color } from "./types";
import { memo } from "react";

export function isAttacked(tile: TileData, pieceColor: color): boolean {
  for (const attacker of tile.attackers) {
    if (attacker.color !== pieceColor) return true;
  }
  return false;
}

const FILES = "abcdefgh";

interface Props {
  tileData: TileData;
  active: boolean;
}

const Tile = memo(({ tileData, active }: Props) => {
  const { setNodeRef } = useDroppable({
    id: tileData.id,
  });
  const piece = tileData.piece;
  return (
    <div
      ref={setNodeRef}
      className={
        "square-" + tileData.color[0] + " tile" + (active ? " attacked" : "")
      }
      id={FILES[tileData.file] + tileData.rank}
    >
      {piece ? (
        <Piece
          id={piece!.id}
          color={piece!.color}
          type={piece!.type}
          src={tileData.piece?.src ?? ""}
        />
      ) : null}
    </div>
  );
});

export default Tile;

// piece?: React.ReactNode;
