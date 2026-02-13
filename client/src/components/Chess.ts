import { useRef } from "react";
import {
  type PieceData,
  type TileData,
  type BoardData,
  type Move,
  type color,
  type type,
  type dimension,
  FENData,
} from "./types";
import { encodeTile, decodeTile } from "./Tile.tsx";
import {
  checkBlocks,
  filterAttackedTiles,
  checkCastlingMoves,
  removeCastlingMove,
} from "./PieceTypes/King";
import { checkPawnMoves, promote } from "./PieceTypes/Pawn";
import { calculateMoves, blockMoves, unblockMoves } from "./MoveCalculation";
import { castle, getCastlingMoves } from "./PieceTypes/King";
import { isAttacked } from "./Tile";

/**
 * Checks if the piece at piecePos is pinned to their king at kingPos and determines all moves that can block the pin.
 * @param board : TileData[]
 * @param kingPos : [dimension, dimension]
 * @param piecePos : [dimension, dimension]
 * @returns Set<TileData> | null : Collection of all moves that that can block the pin (including capturing the attacker itself), or null if piece is not pinned.
 */
export function getPinBlocks(
  board: TileData[],
  kingPos: [dimension, dimension],
  piecePos: [dimension, dimension],
): Set<TileData> | null {
  // Check that a king is at kingPos
  const [kingRank, kingFile] = kingPos;
  if (
    !board[kingRank * 8 + kingFile].piece ||
    board[kingRank * 8 + kingFile].piece!.type !== "king"
  ) {
    return null;
  }

  // Check that a piece of the same color is at piecePos
  const color = board[kingRank * 8 + kingFile].piece!.color;
  const [pieceRank, pieceFile] = piecePos;
  if (
    !board[kingRank * 8 + kingFile].piece ||
    board[kingRank * 8 + kingFile].piece!.color !== color
  ) {
    return null;
  }

  // Check if piece is the king
  if (pieceRank === kingRank && pieceFile === kingFile) return null;

  const pinBlocks = new Set<TileData>();
  let pinPresent = false;

  // file axis
  if (kingFile === pieceFile) {
    const direction = pieceRank > kingRank ? 1 : -1;

    // Check for an opposing rook or queen
    for (let i = pieceRank + direction; i >= 0 && i < 8; i += direction) {
      pinBlocks.add(board[i * 8 + pieceFile]);
      const piece = board[i * 8 + pieceFile].piece;
      if (
        (piece?.type === "rook" || piece?.type === "queen") &&
        piece?.color !== color
      ) {
        pinPresent = true;
        break;
      } else if (board[i * 8 + pieceFile].piece) {
        return null; // Different piece
      }
    }
    // rook/queen not found
    if (!pinPresent) return null;

    // Check if another piece is between piece and king
    for (let i = kingRank + direction; i !== pieceRank; i += direction) {
      pinBlocks.add(board[i * 8 + pieceFile]);
      if (board[i * 8 + pieceFile].piece) return null;
    }

    return pinBlocks;
  }

  // rank axis
  else if (kingRank === pieceRank) {
    const direction = pieceFile > kingFile ? 1 : -1;

    // Check for an opposing rook or queen
    for (let i = pieceFile + direction; i >= 0 && i < 8; i += direction) {
      pinBlocks.add(board[pieceRank * 8 + i]);
      const piece = board[pieceRank * 8 + i].piece;
      if (
        (piece?.type === "rook" || piece?.type === "queen") &&
        piece?.color !== color
      ) {
        pinPresent = true;
        break;
      } else if (board[pieceRank * 8 + i].piece) {
        return null; // Different piece
      }
    }
    // rook/queen not found
    if (!pinPresent) return null;

    // Check if another piece is between piece and king
    for (let i = kingFile + direction; i !== pieceFile; i += direction) {
      pinBlocks.add(board[pieceRank * 8 + i]);
      if (board[pieceRank * 8 + i].piece) return null;
    }

    return pinBlocks;
  }

  // diagnoal
  else if (Math.abs(kingRank - pieceRank) === Math.abs(kingFile - pieceFile)) {
    const rankDirection = pieceRank > kingRank ? 1 : -1;
    const fileDirection = pieceFile > kingFile ? 1 : -1;

    // Check for an opposing bishop or queen
    let i = pieceRank + rankDirection;
    let j = pieceFile + fileDirection;
    while (i >= 0 && i < 8 && j >= 0 && j < 8) {
      pinBlocks.add(board[i * 8 + j]);
      const piece = board[i * 8 + j].piece;
      if (
        (piece?.type === "bishop" || piece?.type === "queen") &&
        piece?.color !== color
      ) {
        pinPresent = true;
        break;
      } else if (board[i * 8 + j].piece) {
        return null; // Different piece
      }
      i += rankDirection;
      j += fileDirection;
    }
    // bishop/queen not found
    if (!pinPresent) return null;

    // Check if another piece is between piece and king
    i = kingRank + rankDirection;
    j = kingFile + fileDirection;
    while (i !== pieceRank || j !== pieceFile) {
      pinBlocks.add(board[i * 8 + j]);
      if (board[i * 8 + j].piece) return null;
      i += rankDirection;
      j += fileDirection;
    }

    return pinBlocks;
  }

  // piece not pinned
  else return null;
}

