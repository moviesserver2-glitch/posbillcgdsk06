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
import { useState, useEffect, useRef } from 'react';

interface QuantityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, amount?: number) => void;
  productName: string;
}

export function QuantityDialog({
  isOpen,
  onClose,
  onConfirm,
  productName,
}: QuantityDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setAmount('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (amount !== '' && Number(amount) < 0) {
        return;
    }
    const numQuantity = Number(quantity) || 1;
    const numAmount = amount === '' ? undefined : Number(amount);
    onConfirm(numQuantity, numAmount);
  };

  const handleQuantityKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      amountInputRef.current?.focus();
    }
  };

  const handleAmountKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enter quantity and amount for {productName}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-4">
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyPress={handleQuantityKeyPress}
            placeholder="Quantity (default: 1)"
            autoFocus
          />
          <Input
            ref={amountInputRef}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyPress={handleAmountKeyPress}
            placeholder="Amount (optional)"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={amount !== '' && Number(amount) < 0}>
            Add
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
