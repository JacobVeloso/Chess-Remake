import os
import torch
from torch.utils.data import Dataset

class ChessDataset(Dataset):
    def __init__(self, data_dir: str):
        # self.positions = positions
        self.data_dir = data_dir

        # Discover chunk files
        self.files = sorted(
            f for f in os.listdir(data_dir)
            if f.endswith(".pt")
        )

        if not self.files:
            raise RuntimeError("No data files found")

        # Index mapping: global_idx → (file_idx, local_idx)
        self.index = []

        self.length = 0
        self.file_sizes = []

        for file_idx, fname in enumerate(self.files):
            path = os.path.join(data_dir, fname)
            meta = torch.load(path, map_location="cpu")

            n = meta["boards"].shape[0]
            self.file_sizes.append(n)

            for local_idx in range(n):
                self.index.append((file_idx, local_idx))

            self.length += n

        # Do NOT keep file contents in memory
        self._cache = {}
        self._cache_size = 2  # number of chunks cached

    def __len__(self):
        return self.length
    
    def _load_file(self, file_idx):
        if file_idx in self._cache:
            return self._cache[file_idx]

        path = os.path.join(self.data_dir, self.files[file_idx])
        data = torch.load(path, map_location="cpu")

        # Simple LRU cache
        if len(self._cache) >= self._cache_size:
            self._cache.pop(next(iter(self._cache)))

        self._cache[file_idx] = data
        return data

    def __getitem__(self, idx):
        file_idx, local_idx = self.index[idx]
        data = self._load_file(file_idx)

        board = data["boards"][local_idx]
        move = data["moves"][local_idx]

        return board, move
    
def encode_move(uci: str) -> int | None:
    if not 4 <= len(uci) <= 5:
        return
    
    source, target = uci[:2], uci[2:]
    promotion = None

    # Check uci format
    if not 'a' <= source[0] <= 'h' or not 'a' <= target[0] <= 'h' or not source[1].isdigit() or not target[1].isdigit() or not 1 <= int(source[1]) <= 8 or not 1 <= int(target[1]) <= 8:
        return
    
    # Check for pawn promotion
    if len(target) == 3:
        if target[2] not in 'nrbq':
            return
        promotion = target[2]
    
    # Extract numerical values for ranks & files 
    src_rank = int(source[1]) - 1
    src_file = ord(source[0]) - ord('a')
    tgt_rank = int(target[1]) - 1
    tgt_file = ord(target[0]) - ord('a')

    # Same position
    if src_rank == tgt_rank and src_file == tgt_file:
        return

    move_idx = (src_rank * 8 + src_file) * 76

    KNIGHT_OFFSET = 56
    PROMOTE_OFFSET = 64

    # Promotion
    if promotion:
        move_idx += PROMOTE_OFFSET
        move_idx += (0 if promotion == 'n' else 1 if promotion == 'r' else 2 if promotion == 'b' else 3) * 4
        move_idx += 0 if tgt_file < src_file else 1 if tgt_file == src_file else 2

    # Sliding moves
    elif src_rank == tgt_rank or src_file == tgt_file or abs(src_rank - tgt_rank) == abs(src_file - tgt_file):
        # N
        if src_rank < tgt_rank and src_file == tgt_file:
            move_idx += 0 * 7 + tgt_rank - src_rank
        
        # NE
        elif src_rank < tgt_rank and src_file < tgt_file:
            move_idx += 1 * 7 + tgt_rank - src_rank
        
        # E
        elif src_rank == tgt_rank and src_file < tgt_file:
            move_idx += 2 * 7 + tgt_file - src_file

        # SE
        elif src_rank > tgt_rank and src_file < tgt_file:
            move_idx += 3 * 7 + src_rank - tgt_rank

        # S
        elif src_rank > tgt_rank and src_file == tgt_file:
            move_idx += 4 * 7 + src_rank - tgt_rank

        # SW
        elif src_rank > tgt_rank and src_file > tgt_file:
            move_idx += 5 * 7 + src_rank - tgt_rank
        
        # W
        elif src_rank == tgt_rank and src_file > tgt_file:
            move_idx += 6 * 7 + src_file - tgt_file

        # NW (src_rank < tgt_rank and src_file > tgt_file)
        else:
            move_idx += 7 * 7 + tgt_rank - src_rank
    
    # Knight moves
    else:
        move_idx += KNIGHT_OFFSET
        if tgt_rank == src_rank + 2 and tgt_file == src_file + 1:
            move_idx += 0
        elif tgt_rank == src_rank + 1 and tgt_file == src_file + 2:
            move_idx += 1
        elif tgt_rank == src_rank - 1 and tgt_file == src_file + 2:
            move_idx += 2
        elif tgt_rank == src_rank - 2 and tgt_file == src_file + 1:
            move_idx += 3
        elif tgt_rank == src_rank - 2 and tgt_file == src_file - 1:
            move_idx += 4
        elif tgt_rank == src_rank - 1 and tgt_file == src_file - 2:
            move_idx += 5
        elif tgt_rank == src_rank + 1 and tgt_file == src_file - 2:
            move_idx += 6
        elif tgt_rank == src_rank + 2 and tgt_file == src_file - 1:
            move_idx += 7
        else: # illegal move
            return
    
    return move_idx


