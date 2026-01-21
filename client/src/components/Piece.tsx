import "./Piece.css";
import { MoveContext } from "./Board";
import type { color, PieceData, PieceState, TileData, type } from "./types";
import { useDraggable } from "@dnd-kit/core";
import { memo, useContext } from "react";

interface Props {
  id: string;
  color: color;
  type: type;
  src: string;
  selectPiece: (
    piece: PieceState | null,
    moves: Map<PieceData["id"], Set<TileData["id"]>>
  ) => undefined;
}

const Piece = memo(({ id, color, type, src, selectPiece }: Props) => {
  const moves = useContext(MoveContext);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
      }
    : undefined;

  return (
    <img
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      id={"" + id}
      className={"piece " + color + " " + type}
      style={style}
      src={src}
      onClick={() => selectPiece({ id, color, type, src }, moves ?? new Map())}
    />
  );
});

export default Piece;
