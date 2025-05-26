"use client";

import React from 'react';
import { OnlineEngineEvents } from '@/services/GameService';
import { useGame } from '@/context/GameContext';

export const ServerStatusModal = () => {
  const { online } = useGame();
  const [status, setStatus] = React.useState({
    isConnected: false,
    showModal: true
  });

  React.useEffect(() => {
    const handleStatus = (newStatus: { isConnected: boolean; showModal: boolean }) => {
      setStatus(newStatus);
    };

    online?.on(OnlineEngineEvents.CONNECTION_STATUS, handleStatus);
    return () => {
      online?.off(OnlineEngineEvents.CONNECTION_STATUS, handleStatus);
    };
  }, [online]);

  if (!status.showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          {status.isConnected ? 'متصل بالخادم' : 'جاري الاتصال بالخادم'}
        </h2>
        {!status.isConnected && (
          <p className="text-gray-600">
            يرجى الانتظار حتى يتم الاتصال بالخادم...
          </p>
        )}
      </div>
    </div>
  );
};