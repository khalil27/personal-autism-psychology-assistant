import logging
import sys
import asyncio
import aiohttp
import json
from datetime import datetime
from dotenv import load_dotenv

from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli
from livekit.agents.llm import function_tool
from livekit.plugins import deepgram, silero, google, speechify

# ---------------- Logging ----------------
logger = logging.getLogger("agent")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

load_dotenv(".env.local")

# ----------------- Global sessions -----------------
AGENT_SESSIONS = {}  # dictionnaire global pour stocker chaque JobContext

# ----------------- Helper : Log conversation -----------------
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

# ----------------- Rapport -----------------
@function_tool
async def generate_diagnostic_report(context: JobContext):
    print(f"[DEBUG] generate_diagnostic_report called with context type: {type(context)}")
    logger.info("📌 generate_diagnostic_report called for context: %s", context)

    session_id = getattr(getattr(context, 'room', None), 'name', None)
    print(f"[DEBUG] session_id extracted from context: {session_id}")
    logger.info("⚙️ Generating report for session_id=%s", session_id)

    if session_id not in AGENT_SESSIONS:
        logger.error("❌ Aucun contexte trouvé pour la session %s", session_id)
    else:
        logger.info("✅ Contexte trouvé pour la session %s", session_id)

    profile = context.proc.userdata.get("patient_profile", {})
    conversation_history = context.proc.userdata.get("conversation_history", [])

    logger.info("⚙️ Generating report for patient: %s", profile.get("name", "Unknown"))
    print(f"[DEBUG] profile in report: {profile}")
    print(f"[DEBUG] conversation_history in report: {conversation_history}")

    dialogue = [
        {"speaker": "AI", "text": i["question"]} if "question" in i else {"speaker": "Patient", "text": i["answer"]}
        for i in conversation_history
    ]

    llm_client = google.LLM(model="gemini-2.5-flash", temperature=0.5, max_output_tokens=500)
    conversation_text = "\n".join([f"{d['speaker']}: {d['text']}" for d in dialogue])

    prompt = (
        f"You are Dr. Mira, a compassionate psychologist. "
        f"Based on the following conversation and patient profile, generate a JSON object with fields:\n"
        f"- narrative: {{description, symptoms_observed, physical_markers, behavioral_markers}}\n"
        f"- risk_indicators: {{suicidal_ideation, substance_use, pregnancy, family_history, other_risks}}\n"
        f"- clinical_inference: {{primary_diagnosis, differential_diagnoses, recommendations}}\n\n"
        f"Patient profile: {json.dumps(profile)}\n"
        f"Conversation:\n{conversation_text}"
    )

    try:
        logger.info("⚙️ Sending prompt to AI for summary...")
        response = await llm_client.generate_content(prompt)
        ai_summary = response.text or ""
        summary_json = json.loads(ai_summary)
        logger.info("✅ AI summary parsed successfully")
    except (json.JSONDecodeError, Exception) as e:
        logger.warning("⚠️ AI response invalid, using fallback. Error: %s", e)
        summary_json = {
            "narrative": {"description": "Résumé automatique", "symptoms_observed": [], "physical_markers": [], "behavioral_markers": []},
            "risk_indicators": {"suicidal_ideation": "None reported", "substance_use": "Unknown", "pregnancy": "N/A", "family_history": "N/A", "other_risks": []},
            "clinical_inference": {"primary_diagnosis": "Preliminary assessment", "differential_diagnoses": [], "recommendations": ["Consultation recommandée"]}
        }

    report = {
        "session_id": session_id,
        "patient_id": profile.get("id", "unknown"),
        "overview": {
            "name": profile.get("name", "Unknown"),
            "age": profile.get("age"),
            "gender": profile.get("gender", ""),
            "occupation": profile.get("occupation", ""),
            "education_level": profile.get("education_level", ""),
            "marital_status": profile.get("marital_status", ""),
            "session_info": f"Session - {datetime.now().strftime('%Y-%m-%d')}",
            "initial_diagnosis": "Pending",
            "scores": [],
        },
        "narrative": summary_json.get("narrative", {}),
        "risk_indicators": summary_json.get("risk_indicators", {}),
        "clinical_inference": summary_json.get("clinical_inference", {}),
        "dialogue": dialogue,
        "doctor_notes": "Dr. Mira",
        "notified_to_doctor": True,
    }

    logger.info("📌 Report generated for: %s", report["overview"]["name"])
    print(f"[DEBUG] Report generated: {report}")

    backend_url = "http://localhost:5000/api/reports"
    async with aiohttp.ClientSession() as session:
        try:
            logger.info("💬 Sending report to backend at %s", backend_url)
            async with session.post(backend_url, json=report) as resp:
                body = await resp.text()
                if resp.status in [200, 201]:
                    logger.info("✅ Report saved successfully: %s", body)
                else:
                    logger.error("❌ Error saving report (%s): %s", resp.status, body)
        except Exception as e:
            logger.error("❌ Backend request failed: %s", e)

    return report

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
    print(f"[DEBUG] Entrypoint started. Room name: {room_name}")
    logger.info("📌 Entrypoint started for room: %s", room_name)

    server_url = "http://localhost:5001/getProfile"
    profile = {}

    for attempt in range(5):
        async with aiohttp.ClientSession() as session:
            async with session.get(server_url, params={"room": room_name}) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    profile = data.get("profile", {})
                    if profile:
                        logger.info("✅ Profile loaded successfully on attempt %d", attempt + 1)
                        print(f"[DEBUG] Profile loaded: {profile}")
                        break
        if not profile:
            logger.warning("⚠️ Profil vide, tentative %d/5...", attempt + 1)
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
    logger.info("📌 Patient profile set: %s", ctx.proc.userdata["patient_profile"])
    print(f"[DEBUG] Patient profile stored in ctx.proc.userdata: {ctx.proc.userdata['patient_profile']}")

    AGENT_SESSIONS[room_name] = ctx
    logger.info("📌 Session added to AGENT_SESSIONS: %s", room_name)
    print(f"[DEBUG] AGENT_SESSIONS keys now: {list(AGENT_SESSIONS.keys())}")

    # --- Création de la session Agent ---
    session_agent = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.LLM(model="gemini-2.5-flash", temperature=0.7, max_output_tokens=500),
        tts=speechify.TTS(model="simba-english", voice_id="jack"),
        vad=silero.VAD.load(),
        use_tts_aligned_transcript=True,
    )

    # --- Handlers conversation ---
    async def handle_transcription(event):
        text = getattr(event, "text", "").strip()
        participant = getattr(event, "participant", None)
        if text:
            ctx.proc.userdata["conversation_history"].append({"answer": text})
            logger.info("💬 Patient (STT) %s: %s", participant, text)
            log_conversation(ctx)

    session_agent.stt.on("transcription", lambda e: asyncio.create_task(handle_transcription(e)))

    async def async_handle_text_stream(reader, participant_identity):
        async for chunk in reader:
            text_chunk = chunk.decode("utf-8") if isinstance(chunk, (bytes, bytearray)) else str(chunk)
            ctx.proc.userdata["conversation_history"].append({"answer": text_chunk})
            logger.info("💬 Patient (Stream) %s: %s", participant_identity, text_chunk)
            log_conversation(ctx)

    def handle_text_stream(reader, participant_identity):
        asyncio.create_task(async_handle_text_stream(reader, participant_identity))

    for topic_name in ["chat", "messages", "default"]:
        try:
            ctx.room.register_text_stream_handler(topic_name, handle_text_stream)
            logger.info("✅ Registered text stream handler for topic='%s'", topic_name)
        except Exception as e:
            logger.warning("⚠️ Could not register handler for topic='%s': %s", topic_name, e)

    def llm_callback(event):
        text = getattr(event, "text", None)
        if text:
            ctx.proc.userdata["conversation_history"].append({"question": text})
            logger.info("🤖 AI: %s", text)
            log_conversation(ctx)

    session_agent.llm.on("message", llm_callback)

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

    await session_agent.start(agent=agent, room=ctx.room)
    await ctx.connect()
    await session_agent.say("Hello, my name is Dr. Mira. I will ask you a few quick questions about how you feel.")
    logger.info("💬 Initial message sent to patient")
    print("[DEBUG] Initial message sent")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))