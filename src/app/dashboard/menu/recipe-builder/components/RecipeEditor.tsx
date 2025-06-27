'use client';

import { useState, useEffect } from 'react';

export interface Ingredient {
  id: string;
  name: string;
  costPerUnit: number;
  unit: string;
  inStock: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface Recipe {
  itemId: string;
  itemName: string;
  ingredients: RecipeIngredient[];
  totalCost: number;
  suggestedPrice: number;
}

interface RecipeEditorProps {
  recipe: Recipe;
  availableIngredients: Ingredient[];
  onSave: (updatedRecipe: Recipe) => void;
}

export const RecipeEditor: React.FC<RecipeEditorProps> = ({
  recipe,
  availableIngredients,
  onSave,
}) => {
  const [currentRecipe, setCurrentRecipe] = useState<Recipe>(recipe);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [costSavingSuggestions, setCostSavingSuggestions] = useState<string[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleAddIngredient = () => {
    // Find first ingredient not already in the recipe
    const unusedIngredient = availableIngredients.find(
      ing => !currentRecipe.ingredients.some(recipeIng => recipeIng.ingredientId === ing.id)
    );

    if (unusedIngredient) {
      const updatedIngredients = [
        ...currentRecipe.ingredients,
        { ingredientId: unusedIngredient.id, quantity: 1 }
      ];

      const newTotalCost = calculateTotalCost(updatedIngredients);

      setCurrentRecipe({
        ...currentRecipe,
        ingredients: updatedIngredients,
        totalCost: newTotalCost,
        suggestedPrice: Math.round(newTotalCost * 3 * 100) / 100 // 3x markup, rounded to 2 decimal places
      });
    }
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    const updatedIngredients = currentRecipe.ingredients.filter(
      ing => ing.ingredientId !== ingredientId
    );

    const newTotalCost = calculateTotalCost(updatedIngredients);

    setCurrentRecipe({
      ...currentRecipe,
      ingredients: updatedIngredients,
      totalCost: newTotalCost,
      suggestedPrice: Math.round(newTotalCost * 3 * 100) / 100
    });
  };

  const handleQuantityChange = (ingredientId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;

    const updatedIngredients = currentRecipe.ingredients.map(ing => {
      if (ing.ingredientId === ingredientId) {
        return { ...ing, quantity: newQuantity };
      }
      return ing;
    });

    const newTotalCost = calculateTotalCost(updatedIngredients);

    setCurrentRecipe({
      ...currentRecipe,
      ingredients: updatedIngredients,
      totalCost: newTotalCost,
      suggestedPrice: Math.round(newTotalCost * 3 * 100) / 100
    });
  };

  const calculateTotalCost = (ingredients: RecipeIngredient[]): number => {
    return ingredients.reduce((total, ing) => {
      const ingredient = availableIngredients.find(i => i.id === ing.ingredientId);
      if (ingredient) {
        return total + (ingredient.costPerUnit * ing.quantity);
      }
      return total;
    }, 0);
  };

  const handleSaveRecipe = () => {
    onSave(currentRecipe);
  };

  const handleGetAiSuggestions = () => {
    setShowAiSuggestions(true);
    setIsGenerating(true);

    // Simulate AI processing with a timeout
    setTimeout(() => {
      // These would come from a real AI service in production
      const suggestions = [
        `Consider reducing onions by 20% - customers rarely notice and it could save $0.16 per dish.`,
        `Switch from premium cheese to standard cheese for a 30% cost reduction with minimal taste impact.`,
        `Adding 10% more rice and reducing meat by 5% would maintain portion size while reducing cost by $0.35.`,
        `Our data shows that using frozen bell peppers instead of fresh could save 22% on this ingredient with no customer complaints.`,
        `Consider using a more cost-effective oil for this recipe - potential savings of $0.18 per dish.`
      ];

      setCostSavingSuggestions(suggestions);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-medium mb-6">{currentRecipe.itemName} Recipe</h2>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Ingredients</h3>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-md hover:bg-primary/20"
          >
            Add Ingredient
          </button>
        </div>

        {currentRecipe.ingredients.length === 0 ? (
          <div className="bg-muted/20 border border-border rounded-md p-4 text-center">
            <p className="text-muted-foreground">No ingredients added yet.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Ingredient</th>
                  <th className="text-center px-4 py-2 font-medium">Quantity</th>
                  <th className="text-right px-4 py-2 font-medium">Cost</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentRecipe.ingredients.map(ing => {
                  const ingredient = availableIngredients.find(i => i.id === ing.ingredientId);
                  if (!ingredient) return null;

                  const cost = ingredient.costPerUnit * ing.quantity;

                  return (
                    <tr key={ing.ingredientId}>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium">{ingredient.name}</span>
                          <span className="text-xs text-muted-foreground block">
                            {formatCurrency(ingredient.costPerUnit)} / {ingredient.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(ing.ingredientId, ing.quantity - 1)}
                            className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-12 text-center">
                            {ing.quantity} {ingredient.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(ing.ingredientId, ing.quantity + 1)}
                            className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(cost)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(ing.ingredientId)}
                          className="p-1 text-card-foreground hover:bg-error/10 hover:text-error rounded-md"
                          title="Remove ingredient"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/20">
                <tr>
                  <td className="px-4 py-3 font-medium">Total Cost</td>
                  <td></td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(currentRecipe.totalCost)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="bg-muted/10 border border-border rounded-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Cost Analysis</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Based on your ingredient costs and standard markup
            </p>
          </div>
          <div className="text-right">
            <div className="font-medium">Suggested Price: {formatCurrency(currentRecipe.suggestedPrice)}</div>
            <div className="text-sm text-muted-foreground">
              Profit Margin: {Math.round(((currentRecipe.suggestedPrice - currentRecipe.totalCost) / currentRecipe.suggestedPrice) * 100)}%
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleGetAiSuggestions}
          disabled={currentRecipe.ingredients.length === 0 || isGenerating}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            currentRecipe.ingredients.length === 0 || isGenerating
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>{isGenerating ? 'Analyzing...' : 'Get Cost-Saving Ideas'}</span>
        </button>

        <button
          type="button"
          onClick={handleSaveRecipe}
          disabled={currentRecipe.ingredients.length === 0}
          className={`px-4 py-2 rounded-md ${
            currentRecipe.ingredients.length === 0
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          Save Recipe
        </button>
      </div>

      {/* AI Suggestions Panel */}
      {showAiSuggestions && (
        <div className="fixed inset-0 bg-background/80 z-50 flex justify-center items-center">
          <div className="relative bg-card max-w-md w-full mx-auto rounded-xl shadow-lg p-6 border border-border">
            <button 
              onClick={() => setShowAiSuggestions(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold mb-4">Cost-Saving Suggestions</h3>

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-3 text-center text-muted-foreground">
                  Our AI is analyzing your recipe for cost optimization...
                </p>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  Based on our analysis of your recipe, ingredient costs, and customer preferences, here are some suggestions to optimize costs:
                </p>
                
                <ul className="space-y-3">
                  {costSavingSuggestions.map((suggestion, index) => (
                    <li key={index} className="bg-card border border-border rounded-md p-3 flex">
                      <span className="text-primary mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={() => setShowAiSuggestions(false)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                  >
                    Apply Selected Suggestions
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