/**
 * Takes the set intersection of allMoves and allowedMoves, modifying allMoves in place
 * @param allMoves : Set<TileData>
 * @param allowedMoves : Set<TileData>
 */
export function filterMoves(
  allMoves: Set<TileData>,
  allowedMoves: Set<TileData>,
): Set<TileData> {
  const filteredMoves = new Set<TileData>();
  for (const move of allMoves) {
    if (allowedMoves.has(move)) filteredMoves.add(move);
  }
  return filteredMoves;
}

/**
 * Determines all moves that can block a piece from attacking the king, regardless of the type of piece. Can also be used for any generic piece.
 * @param board : TileData[]
 * @param kingPos : [dimension, dimension]
 * @param attackerPos : [dimension, dimension]
 * @returns Set<TileData> : Collection of moves that are in between attacker and king.
 */
export function blockingMoves(
  board: TileData[],
  kingPos: [dimension, dimension],
  attackerPos: [dimension, dimension],
): Set<TileData> {
  const [kingRank, kingFile] = kingPos;
  const [attackerRank, attackerFile] = attackerPos;
  const moves = new Set<TileData>([board[attackerRank * 8 + attackerFile]]);

  // straight
  if (kingRank === attackerRank) {
    const direction = kingFile > attackerFile ? 1 : -1;
    for (let i = attackerFile + direction; i !== kingFile; i += direction) {
      moves.add(board[attackerRank * 8 + i]);
    }
  } else if (kingFile === attackerFile) {
    const direction = kingRank > attackerRank ? 1 : -1;
    for (let i = attackerRank + direction; i !== kingRank; i += direction) {
      moves.add(board[i * 8 + attackerFile]);
    }
  }

  // diagonal
  else if (
    Math.abs(kingRank - attackerRank) === Math.abs(kingFile - attackerFile)
  ) {
    const rankDirection = kingRank > attackerRank ? 1 : -1;
    const fileDirection = kingFile > attackerFile ? 1 : -1;
    let i = attackerRank + rankDirection;
    let j = attackerFile + fileDirection;
    while (i !== kingRank && j !== kingFile) {
      moves.add(board[i * 8 + j]);
      i += rankDirection;
      j += fileDirection;
    }
  }

  // If attacker is a knight/pawn, both cases fail - only blocking move is capturing knight itself

  return moves;
}

/**
 * Calculates all legal moves for all pieces for the color determined by board.turn. Accounts for castles, checks, pins & blocked pieces.
 * @param board BoardData object containing board state and turn
 * @returns Map of all legal moves, where each value is a set of moves accessed via the ID of the piece that can perform exactly those moves.
 */
export function calculateLegalMoves(
  board: BoardData,
): Map<PieceData["id"], Set<TileData["id"]>> | null {
  const pieces = board.turn === "white" ? board.whitePieces : board.blackPieces;
  const king = Array.from(pieces).filter((piece) => piece.type === "king")[0];

  const blocks = checkBlocks(board.tiles, king.rank, king.file);

  const moves = new Map<PieceData["id"], Set<TileData["id"]>>();

  for (const piece of pieces) {
    let pieceMoves = new Set<TileData>();

    for (const [_, moveType] of piece.moves) {
      for (const move of moveType) {
        // Only add moves that do not capture own piece
        if (!move.piece || move.piece.color !== piece.color)
          pieceMoves.add(move);
      }
    }

    // Filter captures for pawns
    if (piece.type === "pawn") {
      const illegalMoves = checkPawnMoves(board.tiles, piece);
      illegalMoves.forEach((move) => pieceMoves.delete(move));
    } else if (piece.type === "king") {
      // Filter castle moves for king
      const illegalCastles = checkCastlingMoves(board.tiles, piece);
      illegalCastles.forEach((move) => pieceMoves.delete(move));

      // Filter out moves that would put king in check
      pieceMoves = filterAttackedTiles(board.tiles, piece, pieceMoves);
    }

    // Filter by moves that can block check (if applicable)
    if (blocks && piece.type !== "king")
      pieceMoves = filterMoves(pieceMoves, blocks);

    // Filter by moves that keep piece pinned (if applicable)
    const pinBlocks = getPinBlocks(
      board.tiles,
      [king.rank, king.file],
      [piece.rank, piece.file],
    );
    if (pinBlocks) pieceMoves = filterMoves(pieceMoves, pinBlocks);

    // Record legal moves
    moves.set(
      piece.id,
      new Set<TileData["id"]>(Array.from(pieceMoves, (move) => move.id)),
    );
  }

  // Check if there is at least one legal move
  for (const moveSet of moves.values()) {
    if (moveSet.size > 0) return moves;
  }

  // Checkmate
  if (isAttacked(board.tiles[king.rank * 8 + king.file], board.turn))
    return null;

  // Stalemate
  return new Map();
}

