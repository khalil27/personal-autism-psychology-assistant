import logging
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, RoomInputOptions, JobContext, WorkerOptions, cli, metrics, JobProcess
from livekit.agents.llm import function_tool
from livekit.plugins import cartesia, deepgram, google, silero, noise_cancellation ,elevenlabs
import asyncio

logger = logging.getLogger("agent")
logging.basicConfig(level=logging.INFO)  # 🔹 Active l'affichage console
load_dotenv(".env.local")

# ----------------- Agent -----------------
class Assistant(Agent):
    def __init__(self, profile_text: str) -> None:
        super().__init__(
            instructions=(
                "You are Dr. Mira, an empathetic psychological AI assistant.\n"
                "You must introduce yourself first (say your name).\n"
                "Ask only 3 to 6 short and simple questions to understand the patient's situation.\n"
                "After asking these questions, generate a structured diagnostic report automatically.\n\n"
                f"{profile_text}"
            )
        )

# ----------------- Fonction personnalisée pour générer le rapport -----------------
@function_tool
async def generate_diagnostic_report(context: JobContext):
    """
    Cette fonction est appelée après la conversation.
    Elle récupère l'historique des messages et construit un rapport structuré.
    """
    conversation_history = [msg.content for msg in context.history]

    # Récupérer le profil du patient depuis userdata
    profile = context.proc.userdata.get("patient_profile", {})

    # Construire le rapport structuré
    report = {
        "session_id": context.room.name,  # utiliser le nom de la room comme session_id
        "patient_id": profile.get("id", "unknown"),
        "generated_by": "AI_Assistant",
        "status": "draft",
        "version": 1,
        "notified_to_doctor": False,
        "overview": {
            "name": profile.get("name", "N/A"),
            "age": profile.get("age", "N/A"),
            "gender": profile.get("gender", "N/A"),
            "occupation": profile.get("occupation", "N/A"),
            "education_level": profile.get("education_level", "N/A"),
            "marital_status": profile.get("marital_status", "N/A"),
            "session_info": "AI session summary",
            "initial_diagnosis": "Pending",
            "scores": [],
        },
        "narrative": {
            "description": "Résumé de la conversation",
            "symptoms_observed": [],
            "physical_markers": [],
            "behavioral_markers": [],
        },
        "risk_indicators": {},
        "clinical_inference": {
            "primary_diagnosis": "Preliminary assessment",
            "differential_diagnoses": [],
            "recommendations": ["Consultation recommandée"],
        },
        "dialogue": [{"speaker": "AI", "text": msg} for msg in conversation_history],
        "doctor_notes": "",
    }

    # Envoyer le rapport au backend
    import aiohttp
    backend_url = "http://localhost:5001/api/reports"  # endpoint de création du rapport
    async with aiohttp.ClientSession() as session:
        async with session.post(backend_url, json=report) as resp:
            if resp.status == 201:
                data = await resp.json()
                logging.info("📌 Rapport sauvegardé: %s", data)
            else:
                logging.error("❌ Échec de la sauvegarde du rapport: %s", await resp.text())

    return report

# ----------------- Pré-chargement VAD ----------------- 
def prewarm(proc: JobProcess): 
    proc.userdata["vad"] = silero.VAD.load()

# ----------------- Entrypoint de l'agent -----------------
async def entrypoint(ctx: JobContext):
    room_name = ctx.room.name
    profile = {}

    # Requête vers le serveur pour récupérer le profil patient
    import aiohttp
    server_url = "http://localhost:5001/getProfile"
    async with aiohttp.ClientSession() as session:
        async with session.get(server_url, params={"room": room_name}) as resp:
            if resp.status == 200:
                data = await resp.json()
                profile = data.get("profile", {})

    logging.info("📌 Profil reçu: %s", profile)

    # Stocker le profil dans userdata pour le générateur de rapport
    ctx.proc.userdata["patient_profile"] = {
        "id": profile.get("user_id", {}).get("id", "unknown"),
        "name": profile.get("user_id", {}).get("name", "N/A"),
        "last_name": profile.get("user_id", {}).get("last_name", ""),
        "age": profile.get("age", "N/A"),
        "gender": profile.get("gender", "N/A"),
        "occupation": profile.get("occupation", "N/A"),
        "education_level": profile.get("education_level", "N/A"),
        "marital_status": profile.get("marital_status", "N/A"),
        "notes": profile.get("notes", ""),
    }

    # Construire le texte pour l'IA
    profile_text = (
        f"Patient profile:\n"
        f"- Name: {profile.get('user_id', {}).get('name', 'N/A')} {profile.get('user_id', {}).get('last_name', '')}\n"
        f"- Age: {profile.get('age', 'N/A')}\n"
        f"- Gender: {profile.get('gender', 'N/A')}\n"
        f"- Occupation: {profile.get('occupation', 'N/A')}\n"
        f"- Education Level: {profile.get('education_level', 'N/A')}\n"
        f"- Marital Status: {profile.get('marital_status', 'N/A')}\n"
        f"- Notes: {profile.get('notes', '')}\n"
    )

    # Créer la session LiveKit
    session_agent = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.LLM(model="gemini-2.5-flash", temperature=0.7),
        tts=elevenlabs.TTS(
            voice_id="ODq5zmih8GrVes37Dizd",
            model="eleven_multilingual_v2"
        ),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True
    )

    # Collecte des métriques
    usage_collector = metrics.UsageCollector()
    @session_agent.on("metrics_collected")
    def _on_metrics_collected(ev):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logging.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # Démarrer l’assistant
    assistant = Assistant(profile_text)
    await session_agent.start(
        agent=assistant,
        room=ctx.room,
        room_input_options=RoomInputOptions(noise_cancellation=noise_cancellation.BVC())
    )

    await ctx.connect()

    # Message initial
    await session_agent.say("Hello, my name is Dr. Mira. I will ask you a few quick questions about how you feel.")

    # ----------------- Fin de session et génération du rapport -----------------
    async def finish_session():
        # Message final
        await session_agent.say(
            "You can now press the End button to finish the session and return to your dashboard."
        )
        # Générer le rapport
        await generate_diagnostic_report(ctx)

    # Listener pour déclencher la fin quand l'agent devient idle
    session_agent.on("idle", lambda ev: asyncio.create_task(finish_session()))



# ----------------- Lancer le worker -----------------
if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
