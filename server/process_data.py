import io
import os
import zstandard as zstd
import chess.pgn
import random
import torch
import re
from dataset import encode_board, encode_move

def stream_pgn_zst(path):
    with open(path, "rb") as f:
        dctx = zstd.ZstdDecompressor()
        with dctx.stream_reader(f) as reader:
            text_stream = io.TextIOWrapper(reader, encoding="utf-8")

            while True:
                game = chess.pgn.read_game(text_stream)
                if game is None:
                    break
                yield game

def main():
    MIN_PLY = 8
    MAX_PLY = 80
    SAMPLES_PER_GAME = 5
    DATAPTS_PER_CHUNK = 10000
    num_chunks = 0
    num_datapts = 0

    # Device
    device = torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")

    def new_chunk() -> dict:
        return {"boards": torch.tensor(()).new_zeros((DATAPTS_PER_CHUNK, 13, 8, 8), device=device), "moves": torch.tensor(()).new_zeros(DATAPTS_PER_CHUNK)}
    
    data = new_chunk()
    for f in os.scandir("data/raw"):
        if not f.is_file() or not re.fullmatch(".*\.pgn\.zst$", f.path):
            continue
        games = stream_pgn_zst(f.path)
        for game in games:
            moves = list(game.mainline_moves())
            if len(moves) <= MIN_PLY:
                continue

            # Store FEN,move pairs for whole game
            pairs: list[(str, int)] = []
            board = chess.Board()
            for move in moves:
                encoded_move = encode_move(move.uci())
                pairs.append((board.fen(), encoded_move))
                board.push(move)

            candidate_indices = range(MIN_PLY, min(len(moves) - 1, MAX_PLY))

            sampled = random.sample(
                candidate_indices,
                k=min(SAMPLES_PER_GAME, len(candidate_indices))
            )

            for idx in sampled:
                fen, encoded_move = pairs[idx]
                board_tensor = encode_board(fen).to(device)

                data["boards"][num_datapts] = board_tensor
                data["moves"][num_datapts] = encoded_move

                num_datapts += 1

                if num_datapts == DATAPTS_PER_CHUNK:
                    torch.save(data, f"data/processed/chunk_{num_chunks:03d}.pt")
                    num_chunks += 1
                    num_datapts = 0
                    data = new_chunk()

if __name__ == "__main__":
    main()