/**
 * Removes a piece from the board and the board's collection of pieces. Removes all of the piece's attacks on the board tiles.
 * @param board BoardData object containing board state and collection of pieces
 * @param piece PieceData object to delete.
 */
function deletePiece(board: BoardData, piece: PieceData): void {
  // Remove piece and all of its attacks from board
  for (const tile of board.tiles) {
    tile.attackers.delete(piece);
    if (tile.piece === piece) tile.piece = null;
  }

  // Remove piece from board's piece collections
  if (piece.color === "white") board.whitePieces.delete(piece);
  else board.blackPieces.delete(piece);
}

/**
 * Simulate a move played on the board and returns the new board state. Recalculates the moves for all pieces affected by the move. Increments move counters as necesssary and switches turns (flips board.turn).
 * @param board BoardData object containing board state
 * @param move Move object to apply to board
 * @returns Updated BoardData object.
 */
export function applyMove(board: BoardData, move: Move): BoardData {
  const piece = move.piece;
  const sourceTile = board.tiles[+move.from];
  const targetTile = board.tiles[+move.to];

  // Reset en passant pawn
  board.epPawn?.params.set("movedTwo", false);
  board.epPawn = null;

  // Extra checks for kings
  if (piece.type === "king" && Math.abs(+move.from - +move.to) === 2) {
    castle(board.tiles, move);
  } else {
    if (piece.type === "king") piece.params.set("hasMoved", true);
    // Extra checks for pawns
    else if (piece.type === "pawn") {
      // Check if pawn captured via en passant
      if (targetTile.file !== sourceTile.file && !targetTile.piece) {
        deletePiece(
          board,
          board.tiles[sourceTile.rank * 8 + targetTile.file].piece!,
        );
      }

      // Check if pawn moved two squares
      if (Math.abs(+move.from - +move.to) === 16) {
        piece.params.set("movedTwo", true);
        board.epPawn = piece;
      } else piece.params.set("movedTwo", false);
    }
    // Extra check for rook
    else if (piece.type === "rook") {
      piece.params.set("hasMoved", true);

      // Remove castling move for king
      if (
        board.tiles[piece.rank * 8 + 4].piece &&
        board.tiles[piece.rank * 8 + 4].piece!.type === "king" &&
        !board.tiles[piece.rank * 8 + 4].piece!.params.get("hasMoved")
      ) {
        const king = board.tiles[piece.rank * 8 + 4].piece!;
        if (piece.file < king.file)
          removeCastlingMove(
            board.tiles,
            board.tiles[piece.rank * 8 + 4].piece!,
            "left",
          );
        // piece.file > king.file
        else
          removeCastlingMove(
            board.tiles,
            board.tiles[piece.rank * 8 + 4].piece!,
            "right",
          );
      }
    }

    // Check for a capture
    if (targetTile.piece) deletePiece(board, targetTile.piece!);

    sourceTile.piece = null;
    targetTile.piece = piece;

    // Update position of piece
    piece.rank = targetTile.rank;
    piece.file = targetTile.file;

    // Promote if pawn reached end of board
    if (
      piece.type === "pawn" &&
      ((piece.color === "white" && piece.rank === 0) ||
        (piece.color === "black" && piece.rank === 7))
    )
      promote(board.tiles, piece, "queen"); // TODO: Allow user to choose piece
    // Recalculate possible moves for piece
    else calculateMoves(piece, board.tiles, move);
  }

  // Recalculate possible moves for pieces interacting with source & target tiles
  sourceTile.attackers.forEach((unblockedPiece) => {
    if (unblockedPiece !== piece)
      unblockMoves(
        unblockedPiece,
        board.tiles,
        sourceTile.rank,
        sourceTile.file,
      );
  });
  targetTile.attackers.forEach((blockedPiece) =>
    blockMoves(blockedPiece, board.tiles, targetTile.rank, targetTile.file),
  );

  // Reset halfmoves if pawn advanced or piece was captured, otherwise increment
  if (piece.type === "pawn" || move.capture) board.halfmoves = 0;
  else board.halfmoves++;

  // Increment fullmoves
  if (board.turn === "black") board.fullmoves++;

  // Switch turns
  board.turn = board.turn === "white" ? "black" : "white";

  return board;
}

