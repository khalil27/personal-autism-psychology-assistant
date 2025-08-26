import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { App } from '../../../components/LiveKit/App';
import { getAppConfig } from '../../../lib/utils';
import type { AppConfig } from '../../../lib/types';

import { sessionsAPI } from '../../../services/api'; // à adapter selon ton API

const SessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const headers = new Headers(); // tu peux ajouter tes headers si besoin
        const config = await getAppConfig(headers);
        setAppConfig(config);
      } catch (err) {
        console.error('Failed to load app config:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleJoinSession = async () => {
    if (!sessionId) return;
    try {
      const res = await sessionsAPI.join(sessionId); 
      const { room_name, join_token, server_url } = res;

      // Redirige vers ta page LiveKit
      window.location.href = `/livekit-room?room=${encodeURIComponent(
        room_name
      )}&token=${encodeURIComponent(join_token)}&server=${encodeURIComponent(server_url)}`;
    } catch (error) {
      console.error('Failed to join session:', error);
      alert('Impossible de rejoindre la session pour le moment.');
    }
  };

  if (loading || !appConfig) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{appConfig.pageTitle}</h1>
      <p>{appConfig.pageDescription}</p>
      <button onClick={handleJoinSession}>Join Session</button>

      {/* Composant LiveKit */}
      <App appConfig={appConfig} />
    </div>
  );
};

export default SessionPage;
