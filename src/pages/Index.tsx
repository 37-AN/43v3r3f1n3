import React from 'react';
import { PLCData } from '@/utils/plcData';

interface IndexProps {
  plcData: PLCData | null;
  connectionStatus: { [key: string]: boolean };
}

const Index: React.FC<IndexProps> = ({ plcData, connectionStatus }) => {
  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Connection Status:</h2>
      <ul>
        {Object.entries(connectionStatus).map(([deviceId, status]) => (
          <li key={deviceId}>
            Device {deviceId}: {status ? 'Connected' : 'Disconnected'}
          </li>
        ))}
      </ul>
      <h2>PLC Data:</h2>
      {plcData ? (
        <pre>{JSON.stringify(plcData, null, 2)}</pre>
      ) : (
        <p>Loading PLC data...</p>
      )}
    </div>
  );
};

export default Index;

