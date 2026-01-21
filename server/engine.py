import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
import chess
import chess.pgn
import multiprocessing

from torch import optim
from dataset import ChessDataset

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
    # Load chess game data
    game = chess.pgn.read_game(open("games/0.pgn"))
    board = game.board()

    training_positions = []

    for move in game.mainline_moves():
        fen_before = board.fen()
        move_uci = move.uci()
        board.push(move)
        training_positions.append([fen_before, move_uci])

    # Device
    device = torch.device("mps")

    # Training objects
    model = ChessEngine().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)

    # Setup data loading for model
    BATCH_SIZE = 256
    dataset = ChessDataset(training_positions)
    loader = DataLoader(
        dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=4
    )

    # Training loop
    EPOCHS = 10
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
    main()