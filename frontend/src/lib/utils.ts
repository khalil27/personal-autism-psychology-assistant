import type { AppConfig } from "./types";

export async function getAppConfig(headers?: Headers): Promise<AppConfig> {
  // 🔥 Appelle ton backend pour obtenir un token et la config
  const res = await fetch("http://127.0.0.1:5001/getToken", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: JSON.stringify({
      room: "default-room", // tu peux remplacer par un room dynamique
      identity: "patient-123", // idem, l’utilisateur actuel
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch token: ${res.statusText}`);
  }

  const data = await res.json();

  return {
    livekitUrl: "wss://test-0xsooiuu.livekit.cloud", // pris depuis ton .env backend
    token: data.token, // token JWT renvoyé par Flask
    roomName: "default-room",
    pageTitle: "Session Patient",
    pageDescription: "Bienvenue dans ta session LiveKit",
  };
}

