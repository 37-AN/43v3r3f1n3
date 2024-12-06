import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTokenizeForm } from "@/hooks/useTokenizeForm";
import { TokenizeForm } from "./TokenizeForm";

interface TokenizeDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TokenizeDeviceDialog({ open, onOpenChange, onSuccess }: TokenizeDeviceDialogProps) {
  const { formData, setFormData, isSubmitting, handleSubmit } = useTokenizeForm(onSuccess);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tokenize Industrial Asset</DialogTitle>
          <DialogDescription>
            Create a new tokenized asset to enable secure data sharing and monetization.
          </DialogDescription>
        </DialogHeader>
        <TokenizeForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}