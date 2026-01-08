import "./Board.css";
import Tile from "./Tile";
import type { PieceState, PieceData, TileState, TileData } from "./types.ts";
import useChess, { calculateLegalMoves } from "./Chess.ts";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { createContext } from "react";

function getPieceState(
  board: TileState[],
  id: PieceData["id"]
): PieceState | null {
  for (const tile of board) {
    if (tile.piece?.id === id) return tile.piece;
  }
  return null;
}

function getPieceData(
  board: TileData[],
  id: PieceData["id"]
): PieceData | null {
  for (const tile of board) {
    if (tile.piece?.id === id) return tile.piece;
  }
  return null;
}

export const MoveContext = createContext<Map<string, Set<string>> | null>(
  new Map<string, Set<string>>()
);

const Board = () => {
  const {
    board,
    boardData,
    movePiece,
    activePiece,
    selectPiece,
    actives,
    turn,
  } = useChess();
  let moves = calculateLegalMoves(boardData.current, turn.current);

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

    const piece = getPieceData(boardData.current.tiles, pieceId);
    if (!piece) return;

    // Check if tile is a legal move for the piece
    if (moves?.get(pieceId)?.has(targetTileId)) {
      selectPiece(null, moves);
      const sourceTileId = board[piece.rank * 8 + piece.file].id;
      moves = movePiece(sourceTileId, targetTileId, moves);

      if (moves === null) return; // End of game
    }
  }

  function handleTileClick(tileID: TileData["id"]): undefined {
    if (moves?.get(activePiece?.id ?? "")?.has(tileID)) {
      selectPiece(null, moves);
      const piece = getPieceData(boardData.current.tiles, activePiece!.id);
      if (!piece) return;
      const sourceTileId = board[piece.rank * 8 + piece.file].id;
      moves = movePiece(sourceTileId, tileID, moves);

      if (moves === null) return;
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
