from flask import Flask
app = Flask(__name__)

@app.route("/")
def home():
    return "Hello from Python!"

app.run(host="0.0.0.0", port=5000)
