import React from "react";
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';


interface AppProps {
  appConfig: {
    livekitUrl: string;
    token: string;
    roomName: string;
  };
}

export const App: React.FC<AppProps> = ({ appConfig }) => {
  return (
    <LiveKitRoom
      serverUrl={appConfig.livekitUrl}
      token={appConfig.token}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={() => console.log("Disconnected")}
      style={{ height: "100vh", width: "100vw" }}
    >
      <div>
        <h2>Connected to room: {appConfig.roomName}</h2>
        {/* Ici tu peux ajouter les composants LiveKit UI, ex. Participants, Chat */}
      </div>
    </LiveKitRoom>
  );
};
