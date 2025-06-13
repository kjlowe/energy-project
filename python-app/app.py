from flask import Flask
from datetime import datetime

app = Flask(__name__)

@app.route("/")
def home():
    # calculate today's date
    # and return a greeting message
    today = datetime.now().strftime("%Y-%m-%d")
    return f"Today's date is: {today} and I'm ready for it! And it's up to date from my work computer again!"

app.run(debug=True, host="0.0.0.0", port=5000)
