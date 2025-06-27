'use client';

interface TopWastedIngredient {
  id: string;
  name: string;
  count: number;
  cost: number;
}

interface CommonReason {
  reason: string;
  count: number;
}

interface WasteStatsProps {
  topWastedIngredients: TopWastedIngredient[];
  commonReasons: CommonReason[];
}

export default function WasteStats({ topWastedIngredients, commonReasons }: WasteStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Top Wasted Ingredients */}
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Top Wasted Ingredients</h2>
        
        {topWastedIngredients.length === 0 ? (
          <p className="text-muted-foreground">No waste data available yet.</p>
        ) : (
          <div className="space-y-4">
            {topWastedIngredients.slice(0, 5).map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.count} instances</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-destructive">${item.cost.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total cost</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Common Waste Reasons */}
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Common Waste Reasons</h2>
        
        {commonReasons.length === 0 ? (
          <p className="text-muted-foreground">No reason data available yet.</p>
        ) : (
          <div className="space-y-4">
            {commonReasons.slice(0, 5).map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">{item.reason}</span>
                  <span className="text-muted-foreground">{item.count} times</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      index === 0 ? 'bg-destructive' :
                      index === 1 ? 'bg-warning' :
                      'bg-primary'
                    }`} 
                    style={{ 
                      width: `${Math.min(100, (item.count / commonReasons[0].count) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