/**
 * Generates the FEN representation of a BoardData object. FEN representation is in the form:
 * "\<piece placements\> \<active color\> \<castling rights\> \<en passant target sqaure\> \<halfmoves\> \<fullmoves\>"
 *
 * e.g. "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" (starting position).
 * @param board BoardData object containing all information to generate FEN
 * @returns FEN representation.
 */
export function generateFEN(board: BoardData): string {
  let boardFen = "";
  let emptySpaces = 0;
  for (const tile of board.tiles) {
    if (tile.piece) {
      // Notate number of empty spaces
      if (emptySpaces > 0) {
        boardFen += emptySpaces;
        emptySpaces = 0;
      }

      // Notate piece based on type and color
      switch (tile.piece.type) {
        case "pawn":
          boardFen += tile.piece.color === "white" ? "P" : "p";
          break;
        case "rook":
          boardFen += tile.piece.color === "white" ? "R" : "r";
          break;
        case "knight":
          boardFen += tile.piece.color === "white" ? "N" : "n";
          break;
        case "bishop":
          boardFen += tile.piece.color === "white" ? "B" : "b";
          break;
        case "queen":
          boardFen += tile.piece.color === "white" ? "Q" : "q";
          break;
        case "king":
          boardFen += tile.piece.color === "white" ? "K" : "k";
          break;
      }
    } else ++emptySpaces; // Count empty spaces between pieces

    // Notate next rank
    if (+tile.id % 8 === 7) {
      // Notate number of empty spaces
      if (emptySpaces > 0) {
        boardFen += emptySpaces;
        emptySpaces = 0;
      }

      if (tile.id !== "63") boardFen += "/";
    }
  }

  const turnFen = board.turn === "white" ? "w" : "b";

  function getCastlingFEN(king: PieceData): string {
    const moves = getCastlingMoves(board.tiles, king, false);
    // console.log([...moves]);
    let queenSide = false;
    let kingSide = false;
    for (const move of moves) {
      if (move.file < king.file) queenSide = true;
      else kingSide = true;
    }
    let fen = "";
    if (kingSide) fen += king.color === "white" ? "K" : "k";
    if (queenSide) fen += king.color === "white" ? "Q" : "q";
    return fen;
  }

  let castlingFen = "";

  for (const piece of board.whitePieces) {
    if (piece.type === "king") castlingFen += getCastlingFEN(piece);
  }

  for (const piece of board.blackPieces) {
    if (piece.type === "king") castlingFen += getCastlingFEN(piece);
  }

  function getEpTile(): string {
    if (!board.epPawn) return "-";
    const direction = board.epPawn.color === "white" ? 1 : -1;
    const epTarget =
      board.tiles[(board.epPawn.rank + direction) * 8 + board.epPawn.file];
    return encodeTile(epTarget);
  }

  const epFen = getEpTile();
  const halfFen = +board.halfmoves;
  const fullFen = +board.fullmoves;

  return (
    boardFen +
    " " +
    turnFen +
    " " +
    (castlingFen ? castlingFen : "-") +
    " " +
    epFen +
    " " +
    halfFen +
    " " +
    fullFen
  );
}

/**
 * Determines and returns a boolean array representing the active moves for a certain piece.
 * @param moves Map containing all legal moves for all pieces.
 * @param pieceID String ID of piece to highlight moves for.
 * @returns Boolean array, where true indicates a highlighted tile.
 */
export function getHighlightedTiles(
  moves: Map<PieceData["id"], Set<TileData["id"]>>,
  pieceID: PieceData["id"],
): boolean[] {
  const tiles = Array(64).fill(false);
  moves.get(pieceID)?.forEach((move) => (tiles[+move] = true));
  return tiles;
}

/**
 * Initialises a chess board consisting of TileData objects with their IDs, positions and colors. Board is created without pieces.
 * @returns Array of 64 TileData objects representing chess board
 */
