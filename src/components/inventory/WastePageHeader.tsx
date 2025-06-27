'use client';

interface WastePageHeaderProps {
  onAddWasteClick: () => void;
  totalWasteItems: number;
  totalWasteCost: number;
}

export default function WastePageHeader({ 
  onAddWasteClick, 
  totalWasteItems, 
  totalWasteCost 
}: WastePageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Waste & Spoilage Log</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage ingredient waste and spoilage
          </p>
        </div>
        
        <button
          onClick={onAddWasteClick}
          className="btn btn-primary flex items-center whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Log Waste/Spoilage
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground">Items Logged</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-2xl font-bold mt-2">{totalWasteItems}</p>
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground">Total Cost</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold mt-2">${totalWasteCost.toFixed(2)}</p>
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground">Top Reason</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-2">
            <p className="text-xl font-medium">Expired</p>
            <p className="text-sm text-muted-foreground">Most common reason for waste</p>
          </div>
        </div>
      </div>
    </div>
  );
}
