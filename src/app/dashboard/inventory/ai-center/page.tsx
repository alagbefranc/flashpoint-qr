'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useChat } from 'ai/react';
import { useAuth } from '@/lib/context/AuthContext';
import { Sparkles, RefreshCcw, BarChart3, DollarSign, Recycle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ReorderForecast from '@/components/inventory/ai-center/ReorderForecast';
import CostOptimizer from '@/components/inventory/ai-center/CostOptimizer';
import WasteReductionTips from '@/components/inventory/ai-center/WasteReductionTips';
import InventoryReports from '@/components/inventory/ai-center/InventoryReports';

export default function AICenter() {
  const { user, restaurant, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('reorder');
  
  // If auth is still loading, show a loading spinner
  if (authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI-Powered Inventory Center
          </h1>
          <p className="text-muted-foreground">
            Smart insights and recommendations for your restaurant inventory
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>
            AI-powered tools to help you optimize your inventory management. Select a tool below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <TabsTrigger value="reorder" className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                <span>Reorder Forecast</span>
              </TabsTrigger>
              <TabsTrigger value="cost" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Cost Optimizer</span>
              </TabsTrigger>
              <TabsTrigger value="waste" className="flex items-center gap-2">
                <Recycle className="h-4 w-4" />
                <span>Waste Reduction</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reorder" className="mt-4">
              <ReorderForecast restaurant={restaurant} />
            </TabsContent>
            
            <TabsContent value="cost" className="mt-4">
              <CostOptimizer restaurant={restaurant} />
            </TabsContent>
            
            <TabsContent value="waste" className="mt-4">
              <WasteReductionTips restaurant={restaurant} />
            </TabsContent>

            <TabsContent value="reports" className="mt-4">
              <InventoryReports restaurant={restaurant} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
