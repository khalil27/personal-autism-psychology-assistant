# --- server.py ---
import os
import subprocess
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from livekit import api

load_dotenv(".env.local")
AGENT_DIR = r"C:\Users\khalil\Desktop\personal-autism-psychology-assistant\agent-starter-python-main\src"


app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")

# ------------------ Endpoint pour obtenir les détails de connexion ------------------
@app.route("/getConnectionDetails", methods=["POST"])
def get_connection_details():
    data = request.json
    room_name = data.get("room")
    identity = data.get("identity", "web_user")
    name = data.get("name", identity)

    if not room_name:
        return jsonify({"error": "room required"}), 400

    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
        .with_identity(identity) \
        .with_name(name) \
        .with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
        ))

    connection_details = {
        "serverUrl": LIVEKIT_URL,
        "roomName": room_name,
        "participantName": name,
        "participantToken": token.to_jwt(),
    }

    return jsonify(connection_details)

# ------------------ Endpoint pour connecter l'agent à une room ------------------
AGENT_RUNNING = False

AGENT_CONTEXT = {}

@app.route("/connectAgent", methods=["POST"])
def connect_agent():
    data = request.json
    room_name = data.get("room")
    profile = data.get("profile")

    if not room_name:
        return jsonify({"error": "room required"}), 400
    if not profile:
        return jsonify({"error": "profile required"}), 400

    # ✅ Sauvegarder le profil dans un "contexte partagé"
    AGENT_CONTEXT[room_name] = profile

    return jsonify({"status": f"Agent ready for room {room_name}", "profile": profile}), 200


if __name__ == "__main__":
    app.run(port=5001, debug=True)
