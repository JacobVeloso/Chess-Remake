import multiprocessing
import torch
from engine import ChessEngine
from dataset import encode_move, decode_move, encode_board

def main():
    device = torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")
    model = ChessEngine().to(device)

    model.load_state_dict(torch.load("model.pt"))
    model.eval()

    # (FEN, legal_moves)
    sample_game = [
        ("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 
            [
                "a2a3", "a2a4", "b2b3", "b2b4", "c2c3", "c2c4", "d2d3", "d2d4", "e2e3", "e2e4", "f2f3", "f2f4", "g2g3", "g2g4", "h2h3", "h2h4", "b1a3", "b1c3", "g1f3", "g1h3" 
            ]
        ),
        ("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
            [
                "b8a6", "b8c6", "g8f6", "g8h6", "a7a6", "a7a5", "b7b6", "b7b5", "c7c6", "c7c5", "d7d6", "d7d5", "e7e6", "e7e5", "f7f6", "f7f5", "g7g6", "g7g5", "h7h6", "h7h5"
            ]
        ),
        ("rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
            [
                "a2a3", "a2a4", "b2b3", "b2b4", "c2c3", "c2c4", "d2d3", "d2d4", "e4e5", "f2f3", "f2f4", "g2g3", "g2g4", "h2h3", "h2h4", "b1a3", "b1c3", "d1e2", "d1f3", "d1g4", "d1h5", "e1e2", "f1e2", "f1d3", "f1c4", "f1b5", "f1a6", "g1e2", "g1f3", "g1h3" 
            ]
        ),
        ("rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
            [
                "b8a6", "b8c6", "d8c7", "d8b6", "d8a5", "g8f6", "g8h6", "a7a6", "a7a5", "b7b6", "b7b5", "c5c4", "d7d6", "d7d5", "e7e6", "e7e5", "f7f6", "f7f5", "g7g6", "g7g5", "h7h6", "h7h5"
            ]
        ),
        ("r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
            [
                "a2a3", "a2a4", "b2b3", "b2b4", "c2c3", "c2c4", "d2d3", "d2d4", "e4e5", "g2g3", "g2g4", "h2h3", "h2h4", "b1a3", "b1c3", "d1e2", "e1e2", "f1e2", "f1d3", "f1c4", "f1b5", "f1a6", "f3g5", "f3h4", "f3g1", "f3d4", "f3e5", "h1g1"
            ]
        ),
        ("r1bqkbnr/pp1ppppp/2n5/2p5/2B1P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 3 3",
            [
                "a8b8", "d8c7", "d8b6", "d8a5", "g8f6", "g8h6", "a7a6", "a7a5", "b7b6", "b7b5", "d7d6", "d7d5", "e7e6", "e7e5", "f7f6", "f7f5", "g7g6", "g7g5", "h7h6", "h7h5", "c6e5", "c6d4", "c6b4", "c6a5", "c6b8"
            ]
        ),
        ("r1bqkbnr/pp1p1ppp/2n1p3/2p5/2B1P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 4",
            [
                "c4d5", "c4d3", "c4e2", "c4f1", "c4b3", "c4b5", "c4a6", "e4e5", "f3g5", "f3h4", "f3g1", "f3d4", "f3e5", "a2a3", "a2a4", "b2b3", "b2b4", "c2c3", "c2c4", "d2d3", "d2d4", "g2g3", "g2g4", "h2h3", "h2h4", "b1a3", "b1c3", "d1e2", "e1e2", "e1f1", "h1g1", "h1f1"
            ]
        ),
        ("r1bqkbnr/pp1p1ppp/2n1p3/2p5/2B1P3/2P2N2/PP1P1PPP/RNBQKB1R b KQkq - 0 4",
            [
                "a8b8", "d8e7", "d8f6", "d8g5", "d8h4", "d8c7", "d8b6", "d8a5", "e8e7", "f8e7", "f8d6", "g8h6", "g8f6", "g8e7", "a7a6", "a7a5", "b7b6", "b7b5", "d7d6", "d7d5", "f7f6", "f7f5", "g7g6", "g7g5", "h7h6", "h7h5", "c6e7", "c6e5", "c6d4", "c6b4", "c6a5", "c6b8", "e6e5"
            ]
        ),
        ("r1bqkbnr/p2p1ppp/2n1p3/1pp5/2B1P3/2P2N2/PP1P1PPP/RNBQKB1R w KQkq - 0 5",
            [
                "c4d5", "c4d3", "c4e2", "c4f1", "c4b3", "e4e5", "f3g5", "f3h4", "f3g1", "f3d4", "f3e5", "a2a3", "a2a4", "b2b3", "b2b4", "d2d3", "d2d4", "g2g3", "g2g4", "h2h3", "h2h4", "b1a3", "d1e2", "d1c2", "d1b3", "d1a4", "e1e2", "e1f1", "h1g1", "h1f1"
            ]
        ),
        ("r1bqkbnr/p2p1ppp/2n1p3/1pp5/4P3/1BP2N2/PP1P1PPP/RNBQKB1R b KQkq - 1 5",
            [
                "a8b8", "c8b7", "c8a6", "d8e7", "d8f6", "d8g5", "d8h4", "d8c7", "d8b6", "d8a5", "e8e7", "f8e7", "f8d6", "g8h6", "g8f6", "g8e7", "a7a6", "a7a5", "d7d6", "d7d5", "f7f6", "f7f5", "g7g6", "g7g5", "h7h6", "h7h5", "c6e7", "c6e5", "c6d4", "c6b4", "c6a5", "c6b8", "e6e5", "b5b4", "c5c4"
            ]
        )
    ]

    with torch.no_grad():
        for board, legal_moves in sample_game:
            board_tensor = encode_board(board).unsqueeze(0).to(device)
            logits = model(board_tensor)[0]
            policy = torch.softmax(logits, dim=0)

            mask = torch.zeros(4864, device=device)
            for move in legal_moves:
                mask[encode_move(move)] = 1

            policy *= mask
            policy /= policy.sum()

            best_idx = torch.argmax(policy).item()
            best_move = decode_move(best_idx)

            print(best_move)


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()