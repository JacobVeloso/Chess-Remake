import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torch import optim
import re
import multiprocessing
import os

from dataset import ChessDataset, encode_move_tensor

class ChessEngine(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(13, 64, 3, padding=1)
        self.conv2 = nn.Conv2d(64, 128, 3, padding=1)
        self.conv3 = nn.Conv2d(128, 128, 3, padding=1)
        self.conv4 = nn.Conv2d(128, 64, 3, padding=1)
        self.head = nn.Linear(64*8*8, 4864) # 8 * 8 * 76

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = F.relu(self.conv3(x))
        x = F.relu(self.conv4(x))
        x = x.view(x.size(0), -1)
        return self.head(x)

def main():
    # # Load chess game data
    # game = chess.pgn.read_game(open("games/0.pgn"))
    # board = game.board()

    # for move in game.mainline_moves():
    #     fen_before = board.fen()
    #     move_uci = move.uci()
    #     board.push(move)
    #     training_positions.append([fen_before, move_uci])

    # Device
    device = torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")
    # training_positions = []
    # with os.scandir("data/processed") as pts:
    #     for f in pts:
    #         if not f.is_file() or not re.fullmatch(".*\.pt$", f.path):
    #             continue
    #         print(f.path)
    #         tensors: dict[str, torch.Tensor] = torch.load(f.path, map_location=device)
    #         print("Loaded tensors!")
    #         for datapoint in tensors.values():
    #             board, move_tensor = datapoint.split(13)
    #             move = encode_move_tensor(move_tensor)
    #             training_positions.append((board, move))

    # Training objects
    model = ChessEngine().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)

    # Setup data loading for model
    dataset = ChessDataset("data/processed")
    loader = DataLoader(
        dataset,
        batch_size=1024,
        shuffle=True
        # num_workers=4,
        # multiprocessing_context='fork' if torch.backends.mps.is_available() else None
    )

    # Training loop
    EPOCHS = 5
    for epoch in range(EPOCHS):
        model.train()
        running_loss = 0.0

        for boards, moves in loader:
            boards = boards.to(device)
            moves = moves.to(device)

            optimizer.zero_grad()

            outputs = model(boards)
            loss = criterion(outputs, moves)

            loss.backward()
            optimizer.step()

            running_loss += loss.item()

        # Calculate loss
        avg_loss = running_loss / len(loader)
        print(f"Epoch {epoch+1}/{EPOCHS} | Loss: {avg_loss:.4f}")

    # Save model
    torch.save(model.state_dict(), "model.pt")

if __name__ == "__main__":
    multiprocessing.freeze_support()
    # multiprocessing.set_start_method('fork', force=True) 
    main()