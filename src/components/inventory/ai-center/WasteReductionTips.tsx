'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { collection, query, getDocs, orderBy, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAuth } from 'firebase/auth';
import { RefreshCcw, Recycle, Check, Lightbulb, Sparkles } from 'lucide-react';

interface WasteReductionTipsProps {
  restaurant: any;
}

interface WasteTip {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'storage' | 'ordering' | 'preparation' | 'training' | 'menu design';
  estimatedSavings: number;
  implemented: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  aiEnhanced?: boolean;
}

// Define a type for Firestore document data
interface FirestoreWasteItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  reason: string;
  timestamp: any; // Firestore timestamp
  cost: number;
  [key: string]: any; // Allow for any other properties
}

interface WasteData {
  wasteItems: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    reason: string;
    timestamp: any; // Firestore timestamp
    cost: number;
  }>;
  totalWaste: number;
}

interface FirestoreIngredient {
  id: string;
  name: string;
  category: string;
  cost: number;
  supplier: string;
  stock: number;
  unit: string;
  minimumStock: number;
  expiryDate?: any; // Firestore timestamp
  [key: string]: any; // Allow for any other properties
}

interface IngredientData {
  id: string;
  name: string;
  category: string;
  cost: number;
  supplier: string;
  stock: number;
  unit: string;
  minimumStock: number;
  expiryDate?: any; // Firestore timestamp
}

