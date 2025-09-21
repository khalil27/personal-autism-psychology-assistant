# --- server.py ---
import os
import asyncio
import logging
import nest_asyncio
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from livekit import api

# Importer ton agent (AGENT_SESSIONS doit contenir des JobContext)
from agent import AGENT_SESSIONS, generate_diagnostic_report

# ------------------ Configuration Logging ------------------
logger = logging.getLogger("server")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# ------------------ Charger variables d'environnement ------------------
load_dotenv(".env.local")

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")

if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET or not LIVEKIT_URL:
    logger.warning("⚠️ Certaines variables d'environnement LiveKit manquent ! Vérifie ton .env.local")

# ------------------ Initialisation Flask ------------------
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# Stocke juste les profils à part (facultatif)
AGENT_CONTEXT = {}

# Permet d’éviter les erreurs de loop avec asyncio + Flask
nest_asyncio.apply()

# ------------------ Utils ------------------
def error_response(message, code=400):
    return jsonify({"error": message}), code

# ------------------ Routes ------------------
@app.route("/getConnectionDetails", methods=["POST"])
def get_connection_details():
    data = request.json or {}
    room_name = data.get("room")
    identity = data.get("identity", "web_user")
    name = data.get("name", identity)

    if not room_name:
        return error_response("room required", 400)

    logger.info(f"🎫 Génération d'un token pour room={room_name}, identity={identity}")

    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
        .with_identity(identity) \
        .with_name(name) \
        .with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
        ))

    return jsonify({
        "serverUrl": LIVEKIT_URL,
        "roomName": room_name,
        "participantName": name,
        "participantToken": token.to_jwt(),
    })

@app.route("/connectAgent", methods=["POST"])
def connect_agent():
    """
    Associe un agent à une room (profil côté front).
    """
    data = request.json or {}
    room_name = data.get("room")
    profile = data.get("profile")

    logger.info(f"📨 [connectAgent] Payload brut: {data}")
    if not room_name:
        return error_response("room required")
    if not profile:
        return error_response("profile required")

    AGENT_CONTEXT[room_name] = profile

    logger.info(f"🤖 Agent associé à la room '{room_name}' avec profil: {profile}")
    logger.info(f"📂 Etat complet de AGENT_CONTEXT: {AGENT_CONTEXT}")
    logger.info(f"📋 Sessions actives côté agent: {list(AGENT_SESSIONS.keys())}")

    return jsonify({"status": f"Agent ready for room {room_name}"}), 200

@app.route("/getProfile", methods=["GET"])
def get_profile():
    room_name = request.args.get("room")
    if not room_name:
        return error_response("room required")

    profile = AGENT_CONTEXT.get(room_name)
    if not profile:
        return error_response("profile not found", 404)

    logger.info(f"📌 Profil récupéré pour room '{room_name}': {profile}")
    return jsonify({"profile": profile})

@app.route("/api/reports/generate", methods=["POST"])
def generate_report():
    """
    Déclenche la génération d'un rapport côté agent.
    """
    data = request.json or {}
    logger.info(f"📨 [generateReport] Payload brut reçu: {data}")
    logger.info(f"📂 Etat actuel de AGENT_CONTEXT: {AGENT_CONTEXT}")
    logger.info(f"📋 Sessions actives côté agent: {list(AGENT_SESSIONS.keys())}")

    session_id = data.get("session_id")
    if not session_id:
        return error_response("session_id required")

    # ✅ Récupère le contexte depuis AGENT_CONTEXT
    profile_context = AGENT_CONTEXT.get(session_id)
    if not profile_context:
        logger.warning(f"⚠️ Aucun profil trouvé pour session {session_id}, génération forcée avec contexte vide.")
        profile_context = {}

    # Transforme le dict en un objet compatible avec generate_diagnostic_report
    class DummyProc:
        def __init__(self, userdata):
            self.userdata = userdata

    class DummyContext:
        def __init__(self, profile):
            self.proc = DummyProc({"patient_profile": profile})

    context_obj = DummyContext(profile_context)

    try:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(generate_diagnostic_report(context_obj))
        except RuntimeError:
            # Si pas de loop courant (cas Flask), crée un loop temporaire
            asyncio.run(generate_diagnostic_report(context_obj))

        logger.info(f"📢 Rapport déclenché pour la session {session_id}")
        return jsonify({"message": f"Report generation triggered for session {session_id}"}), 200

    except Exception:
        logger.exception("❌ Échec de la génération du rapport")
        return error_response("Failed to trigger report generation", 500)

if __name__ == "__main__":
    logger.info("🚀 Démarrage du serveur Flask sur http://localhost:5001")
    app.run(port=5001, debug=True)
