import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DeviceProtocolSettingsProps {
  protocol: string;
  ipAddress: string;
  port: string;
  slaveId: string;
  rack: string;
  slot: string;
  onProtocolChange: (value: string) => void;
  onIpAddressChange: (value: string) => void;
  onPortChange: (value: string) => void;
  onSlaveIdChange: (value: string) => void;
  onRackChange: (value: string) => void;
  onSlotChange: (value: string) => void;
}

export const DeviceProtocolSettings = ({
  protocol,
  ipAddress,
  port,
  slaveId,
  rack,
  slot,
  onProtocolChange,
  onIpAddressChange,
  onPortChange,
  onSlaveIdChange,
  onRackChange,
  onSlotChange,
}: DeviceProtocolSettingsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="protocol">Protocol</Label>
        <Select value={protocol} onValueChange={onProtocolChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select protocol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modbus">Modbus TCP</SelectItem>
            <SelectItem value="s7">S7 (TIA Portal)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ip_address">IP Address</Label>
        <Input
          id="ip_address"
          value={ipAddress}
          onChange={(e) => onIpAddressChange(e.target.value)}
          placeholder="192.168.1.100"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            type="number"
            value={port}
            onChange={(e) => onPortChange(e.target.value)}
            min="1"
            max="65535"
          />
        </div>
        {protocol === "modbus" ? (
          <div className="space-y-2">
            <Label htmlFor="slave_id">Slave ID</Label>
            <Input
              id="slave_id"
              type="number"
              value={slaveId}
              onChange={(e) => onSlaveIdChange(e.target.value)}
              min="1"
              max="247"
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="rack">Rack</Label>
              <Input
                id="rack"
                type="number"
                value={rack}
                onChange={(e) => onRackChange(e.target.value)}
                min="0"
                max="7"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot">Slot</Label>
              <Input
                id="slot"
                type="number"
                value={slot}
                onChange={(e) => onSlotChange(e.target.value)}
                min="0"
                max="31"
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};