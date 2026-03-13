import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

interface QuantityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  productName: string;
}

export function QuantityDialog({
  isOpen,
  onClose,
  onConfirm,
  productName,
}: QuantityDialogProps) {
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const numQuantity = Number(quantity);
    if (numQuantity > 0) {
      onConfirm(numQuantity);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enter quantity for {productName}</AlertDialogTitle>
        </AlertDialogHeader>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter quantity"
          autoFocus
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!quantity || Number(quantity) <= 0}>
            Add
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
