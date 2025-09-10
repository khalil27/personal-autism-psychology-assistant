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

# ----------------- Fonction conversation -----------------
def log_conversation(ctx):
    conv = ctx.proc.userdata.get("conversation_history", [])
    logger.info("===== Conversation =====")
    for turn in conv:
        if "question" in turn:
            logger.info("🤖 AI: %s", turn["question"])
        elif "answer" in turn:
            logger.info("💬 Patient: %s", turn["answer"])
    logger.info("========================")
    sys.stdout.flush()  # flush pour affichage immédiat

# ----------------- Rapport -----------------
@function_tool
async def generate_diagnostic_report(context: JobContext):
    profile = context.proc.userdata.get("patient_profile", {})
    conversation_history = context.proc.userdata.get("conversation_history", [])
    session_id = context.room.name.replace("session_", "")

    logger.info("⚙️ Generating report for patient: %s", profile.get("name", "Unknown"))

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
        logger.warning("⚠️ AI response invalid or empty, using fallback. Error: %s", e)
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

    backend_url = "http://localhost:5000/api/reports"
    async with aiohttp.ClientSession() as session:
        try:
            logger.info("💬 Sending report to backend at %s", backend_url)
            async with session.post(backend_url, json=report) as resp:
                if resp.status in [200, 201]:
                    data = await resp.json()
                    logger.info("✅ Report saved successfully: %s", data)
                else:
                    logger.error("❌ Error saving report: %s", await resp.text())
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

# ----------------- Entrypoint -----------------
async def entrypoint(ctx: JobContext):
    room_name = ctx.room.name
    server_url = "http://localhost:5001/getProfile"

    # ----------------- Récupération du profil -----------------
    profile = {}
    attempts = 0
    while attempts < 5 and not profile:
        async with aiohttp.ClientSession() as session:
            async with session.get(server_url, params={"room": room_name}) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    profile = data.get("profile", {})
        if not profile:
            logger.warning("Profil vide, retry %d...", attempts + 1)
            await asyncio.sleep(0.5)
            attempts += 1

    full_name = f"{profile.get('user_id', {}).get('name','')} {profile.get('user_id', {}).get('last_name','')}".strip() or "Unknown"
    ctx.proc.userdata["patient_profile"] = {
        "id": profile.get("user_id", {}).get("id", "unknown"),
        "name": full_name,
        "age": profile.get("age"),
        "gender": profile.get("gender"),
        "occupation": profile.get("occupation"),
        "education_level": profile.get("education_level"),
        "marital_status": profile.get("marital_status"),
        "notes": profile.get("notes", ""),
    }

    logger.info("📌 Profile loaded: %s", ctx.proc.userdata["patient_profile"])

    # ----------------- Agent Session -----------------
    session_agent = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.LLM(model="gemini-2.5-flash", temperature=0.7, max_output_tokens=500),
        tts=speechify.TTS(model="simba-english", voice_id="jack"),
        vad=silero.VAD.load(),
        use_tts_aligned_transcript=True,
    )

    # ----------------- Listener transcriptions -----------------
    async def handle_transcription(event):
        text = getattr(event, "text", "")
        is_final = getattr(event, "is_final", True)
        participant = getattr(event, "participant", None)
        
        if not text.strip():
            logger.debug("📝 Empty transcription received")
            return
        
        if is_final:
            ctx.proc.userdata["conversation_history"].append({"answer": text})
            logger.info("💬 Patient (final) | participant=%s: %s", participant, text)
            log_conversation(ctx)
        else:
            logger.info("📝 Patient (partial) | participant=%s: %s", participant, text)

    def handle_audio_chunk(event):
        participant = getattr(event, "participant", None)
        data = getattr(event, "data", b"")
        logger.info("🔹 Audio chunk received | participant=%s | length=%d", participant, len(data))

    session_agent.stt.on("transcription", lambda e: asyncio.create_task(handle_transcription(e)))
    session_agent.stt.on("audio_chunk", handle_audio_chunk)

    # ----------------- Listener LLM -----------------
    def llm_callback(event):
        text = getattr(event, "text", None)
        if text:
            ctx.proc.userdata["conversation_history"].append({"question": text})
            logger.info("🤖 AI: %s", text)
            log_conversation(ctx)
            if "[SESSION_END]" in text.upper() and not ctx.proc.userdata.get("report_generated", False):
                asyncio.create_task(finish_and_report())

    session_agent.llm.on("message", llm_callback)

    # ----------------- Fonction fin et rapport -----------------
    async def finish_and_report():
        try:
            ctx.proc.userdata["report_generated"] = True
            logger.info("💬 Generating report...")
            report = await generate_diagnostic_report(ctx)
            logger.info("✅ Report generated successfully: %s", report.get("session_id"))
            await session_agent.say("The report has been saved. You may now end the call.")
        except Exception as e:
            logger.error("❌ Error during finish_and_report: %s", e)
            await session_agent.say("An error occurred while sending the report. Session finished.")

    # ----------------- Instructions agent -----------------
    profile_info = json.dumps(ctx.proc.userdata["patient_profile"], indent=2)
    instructions = (
        "You are Dr. Mira, a compassionate psychologist conducting a short interview. "
        "You will ask 3-6 short, empathetic questions to understand the patient's mental state. "
        "Keep questions simple and supportive. "
        f"Patient profile:\n{profile_info}\n"
        "At the end, summarize the conversation and prepare a diagnostic report for the doctor. "
        "After the report, ask the patient if everything is ok. "
        "The AI will automatically send '[SESSION_END]' after patient confirms."
    )
    agent = Agent(instructions=instructions)

    # ----------------- Démarrage session -----------------
    await session_agent.start(agent=agent, room=ctx.room)
    await ctx.connect()
    await session_agent.say("Hello, my name is Dr. Mira. I will ask you a few quick questions about how you feel.")
    logger.info("💬 Initial message sent to patient")

# ----------------- Main -----------------
if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
