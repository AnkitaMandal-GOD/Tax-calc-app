import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface LoadingModalProps {
  isOpen: boolean;
}

export default function LoadingModal({ isOpen }: LoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex items-center space-x-3 py-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <div>
            <p className="text-sm font-medium text-gray-900">Processing with AI...</p>
            <p className="text-xs text-gray-500">Categorizing and analyzing deductibility</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}