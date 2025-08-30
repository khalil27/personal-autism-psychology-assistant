import logging
import json
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, RoomInputOptions, JobContext, WorkerOptions, cli, metrics, JobProcess
from livekit.agents.llm import function_tool
from livekit.plugins import cartesia, deepgram, google, silero, noise_cancellation

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
                "Ask only 3 short and simple questions to understand the patient's situation.\n"
                "After asking these questions, generate a structured diagnostic report automatically.\n\n"
                f"{profile_text}"
            )
        )

# ----------------- Fonction personnalisée pour générer le rapport -----------------
@function_tool
async def generate_diagnostic_report(context: JobContext):
    conversation_history = [msg.content for msg in context.history]
    return {
        "summary": "Short summary of patient condition",
        "symptoms": ["stress", "possible anxiety"],
        "analysis": "Quick analysis based on limited questions",
        "recommendations": ["consultation with psychologist", "daily relaxation exercise"],
        "conversation_history": conversation_history
    }

# ----------------- Pré-chargement VAD -----------------
def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

# ----------------- Entrypoint de l'agent -----------------
async def entrypoint(ctx: JobContext):
    # --- Récupérer le profil patient ---
    profile_str = getattr(ctx.room, "metadata", "{}")
    try:
        profile = json.loads(profile_str)
    except (TypeError, json.JSONDecodeError):
        profile = {}
    
    # 🔹 Affichage console pour vérification
    logger.info("Patient profile received: %s", profile)

    profile_text = (
        f"Patient profile:\n"
        f"- Age: {profile.get('age', 'N/A')}\n"
        f"- Gender: {profile.get('gender', 'N/A')}\n"
        f"- Occupation: {profile.get('occupation', 'N/A')}\n"
        f"- Education Level: {profile.get('education_level', 'N/A')}\n"
        f"- Marital Status: {profile.get('marital_status', 'N/A')}\n"
        f"- Notes: {profile.get('notes', '')}\n"
    )

    # --- Crée la session Agent avec Google LLM ---
    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.LLM(
            model="gemini-2.5-flash",
            temperature=0.7,
        ),
        tts=cartesia.TTS(voice="6f84f4b8-58a2-430c-8c79-688dad597532"),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True
    )

    # --- Collecte de métriques ---
    usage_collector = metrics.UsageCollector()
    @session.on("metrics_collected")
    def _on_metrics_collected(ev):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # --- Démarrage de la session ---
    assistant = Assistant(profile_text)
    await session.start(
        agent=assistant,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # --- Connexion du job ---
    await ctx.connect()

    # --- Message d’ouverture automatique ---
    await session.say("Hello, my name is Dr. Mira. I will ask you a few quick questions about how you feel.")

# ----------------- Lancer le worker -----------------
if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
