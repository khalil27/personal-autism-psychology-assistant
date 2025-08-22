from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from livekit import api

app = FastAPI()

# ----------------- CORS -----------------
origins = [
    "http://localhost:3000",  # ton frontend React
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------------------------

API_KEY = "APIiRSWjzSsmTXq"
API_SECRET = "jSrWT2YS5QdBRVd5pkcKD9DiQ1TKARcBMejsTtj20e6"

ROOM_NAME = "test-room"  # <-- nom unique de la room

@app.get("/get_token")
def get_token(identity: str = Query("mobile_user", description="Nom de l'utilisateur")):
    # Crée un token LiveKit
    at = api.AccessToken(API_KEY, API_SECRET)
    at.identity = identity
    at.video = api.VideoGrants(room=ROOM_NAME)
    return {"token": at.to_jwt(), "room": ROOM_NAME, "identity": identity}
