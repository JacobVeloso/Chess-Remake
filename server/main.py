from flask import Flask, request, jsonify
from flask_cors import CORS
import multiprocessing
import torch
from engine import ChessEngine
from dataset import encode_move, decode_move, encode_board

app = Flask(__name__)
CORS(app, resources={r'/api/*': {'origins': "http://localhost:5173"}})

device = torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")
model = ChessEngine().to(device)

model.load_state_dict(torch.load("model.pt"))
model.eval()

@app.route('/api/process', methods=["POST"])
def move():
    data: dict = request.json
    fen: str = data.get("fen")
    legal_moves: list[str] = data.get("moves")
    # print(fen)
    print(legal_moves)
    if (len(legal_moves) == 0):
        print("no legal moves")

    with torch.no_grad():
        board_tensor = encode_board(fen).unsqueeze(0).to(device)
        logits = model(board_tensor)[0]
        policy = torch.softmax(logits, dim=0)

        mask = torch.zeros(4864, device=device)
        for move in legal_moves:
            mask[encode_move(move)] = 1

        policy *= mask
        policy /= policy.sum()

        best_idx = torch.argmax(policy).item()
        best_move = decode_move(best_idx)
        # if best_move == 'd8d8':
        #     for move in legal_moves:
        #         if decode_move(encode_move(move)) != move:
        #             print(f"{move} -> {encode_move(move)} -> {decode_move(encode_move(move))}")
        print(best_move)

        return jsonify({
            "move": best_move
        })

if __name__ == "__main__":
    multiprocessing.freeze_support()
    app.run(debug=True)