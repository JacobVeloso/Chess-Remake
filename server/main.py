from flask import Flask
from flask_cors import CORS


app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, World!'

if __name__ == "__main__":
    app.run(debug=True, port=2525)