import "./Board.css";
import Tile from "./Tile.tsx";
import type {
  PieceState,
  PieceData,
  TileState,
  TileData,
  type,
  color,
} from "./types.ts";
import { encodeMove, decodeMove } from "./Tile.tsx";
import useChess, { calculateLegalMoves, generateFEN } from "./Chess.ts";
import pieces from "../assets/index";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { createContext, useRef, useState } from "react";

function getPieceState(
  board: TileState[],
  id: PieceData["id"],
): PieceState | null {
  for (const tile of board) {
    if (tile.piece?.id === id) return tile.piece;
  }
  return null;
}

function getPieceData(
  board: TileData[],
  id: PieceData["id"],
): PieceData | null {
  for (const tile of board) {
    if (tile.piece?.id === id) return tile.piece;
  }
  return null;
}

function getSrc(type: type, color: color): string {
  switch (type) {
    case "pawn":
      return color === "white" ? pieces.whitePawn : pieces.blackPawn;
    case "rook":
      return color === "white" ? pieces.whiteRook : pieces.blackRook;
    case "knight":
      return color === "white" ? pieces.whiteKnight : pieces.blackKnight;
    case "bishop":
      return color === "white" ? pieces.whiteBishop : pieces.blackBishop;
    case "queen":
      return color === "white" ? pieces.whiteQueen : pieces.blackQueen;
    case "king":
      return color === "white" ? pieces.whiteKing : pieces.blackKing;
    default:
      return "";
  }
}

function extractBoardState(tiles: TileData[]): TileState[] {
  return Array.from({ length: 64 }, (_, index) => {
    const piece = tiles[index].piece;
    return {
      id: "" + index,
      color: tiles[index].color,
      rank: tiles[index].rank,
      file: tiles[index].file,
      piece: piece
        ? {
            id: piece.id,
            color: piece.color,
            type: piece.type,
            src: getSrc(piece.type, piece.color),
          }
        : null,
    };
  });
}

export const MoveContext = createContext<Map<string, Set<string>> | null>(
  new Map<string, Set<string>>(),
);

const Board = () => {
  const { boardData, movePiece } = useChess();
  const [board, setBoard] = useState<TileState[]>(
    extractBoardState(boardData.current.tiles),
  );
  const [activePiece, setPiece] = useState<PieceState | null>(null);
  const actives = useRef<boolean[]>(new Array(64).fill(false));
  const lastTile = useRef<TileData["id"]>("");

  let moves = calculateLegalMoves(boardData.current);

  const engineMove = async () => {
    try {
      const legalMoves = new Set<string>();
      for (const [pieceId, moveSet] of moves ?? new Map()) {
        const piece = getPieceData(boardData.current.tiles, pieceId);
        if (!piece) continue;
        const source = boardData.current.tiles[piece.rank * 8 + piece.file];
        for (const move of moveSet) {
          const target = boardData.current.tiles[+move];
          legalMoves.add(encodeMove(source, target));
        }
      }
      // console.log([...legalMoves]);
      const res = await fetch("http://127.0.0.1:5000/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fen: generateFEN(boardData.current),
          moves: [...legalMoves],
        }),
      });

      const returnVal = await res.json();
      const [source, target] = decodeMove(returnVal.move);
      // console.log(source, target);

      moves = movePiece(source, target, moves ?? new Map());
      lastTile.current = source;
      setBoard(extractBoardState(boardData.current.tiles));

      if (moves === null) {
        console.log("GAME OVER");
        return;
      } // End of game
    } catch (err) {
      console.error("Error: ", err);
    }
  };

  function selectPiece(
    piece: PieceState | null,
    moves: Map<PieceData["id"], Set<TileData["id"]>>,
  ): undefined {
    actives.current.forEach((_, i) => (actives.current[i] = false));

    if (piece && activePiece !== piece)
      moves.get(piece.id)?.forEach((move) => (actives.current[+move] = true));

    setPiece(piece !== activePiece ? piece : null);

    return undefined;
  }

  function handleDragStart(event: DragStartEvent) {
    const pieceId = event.active.id as PieceData["id"];
    const piece = getPieceState(board, pieceId);
    if (piece) selectPiece(piece, moves ?? new Map());
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // Check if piece is hovering over a tile
    if (!over) return;

    // event IDs
    const targetTileId = over.id as TileData["id"];
    const pieceId = active.id as PieceData["id"];

    // Check if tile is a legal move for the piece
    if (moves?.get(pieceId)?.has(targetTileId)) {
      selectPiece(null, moves);
      const piece = getPieceData(boardData.current.tiles, pieceId);
      if (!piece) return;
      const sourceTileId = board[piece.rank * 8 + piece.file].id;
      moves = movePiece(sourceTileId, targetTileId, moves);
      lastTile.current = sourceTileId;
      // Update board state and trigger re-render
      setBoard(extractBoardState(boardData.current.tiles));

      if (moves === null) {
        console.log("GAME OVER");
        return; // End of game
      }

      engineMove();
    }
  }

  function handleTileClick(tileID: TileData["id"]): undefined {
    if (moves?.get(activePiece?.id ?? "")?.has(tileID)) {
      selectPiece(null, moves);
      const piece = getPieceData(boardData.current.tiles, activePiece!.id);
      if (!piece) return;
      const sourceTileId = board[piece.rank * 8 + piece.file].id;
      moves = movePiece(sourceTileId, tileID, moves);
      lastTile.current = sourceTileId;
      // Update board state and trigger re-render
      setBoard(extractBoardState(boardData.current.tiles));

      if (moves === null) {
        console.log("GAME OVER");
        return;
      }

      engineMove();
    }
  }

  return (
    <div className="container">
      <MoveContext value={moves}>
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {board.map((tileState) => {
            return (
              <Tile
                key={tileState.id}
                tileState={tileState}
                active={actives.current[tileState.rank * 8 + tileState.file]}
                last={lastTile.current === tileState.id}
                selectPiece={selectPiece}
                handleTileClick={handleTileClick}
              />
            );
          })}
        </DndContext>
      </MoveContext>
    </div>
  );
};

export default Board;
