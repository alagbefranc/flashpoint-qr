'use client';

import { useState } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Modal } from '@/components/ui/Modal';

export default function AiSummaryPage() {
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');

  const handleViewDetails = (insight: string) => {
    setSelectedInsight(insight);
    setIsDetailsPanelOpen(true);
  };

  const handleAction = (type: string) => {
    setActionType(type);
    setIsActionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-gray-500 mt-1">
            Data-driven recommendations and analysis for your business
          </p>
        </div>
        <div>
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => handleAction('refresh')}
          >
            Refresh Insights
          </button>
        </div>
      </div>

      {/* Top Insights */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 text-card-foreground">Top Insights</h2>
        <div className="space-y-4">
          <div 
            className="bg-card border border-border rounded-md p-4 cursor-pointer hover:bg-accent"
            onClick={() => handleViewDetails('menu-optimization')}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-primary">Menu Optimization</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">High Impact</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on sales patterns, we recommend highlighting your pasta dishes more prominently 
              and potentially reducing prices on appetizers during weekday evenings.
            </p>
          </div>

          <div 
            className="bg-card border border-border rounded-md p-4 cursor-pointer hover:bg-accent"
            onClick={() => handleViewDetails('staffing-recommendation')}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-primary">Staffing Recommendation</h3>
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">Medium Impact</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Consider adding 1-2 additional staff on Friday evenings. Historical data shows 
              longer wait times during this period which may impact customer satisfaction.
            </p>
          </div>
        </div>
      </div>

      {/* Sales Forecast */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 text-card-foreground">Sales Forecast</h2>
        <div 
          className="bg-card border border-border rounded-md p-4 cursor-pointer hover:bg-accent"
          onClick={() => handleViewDetails('sales-forecast')}
        >
          <p className="text-sm text-muted-foreground">Next 7-Day Sales Forecast</p>
          <div className="h-40 bg-muted/20 rounded my-3 flex items-center justify-center">
            <p className="text-muted-foreground">Chart placeholder - Would use a real chart library</p>
          </div>
          <p className="text-sm">
            <span className="font-medium">Prediction:</span> 12% increase in sales next week compared to previous week, 
            with peak expected on Saturday evening.
          </p>
        </div>
      </div>

      {/* Customer Insights */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 text-card-foreground">Customer Insights</h2>
        <div 
          className="bg-card border border-border rounded-md p-4 cursor-pointer hover:bg-accent"
          onClick={() => handleViewDetails('customer-feedback')}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-primary">Sentiment Analysis</h3>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Positive Trend</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Customer reviews have shown a 15% increase in positive sentiment over the last month. 
            Key positive mentions: food quality, ambiance, friendly staff.
          </p>
        </div>
      </div>

      {/* Insight Details Slide Panel */}
      <SlidePanel
        isOpen={isDetailsPanelOpen}
        onClose={() => setIsDetailsPanelOpen(false)}
        title={selectedInsight ? `${selectedInsight.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}` : 'Insight Details'}
        width="lg"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This is a placeholder for detailed AI insights about {selectedInsight}. 
            In a real implementation, this would show detailed analysis, charts, and recommendations.
          </p>
          
          {/* Placeholder for detailed information */}
          <div className="h-64 bg-muted/20 rounded flex items-center justify-center">
            <p className="text-muted-foreground">Detailed analysis for {selectedInsight} would appear here</p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Recommendations</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Sample recommendation 1 related to {selectedInsight}</li>
              <li>Sample recommendation 2 related to {selectedInsight}</li>
              <li>Sample recommendation 3 related to {selectedInsight}</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setIsDetailsPanelOpen(false);
                handleAction('implement');
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Implement Recommendations
            </button>
          </div>
        </div>
      </SlidePanel>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={actionType === 'refresh' ? "Refresh AI Insights" : "Implement Recommendations"}
        size="sm"
        footer={
          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => setIsActionModalOpen(false)}
              className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsActionModalOpen(false);
                // In a real app, this would trigger the action
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {actionType === 'refresh' ? "Refresh Now" : "Confirm Implementation"}
            </button>
          </div>
        }
      >
        <div className="py-2">
          {actionType === 'refresh' ? (
            <p>
              This will analyze your latest business data and generate new AI insights. 
              This process may take a few minutes. Would you like to continue?
            </p>
          ) : (
            <p>
              You're about to implement the recommended changes for {selectedInsight}. 
              This will affect your restaurant operations. Would you like to proceed?
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
