import os, logging, asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from livekit.agents import NOT_GIVEN, Agent, AgentFalseInterruptionEvent, AgentSession, JobContext, JobProcess, MetricsCollectedEvent, RoomInputOptions, RunContext, WorkerOptions, cli, metrics
from livekit.agents.llm import function_tool
from livekit.plugins import cartesia, deepgram, noise_cancellation, google, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")
logging.basicConfig(level=logging.INFO)
load_dotenv(".env.local")
LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL = os.getenv("LIVEKIT_API_KEY"), os.getenv("LIVEKIT_API_SECRET"), os.getenv("LIVEKIT_URL")
app = FastAPI()

class RoomRequest(BaseModel):
    room_name: str
    identity: str = "assistant_psychologique"

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a psychological assistant AI. Your role is to help patients, ask questions to understand their state, give supportive and empathetic answers, and generate a session report. Speak clearly, concisely, and respectfully.")
    @function_tool
    async def example_tool(self, context: RunContext, input_text: str):
        logger.info(f"Processing input: {input_text}")
        return f"Received: {input_text}"

def prewarm(proc: JobProcess): proc.userdata["vad"] = silero.VAD.load()

@app.post("/startWorker")
async def start_worker(req: RoomRequest):
    room_name, identity = req.room_name, req.identity
    if not room_name: raise HTTPException(status_code=400, detail="Missing room_name")
    asyncio.create_task(run_worker(room_name, identity))
    return {"message": f"Worker starting for room {room_name}", "identity": identity}

async def run_worker(room_name: str, identity: str):
    logger.info(f"Starting Worker for room {room_name} as {identity}")
    async def entrypoint(ctx: JobContext):
        ctx.log_context_fields = {"room": ctx.room.name}
        session = AgentSession(
            llm=google.LLM(model="gemini-2.0-flash-exp", temperature=0.8),
            stt=deepgram.STT(model="nova-3", language="multi"),
            tts=cartesia.TTS(voice="6f84f4b8-58a2-430c-8c79-688dad597532"),
            turn_detection=MultilingualModel(),
            vad=ctx.proc.userdata["vad"],
            preemptive_generation=True
        )
        @session.on("agent_false_interruption")
        def _on_agent_false_interruption(ev: AgentFalseInterruptionEvent):
            logger.info("False positive interruption, resuming...")
            session.generate_reply(instructions=ev.extra_instructions or NOT_GIVEN)
        usage_collector = metrics.UsageCollector()
        @session.on("metrics_collected")
        def _on_metrics_collected(ev: MetricsCollectedEvent):
            metrics.log_metrics(ev.metrics)
            usage_collector.collect(ev.metrics)
        async def log_usage():
            summary = usage_collector.get_summary()
            logger.info(f"Usage summary: {summary}")
        ctx.add_shutdown_callback(log_usage)
        await session.start(agent=Assistant(), room=ctx.room, room_input_options=RoomInputOptions(noise_cancellation=noise_cancellation.BVC()))
        await ctx.connect()
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm, room_name=room_name, identity=identity))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
