import os
from flask import Flask, request, jsonify
from livekit import api
from dotenv import load_dotenv 

load_dotenv(".env.local")

app = Flask(__name__)

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")

# 👉 1. Endpoint pour générer un token LiveKit
@app.route("/getToken", methods=["POST"])
def get_token():
    data = request.json
    room_name = data.get("room")
    identity = data.get("identity")  # ex: l'ID patient

    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
        .with_identity(identity) \
        .with_name(identity) \
        .with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
        ))
    return jsonify({"token": token.to_jwt()})


# 👉 2. Endpoint pour créer une room (optionnel si tu veux les pré-créer)
@app.route("/createRoom", methods=["POST"])
def create_room():
    data = request.json
    room_name = data.get("room")

    lk = api.LiveKitAPI(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    room = lk.room.create(name=room_name)
    return jsonify({"room": room.to_dict()})


if __name__ == "__main__":
    app.run(port=5001, debug=True)
