from flask import Flask
app = Flask(__name__)

@app.route("/")
def home():
    return "Hello from Python! Did it work now? testing again"

app.run(debug=True, host="0.0.0.0", port=5000)
