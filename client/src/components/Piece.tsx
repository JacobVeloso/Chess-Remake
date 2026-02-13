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
    moves: Map<PieceData["id"], Set<TileData["id"]>>,
  ) => undefined;
}

/**
 * Deletes all moves of a certain move type for a piece, and removes that piece as an attacker for each move.
 * @param piece PieceData object to clear moves
 * @param type String key indicating move type
 */
export function deleteMoves(piece: PieceData, type: string): void {
  piece.moves.get(type)?.forEach((move) => move.attackers.delete(piece));
  piece.moves.get(type)?.clear();
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
