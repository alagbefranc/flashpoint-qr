// Inventory Types
export interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;  // e.g., kg, l, pcs
  costPerUnit: number;
  currentStock: number;
  minStockLevel: number;
  supplier?: string;
  expiryDate?: string;
  lastOrderDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
