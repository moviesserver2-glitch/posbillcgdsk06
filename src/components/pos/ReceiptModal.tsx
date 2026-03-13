
import { Sale } from '@/types/product';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatINR } from '@/lib/currency';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface ReceiptModalProps {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
}

export function ReceiptModal({ sale, open, onClose }: ReceiptModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  if (!sale) return null;

  const totalQuantity = sale.items.length;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = sale.items.map((item) => {
      const itemTotal = item.product.price * item.quantity;
      const afterDiscount = itemTotal - item.discount;
      return `
        <tr>
          <td style="padding: 2px 0; text-align: left; vertical-align: top; word-break: break-word;">${item.product.name}</td>
          <td style="padding: 2px 8px; text-align: center; vertical-align: top;">${item.quantity}</td>
          <td style="padding: 2px 0; text-align: right; vertical-align: top; white-space: nowrap; font-weight: 600;">
            ${formatINR(afterDiscount)}
            ${item.discount > 0 ? `<br><span style="color: #dc2626; font-size: 10px;">(-${formatINR(item.discount)})</span>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${sale.orderId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
              padding: 5px;
              max-width: 40mm;
              margin: 0 auto;
              line-height: 1.4;
              font-weight: bold;
              color: #000;
            }
            .header { text-align: center; margin-bottom: 12px; }
            .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 6px; }
            .header p { font-size: 10px; margin: 2px 0; }
            .divider { border-top: 1px dashed #333; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            .items-header th {
              font-size: 9px;
              text-transform: uppercase;
              padding-bottom: 6px;
              border-bottom: 1px solid #ddd;
            }
            .items-header th:first-child { text-align: left; width: 50%; }
            .items-header th:nth-child(2) { text-align: center; width: 15%; }
            .items-header th:last-child { text-align: right; width: 35%; }
            .totals { margin-top: 6px; }
            .totals td { padding: 3px 0; font-size: 11px; }
            .totals .label { text-align: left; }
            .totals .value { text-align: right; }
            .discount { color: #dc2626; }
            .grand-total td {
              font-size: 13px;
              padding-top: 8px;
              border-top: 2px solid #333;
            }
            .footer { text-align: center; margin-top: 16px; font-size: 10px; }
            .footer p { margin: 3px 0; }
            .footer .thanks { margin-top: 8px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Receipt</h1>
            <p>${format(new Date(sale.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            <p>Order ID: ${sale.orderId}</p>
          </div>

          <div class="divider"></div>

          <table>
            <thead class="items-header">
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="divider"></div>

          <table class="totals">
            <tr>
              <td class="label">Total Items</td>
              <td class="value">${totalQuantity}</td>
            </tr>
            <tr>
              <td class="label">Subtotal</td>
              <td class="value">${formatINR(sale.subtotal)}</td>
            </tr>
            ${sale.discount > 0 ? `
            <tr class="discount">
              <td class="label">Discount</td>
              <td class="value">-${formatINR(sale.discount)}</td>
            </tr>
            ` : ''}
            <tr class="grand-total">
              <td class="label">TOTAL</td>
              <td class="value">${formatINR(sale.total)}</td>
            </tr>
          </table>

          <div class="divider"></div>

          <div class="footer">
            <p>Payment: ${sale.paymentMethod.toUpperCase()}</p>
            <p class="thanks">Thank you for your purchase!</p>
            <p>Visit Again</p>
            <p style="margin-top: 8px;">- - - - - - - - - - - - - - - -</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSendWhatsApp = () => {
    if (!sale) return;

    const itemsText = sale.items.map(item => {
      const itemTotal = item.product.price * item.quantity;
      const afterDiscount = itemTotal - item.discount;
      let text = `${item.product.name} (x${item.quantity}) - ${formatINR(afterDiscount)}`;
      if (item.discount > 0) {
        text += ` (Discount: -${formatINR(item.discount)})`;
      }
      return text;
    }).join('\n');

    const message = `
*Receipt*
Order ID: ${sale.orderId}
Date: ${format(new Date(sale.createdAt), 'dd MMM yyyy, HH:mm')}

*Items:*
${itemsText}

*------------------------*
Total Items: ${totalQuantity}
Subtotal: ${formatINR(sale.subtotal)}
${sale.discount > 0 ? `Discount: -${formatINR(sale.discount)}` : ''}
*TOTAL: ${formatINR(sale.total)}*

Payment: ${sale.paymentMethod.toUpperCase()}

_Thank you for your purchase!_
_Visit Again_
    `;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            Receipt
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div id="receipt-content" className="bg-card p-4 mx-4 mb-4 rounded-lg border border-border font-mono text-xs">
          {/* Header */}
          <div className="text-center mb-3">
            <h3 className="font-bold text-lg">Receipt</h3>
            <p className="text-[10px] text-muted-foreground mt-1">
              {format(new Date(sale.createdAt), 'dd MMM yyyy, HH:mm')}
            </p>
            <p className="text-xs font-semibold mt-1">
              Order ID: {sale.orderId}
            </p>
          </div>

          <div className="border-t border-dashed border-border my-3" />

          {/* Items Header */}
          <div className="flex text-[10px] text-muted-foreground font-semibold mb-2 pb-2 border-b border-border">
            <span className="flex-1">Item</span>
            <span className="w-10 text-center">Qty</span>
            <span className="w-16 text-right">Amount</span>
          </div>

          {/* Items */}
          <div className="space-y-1">
            {sale.items.map((item, index) => {
              const itemTotal = item.product.price * item.quantity;
              return (
                <div key={index} className="flex items-start text-[11px]">
                  <span className="flex-1 pr-2">
                    {item.product.name}
                  </span>
                  <span className="w-10 text-center font-medium">
                    {item.quantity}
                  </span>
                  <span className="w-16 text-right">
                    <span className="font-semibold">{formatINR(itemTotal - item.discount)}</span>
                    {item.discount > 0 && (
                      <span className="block text-destructive text-[9px]">
                        (-{formatINR(item.discount)})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-border my-3" />

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium">{totalQuantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatINR(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span className="font-medium">-{formatINR(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-2 border-t-2 border-border">
              <span>TOTAL</span>
              <span className="text-primary">{formatINR(sale.total)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border my-3" />

          {/* Footer */}
          <div className="text-center text-[10px] text-muted-foreground space-y-1">
            <p>Payment: {sale.paymentMethod.toUpperCase()}</p>
            <p className="pt-1 font-medium">Thank you for your purchase!</p>
            <p>Visit Again</p>
            <p className="pt-1">- - - - - - - - - - - - - - - -</p>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-2">
          <div className="flex gap-2">
            <Input
              type="tel"
              placeholder="WhatsApp Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <Button onClick={handleSendWhatsApp} disabled={!phoneNumber}>
              Send
            </Button>
          </div>
          <Button onClick={handlePrint} className="w-full gap-2">
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
