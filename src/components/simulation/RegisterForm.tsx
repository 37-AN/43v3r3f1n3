import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegisterFormProps {
  address: string;
  value: string;
  onAddressChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function RegisterForm({
  address,
  value,
  onAddressChange,
  onValueChange,
  onSubmit,
  isLoading
}: RegisterFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Register Address</Label>
        <Input
          id="address"
          type="number"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          min="0"
          max="65535"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">Value</Label>
        <Input
          id="value"
          type="number"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          min="0"
          max="65535"
        />
      </div>
      <Button 
        onClick={onSubmit} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Updating...' : 'Write Register'}
      </Button>
    </div>
  );
}