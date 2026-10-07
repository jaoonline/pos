import { formatMoney } from "@/lib/money";
import type { ReceiptData } from "@/lib/serialize";

export function ReceiptView({
  receipt,
  shopName,
  shopAddress,
  shopPhone,
  receiptFooter,
  currencySymbol,
}: {
  receipt: ReceiptData;
  shopName: string;
  shopAddress?: string | null;
  shopPhone?: string | null;
  receiptFooter?: string | null;
  currencySymbol: string;
}) {
  const paymentMethodLabel: Record<string, string> = {
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
    CARD: "Card / POS",
  };

  return (
    <div className="receipt-print mx-auto w-full max-w-sm space-y-3 bg-white p-4 font-mono text-sm text-black">
      <div className="text-center">
        <p className="text-base font-bold">{shopName}</p>
        {shopAddress && <p className="text-xs">{shopAddress}</p>}
        {shopPhone && <p className="text-xs">{shopPhone}</p>}
      </div>

      <div className="border-t border-dashed border-black/40" />

      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between">
          <span>Receipt #</span>
          <span>{receipt.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date</span>
          <span>{new Date(receipt.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Served by</span>
          <span>{receipt.salespersonName}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer</span>
          <span>{receipt.customerName}</span>
        </div>
        {receipt.status !== "COMPLETED" && (
          <div className="flex justify-between font-bold uppercase">
            <span>Status</span>
            <span>{receipt.status}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-black/40" />

      <table className="w-full text-xs">
        <thead>
          <tr className="text-left">
            <th className="pb-1 font-normal">Item</th>
            <th className="pb-1 text-right font-normal">Qty</th>
            <th className="pb-1 text-right font-normal">Price</th>
            <th className="pb-1 text-right font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-0.5 pr-2 align-top">
                {item.productName}
                <div className="text-[10px] text-black/60">{item.sku}</div>
              </td>
              <td className="py-0.5 text-right align-top">{item.quantity}</td>
              <td className="py-0.5 text-right align-top">{formatMoney(item.unitPrice, currencySymbol)}</td>
              <td className="py-0.5 text-right align-top">{formatMoney(item.lineTotal, currencySymbol)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black/40" />

      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(receipt.subtotal, currencySymbol)}</span>
        </div>
        {receipt.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatMoney(receipt.discountAmount, currencySymbol)}</span>
          </div>
        )}
        {receipt.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatMoney(receipt.taxAmount, currencySymbol)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold">
          <span>Total</span>
          <span>{formatMoney(receipt.totalAmount, currencySymbol)}</span>
        </div>
      </div>

      {receipt.payment && (
        <>
          <div className="border-t border-dashed border-black/40" />
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span>Payment method</span>
              <span>{paymentMethodLabel[receipt.payment.method] ?? receipt.payment.method}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount paid</span>
              <span>{formatMoney(receipt.payment.amountPaid, currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span>{formatMoney(receipt.payment.changeAmount, currencySymbol)}</span>
            </div>
            {receipt.payment.reference && (
              <div className="flex justify-between">
                <span>Reference</span>
                <span>{receipt.payment.reference}</span>
              </div>
            )}
          </div>
        </>
      )}

      <div className="border-t border-dashed border-black/40" />

      {receiptFooter && <p className="text-center text-xs">{receiptFooter}</p>}
    </div>
  );
}