export default function WasteReductionTips({ restaurant }: WasteReductionTipsProps) {
  const [loading, setLoading] = useState(true);
  const [wasteTips, setWasteTips] = useState<WasteTip[]>([]);
  const [processingAI, setProcessingAI] = useState(false);
  const [wastePercentage, setWastePercentage] = useState(0);
  const [implementedTips, setImplementedTips] = useState(0);
  const { toast } = useToast();

  // Fetch waste data and generate tips
  useEffect(() => {
    const fetchWasteData = async () => {
      if (!restaurant?.id) return;
      
      setLoading(true);
      try {
        // Get waste logs
        const wasteRef = collection(db, 'restaurants', restaurant.id, 'waste');
        const q = query(wasteRef, orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        
        // Get ingredients data for reference
        const ingredientsRef = collection(db, 'restaurants', restaurant.id, 'ingredients');
        const ingredientsSnapshot = await getDocs(ingredientsRef);
        
        // Process waste data with explicit typing
        const rawWasteData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id
          } as FirestoreWasteItem;
        });
        
        // Transform the raw data into the expected WasteData structure
        const wasteData: WasteData = {
          wasteItems: rawWasteData.map(item => ({
            ingredientId: item.ingredientId || '',
            ingredientName: item.ingredientName || '',
            quantity: item.quantity || 0,
            reason: item.reason || '',
            timestamp: item.timestamp,
            cost: item.cost || 0
          })),
          totalWaste: rawWasteData.reduce((sum, item) => sum + (item.cost || 0), 0)
        };
        
        // Transform ingredients data with explicit typing
        const ingredientsData = ingredientsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            category: data.category || '',
            cost: data.cost || 0,
            supplier: data.supplier || '',
            stock: data.stock || 0,
            unit: data.unit || '',
            minimumStock: data.minimumStock || 0,
            expiryDate: data.expiryDate
          } as IngredientData;
        });
        
        // Generate waste tips with properly formatted data
        generateWasteTips(wasteData, ingredientsData);
        
        // Calculate waste percentage based on actual data
        const totalInventoryValue = ingredientsData.reduce((sum, item) => sum + ((item.cost || 0) * (item.stock || 0)), 0);
        const actualWastePercentage = totalInventoryValue > 0 ? (wasteData.totalWaste / totalInventoryValue) * 100 : 0;
        setWastePercentage(Math.min(actualWastePercentage, 10)); // Cap at 10% for UI display
      } catch (error) {
        console.error("Error fetching waste data:", error);
        toast({
          title: "Error",
          description: "Failed to load waste data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWasteData();
  }, [restaurant?.id, toast]);
  
  // Generate waste reduction tips
  const generateWasteTips = (wasteData: WasteData, ingredientsData: IngredientData[]) => {
    // Predefined waste reduction tips as fallback
    const baseTips: WasteTip[] = [
      {
        id: '1',
        title: 'Implement First-In-First-Out (FIFO)',
        description: 'Store ingredients with older stock in front to ensure they are used first. This simple inventory management technique can significantly reduce spoilage.',
        impact: 'high',
        category: 'storage',
        estimatedSavings: 300,
        implemented: false,
        difficulty: 'easy'
      },
      {
        id: '2',
        title: 'Daily Prep Lists Based on Forecasts',
        description: 'Create prep lists based on sales forecasts instead of fixed amounts. Analyze your POS data to identify patterns and adjust prep quantities accordingly.',
        impact: 'high',
        category: 'preparation',
        estimatedSavings: 450,
        implemented: false,
        difficulty: 'medium'
      },
      {
        id: '3',
        title: 'Staff Training on Waste Tracking',
        description: 'Train staff to consistently record all waste with reasons. This data will help identify patterns and problem areas in your operations.',
        impact: 'medium',
        category: 'training',
        estimatedSavings: 200,
        implemented: true,
        difficulty: 'easy'
      },
      {
        id: '4',
        title: 'Cross-Utilize Ingredients',
        description: 'Design your menu to use the same ingredients across multiple dishes. This reduces the number of items you need to stock and the risk of spoilage.',
        impact: 'medium',
        category: 'menu design',
        estimatedSavings: 350,
        implemented: false,
        difficulty: 'medium'
      },
      {
        id: '5',
        title: 'Optimize Order Frequency',
        description: 'Order highly perishable items more frequently in smaller quantities. This may slightly increase delivery costs but can significantly reduce waste.',
        impact: 'high',
        category: 'ordering',
        estimatedSavings: 500,
        implemented: false,
        difficulty: 'easy'
      },
      {
        id: '6',
        title: 'Repurpose Food Scraps',
        description: 'Create a system for repurposing usable food scraps. Vegetable trimmings can be used for stocks, bread for croutons, and fruit for desserts.',
        impact: 'medium',
        category: 'preparation',
        estimatedSavings: 250,
        implemented: false,
        difficulty: 'medium'
      }
    ];
    
    setWasteTips(baseTips);
    
    // Count implemented tips
    const implemented = baseTips.filter(tip => tip.implemented).length;
    setImplementedTips(implemented);
  };
  
  // Generate AI-enhanced waste tips
  const generateAIWasteTips = async () => {
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
          requestType: 'waste-reduction',
          wasteData: {
            wastePercentage,
            implementedTips
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
      
      // Parse the AI response to enhance our tips
      enhanceTipsWithAI(aiResponse);
      
      toast({
        title: "AI Analysis Updated",
        description: "Waste reduction tips have been refreshed with AI insights",
      });
    } catch (error) {
      console.error("Error generating AI waste tips:", error);
      toast({
        title: "AI Processing Failed",
        description: error instanceof Error ? error.message : "Could not generate AI-enhanced waste tips",
        variant: "destructive"
      });
    } finally {
      setProcessingAI(false);
    }
  };
  
  // Process AI response to enhance tips
  const enhanceTipsWithAI = (aiResponse: string) => {
    try {
      // Extract useful information from the AI response
      // This is a simplified implementation - we'd need more robust parsing in production
      
      // Look for new tips or enhancements to existing ones
      const enhancedTips = [...wasteTips].map(tip => {
        // Look for this tip in the AI response by title or keywords
        const titleRegex = new RegExp(`${tip.title}[\\s\\S]*?(?=\\n\\n|$)`, 'i');
        const categoryRegex = new RegExp(`${tip.category}[\\s\\S]*?(?=\\n\\n|$)`, 'i');
        
        const titleMatch = aiResponse.match(titleRegex);
        const categoryMatch = !titleMatch ? aiResponse.match(categoryRegex) : null;
        const match = titleMatch || categoryMatch;
        
        if (match) {
          const matchText = match[0];
          
          // Try to extract values from AI response
          const descriptionMatch = matchText.match(/description[:\s]*([^\n]+)/i);
          const impactMatch = matchText.match(/impact[:\s]*(high|medium|low)/i);
          const savingsMatch = matchText.match(/savings[:\s]*\$(\d+(\.\d+)?)/i) || 
                             matchText.match(/estimated savings[:\s]*\$(\d+(\.\d+)?)/i);
          const difficultyMatch = matchText.match(/difficulty[:\s]*(easy|medium|hard)/i);
          
          // Update with AI insights if found
          return {
            ...tip,
            description: descriptionMatch ? descriptionMatch[1].trim() : tip.description,
            impact: impactMatch ? impactMatch[1] as 'high' | 'medium' | 'low' : tip.impact,
            estimatedSavings: savingsMatch ? parseFloat(savingsMatch[1]) : tip.estimatedSavings,
            difficulty: difficultyMatch ? difficultyMatch[1] as 'easy' | 'medium' | 'hard' : tip.difficulty,
            aiEnhanced: true
          };
        }
        
        return tip;
      });
      
      // Check if AI suggested completely new tips
      const newTipsSection = aiResponse.match(/new tips?[:\s]*([\s\S]+)/i);
      
      if (newTipsSection) {
        const newTipsText = newTipsSection[1];
        const tipRegex = /\d+\s*[.)]\s*([^\n]+)/g;
        let tipMatch;
        
        while ((tipMatch = tipRegex.exec(newTipsText)) !== null) {
          if (tipMatch[1]) {
            const tipTitle = tipMatch[1].trim();
            
            // Check if this is truly a new tip (not matching existing ones)
            const isNewTip = !enhancedTips.some(tip => 
              tip.title.toLowerCase().includes(tipTitle.toLowerCase()) || 
              tipTitle.toLowerCase().includes(tip.title.toLowerCase())
            );
            
            if (isNewTip) {
              // Generate a unique ID
              const newId = `ai-${Date.now()}-${enhancedTips.length}`;
              
              // Add the new tip
              enhancedTips.push({
                id: newId,
                title: tipTitle,
                description: 'AI-generated recommendation based on your waste patterns',
                impact: 'medium',
                category: 'preparation', // Default category
                estimatedSavings: 100, // Default savings estimate
                implemented: false,
                difficulty: 'medium',
                aiEnhanced: true
              });
            }
          }
        }
      }
      
      setWasteTips(enhancedTips);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // If parsing fails, keep the original tips
    }
  };
  
  const impactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const categoryIcon = (category: string) => {
    switch (category) {
      case 'storage': return '🧊';
      case 'ordering': return '📦';
      case 'preparation': return '🔪';
      case 'training': return '👨‍🍳';
      case 'menu design': return '📋';
      default: return '💡';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Waste Reduction Tips</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered recommendations to minimize food waste and increase profitability
          </p>
        </div>
        <Button 
          onClick={generateAIWasteTips}
          disabled={loading || processingAI}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          {processingAI ? "Processing..." : "Refresh AI Tips"}
        </Button>
      </div>
      
      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Waste Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Recycle className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{wastePercentage.toFixed(1)}%</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">of food cost</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tips Implemented</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <div className="text-2xl font-bold">{implementedTips}/{wasteTips.length}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">best practices applied</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Potential Monthly Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(wasteTips.filter(t => !t.implemented).reduce((sum, tip) => sum + tip.estimatedSavings, 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">by implementing all tips</p>
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
      ) : wasteTips.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No waste reduction tips available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            We don't have enough waste tracking data to generate personalized recommendations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {wasteTips.map((tip) => (
            <Card key={tip.id} className={`flex flex-col ${tip.implemented ? 'border-green-200 dark:border-green-900' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-1">
                      {tip.title}
                      {tip.aiEnhanced && <Sparkles className="h-3 w-3 text-primary" />}
                    </CardTitle>
                    <CardDescription className="capitalize">
                      {tip.category}
                    </CardDescription>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${impactColor(tip.impact)}`}>
                    <span className="capitalize">{tip.impact} impact</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm">
                  <span className={tip.aiEnhanced ? "text-primary-foreground font-medium" : ""}>
                    {tip.description}
                  </span>
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Est. monthly savings:</span>
                  <span className="text-sm font-medium text-emerald-600">
                    {formatCurrency(tip.estimatedSavings)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end mt-auto pt-2">
                {tip.implemented ? (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Check className="h-4 w-4 mr-1" /> Implemented
                  </div>
                ) : (
                  <Button variant="ghost" size="sm">Mark as Implemented</Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