function createBoard(): TileData[] {
  let tileID = 0;
  return Array.from({ length: 64 }, (_, index) => {
    const [rank, file]: [dimension, dimension] = [
      Math.floor(index / 8) as dimension,
      (index % 8) as dimension,
    ];
    const color: color = (rank + file) % 2 === 0 ? "white" : "black";

    return {
      id: "" + tileID++,
      rank,
      file,
      color,
      piece: null,
      attackers: new Set<PieceData>(),
    };
  });
}

/**
 * Inspects the value stored at env.VITE_FEN to setup the state of the board.
 * @returns BoardData object storing the state of the board including piece placements & move counters.
 */
function setup(): BoardData {
  const OPENING_FEN = import.meta.env.VITE_FEN;
  const [placements, active, castles, enPassants, halfmoves, fullmoves] =
    OPENING_FEN.split(" ");

  // Instantiate board
  const board: BoardData = {
    tiles: createBoard(),
    whitePieces: new Set<PieceData>(),
    blackPieces: new Set<PieceData>(),
    turn: (active === "w" ? "white" : "black") as color,
    halfmoves: +halfmoves,
    fullmoves: +fullmoves,
    epPawn: null,
  };

  // Place all pieces
  const ranks = placements.split("/");
  let id = 0;
  for (let i = 0; i < 8; ++i) {
    const rank = ranks[i];
    let j = 0;
    for (const data of rank) {
      if (isNaN(+data)) {
        const metadata = FENData.get(data)!;
        const piece = {
          id: (id++).toString(),
          color: metadata[0] as color,
          type: metadata[1] as type,
          rank: i as dimension,
          file: j as dimension,
          moves: new Map<string, Set<TileData>>(),
          params: new Map<string, boolean>(),
        };
        board.tiles[i * 8 + j++].piece = piece;
        (metadata[0] === "white" ? board.whitePieces : board.blackPieces).add(
          piece,
        );
        // Check for enpassant
        if (metadata[1] === "pawn") {
          piece.params.set("movedTwo", false);
          const epID = decodeTile(enPassants);
          if (epID !== "") {
            const [epRank, epFile] = [+epID / 8, +epID % 8];
            const direction = metadata[0] === "white" ? -1 : 1;
            if (
              board.tiles[(epRank + direction) * 8 + epFile].piece === piece
            ) {
              piece.params.set("movedTwo", true);
              board.epPawn = piece;
            }
          }
        }

        // Check for castling rights
        else if (metadata[1] === "king" || metadata[1] === "rook") {
          piece.params.set("hasMoved", true);
          for (const castle of castles) {
            if (
              castle === "K" &&
              piece.color === "white" &&
              (piece.type === "king" ||
                (piece.type === "rook" && piece.rank === 7 && piece.file === 7))
            )
              piece.params.set("hasMoved", false);
            else if (
              castle === "Q" &&
              piece.color === "white" &&
              (piece.type === "king" ||
                (piece.type === "rook" && piece.rank === 7 && piece.file === 0))
            )
              piece.params.set("hasMoved", false);
            else if (
              castle === "k" &&
              piece.color === "black" &&
              (piece.type === "king" ||
                (piece.type === "rook" && piece.rank === 0 && piece.file === 7))
            )
              piece.params.set("hasMoved", false);
            else if (
              castle === "q" &&
              piece.color === "black" &&
              (piece.type === "king" ||
                (piece.type === "rook" && piece.rank === 0 && piece.file === 0))
            )
              piece.params.set("hasMoved", false);
          }
        }
      } else j += +data;
    }
  }

  // Calculate moves for all pieces
  for (const piece of board.whitePieces) calculateMoves(piece, board.tiles);
  for (const piece of board.blackPieces) calculateMoves(piece, board.tiles);

  return board;
}

function useChess() {
  const boardData = useRef<BoardData>(setup());

  // Attempt to move piece on board and recalculate moves if successful
  const movePiece = (
    from: TileData["id"],
    to: TileData["id"],
    legalMoves: Map<PieceData["id"], Set<TileData["id"]>>,
  ): Map<string, Set<string>> | null => {
    const piece = boardData.current.tiles[+from].piece;
    if (piece && legalMoves.get(piece.id)?.has(to)) {
      // Apply the move to the board
      const capture = boardData.current.tiles[+to].piece ?? undefined;
      applyMove(boardData.current, { from, to, piece, capture });

      // Calculate legal moves for new active color
      return calculateLegalMoves(boardData.current);
    }
    return new Map<string, Set<string>>();
  };

  return {
    boardData,
    movePiece,
  };
}

export default useChess;
