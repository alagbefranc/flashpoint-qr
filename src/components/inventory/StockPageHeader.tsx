'use client';

interface StockPageHeaderProps {
  onAddStockClick: () => void;
  totalItems: number;
  lowStockCount: number;
}

export default function StockPageHeader({ onAddStockClick, totalItems, lowStockCount }: StockPageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stock Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage inventory levels and track stock changes
          </p>
        </div>
        
        <button
          onClick={onAddStockClick}
          className="btn btn-primary flex items-center whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Record Stock Change
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground">Total Items</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-2xl font-bold mt-2">{totalItems}</p>
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground">Low Stock Items</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-2xl font-bold mt-2">{lowStockCount}</p>
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground">Stock Health</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${
              lowStockCount === 0 ? 'text-success' :
              lowStockCount < totalItems / 3 ? 'text-warning' :
              'text-destructive'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-2 pt-2 border-t">
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className={`h-2.5 rounded-full ${
                lowStockCount === 0 ? 'bg-success' :
                lowStockCount < totalItems / 3 ? 'bg-warning' :
                'bg-destructive'
              }`} style={{ width: `${Math.max(0, 100 - (lowStockCount / totalItems * 100))}%` }}></div>
            </div>
            <p className="text-sm mt-1 text-muted-foreground">
              {lowStockCount === 0 ? 'Optimal' :
               lowStockCount < totalItems / 3 ? 'Attention needed' :
               'Critical'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
