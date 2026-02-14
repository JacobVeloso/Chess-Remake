import "./Promotion.css";
import pieces from "../assets/index";
import { memo } from "react";
import type { color, type } from "./types";

interface Props {
  color: color;
  promote: (promoteType: type) => undefined;
}

const Promotion = memo(({ color, promote }: Props) => {
  return (
    <div id="overlay" className={"overlay"}>
      <div className={"panel"}>
        <img
          className={"panel-btn"}
          src={color === "white" ? pieces.whiteRook : pieces.blackRook}
          onClick={() => promote("rook")}
        />
        <img
          className={"panel-btn"}
          src={color === "white" ? pieces.whiteBishop : pieces.blackBishop}
          onClick={() => promote("bishop")}
        />
        <img
          className={"panel-btn"}
          src={color === "white" ? pieces.whiteQueen : pieces.blackQueen}
          onClick={() => promote("queen")}
        />
        <img
          className={"panel-btn"}
          src={color === "white" ? pieces.whiteKnight : pieces.blackKnight}
          onClick={() => promote("knight")}
        />
      </div>
    </div>
  );
});

export default Promotion;
