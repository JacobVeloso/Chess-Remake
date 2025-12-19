import "./Board.css";
import pieces from "../assets/index";
import Tile, { isAttacked } from "./Tile";
import type {
  PieceData,
  TileData,
  BoardState,
  Move,
  type,
  color,
  dimension,
} from "./types.ts";
import { bishopMoves, bishopBlock } from "./PieceTypes/Bishop.ts";
import { rookMoves, rookBlock } from "./PieceTypes/Rook.ts";
import { knightMoves, knightBlock } from "./PieceTypes/Knight";
import { pawnMoves, pawnBlock } from "./PieceTypes/Pawn.ts";
import { kingMoves, kingBlock, checkBlocks } from "./PieceTypes/King.ts";
import { queenMoves, queenBlock } from "./PieceTypes/Queen";
import useChess, {
  calculateLegalMoves,
  applyMove,
  calculateAllMoves,
  filterBlocked,
  checkFilter,
  pinFilter,
  nextGameState,
  getHighlightedTiles,
} from "./Chess.ts";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect } from "react";

export let whiteCanMove = true;

function setupInitialBoard(): BoardState {
  const tileIds = new Map<TileData["id"], TileData>();
  const WHITE_PIECES: Set<PieceData> = new Set();
  const BLACK_PIECES: Set<PieceData> = new Set();
  let pieceID = 0;
  let tileID = 0;
  // Initialise tiles array
  const TILES: TileData[] = Array.from({ length: 64 }, (_, index) => {
    const [rank, file]: [dimension, dimension] = [
      Math.floor(index / 8) as dimension,
      (index % 8) as dimension,
    ];
    const color: color = (rank + file) % 2 === 0 ? "white" : "black";

    let type: type | null = null;
    let src: string | null = null;
    let pieceColor: color | null = null;

    // black piece
    if (rank === 1) {
      pieceColor = "black";
      type = "pawn";
      src = pieces.blackPawn;
    } else if (rank === 0) {
      pieceColor = "black";
      if (file === 0 || file === 7) {
        type = "rook";
        src = pieces.blackRook;
      } else if (file === 1 || file === 6) {
        type = "knight";
        src = pieces.blackKnight;
      } else if (file === 2 || file === 5) {
        type = "bishop";
        src = pieces.blackBishop;
      } else if (file === 3) {
        type = "queen";
        src = pieces.blackQueen;
      } else if (file === 4) {
        type = "king";
        src = pieces.blackKing;
      }
    }

    // white piece
    else if (rank === 6) {
      pieceColor = "white";
      type = "pawn";
      src = pieces.whitePawn;
    } else if (rank === 7) {
      pieceColor = "white";
      if (file === 0 || file === 7) {
        type = "rook";
        src = pieces.whiteRook;
      } else if (file === 1 || file === 6) {
        type = "knight";
        src = pieces.whiteKnight;
      } else if (file === 2 || file === 5) {
        type = "bishop";
        src = pieces.whiteBishop;
      } else if (file === 3) {
        type = "queen";
        src = pieces.whiteQueen;
      } else if (file === 4) {
        type = "king";
        src = pieces.whiteKing;
      }
    }

    let piece: PieceData | null = null;
    if (type) {
      const params: Map<string, boolean> = new Map();
      switch (type) {
        case "pawn":
          params.set("movedTwo", false);
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            src: src!,
            rank,
            file,
            moves: new Set<TileData>(),
            params,
          };
          break;
        case "rook":
          params.set("hasMoved", false);
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            src: src!,
            rank,
            file,
            moves: new Set<TileData>(),
            params,
          };
          break;
        case "bishop":
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            src: src!,
            rank,
            file,
            moves: new Set<TileData>(),
            params,
          };
          break;
        case "knight":
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            src: src!,
            rank,
            file,
            moves: new Set<TileData>(),
            params,
          };
          break;
        case "king":
          params.set("hasMoved", false);
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            src: src!,
            rank,
            file,
            moves: new Set<TileData>(),
            params,
          };
          break;
        case "queen":
          piece = {
            id: "" + pieceID++,
            color: pieceColor!,
            type,
            src: src!,
            rank,
            file,
            moves: new Set<TileData>(),
            params,
          };
          break;
        default:
          piece = null;
      }
      if (piece) {
        if (piece.color === "white") WHITE_PIECES.add(piece);
        else BLACK_PIECES.add(piece);
      }
    }

    let tileData: TileData = {
      id: "" + tileID++,
      rank,
      file,
      color,
      piece,
      attackers: new Set(),
    };
    tileIds.set(tileData.id, tileData);
    return tileData;
  });

  // Set black pawn moves
  for (let i = 2; i <= 3; ++i) {
    for (let j = 0; j < 8; ++j) {
      const blackPawn = TILES[1 * 8 + j].piece!;
      TILES[i * 8 + j].attackers.add(blackPawn);
      blackPawn.moves.add(TILES[i * 8 + j]);
    }
  }

  // Set white pawn moves
  for (let i = 4; i <= 5; ++i) {
    for (let j = 0; j < 8; ++j) {
      const whitePawn = TILES[6 * 8 + j].piece!;
      TILES[i * 8 + j].attackers.add(whitePawn);
      whitePawn.moves.add(TILES[i * 8 + j]);
    }
  }

  // Set rook moves
  const leftBlackRook = TILES[0 * 8 + 0].piece!;
  TILES[0 * 8 + 1].attackers.add(leftBlackRook);
  TILES[1 * 8 + 0].attackers.add(leftBlackRook);
  leftBlackRook.moves.add(TILES[0 * 8 + 1]);
  leftBlackRook.moves.add(TILES[1 * 8 + 0]);

  const rightBlackRook = TILES[0 * 8 + 7].piece!;
  TILES[0 * 8 + 6].attackers.add(rightBlackRook);
  TILES[1 * 8 + 7].attackers.add(rightBlackRook);
  rightBlackRook.moves.add(TILES[0 * 8 + 6]);
  rightBlackRook.moves.add(TILES[1 * 8 + 7]);

  const leftWhiteRook = TILES[7 * 8 + 0].piece!;
  TILES[7 * 8 + 1].attackers.add(leftWhiteRook);
  TILES[6 * 8 + 0].attackers.add(leftWhiteRook);
  leftWhiteRook.moves.add(TILES[7 * 8 + 1]);
  leftWhiteRook.moves.add(TILES[6 * 8 + 0]);

  const rightWhiteRook = TILES[7 * 8 + 7].piece!;
  TILES[7 * 8 + 6].attackers.add(rightWhiteRook);
  TILES[6 * 8 + 7].attackers.add(rightWhiteRook);
  rightWhiteRook.moves.add(TILES[7 * 8 + 6]);
  rightWhiteRook.moves.add(TILES[6 * 8 + 7]);

  // Set knight moves
  const leftBlackKnight = TILES[0 * 8 + 1].piece!;
  TILES[2 * 8 + 0].attackers.add(leftBlackKnight);
  TILES[2 * 8 + 2].attackers.add(leftBlackKnight);
  leftBlackKnight.moves.add(TILES[2 * 8 + 0]);
  leftBlackKnight.moves.add(TILES[2 * 8 + 2]);

  const rightBlackKnight = TILES[0 * 8 + 6].piece!;
  TILES[2 * 8 + 5].attackers.add(rightBlackKnight);
  TILES[2 * 8 + 7].attackers.add(rightBlackKnight);
  rightBlackKnight.moves.add(TILES[2 * 8 + 5]);
  rightBlackKnight.moves.add(TILES[2 * 8 + 7]);

  const leftWhiteKnight = TILES[7 * 8 + 1].piece!;
  TILES[5 * 8 + 0].attackers.add(leftWhiteKnight);
  TILES[5 * 8 + 2].attackers.add(leftWhiteKnight);
  leftWhiteKnight.moves.add(TILES[5 * 8 + 0]);
  leftWhiteKnight.moves.add(TILES[5 * 8 + 2]);

  const rightWhiteKnight = TILES[7 * 8 + 6].piece!;
  TILES[5 * 8 + 5].attackers.add(rightWhiteKnight);
  TILES[5 * 8 + 7].attackers.add(rightWhiteKnight);
  rightWhiteKnight.moves.add(TILES[5 * 8 + 5]);
  rightWhiteKnight.moves.add(TILES[5 * 8 + 7]);

  // Set bishop moves
  const leftBlackBishop = TILES[0 * 8 + 2].piece!;
  TILES[1 * 8 + 1].attackers.add(leftBlackBishop);
  TILES[1 * 8 + 3].attackers.add(leftBlackBishop);
  leftBlackBishop.moves.add(TILES[1 * 8 + 1]);
  leftBlackBishop.moves.add(TILES[1 * 8 + 3]);

  const rightBlackBishop = TILES[0 * 8 + 5].piece!;
  TILES[1 * 8 + 4].attackers.add(rightBlackBishop);
  TILES[1 * 8 + 6].attackers.add(rightBlackBishop);
  rightBlackBishop.moves.add(TILES[1 * 8 + 4]);
  rightBlackBishop.moves.add(TILES[1 * 8 + 6]);

  const leftWhiteBishop = TILES[7 * 8 + 2].piece!;
  TILES[6 * 8 + 1].attackers.add(leftWhiteBishop);
  TILES[6 * 8 + 3].attackers.add(leftWhiteBishop);
  leftWhiteBishop.moves.add(TILES[6 * 8 + 1]);
  leftWhiteBishop.moves.add(TILES[6 * 8 + 3]);

  const rightWhiteBishop = TILES[7 * 8 + 5].piece!;
  TILES[6 * 8 + 4].attackers.add(rightWhiteBishop);
  TILES[6 * 8 + 6].attackers.add(rightWhiteBishop);
  rightWhiteBishop.moves.add(TILES[6 * 8 + 4]);
  rightWhiteBishop.moves.add(TILES[6 * 8 + 6]);

  // Set queen moves
  const blackQueen = TILES[0 * 8 + 3].piece!;
  TILES[0 * 8 + 2].attackers.add(blackQueen);
  TILES[1 * 8 + 2].attackers.add(blackQueen);
  TILES[1 * 8 + 3].attackers.add(blackQueen);
  TILES[1 * 8 + 4].attackers.add(blackQueen);
  TILES[0 * 8 + 4].attackers.add(blackQueen);
  blackQueen.moves.add(TILES[0 * 8 + 2]);
  blackQueen.moves.add(TILES[1 * 8 + 2]);
  blackQueen.moves.add(TILES[1 * 8 + 3]);
  blackQueen.moves.add(TILES[1 * 8 + 4]);
  blackQueen.moves.add(TILES[0 * 8 + 4]);

  const whiteQueen = TILES[7 * 8 + 3].piece!;
  TILES[7 * 8 + 2].attackers.add(whiteQueen);
  TILES[6 * 8 + 2].attackers.add(whiteQueen);
  TILES[6 * 8 + 3].attackers.add(whiteQueen);
  TILES[6 * 8 + 4].attackers.add(whiteQueen);
  TILES[7 * 8 + 4].attackers.add(whiteQueen);
  whiteQueen.moves.add(TILES[7 * 8 + 2]);
  whiteQueen.moves.add(TILES[6 * 8 + 2]);
  whiteQueen.moves.add(TILES[6 * 8 + 3]);
  whiteQueen.moves.add(TILES[6 * 8 + 4]);
  whiteQueen.moves.add(TILES[7 * 8 + 4]);

  // Set king moves
  const blackKing = TILES[0 * 8 + 4].piece!;
  TILES[0 * 8 + 3].attackers.add(blackKing);
  TILES[1 * 8 + 3].attackers.add(blackKing);
  TILES[1 * 8 + 4].attackers.add(blackKing);
  TILES[1 * 8 + 5].attackers.add(blackKing);
  TILES[0 * 8 + 5].attackers.add(blackKing);
  blackKing.moves.add(TILES[0 * 8 + 3]);
  blackKing.moves.add(TILES[1 * 8 + 3]);
  blackKing.moves.add(TILES[1 * 8 + 4]);
  blackKing.moves.add(TILES[1 * 8 + 5]);
  blackKing.moves.add(TILES[0 * 8 + 5]);

  const whiteKing = TILES[7 * 8 + 4].piece!;
  TILES[7 * 8 + 3].attackers.add(whiteKing);
  TILES[6 * 8 + 3].attackers.add(whiteKing);
  TILES[6 * 8 + 4].attackers.add(whiteKing);
  TILES[6 * 8 + 5].attackers.add(whiteKing);
  TILES[7 * 8 + 5].attackers.add(whiteKing);
  whiteKing.moves.add(TILES[7 * 8 + 3]);
  whiteKing.moves.add(TILES[6 * 8 + 3]);
  whiteKing.moves.add(TILES[6 * 8 + 4]);
  whiteKing.moves.add(TILES[6 * 8 + 5]);
  whiteKing.moves.add(TILES[7 * 8 + 5]);

  return {
    tiles: TILES,
    moveHistory: [],
    whitePieces: WHITE_PIECES,
    blackPieces: BLACK_PIECES,
  };
}

