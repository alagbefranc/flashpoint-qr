'use client';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  hasModifiers: boolean;
  popularityScore?: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (id: string) => void;
  onToggleAvailability: (id: string, available: boolean) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onEdit,
  onToggleAvailability,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        {item.imageUrl ? (
          <div className="h-40 overflow-hidden">
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-40 bg-muted flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {item.popularityScore && item.popularityScore > 8 && (
          <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
            Popular
          </span>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-card-foreground">
            {item.name}
          </h3>
          <span className="font-semibold text-card-foreground">
            {formatPrice(item.price)}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs inline-flex items-center">
            {item.hasModifiers && (
              <span className="text-muted-foreground flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Has modifiers
              </span>
            )}
          </span>
          
          <div className="flex space-x-1">
            <button 
              onClick={() => onToggleAvailability(item.id, !item.isAvailable)}
              className={`rounded-md p-1 ${item.isAvailable ? 'text-success bg-success/10' : 'text-error bg-error/10'}`}
              title={item.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {item.isAvailable ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </button>
            
            <button 
              onClick={() => onEdit(item.id)}
              className="rounded-md p-1 text-card-foreground bg-accent hover:bg-accent-hover"
              title="Edit item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
