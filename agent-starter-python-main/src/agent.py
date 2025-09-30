import logging
import sys
import asyncio
import aiohttp
import json
import os
import re
from google import genai
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli
from livekit.plugins import deepgram, silero, google, speechify

# ---------------- Logging ----------------
logger = logging.getLogger("agent")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# ---------------- Env variables ----------------
load_dotenv(".env.local")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GENAI_API_KEY = os.getenv("GENAI_API_KEY")
client = genai.Client(api_key=GENAI_API_KEY)

# ----------------- Global sessions -----------------
AGENT_SESSIONS = {}

# ----------------- Helper -----------------
def log_conversation(ctx):
    conv = ctx.proc.userdata.get("conversation_history", [])
    logger.info("===== Conversation =====")
    for turn in conv:
        if "question" in turn:
            logger.info("🤖 AI: %s", turn["question"])
        elif "answer" in turn:
            logger.info("💬 Patient: %s", turn["answer"])
    logger.info("========================")
    print(f"[DEBUG] Current conversation_history: {ctx.proc.userdata.get('conversation_history', [])}")
    sys.stdout.flush()

def convert_sets(obj):
    if isinstance(obj, set):
        return list(obj)
    if isinstance(obj, dict):
        return {k: convert_sets(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_sets(i) for i in obj]
    return obj


async def generate_report_with_gemini(profile, dialogue, session_id):
    prompt = (
        "You are Dr. Mira, a compassionate psychologist. "
        "Based on the following patient profile and dialogue, generate a complete session report in JSON "
        "with the exact following structure:\n\n"
        "{\n"
        "  \"session_id\": \"<session_id>\",\n"
        "  \"patient_id\": \"<patient_id>\",\n"
        "  \"overview\": {\n"
        "    \"name\": \"<full name>\",\n"
        "    \"age\": <age>,\n"
        "    \"gender\": \"<gender>\",\n"
        "    \"occupation\": \"<occupation>\",\n"
        "    \"education_level\": \"<education level>\",\n"
        "    \"marital_status\": \"<marital status>\",\n"
        "    \"session_info\": \"Session <session_id> - Consultation\",\n"
        "    \"initial_diagnosis\": \"<diagnosis>\",\n"
        "    \"scores\": [\n"
        "      {\"tool\": \"<tool>\", \"intake\": <intake>, \"current\": <current>}\n"
        "    ]\n"
        "  },\n"
        "  \"narrative\": {\n"
        "    \"description\": \"<short description>\",\n"
        "    \"symptoms_observed\": [\"<symptom1>\", \"<symptom2>\"] ,\n"
        "    \"physical_markers\": [\"<marker1>\", \"<marker2>\"] ,\n"
        "    \"behavioral_markers\": [\"<behavior1>\", \"<behavior2>\"]\n"
        "  },\n"
        "  \"risk_indicators\": {\n"
        "    \"suicidal_ideation\": \"<value>\",\n"
        "    \"substance_use\": \"<value>\",\n"
        "    \"pregnancy\": \"<value>\",\n"
        "    \"family_history\": \"<value>\",\n"
        "    \"other_risks\": [\"<risk1>\", \"<risk2>\"]\n"
        "  },\n"
        "  \"clinical_inference\": {\n"
        "    \"primary_diagnosis\": \"<primary diagnosis>\",\n"
        "    \"differential_diagnoses\": [\"<diagnosis1>\", \"<diagnosis2>\"] ,\n"
        "    \"recommendations\": [\"<recommendation1>\", \"<recommendation2>\"]\n"
        "  },\n"
        "  \"dialogue\": <dialogue>,\n"
        "  \"doctor_notes\": \"<doctor notes>\",\n"
        "  \"notified_to_doctor\": true\n"
        "}\n\n"
        f"Patient profile: {json.dumps(profile, indent=2)}\n"
        f"Dialogue: {json.dumps(dialogue, indent=2)}\n"
        f"Session ID: {session_id}\n\n"
        "Return only the JSON object without any extra text."
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    logger.info(f"💬 Gemini raw response: {response}")
    text = getattr(response, "text", str(response))
    logger.info(f"💬 Gemini raw text: {text}")

    # 🔍 Extraire uniquement le JSON
    try:
        # Enlever les backticks ```json ... ```
        match = re.search(r"```json\s*(\{.*\})\s*```", text, re.DOTALL)
        if match:
            json_text = match.group(1)
        else:
            logger.warning("⚠️ Aucun bloc JSON trouvé, utilisation du texte brut")
            json_text = text

        return json.loads(json_text)

    except Exception as e:
        logger.error(f"❌ Error parsing Gemini output: {e}")
        return {}

# ----------------- Pré-chargement -----------------
def prewarm(proc):
    logger.info("🔹 Prewarming session...")
    proc.userdata["vad"] = silero.VAD.load()
    proc.userdata["conversation_history"] = []
    proc.userdata["end_call"] = False
    proc.userdata["report_generated"] = False
    logger.info("🔹 Prewarm completed")
    print("[DEBUG] Prewarm done. userdata keys:", list(proc.userdata.keys()))

# ----------------- Entrypoint -----------------
async def entrypoint(ctx: JobContext):
    room_name = ctx.room.name
    logger.info(f"📌 Entrypoint started for room: {room_name}")
    print(f"[DEBUG] Entrypoint started. Room name: {room_name}")

    # Charger le profil patient
    server_url = "http://localhost:5001/getProfile"
    profile = {}

    for attempt in range(5):
        async with aiohttp.ClientSession() as session:
            async with session.get(server_url, params={"room": room_name}) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    profile = data.get("profile", {})
                    if profile:
                        logger.info(f"✅ Profile loaded successfully on attempt {attempt + 1}")
                        print(f"[DEBUG] Profile loaded: {profile}")
                        break
        if not profile:
            logger.warning(f"⚠️ Profil vide, tentative {attempt + 1}/5...")
            await asyncio.sleep(0.5)

    ctx.proc.userdata["patient_profile"] = {
        "id": profile.get("user_id", {}).get("id", "unknown"),
        "name": f"{profile.get('user_id', {}).get('name','')} {profile.get('user_id', {}).get('last_name','')}".strip() or "Unknown",
        "age": profile.get("age"),
        "gender": profile.get("gender"),
        "occupation": profile.get("occupation"),
        "education_level": profile.get("education_level"),
        "marital_status": profile.get("marital_status"),
        "notes": profile.get("notes", ""),
    }
    logger.info(f"📌 Patient profile set: {ctx.proc.userdata['patient_profile']}")
    print(f"[DEBUG] Patient profile stored: {ctx.proc.userdata['patient_profile']}")

    AGENT_SESSIONS[room_name] = ctx
    logger.info(f"📌 Session added to AGENT_SESSIONS: {room_name}")
    print(f"[DEBUG] AGENT_SESSIONS keys now: {list(AGENT_SESSIONS.keys())}")

    # Création de la session agent
    session_agent = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.LLM(model="gemini-2.5-flash", temperature=0.7, max_output_tokens=500),
        tts=speechify.TTS(model="simba-english", voice_id="jack"),
        vad=silero.VAD.load(),
        use_tts_aligned_transcript=True,
    )

    # Gestion du report-request
    def handle_report_request(reader, participant_identity):
        async def process_report_request():
            async for chunk in reader:
                try:
                    text = chunk.decode("utf-8") if isinstance(chunk, (bytes, bytearray)) else str(chunk)
                    logger.info(f"📩 Report request received: {text}")

                    data = json.loads(text)
                    if data.get("type") != "GENERATE_REPORT":
                        logger.warning("⚠️ Type incorrect pour le rapport")
                        continue

                    dialogue = data["data"]["dialogue"]
                    session_id = data["data"]["meta"]["sessionId"]

                    logger.info(f"📝 Génération du rapport pour session {session_id}")

                    report = await generate_report_with_gemini(
                        ctx.proc.userdata["patient_profile"],
                        dialogue,
                        session_id
                    )

                    logger.info(f"🖨 Rapport structuré prêt :\n{json.dumps(report, indent=2)}")

                    # -------------------- Envoi au backend --------------------
                    backend_url = "http://localhost:5000/api/reports"
                    async with aiohttp.ClientSession() as session:
                        async with session.post(backend_url, json=report) as resp:
                            if resp.status in (200, 201):
                                logger.info("✅ Rapport envoyé au backend avec succès")
                                print("[DEBUG] Rapport envoyé au backend")
                            else:
                                logger.error(f"❌ Échec envoi rapport au backend: {resp.status} - {await resp.text()}")

                except Exception as e:
                    logger.error(f"❌ Erreur traitement report-request: {e}")

        asyncio.create_task(process_report_request())

    ctx.room.register_text_stream_handler("report-request", handle_report_request)
    logger.info("✅ Registered report-request handler")

    # Instructions
    profile_info = json.dumps(ctx.proc.userdata["patient_profile"], indent=2)
    instructions = (
        "You are Dr. Mira, a compassionate psychologist conducting a short interview. "
        "You will ask 3-6 short, empathetic questions to understand the patient's mental state. "
        "Keep questions simple and supportive. "
        f"Patient profile:\n{profile_info}\n"
        "At the end of the conversation, summarize what the patient has shared in a concise way. "
        "Do NOT generate a diagnostic report automatically. "
        "The AI should only send '[SESSION_END]' after the patient confirms that everything is fine."
    )

    agent = Agent(instructions=instructions)

    # Démarrage session agent
    await session_agent.start(agent=agent, room=ctx.room)
    await ctx.connect()
    await session_agent.say("Hello, my name is Dr. Mira. I will ask you a few quick questions about how you feel.")
    logger.info("💬 Initial message sent to patient")
    print("[DEBUG] Initial message sent")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
