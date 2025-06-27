'use client';

import { useState } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';

export default function QuickStatsPage() {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  const handleViewDetails = (metric: string) => {
    setSelectedMetric(metric);
    setIsDetailsPanelOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quick Stats</h1>
          <p className="text-gray-500 mt-1">
            Key performance indicators and metrics for your restaurant
          </p>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <select className="border rounded-md p-2 bg-background text-sm">
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 text-card-foreground">Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="bg-card border border-border rounded-md p-4 cursor-pointer hover:bg-accent"
            onClick={() => handleViewDetails('total-sales')}
          >
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-semibold mt-1">$1,234.56</p>
            <p className="text-xs text-green-600 mt-1">↑ 8.5% from previous period</p>
          </div>
          
          <div 
            className="bg-card border border-border rounded-md p-4 cursor-pointer hover:bg-accent"
            onClick={() => handleViewDetails('average-order')}
          >
            <p className="text-sm text-muted-foreground">Average Order Value</p>
            <p className="text-2xl font-semibold mt-1">$24.68</p>
            <p className="text-xs text-red-600 mt-1">↓ 2.3% from previous period</p>
          </div>
          
          <div 
            className="bg-card border border-border rounded-md p-4 cursor-pointer hover:bg-accent"
            onClick={() => handleViewDetails('order-count')}
          >
            <p className="text-sm text-muted-foreground">Order Count</p>
            <p className="text-2xl font-semibold mt-1">50</p>
            <p className="text-xs text-green-600 mt-1">↑ 12% from previous period</p>
          </div>
        </div>
      </div>

      {/* Operational Stats */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 text-card-foreground">Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="bg-card border border-border rounded-md p-4 cursor-pointer hover:bg-accent"
            onClick={() => handleViewDetails('table-turnover')}
          >
            <p className="text-sm text-muted-foreground">Table Turnover Rate</p>
            <p className="text-2xl font-semibold mt-1">3.2x</p>
            <p className="text-xs text-green-600 mt-1">↑ 0.5x from previous period</p>
          </div>
          
          <div 
            className="bg-card border border-border rounded-md p-4 cursor-pointer hover:bg-accent"
            onClick={() => handleViewDetails('avg-prep-time')}
          >
            <p className="text-sm text-muted-foreground">Average Prep Time</p>
            <p className="text-2xl font-semibold mt-1">14.5 min</p>
            <p className="text-xs text-green-600 mt-1">↓ 2 min from previous period</p>
          </div>
          
          <div 
            className="bg-card border border-border rounded-md p-4 cursor-pointer hover:bg-accent"
            onClick={() => handleViewDetails('peak-hours')}
          >
            <p className="text-sm text-muted-foreground">Peak Hours</p>
            <p className="text-xl font-semibold mt-1">12-2PM, 6-8PM</p>
            <p className="text-xs text-muted-foreground mt-1">Based on order volume</p>
          </div>
        </div>
      </div>

      {/* Chart placeholder - for a real implementation, use a charting library */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 text-card-foreground">Sales Trend</h2>
        <div className="h-64 bg-muted rounded flex items-center justify-center">
          <p className="text-muted-foreground">Chart placeholder - Would use a real chart library</p>
        </div>
      </div>

      {/* Metric Details Slide Panel */}
      <SlidePanel
        isOpen={isDetailsPanelOpen}
        onClose={() => setIsDetailsPanelOpen(false)}
        title={selectedMetric ? `${selectedMetric.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Details` : 'Metric Details'}
        width="lg"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This is a placeholder for detailed {selectedMetric} metrics. In a real implementation, 
            this would show detailed charts, comparisons, and breakdowns of the selected metric.
          </p>
          
          {/* Placeholder for detailed chart */}
          <div className="h-64 bg-muted/20 rounded flex items-center justify-center">
            <p className="text-muted-foreground">Detailed chart for {selectedMetric} would appear here</p>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}
