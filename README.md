# Chess Game & Engine

A personal project consisting of a recreation of the game of chess and a trained engine to play against.

## Description

The chess remake is coded entirely in Typescript.

The engine is a PyTorch model, trained as a CNN. The training data was pooled from Lichess' open database, which consists of millions of games.

## Getting Started

### Dependencies

**Python 3.10** is used for this project.

Install PyTorch:

```
$ pip install torch torchvision
```

Install Flask & Flask-CORS:

```
$ pip install Flask
$ pip install Flask-Cors
```

Install zstandard:

```
$ pip install zstandard
```

Install python-chess:

```
$ pip install chess
```

### Setup

Be sure to set the environmental variables in `/client/.env` before running.

- `VITE_PLAYER` - set to `engine` to play against the model. Any other value will result in 2-player chess.
- `VITE_FEN` - indicates how the board is setup upon startup. `DEFAULT_FEN` stores the basic starting position

You can freely store any FEN as an environment variable and then substitute it into the `VITE_FEN` variable to seamlessly switch between different board setups between executions.

> **NOTE**: Currently the program does **not** check that `VITE_FEN` is in the correct format (I plan to include error checks in the future). Learn how FEN notation is defined [here](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation#:~:text=citation%20needed%5D-,Definition,-%5Bedit%5D)

### Executing Program

Run server as usual:

```
$ npm run dev
```

Run Flask app through `main.py`:

```
$ python3 main.py
```

### Future Additions

- Allow player to choose to play as white or black when playing against the model, either within the program or through an environment variable
- Flip board display when playing in 2-player mode
- Error checks for `VITE_FEN` when setting up board
- Automatically configure GPU usage depending on machine (currently uses MPS for Apple Silicon)