def decode_move(move_idx: int) -> str | None:
    if not 0 <= move_idx < 4864:
        return
    
    src_idx = move_idx // 76
    move_type = move_idx % 76

    src_rank = src_idx // 8
    src_file = src_idx % 8

    uci = chr(src_file + 97) + str(src_rank + 1)

    # Sliding move
    if move_type < 56:
        direction = move_type // 7
        dist = move_type % 7

        match direction:
            case 0:
                tgt_rank = src_rank + dist
                tgt_file = src_file
            case 1:
                tgt_rank = src_rank + dist
                tgt_file = src_file + dist
            case 2:
                tgt_rank = src_rank
                tgt_file = src_file + dist
            case 3:
                tgt_rank = src_rank - dist
                tgt_file = src_file + dist
            case 4:
                tgt_rank = src_rank - dist
                tgt_file = src_file
            case 5:
                tgt_rank = src_rank - dist
                tgt_file = src_file - dist
            case 6:
                tgt_rank = src_rank
                tgt_file = src_file - dist
            case 7:
                tgt_rank = src_rank + dist
                tgt_file = src_file - dist
        
        uci += chr(tgt_file + 97) + str(tgt_rank + 1)

    # Knight move
    elif move_type < 64:
        match move_type:
            case 56:
                tgt_rank = src_rank + 2
                tgt_file = src_file + 1
            case 57:
                tgt_rank = src_rank + 1
                tgt_file = src_file + 2
            case 58:
                tgt_rank = src_rank - 1
                tgt_file = src_file + 2
            case 59:
                tgt_rank = src_rank - 2
                tgt_file = src_file + 1
            case 60:
                tgt_rank = src_rank - 2
                tgt_file = src_file - 1
            case 61:
                tgt_rank = src_rank - 1
                tgt_file = src_file - 2
            case 62:
                tgt_rank = src_rank + 1
                tgt_file = src_file - 2
            case 63:
                tgt_rank = src_rank + 2
                tgt_file = src_file - 1
        
        uci += chr(tgt_file + 97) + str(tgt_rank + 1)

    # Promotion
    else:
        tgt_rank = 8 if src_rank == 6 else 1
        move_type -= 64
        match move_type // 3:
            case 0:
                promotion = 'n'
            case 1:
                promotion = 'r'
            case 2:
                promotion = 'b'
            case 3:
                promotion = 'q'
        
        match move_type % 3:
            case 0:
                tgt_file = src_file - 1
            case 1:
                tgt_file = src_file
            case 2:
                tgt_file = src_file + 1
        
        uci += chr(tgt_file + 97) + str(tgt_rank) + promotion
    
    return uci


def encode_board(fen: str) -> torch.Tensor | None:
    board = torch.tensor(()).new_zeros((13, 8, 8))
    placements, active, castling_availability, ep_target, *_ = fen.split()

    if not placements or not active or not castling_availability or not ep_target:
        raise ValueError(f"Incorrect format: {fen}")

    # Encode piece placements
    PIECE_REPS = "PRNBQKprnbqk"
    lines = placements.split('/')
    rank = 7
    for line in lines:
        file = 0
        for char in line:
            if char.isdigit() and 1 <= int(char) <= 8:
                file += int(char)
            else:
                piece_index = PIECE_REPS.index(char)  
                board[piece_index][rank][file] = 1
                file += 1
        rank -= 1

    # Encode color active
    if active == 'b':
        board[12][0][0] = 1
    elif active != 'w': # active can only be 'w' or 'b'
        raise ValueError(f"Invalid color: {active}")
    
    # Encode castling availability
    if castling_availability != '-':
        for castle in castling_availability:
            match castle:
                case 'K':
                    board[12][0][1] = 1
                case 'Q':
                    board[12][0][2] = 1
                case 'k':
                    board[12][0][3] = 1
                case 'q':
                    board[12][0][4] = 1
                case _:
                    raise ValueError(f"Invalid castle: {castling_availability}")
            
    # Encode en passant target
    if ep_target != '-':
        if len(ep_target) != 2 or not 97 <= ord(ep_target[0]) <= 104 or not ep_target[1].isdigit() or (int(ep_target[1]) != 3 and int(ep_target[1]) != 6):
            raise ValueError(f"Invalid en passant target: {ep_target}")
        file, rank = ep_target[0], ep_target[1]
        board[12][int(rank)][ord(file) - ord('a')] = 1

    return board

def encode_move_tensor(move: torch.Tensor) -> int | None:
    source_alg = ""
    target_alg = ""
    FILES = "abcdefgh"
    for i in range(len(move[0])):
        for j in range(len(move[0][i])):
            if move[0][i][j] == 1:
                source_alg += FILES[j] + str(i+1)
            elif move[0][i][j] == 2:
                target_alg += FILES[j] + str(i+1)
    if source_alg == "" or target_alg == "":
        return
    
    return encode_move(source_alg + target_alg)