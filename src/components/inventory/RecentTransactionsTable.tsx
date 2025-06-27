'use client';

interface StockTransaction {
  id?: string;
  ingredientId: string;
  ingredientName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: any;
  createdBy: string;
  createdByName: string;
}

interface RecentTransactionsTableProps {
  transactions: StockTransaction[];
}

export default function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date);
    } catch (err) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Stock Transactions</h2>
        <span className="text-sm text-muted-foreground">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-sm">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Item</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Quantity</th>
              <th className="text-left p-3">Reason</th>
              <th className="text-left p-3">Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No transactions found. Add stock adjustments to see them here.
                </td>
              </tr>
            ) : (
              transactions.map(transaction => (
                <tr 
                  key={transaction.id} 
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <td className="p-3">{formatDate(transaction.date)}</td>
                  <td className="p-3 font-medium">{transaction.ingredientName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'in' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-destructive/20 text-destructive'
                    }`}>
                      {transaction.type === 'in' ? 'Stock In' : 'Stock Out'}
                    </span>
                  </td>
                  <td className="p-3">{transaction.quantity}</td>
                  <td className="p-3">{transaction.reason}</td>
                  <td className="p-3 text-muted-foreground text-sm">{transaction.createdByName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
