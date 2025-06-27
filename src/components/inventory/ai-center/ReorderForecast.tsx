'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAuth } from 'firebase/auth';
import { RefreshCcw, AlertTriangle, Info, Sparkles } from 'lucide-react';

interface ReorderForecastProps {
  restaurant: any;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  par: number;  // Par level (minimum level that should be maintained)
  reorderPoint: number;
  category: string;
  lastOrdered?: Date;
  usageRate?: number; // estimated weekly usage
}

interface ReorderSuggestion {
  id: string;
  name: string;
  currentStock: number;
  reorderAmount: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
  daysUntilStockout: number;
  reasoning: string;
  aiEnhanced?: boolean;
}

export default function ReorderForecast({ restaurant }: ReorderForecastProps) {
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [processingAI, setProcessingAI] = useState(false);
  const { toast } = useToast();

  // Automatically fetch data when component mounts
  useEffect(() => {
    if (restaurant?.id) {
      generateAIForecast();
    }
  }, [restaurant?.id]);
  
  // Generate reorder suggestions
  const generateReorderSuggestions = (items: InventoryItem[]) => {
    // Basic algorithm for reorder suggestions
    const suggestions: ReorderSuggestion[] = items
      .filter(item => {
        // Filter items that are below reorder point
        return item.quantity <= item.reorderPoint;
      })
      .map(item => {
        // Calculate days until stockout
        const daysUntilStockout = item.usageRate ? 
          Math.max(0, Math.round((item.quantity / item.usageRate) * 7)) : 
          (item.quantity > 0 ? 14 : 0); // Default if no usage data
          
        // Determine priority
        let priority: 'high' | 'medium' | 'low';
        if (daysUntilStockout <= 2) {
          priority = 'high';
        } else if (daysUntilStockout <= 5) {
          priority = 'medium';
        } else {
          priority = 'low';
        }
        
        // Calculate reorder amount (par level - current quantity)
        const reorderAmount = Math.max(0, item.par - item.quantity);
        
        return {
          id: item.id,
          name: item.name,
          currentStock: item.quantity,
          reorderAmount,
          unit: item.unit,
          priority,
          daysUntilStockout,
          reasoning: daysUntilStockout <= 2 ? 
            "Critically low stock" : 
            daysUntilStockout <= 5 ? 
            "Approaching stockout based on usage patterns" : 
            "Below reorder threshold"
        };
      })
      // Sort by priority (high to low) and then by days until stockout (low to high)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.daysUntilStockout - b.daysUntilStockout;
      });
      
    setReorderSuggestions(suggestions);
  };
  
  // Generate AI-enhanced forecast
  const generateAIForecast = async () => {
    setLoading(true);
    setProcessingAI(true);
    const auth = getAuth();
    
    try {
      // Get the current user's ID token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await user.getIdToken();
      
      // Call our secure API endpoint
      const response = await fetch('/api/ai/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          requestType: 'reorder-forecast'
        })
      });
      
      if (!response.ok) {
        if (response.status === 500) {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Server error processing request');
          } catch (e) {
            throw new Error('Server error: OpenAI API key may be missing');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch AI recommendations');
        }
      }
      
      // Process the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response');
      }
      
      let aiResponse = '';
      
      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode and append the chunk
        const chunk = new TextDecoder().decode(value);
        aiResponse += chunk;
      }
      
      // Generate sample inventory items (will be replaced with actual API data later)
      const sampleInventoryItems: InventoryItem[] = [
        {
          id: 'item1',
          name: 'Tomatoes',
          quantity: 5,
          unit: 'kg',
          par: 20,
          reorderPoint: 10,
          category: 'Produce',
          usageRate: 3.5
        },
        {
          id: 'item2',
          name: 'Chicken Breast',
          quantity: 8,
          unit: 'kg',
          par: 25,
          reorderPoint: 12,
          category: 'Meat',
          usageRate: 5
        },
        {
          id: 'item3',
          name: 'Olive Oil',
          quantity: 4,
          unit: 'bottles',
          par: 10,
          reorderPoint: 5,
          category: 'Pantry',
          usageRate: 1.2
        }
      ];
      
      setInventoryItems(sampleInventoryItems);
      
      // Generate basic reorder suggestions
      generateReorderSuggestions(sampleInventoryItems);
      
      // Then enhance with AI insights
      enhanceSuggestionsWithAI(aiResponse);
      
      toast({
        title: "AI Forecast Updated",
        description: "Reorder suggestions have been enhanced with AI insights",
      });
    } catch (error) {
      console.error("Error generating AI forecast:", error);
      toast({
        title: "AI Processing Failed",
        description: error instanceof Error ? error.message : "Could not generate AI-enhanced forecast",
        variant: "destructive"
      });
    } finally {
      setProcessingAI(false);
      setLoading(false);
    }
  };
  
  // Process AI response to enhance suggestions
  const enhanceSuggestionsWithAI = (aiResponse: string) => {
    try {
      // Extract useful information from the AI response
      // This is a simplified implementation - we'd need more robust parsing in production
      
      // Update our suggestions with AI insights
      const enhancedSuggestions = [...reorderSuggestions].map(suggestion => {
        // Look for this item in the AI response
        const itemRegex = new RegExp(`${suggestion.name}[\\s\\S]*?(?=\\n\\n|$)`, 'i');
        const itemMatch = aiResponse.match(itemRegex);
        
        if (itemMatch) {
          const matchText = itemMatch[0];
          
          // Try to extract values from AI response
          // These regex patterns are simplified examples
          const daysMatch = matchText.match(/days until stockout[:\s]*(\d+)/i);
          const priorityMatch = matchText.match(/priority[:\s]*(high|medium|low)/i);
          const reasoningMatch = matchText.match(/reasoning[:\s]*([^\n]+)/i) || 
                               matchText.match(/because[:\s]*([^\n]+)/i);
          
          // Update with AI insights if found
          return {
            ...suggestion,
            daysUntilStockout: daysMatch ? parseInt(daysMatch[1]) : suggestion.daysUntilStockout,
            priority: priorityMatch ? priorityMatch[1] as 'high' | 'medium' | 'low' : suggestion.priority,
            reasoning: reasoningMatch ? reasoningMatch[1] : suggestion.reasoning,
            aiEnhanced: true
          };
        }
        
        return suggestion;
      });
      
      setReorderSuggestions(enhancedSuggestions);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // If parsing fails, keep the original suggestions
    }
  };
  
  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-amber-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reorder Forecast</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered suggestions for inventory reordering based on usage patterns
          </p>
        </div>
        <Button 
          onClick={generateAIForecast}
          disabled={loading || processingAI}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          {processingAI ? "Processing..." : "Refresh AI Forecast"}
        </Button>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-[125px] w-full" />
          <Skeleton className="h-[125px] w-full" />
          <Skeleton className="h-[125px] w-full" />
        </div>
      ) : reorderSuggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No reorder suggestions</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            All your inventory items are currently above their reorder points. Check back later or adjust your reorder points if needed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reorderSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{suggestion.name}</CardTitle>
                    <CardDescription>
                      Current stock: {suggestion.currentStock} {suggestion.unit}
                    </CardDescription>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${priorityColor(suggestion.priority)}`}>
                    {suggestion.priority === 'high' && <AlertTriangle className="h-4 w-4" />}
                    <span className="capitalize">{suggestion.priority} priority</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-xs mt-2">
                  <span className="inline-flex items-center gap-1">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <span className={suggestion.aiEnhanced ? "text-primary-foreground font-medium" : ""}>{suggestion.reasoning}</span>
                  </span>
                </div>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Suggested order:</span>
                    <span className="font-medium">{suggestion.reorderAmount} {suggestion.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days until stockout:</span>
                    <span className="font-medium">{suggestion.daysUntilStockout}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end mt-auto pt-2">
                <Button variant="ghost" size="sm">Add to Order</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
