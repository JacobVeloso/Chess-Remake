import "./Board.css";
import Tile from "./Tile";
import type { PieceState, PieceData, TileState, TileData } from "./types.ts";
import useChess, { calculateLegalMoves, getHighlightedTiles } from "./Chess.ts";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

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

const Board = () => {
  const { board, boardData, movePiece, actives, setActive, turn } = useChess();
  let moves = calculateLegalMoves(boardData.current, turn.current);

  function handleDragStart(event: DragStartEvent) {
    const pieceId = event.active.id as PieceData["id"];
    const piece = getPieceState(board, pieceId);
    if (piece) setActive(getHighlightedTiles(moves ?? new Map(), pieceId));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActive(new Array(64).fill(false));
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
      const sourceTileId = board[piece.rank * 8 + piece.file].id;
      moves = movePiece(sourceTileId, targetTileId, moves);

      if (moves === null) return; // End of game
    }
  }

  return (
    <div className="container">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {board.map((tileState) => {
          return (
            <Tile
              key={tileState.id}
              tileState={tileState}
              active={actives[tileState.rank * 8 + tileState.file]}
            />
          );
        })}
      </DndContext>
    </div>
  );
};

export default Board;