function getPiece(board: TileData[], id: PieceData["id"]): PieceData | null {
  for (const tile of board) {
    if (tile.piece?.id === id) return tile.piece;
  }
  return null;
}

const Board = () => {
  const { board, movePiece, actives, setActive, turn } = useChess(
    setupInitialBoard()
  );
  let moves = calculateLegalMoves(board, turn);
  // for (const key of moves.keys()) {
  //   console.log(key + ": " + moves.get(key));
  //   moves.get(key)?.forEach((move) => {
  //     console.log("move: " + move);
  //   });
  // }

  function handleDragStart(event: DragStartEvent) {
    const pieceId = event.active.id as PieceData["id"];
    const piece = getPiece(board.tiles, pieceId);
    if (piece) setActive(getHighlightedTiles(moves, pieceId));
  }

  function handleDragEnd(event: DragEndEvent) {
    // console.log("MOVES");
    // for (const key of moves.keys()) {
    //   console.log(key + ": " + moves.get(key));
    //   moves.get(key)?.forEach((move) => {
    //     console.log("move: " + move);
    //   });
    // }
    setActive(new Array(64).fill(false));
    const { active, over } = event;

    // Check if piece is hovering over a tile
    if (!over) return;

    // event IDs
    const targetTileId = over.id as TileData["id"];
    const pieceId = active.id as PieceData["id"];

    const piece = getPiece(board.tiles, pieceId);
    if (!piece) return;
    // console.log("piece found!");
    // Check if tile is a legal move for the piece
    if (moves.get(pieceId)?.has(targetTileId)) {
      // console.log("moving piece!");
      const sourceTileId = board.tiles[piece.rank * 8 + piece.file].id;
      const targetTile = board.tiles[+targetTileId];
      moves =
        movePiece(
          {
            from: sourceTileId,
            to: targetTileId,
            piece,
            capture: targetTile.piece ?? undefined,
          },
          moves
        ) ?? new Map();
    }

    // // // Check that piece can access the tile
    // // let canMove = false;
    // // for (const attacker of tiles[+targetTileId].attackers) {
    // //   if (attacker.id === pieceId) {
    // //     canMove = true;
    // //     piece = attacker;
    // //     break;
    // //   }
    // // }
    // // if (!canMove) return;

    // // // Check that move is legal
    // // if (!legalMoves(tiles, piece).has(targetTile)) return;

    // const sourceTile = tiles[piece.rank * 8 + piece.file];
    // if (sourceTile === targetTile) return;
    // const color = piece.color;
    // const targetRank = targetTile.rank;
    // const targetFile = targetTile.file;
    // let pieceToDelete: PieceData | null = null;

    // // Check that tile is empty or can be captured
    // if (targetTile.piece) {
    //   // // Own piece blocking
    //   // if (targetTile.piece.color === color) return;
    //   pieceToDelete = targetTile.piece;
    // }

    // placePiece((prevTiles) => {
    //   // //console.log("placing");
    //   // // Find the piece data from the previous tiles
    //   // let oldTile: TileData | null = null;
    //   // let newTile: TileData | null = null;
    //   // for (const tile of prevTiles) {
    //   //   // Source tile
    //   //   if (tile.piece?.id === pieceId) {
    //   //     oldTile = tile;
    //   //   }
    //   //   // Target tile
    //   //   if (tile.id === targetTileId) {
    //   //     newTile = tile;
    //   //   }
    //   // }
    //   // // tile not found?
    //   // if (!oldTile || !newTile) return prevTiles;

    //   // // Check that source & target tiles are distinct
    //   // //if (oldTile === newTile || newTile.piece) return prevTiles;
    //   // oldTile.piece = null;
    //   // //console.log("placed on " + targetRank + " " + targetFile);
    //   // // Capture piece
    //   // if (newTile.piece) {
    //   //   // Remove old piece and its attacks from board
    //   //   for (const tile of prevTiles) {
    //   //     tile.attackers.delete(newTile.piece);
    //   //   }
    //   // }
    //   // newTile.piece = piece;
    //   // console.log(
    //   //   "piece " + pieceId + " oldTile " + oldTile.id + " newTile " + newTile.id
    //   // );
    //   // return prevTiles;

    //   // Make a shallow copy of the tiles array
    //   let newTiles = prevTiles.map((tile) => ({ ...tile }));

    //   // Find old/new tile indices
    //   const oldIndex = newTiles.findIndex((t) => t.piece?.id === pieceId);
    //   const newIndex = newTiles.findIndex((t) => t.id === targetTileId);

    //   // If not found, return previous state unchanged
    //   if (oldIndex === -1 || newIndex === -1) return prevTiles;

    //   const oldTile = newTiles[oldIndex];
    //   const newTile = newTiles[newIndex];

    //   // Clear the piece from the old tile
    //   newTiles[oldIndex] = { ...oldTile, piece: null };

    //   // Remove attackers referencing the newTile piece (if capturing)
    //   let newTilePiece = newTile.piece;
    //   if (newTilePiece) {
    //     newTiles = newTiles.map((tile) => ({
    //       ...tile,
    //       attackers: new Set(
    //         [...tile.attackers].filter((p) => p !== newTilePiece)
    //       ),
    //     }));
    //   }

    //   // Place the moved piece on the new tile
    //   newTiles[newIndex] = { ...newTiles[newIndex], piece };

    //   return newTiles;
    // });

    // if (pieceToDelete) {
    //   PIECES.delete(pieceToDelete);
    // }

    // piece.rank = targetRank;
    // piece.file = targetFile;
    // colorInCheck = null;
    // // let checkBlocks: Set<TileData> | null = null;
    // // // Recalculate moves for piece
    // // checkBlocks = recalculateMoves(tiles, piece);

    // // // Check if opposing king is now in check
    // // if (checkBlocks) colorInCheck = piece.color === "white" ? "black" : "white";

    // // Extra checks for pawns
    // if (piece.type === "pawn") {
    //   // // Cannot move forward if any piece is blocking
    //   // if (
    //   //   targetTile.piece ||
    //   //   // White pawn moving two with a piece directly in front
    //   //   (piece.color === "white" &&
    //   //     piece.rank === 6 &&
    //   //     tiles[(targetRank - 1) * 8 + targetFile].piece) ||
    //   //   // Black pawn moving two with a piece directly in front
    //   //   (piece.color === "black" &&
    //   //     piece.rank === 1 &&
    //   //     tiles[(targetRank + 1) * 8 + targetFile].piece)
    //   // )
    //   //   return;

    //   // Set and store pawn if it moved two squares (to check for en passant on next turn)
    //   if (Math.abs(targetRank - piece.rank) === 2) {
    //     piece.params.set("movedTwo", true);
    //     if (piece.color === "white") whiteMovedPawn = piece;
    //     else blackMovedPawn = piece;
    //   }
    // }

    // // Once a king or rook moves they cannot be used to castle
    // if (piece.type === "king" || piece.type === "rook")
    //   piece.params.set("hasMoved", true);

    // // Remove attacks from previous turn
    // TILES.forEach((tile) => {
    //   tile.attackers.clear();
    // });

    // // Call nextGameState
    // nextGameState(TILES, PIECES, whiteTurn ? "white" : "black");

    // // const ownPieces = color === "white" ? WHITE_PIECES : BLACK_PIECES;
    // // const oppPieces = color === "white" ? BLACK_PIECES : WHITE_PIECES;

    // // // Recalculate moves for other pieces of same color
    // // // Calculate moves for all of own pieces
    // // for (const other of ownPieces) {
    // //   const blocks = recalculateMoves(tiles, other);
    // //   if (blocks)
    // //     checkBlocks = new Set([...(checkBlocks ?? new Set()), ...blocks]);
    // // }
    // // // Recalculate moves for opposing pieces
    // // for (const opp of oppPieces) {
    // //   removeAttacks(tiles, opp);
    // //   const oppMoves = opp.calcMoves(opp, tiles);
    // //   for (const move of oppMoves) {
    // //     move.attackers.add(opp);
    // //   }
    // // }

    // // TODO: Check that opponent still has legal moves

    // // Reset a pawn that moved two squares last turn (cannot be captured via en passant anymore)
    // if (whiteTurn && blackMovedPawn) {
    //   blackMovedPawn.params.set("movedTwo", false);
    // } else if (!whiteTurn && whiteMovedPawn) {
    //   whiteMovedPawn.params.set("movedTwo", false);
    // }

    // // Switch to other color's turn
    // nextTurn(!whiteTurn);
    // whiteCanMove = !whiteCanMove;
  }

  return (
    <div className="container">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {board.tiles.map((tileData) => {
          return (
            <Tile
              key={tileData.id}
              tileData={tileData}
              active={actives[tileData.rank * 8 + tileData.file]}
            />
          );
        })}
      </DndContext>
    </div>
  );
};

export default Board;
