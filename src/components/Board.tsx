import "./Board.css";
import pieces from "../assets/index";
import Tile from "./Tile";
import type {
  PieceData,
  TileData,
  BoardState,
  type,
  color,
  dimension,
} from "./types.ts";
import useChess, { calculateLegalMoves, getHighlightedTiles } from "./Chess.ts";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

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
    //moveHistory: [],
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

  function handleDragStart(event: DragStartEvent) {
    const pieceId = event.active.id as PieceData["id"];
    const piece = getPiece(board.tiles, pieceId);
    if (piece) setActive(getHighlightedTiles(moves, pieceId));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActive(new Array(64).fill(false));
    const { active, over } = event;

    // Check if piece is hovering over a tile
    if (!over) return;

    // event IDs
    const targetTileId = over.id as TileData["id"];
    const pieceId = active.id as PieceData["id"];

    const piece = getPiece(board.tiles, pieceId);
    if (!piece) return;

    // Check if tile is a legal move for the piece
    if (moves.get(pieceId)?.has(targetTileId)) {
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

/*
You will attempt to implement a performance improvement to a large slowdown in a react app

Your should split your goals into 2 parts:
- identifying the problem
- fixing the problem
	- it is okay to implement a fix even if you aren't 100% sure the fix solves the performance problem. When you aren't sure, you should tell the user to try repeating the interaction, and feeding the "Formatted Data" in the React Scan notifications optimize tab. This allows you to start a debugging flow with the user, where you attempt a fix, and observe the result. The user may make a mistake when they pass you the formatted data, so must make sure, given the data passed to you, that the associated data ties to the same interaction you were trying to debug.

Make sure to check if the user has the react compiler enabled (project dependent, configured through build tool), so you don't unnecessarily memoize components. If it is, you do not need to worry about memoizing user components

One challenge you may face is the performance problem lies in a node_module, not in user code. If you are confident the problem originates because of a node_module, there are multiple strategies, which are context dependent:
- you can try to work around the problem, knowing which module is slow
- you can determine if its possible to resolve the problem in the node_module by modifying non node_module code
- you can monkey patch the node_module to experiment and see if it's really the problem (you can modify a functions properties to hijack the call for example)
- you can determine if it's feasible to replace whatever node_module is causing the problem with a performant option (this is an extreme)


We have the high level time of how much react spent rendering, and what else the browser spent time on during this slowdown

- react component render time: 0ms
- other time: 314ms


We also have lower level information about react components, such as their render time, and which props/state/context changed when they re-rendered.



You may notice components have many renders, but much fewer props/state/context changes. This normally implies most of the components could of been memoized to avoid computation

It's also important to remember if a component had no props/state/context change, and it was memoized, it would not render. So the flow should be:
- find the most expensive components
- see what's causing them to render
- determine how you can make those state/props/context not change for a large set of the renders
- once there are no more changes left, you can memoize the component so it no longer unnecessarily re-renders. 

An important thing to note is that if you see a lot of react renders (some components with very high render counts), but other time is much higher than render time, it is possible that the components with lots of renders run hooks like useEffect/useLayoutEffect, which run outside of what we profile (just react render time).

It's also good to note that react profiles hook times in development, and if many hooks are called (lets say 5,000 components all called a useEffect), it will have to profile every single one. And it may also be the case the comparison of the hooks dependency can be expensive, and that would not be tracked in render time.

If a node_module is the component with high renders, you can experiment to see if that component is the root issue (because of hooks). You should use the same instructions for node_module debugging mentioned previously.

If renders don't seem to be the problem, see if there are any expensive CSS properties being added/mutated, or any expensive DOM Element mutations/new elements being created that could cause this slowdown. 

Your goal will be to help me find the source of a performance problem in a React App. I collected a large dataset about this specific performance problem.

We have the high level time of how much react spent rendering, and what else the browser spent time on during this slowdown

- react component render time: 0ms
- other time (other JavaScript, hooks like useEffect, style recalculations, layerization, paint & commit and everything else the browser might do to draw a new frame after javascript mutates the DOM): 314ms


We also have lower level information about react components, such as their render time, and which props/state/context changed when they re-rendered.



You may notice components have many renders, but much fewer props/state/context changes. This normally implies most of the components could of been memoized to avoid computation

It's also important to remember if a component had no props/state/context change, and it was memoized, it would not render. So a flow we can go through is:
- find the most expensive components
- see what's causing them to render
- determine how you can make those state/props/context not change for a large set of the renders
- once there are no more changes left, you can memoize the component so it no longer unnecessarily re-renders. 


An important thing to note is that if you see a lot of react renders (some components with very high render counts), but other time is much higher than render time, it is possible that the components with lots of renders run hooks like useEffect/useLayoutEffect, which run outside of what we profile (just react render time).

It's also good to note that react profiles hook times in development, and if many hooks are called (lets say 5,000 components all called a useEffect), it will have to profile every single one, and this can add significant overhead when thousands of effects ran.

If it's not possible to explain the root problem from this data, please ask me for more data explicitly, and what we would need to know to find the source of the performance problem.

I will provide you with a set of high level, and low level performance data about a large frame drop in a React App:
### High level
- react component render time: 0ms
- how long it took to run everything else (other JavaScript, hooks like useEffect, style recalculations, layerization, paint & commit and everything else the browser might do to draw a new frame after javascript mutates the DOM): 314ms

### Low level
We also have lower level information about react components, such as their render time, and which props/state/context changed when they re-rendered.

*/
