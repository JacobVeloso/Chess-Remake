from flask import Flask, request, jsonify
from flask_cors import CORS
import multiprocessing
import torch
import os
from engine import ChessEngine
from dataset import encode_move, decode_move, encode_board

app = Flask(__name__)
CORS(app, resources={
    r'/api/*': {
        'origins': [
            "http://localhost:5173", 
            "https://chess-remake-ax6m.vercel.app"
        ]
    }
})

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024  # 16 KB

device = torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")
model = ChessEngine().to(device)

model.load_state_dict(torch.load("model.pt", map_location=device))
model.eval()

@app.route('/api/process', methods=["POST"])
def move():
    data: dict = request.get_json()
    fen: str = data.get("fen")
    legal_moves: list[str] = data.get("moves")

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

        return jsonify({
            "move": best_move
        })

if __name__ == "__main__":
    # multiprocessing.freeze_support()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)