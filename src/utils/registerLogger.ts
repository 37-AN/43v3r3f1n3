type RegisterOperation = 'add' | 'delete' | 'write' | 'read';

export interface RegisterLogEntry {
  operation: RegisterOperation;
  address: number;
  value?: number;
  register_type?: string;
  timestamp: string;
  deviceId?: string;
}

export const logRegisterOperation = (entry: RegisterLogEntry) => {
  const logMessage = `Register ${entry.operation.toUpperCase()}: Address ${entry.address}${
    entry.value !== undefined ? `, Value: ${entry.value}` : ''
  }${entry.register_type ? `, Type: ${entry.register_type}` : ''}${
    entry.deviceId ? `, Device: ${entry.deviceId}` : ''
  }`;
  
  console.log(`[${new Date(entry.timestamp).toLocaleString()}] ${logMessage}`);
  return logMessage;
};