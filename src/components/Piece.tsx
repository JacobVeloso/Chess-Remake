import "./Piece.css";
import type { color, type } from "./types";
import { useDraggable } from "@dnd-kit/core";
import { memo } from "react";

interface Props {
  id: string;
  color: color;
  type: type;
  src: string;
}

const Piece = memo(({ id, color, type, src }: Props) => {
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
    />
  );
});

export default Piece;
