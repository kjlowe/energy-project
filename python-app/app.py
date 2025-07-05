from flask import Flask
from datetime import datetime

app = Flask(__name__)

@app.route("/")
def home():
    today = datetime.now().strftime("%Y-%m-%d")

    # Use correct path if file is in parent directory
    with open("./billing_data_table.html", "r", encoding="utf-8") as f:
        billing_data_table = f.read()

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Billing Year 2024</title>
</head>
<body>
    <h1>Data</h1>
    {billing_data_table}
    <p>Today's date is: {today}</p>
</body>
</html>"""

app.run(debug=True, host="0.0.0.0", port=5000)
