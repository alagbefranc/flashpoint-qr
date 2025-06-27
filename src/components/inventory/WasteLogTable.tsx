'use client';

interface WasteLogEntry {
  id?: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  reason: string;
  cost: number;
  date: any;
  createdBy: string;
  createdByName: string;
}

interface WasteLogTableProps {
  wasteEntries: WasteLogEntry[];
}

export default function WasteLogTable({ wasteEntries }: WasteLogTableProps) {
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
        hour12: true
      }).format(date);
    } catch (err) {
      return 'Invalid Date';
    }
  };
  
  // Sort entries by date (newest first)
  const sortedEntries = [...wasteEntries].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    
    const dateA = a.date.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
    const dateB = b.date.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
    
    return dateB - dateA;
  });

  return (
    <div className="bg-card rounded-lg border shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Waste & Spoilage Log</h2>
        <span className="text-sm text-muted-foreground">
          {wasteEntries.length} entr{wasteEntries.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-sm">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Ingredient</th>
              <th className="text-left p-3">Quantity</th>
              <th className="text-left p-3">Reason</th>
              <th className="text-left p-3">Cost</th>
              <th className="text-left p-3">Logged By</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No waste or spoilage entries have been logged yet.
                </td>
              </tr>
            ) : (
              sortedEntries.map(entry => (
                <tr key={entry.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3 whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="p-3 font-medium">{entry.ingredientName}</td>
                  <td className="p-3">{entry.quantity}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                      {entry.reason}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-destructive">${entry.cost.toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground text-sm">{entry.createdByName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
