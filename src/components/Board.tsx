import "./Board.css";
import Tile from "./Tile.tsx";
import Promotion from "./Promotion.tsx";
import type {
  PieceState,
  PieceData,
  TileState,
  TileData,
  type,
  color,
} from "./types.ts";
import useChess, { calculateLegalMoves } from "./Chess.ts";
import { promote } from "./PieceTypes/Pawn.ts";
import pieces from "../assets/index";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
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
  const [promoting, setPromoting] = useState<boolean>(false);

  let moves = calculateLegalMoves(boardData.current);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  function selectPiece(
    piece: PieceState | null,
    moves: Map<PieceData["id"], Set<TileData["id"]>>,
  ): undefined {
    if (promoting) return undefined;

    // Reset all tiles
    actives.current.forEach((_, i) => (actives.current[i] = false));

    // Highlight tiles if a new active piece is selected
    if (piece && activePiece !== piece)
      moves.get(piece.id)?.forEach((move) => (actives.current[+move] = true));

    // Store piece as 'active'
    setPiece(piece !== activePiece ? piece : null);

    return undefined;
  }

  function handleDragStart(event: DragStartEvent) {
    if (promoting) return;

    const pieceId = event.active.id as PieceData["id"];
    const piece = getPieceState(board, pieceId);

    // Highlight legal moves for piece
    if (piece && activePiece !== piece) selectPiece(piece, moves ?? new Map());
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
      // Unhighlight legal moves
      selectPiece(null, moves);

      // Apply move to board
      const piece = getPieceData(boardData.current.tiles, pieceId);
      if (!piece) return;
      const sourceTileId = board[piece.rank * 8 + piece.file].id;
      moves = movePiece(sourceTileId, targetTileId, moves);
      lastTile.current = sourceTileId;

      // Update board state and trigger re-render
      setBoard(extractBoardState(boardData.current.tiles));

      if (boardData.current.promotingPawn) {
        setPromoting(true);
        return;
      }

      if (moves === null) {
        console.log("GAME OVER");
        return; // End of game
      }
    }
  }

  function handleTileClick(tileID: TileData["id"]): undefined {
    if (promoting || !activePiece) return;
    // Check if tile is a legal move for an active piece
    if (moves?.get(activePiece?.id ?? "")?.has(tileID)) {
      // Unhighlight legal moves
      selectPiece(null, moves);

      // Apply move to board
      const piece = getPieceData(boardData.current.tiles, activePiece!.id);
      if (!piece) return;
      const sourceTileId = board[piece.rank * 8 + piece.file].id;
      moves = movePiece(sourceTileId, tileID, moves);
      lastTile.current = sourceTileId;

      // Update board state and trigger re-render
      setBoard(extractBoardState(boardData.current.tiles));

      if (boardData.current.promotingPawn) {
        setPromoting(true);
        return;
      }

      if (moves === null) {
        console.log("GAME OVER");
        return; // End of game
      }
    }
  }

  function triggerPromotion(promoteType: type): undefined {
    if (!promoting || !boardData.current.promotingPawn) return;

    if (
      promoteType !== "rook" &&
      promoteType !== "bishop" &&
      promoteType !== "queen" &&
      promoteType !== "knight"
    )
      return;

    moves = promote(
      boardData.current,
      boardData.current.promotingPawn,
      promoteType,
    );

    // Update board state and trigger re-render
    setBoard(extractBoardState(boardData.current.tiles));

    if (moves === null) {
      console.log("GAME OVER");
      return; // End of game
    }

    boardData.current.promotingPawn = null;
    setPromoting(false);
  }

  return (
    <div>
      <div className="container">
        <MoveContext value={moves}>
          <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
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
      {promoting && (
        <Promotion color={boardData.current.turn} promote={triggerPromotion} />
      )}
    </div>
  );
};

export default Board;
