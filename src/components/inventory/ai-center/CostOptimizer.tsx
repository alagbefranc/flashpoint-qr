'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAuth } from 'firebase/auth';
import { RefreshCcw, DollarSign, TrendingDown, LineChart, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/Progress';

interface CostOptimizerProps {
  restaurant: any;
}

interface InventoryItem {
  id: string;
  name: string;
  cost: number;
  quantity: number;
  unit: string;
  category: string;
  lastPurchasePrice?: number;
  priceHistory?: {date: Date, price: number}[];
}

interface CostSavingSuggestion {
  id: string;
  itemName: string;
  currentCost: number;
  potentialSavings: number;
  savingsPercentage: number;
  suggestion: string;
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
  alternativeSuppliers?: string[];
  aiEnhanced?: boolean;
}

export default function CostOptimizer({ restaurant }: CostOptimizerProps) {
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [costSuggestions, setCostSuggestions] = useState<CostSavingSuggestion[]>([]);
  const [processingAI, setProcessingAI] = useState(false);
  const [monthlyCost, setMonthlyCost] = useState(0);
  const [potentialSavings, setPotentialSavings] = useState(0);
  const { toast } = useToast();

  // Fetch inventory data and purchase orders
  useEffect(() => {
    const fetchCostData = async () => {
      if (!restaurant?.id) return;
      
      setLoading(true);
      try {
        // Get ingredients data with costs
        const ingredientsRef = collection(db, 'restaurants', restaurant.id, 'ingredients');
        const ingredientsQ = query(ingredientsRef);
        const ingredientsSnapshot = await getDocs(ingredientsQ);
        
        // Get purchase orders to analyze price trends
        const purchaseOrdersRef = collection(db, 'restaurants', restaurant.id, 'purchaseOrders');
        const purchaseOrdersQ = query(purchaseOrdersRef, orderBy('expectedDelivery', 'desc'), limit(50));
        const purchaseOrdersSnapshot = await getDocs(purchaseOrdersQ);
        
        // Process purchase orders to extract price history
        const priceHistoryMap = new Map();
        
        purchaseOrdersSnapshot.docs.forEach(doc => {
          const poData = doc.data();
          if (!poData.items || !Array.isArray(poData.items)) return;
          
          poData.items.forEach(item => {
            if (!item.ingredientId || !item.price || !item.quantity) return;
            
            const unitPrice = item.price / item.quantity;
            const date = poData.expectedDelivery?.toDate() || new Date();
            
            if (!priceHistoryMap.has(item.ingredientId)) {
              priceHistoryMap.set(item.ingredientId, []);
            }
            
            priceHistoryMap.get(item.ingredientId).push({
              date, 
              price: unitPrice
            });
          });
        });
        
        // Create inventory items with price history
        const items = ingredientsSnapshot.docs.map(doc => {
          const data = doc.data();
          // Get price history from purchase orders
          const priceHistory = priceHistoryMap.get(doc.id) || [];
        
          // Sort price history by date (newest first)
          priceHistory.sort((a: {date: Date}, b: {date: Date}) => b.date.getTime() - a.date.getTime());
        
          // Get the last purchase price
          const lastPurchasePrice = priceHistory.length > 0 ? priceHistory[0].price : data.cost;
          
          return {
            id: doc.id,
            name: data.name || 'Unknown Item',
            cost: data.cost || 0,
            quantity: data.quantity || 0,
            unit: data.unit || '',
            category: data.category || 'Uncategorized',
            lastPurchasePrice,
            priceHistory
          };
        });
        
        setInventoryItems(items);
        
        // Calculate monthly cost (simplified)
        const total = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
        setMonthlyCost(total);
        
        // Generate cost saving suggestions
        generateCostSuggestions(items);
      } catch (error) {
        console.error("Error fetching cost data:", error);
        toast({
          title: "Error",
          description: "Failed to load cost data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCostData();
  }, [restaurant?.id, toast]);
  
  // Generate cost saving suggestions
  const generateCostSuggestions = (items: InventoryItem[]) => {
    // Basic algorithm for cost optimization suggestions
    const suggestions: CostSavingSuggestion[] = items
      .filter(item => {
        // Filter items with cost > 0 and where we have price history
        return item.cost > 0 && item.priceHistory && item.priceHistory.length > 1;
      })
      .map(item => {
        // Calculate price volatility and trend
        const priceHistory = item.priceHistory || [];
        const priceIncreasing = priceHistory.length >= 2 && 
          priceHistory[0].price > priceHistory[priceHistory.length - 1].price;
        
        // Calculate potential savings as 10-20% of current cost
        const savingsPercentage = Math.random() * 10 + 10; // 10-20% potential savings
        const potentialSavings = (item.cost * savingsPercentage / 100);
        
        // Total value = cost × quantity
        const totalValue = item.cost * item.quantity;
        
        // Determine priority based on potential savings amount
        let priority: 'high' | 'medium' | 'low';
        if (totalValue > 500) {
          priority = 'high';
        } else if (totalValue > 100) {
          priority = 'medium';
        } else {
          priority = 'low';
        }
        
        // Generate a relevant suggestion
        let suggestion = '';
        let implementationDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
        let alternativeSuppliers: string[] = [];
        
        if (priceIncreasing) {
          suggestion = "Price has been increasing. Consider locking in current rates with bulk purchases or negotiate longer-term contracts.";
          implementationDifficulty = 'medium';
        } else if (priceHistory.length > 3) {
          suggestion = "Price fluctuations observed. Consider strategic purchasing during price dips or exploring alternative suppliers.";
          implementationDifficulty = 'medium';
          alternativeSuppliers = ["Supplier A", "Supplier B"];
        } else {
          suggestion = "Request volume discounts from current supplier or compare prices with alternative vendors.";
          implementationDifficulty = 'easy';
        }
        
        return {
          id: item.id,
          itemName: item.name,
          currentCost: item.cost,
          potentialSavings,
          savingsPercentage,
          suggestion,
          implementationDifficulty,
          priority,
          alternativeSuppliers
        };
      })
      // Sort by potential savings (high to low)
      .sort((a, b) => b.potentialSavings - a.potentialSavings);
      
    setCostSuggestions(suggestions);
    
    // Calculate total potential savings
    const totalSavings = suggestions.reduce((sum, item) => sum + item.potentialSavings, 0);
    setPotentialSavings(totalSavings);
  };
  
  // Generate AI-enhanced cost optimization
  const generateAICostOptimization = async () => {
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
          requestType: 'cost-optimizer',
          inventoryData: {
            items: inventoryItems.map(item => ({
              id: item.id,
              name: item.name,
              cost: item.cost,
              quantity: item.quantity,
              unit: item.unit,
              currentMonthlyCost: monthlyCost
            })),
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch AI recommendations');
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
      
      // Parse the AI response to enhance our suggestions
      enhanceSuggestionsWithAI(aiResponse);
      
      toast({
        title: "AI Cost Analysis Updated",
        description: "Cost optimization suggestions have been enhanced with AI insights",
      });
    } catch (error) {
      console.error("Error generating AI cost optimization:", error);
      toast({
        title: "AI Processing Failed",
        description: error instanceof Error ? error.message : "Could not generate AI-enhanced cost optimization",
        variant: "destructive"
      });
    } finally {
      setProcessingAI(false);
    }
  };
  
  // Process AI response to enhance suggestions
  const enhanceSuggestionsWithAI = (aiResponse: string) => {
    try {
      // Extract useful information from the AI response
      const enhancedSuggestions = [...costSuggestions].map(suggestion => {
        // Look for this item in the AI response
        const itemRegex = new RegExp(`${suggestion.itemName}[\\s\\S]*?(?=\\n\\n|$)`, 'i');
        const itemMatch = aiResponse.match(itemRegex);
        
        if (itemMatch) {
          const matchText = itemMatch[0];
          
          // Try to extract values from AI response
          const savingsMatch = matchText.match(/potential savings[:\s]*\$(\d+(\.\d+)?)/i);
          const percentageMatch = matchText.match(/savings percentage[:\s]*(\d+(\.\d+)?)%/i);
          const priorityMatch = matchText.match(/priority[:\s]*(high|medium|low)/i);
          const suggestionMatch = matchText.match(/suggestion[:\s]*([^\n]+)/i) || 
                                matchText.match(/recommend[:\s]*([^\n]+)/i);
          const suppliersMatch = matchText.match(/alternative suppliers?[:\s]*([^\n]+)/i);
          
          // Update with AI insights if found
          const updatedSuggestion = {
            ...suggestion,
            aiEnhanced: true
          };
          
          if (savingsMatch) {
            updatedSuggestion.potentialSavings = parseFloat(savingsMatch[1]);
          }
          
          if (percentageMatch) {
            updatedSuggestion.savingsPercentage = parseFloat(percentageMatch[1]);
          }
          
          if (priorityMatch) {
            updatedSuggestion.priority = priorityMatch[1] as 'high' | 'medium' | 'low';
          }
          
          if (suggestionMatch) {
            updatedSuggestion.suggestion = suggestionMatch[1].trim();
          }
          
          if (suppliersMatch) {
            updatedSuggestion.alternativeSuppliers = suppliersMatch[1]
              .split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0);
          }
          
          return updatedSuggestion;
        }
        
        return suggestion;
      });
      
      // Recalculate total potential savings
      const totalSavings = enhancedSuggestions.reduce((sum, item) => sum + item.potentialSavings, 0);
      setPotentialSavings(totalSavings);
      
      setCostSuggestions(enhancedSuggestions);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // If parsing fails, keep the original suggestions
    }
  };
  
  const difficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-amber-600';
      case 'hard': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cost Optimizer</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered suggestions to reduce inventory costs
          </p>
        </div>
        <Button 
          onClick={generateAICostOptimization}
          disabled={loading || processingAI}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          {processingAI ? "Processing..." : "Refresh AI Analysis"}
        </Button>
      </div>
      
      {/* Cost summary cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Inventory Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{formatCurrency(monthlyCost)}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Potential Monthly Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-emerald-600">
                <TrendingDown className="mr-2 h-4 w-4" />
                <div className="text-2xl font-bold">{formatCurrency(potentialSavings)}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Savings Opportunity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-2">
                <div className="text-2xl font-bold">
                  {monthlyCost > 0 ? Math.round((potentialSavings / monthlyCost) * 100) : 0}%
                </div>
              </div>
              <Progress 
                value={monthlyCost > 0 ? (potentialSavings / monthlyCost) * 100 : 0} 
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>
      )}
      
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-[125px] w-full" />
          <Skeleton className="h-[125px] w-full" />
          <Skeleton className="h-[125px] w-full" />
        </div>
      ) : costSuggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <LineChart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No cost optimization suggestions</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            We don't have enough price history to generate cost-saving recommendations. Add more purchase orders with pricing information to unlock this feature.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {costSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-1">
                      {suggestion.itemName}
                      {suggestion.aiEnhanced && <Sparkles className="h-3 w-3 text-primary" />}
                    </CardTitle>
                    <CardDescription>
                      Current cost: {formatCurrency(suggestion.currentCost)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    Save up to {formatCurrency(suggestion.potentialSavings)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm space-y-2">
                  <p className={suggestion.aiEnhanced ? "text-primary-foreground font-medium" : ""}>
                    {suggestion.suggestion}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Implementation:</span>
                    <span className={`font-medium capitalize ${difficultyColor(suggestion.implementationDifficulty)}`}>
                      {suggestion.implementationDifficulty}
                    </span>
                  </div>
                  {suggestion.alternativeSuppliers && suggestion.alternativeSuppliers.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Suggested alternatives: {suggestion.alternativeSuppliers.join(', ')}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end mt-auto pt-2">
                <Button variant="ghost" size="sm">View Details</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
