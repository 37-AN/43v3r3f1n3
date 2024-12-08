import * as nodes7 from 'nodes7';

interface S7Connection {
  client: any;
  connected: boolean;
}

export class S7Communication {
  private connections: Map<string, S7Connection> = new Map();

  async connect(ip: string, rack: number, slot: number): Promise<void> {
    const conn = new nodes7();
    
    return new Promise((resolve, reject) => {
      conn.initiateConnection({
        host: ip, 
        rack: rack, 
        slot: slot
      }, (err: any) => {
        if (err) {
          reject(err);
        } else {
          this.connections.set(ip, { 
            client: conn,
            connected: true 
          });
          resolve();
        }
      });
    });
  }

  async disconnect(ip: string): Promise<void> {
    const conn = this.connections.get(ip);
    if (conn && conn.connected) {
      return new Promise((resolve) => {
        conn.client.dropConnection(() => {
          this.connections.delete(ip);
          resolve();
        });
      });
    }
  }

  async readData(ip: string, variables: { area: string, dbNumber: number, start: number, amount: number, type: string }[]): Promise<any> {
    const conn = this.connections.get(ip);
    if (!conn || !conn.connected) {
      throw new Error('Not connected to PLC');
    }

    const vars: { [key: string]: string } = {};
    variables.forEach((v, i) => {
      vars[`var${i}`] = `${v.area}${v.dbNumber},${v.type}${v.start},${v.amount}`;
    });

    return new Promise((resolve, reject) => {
      conn.client.setTranslationCB((tag: string) => vars[tag]);
      conn.client.addItems(Object.keys(vars));
      
      conn.client.readAllItems((err: any, values: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(values);
        }
      });
    });
  }
}

