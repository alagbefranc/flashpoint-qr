import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// Force Node.js runtime to ensure Firebase Admin SDK compatibility
export const runtime = 'nodejs';

// Use a type that's compatible with both client and admin SDK
type InventoryItem = Record<string, any>;

// Create an OpenAI API client (that's edge friendly)
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('OPENAI_API_KEY is not defined in environment variables');
}

const openai = new OpenAI({
  apiKey: openaiApiKey || '',
});

// Firebase Admin SDK is not compatible with edge runtime
// Using default Node.js runtime instead

/**
 * Validates the user's permissions to access restaurant data
 */
async function validateUserAccess(userId: string, restaurantId: string): Promise<boolean> {
  try {
    console.log(`Validating access for userId: ${userId}, restaurantId: ${restaurantId}`);
    
    // Check if user exists and has access to this restaurant
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User document doesn't exist for userId: ${userId}`);
      return false;
    }
    
    const userData = userDoc.data();
    if (!userData) {
      console.log(`User data is null for userId: ${userId}`);
      return false;
    }
    
    console.log(`User data retrieved:`, JSON.stringify(userData, null, 2));
    console.log(`User roles:`, userData.roles ? JSON.stringify(userData.roles, null, 2) : 'undefined');
    console.log(`Looking for role access to restaurantId: ${restaurantId}`);
    
    // Check user's restaurantId field first
    if (userData.restaurantId === restaurantId) {
      console.log(`User has direct restaurantId match: ${restaurantId}`);
      return true;
    }
    
    // Then check roles object
    if (userData.roles && userData.roles[restaurantId]) {
      console.log(`User has role for restaurant: ${restaurantId}`);
      return true;
    }
    
    console.log(`User does not have access to restaurant: ${restaurantId}`);
    return false;
  } catch (error) {
    console.error('Error validating user access:', error);
    return false;
  }
}

/**
 * Fetches inventory data for a restaurant using Admin SDK
 */
async function fetchInventoryData(restaurantId: string): Promise<{
  ingredients: InventoryItem[];
  stockAdjustments: InventoryItem[];
  purchaseOrders: InventoryItem[];
  waste: InventoryItem[];
}> {
  // Get ingredients using Admin SDK
  const ingredientsSnapshot = await adminDb
    .collection('restaurants')
    .doc(restaurantId)
    .collection('ingredients')
    .get();
  
  const ingredients = ingredientsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Get stock transactions using Admin SDK
  const stockSnapshot = await adminDb
    .collection('restaurants')
    .doc(restaurantId)
    .collection('stockTransactions')
    .orderBy('timestamp', 'desc')
    .limit(100)
    .get();
  
  const stockAdjustments = stockSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Get purchase orders using Admin SDK
  const purchaseOrdersSnapshot = await adminDb
    .collection('restaurants')
    .doc(restaurantId)
    .collection('purchaseOrders')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  
  const purchaseOrders = purchaseOrdersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Get waste logs using Admin SDK
  const wasteSnapshot = await adminDb
    .collection('restaurants')
    .doc(restaurantId)
    .collection('wasteLog')
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();
  
  const waste = wasteSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return {
    ingredients,
    stockAdjustments,
    purchaseOrders,
    waste
  };
}

/**
 * Generates a system prompt for the AI based on inventory data and request type
 */
function generateSystemPrompt(
  inventoryData: any,
  requestType: string
): string {
  const { ingredients, stockAdjustments, purchaseOrders, waste } = inventoryData;
  
  // Create a summary of the inventory data
  const ingredientsSummary = ingredients.map((item: InventoryItem) => 
    `${item.name}: Quantity: ${item.quantity} ${item.unit}, Cost: $${item.cost || 'N/A'}, Par: ${item.par || 'N/A'}, Reorder Point: ${item.reorderPoint || 'N/A'}`
  ).join('\n');
  
  let basePrompt = `You are an AI assistant that helps restaurant owners optimize their inventory management. 
You have access to the following inventory data:

INGREDIENTS (${ingredients.length} items):
${ingredientsSummary}

`;

  // Add specific guidance based on request type
  switch (requestType) {
    case 'reorder-forecast':
      basePrompt += `
Based on the inventory data, create detailed reorder suggestions. For each item that's below or approaching its reorder point:
1. Calculate how many days until stockout based on usage rates
2. Suggest reorder quantities to reach par levels
3. Prioritize items (high, medium, low) based on urgency
4. Provide reasoning for each suggestion

Format each suggestion with:
- Item name
- Current stock
- Recommended reorder amount
- Priority level
- Days until stockout
- Brief reasoning

Include business insights on ordering patterns and potential optimizations.
`;
      break;
    
    case 'cost-optimizer':
      basePrompt += `
Analyze the inventory cost data and suggest detailed cost saving opportunities:
1. Identify items with high price volatility or recent price increases
2. Calculate potential savings for each suggestion
3. Provide actionable recommendations (e.g., bulk purchases, supplier changes, etc.)
4. Prioritize suggestions based on potential impact

Format each suggestion with:
- Item name
- Current cost
- Potential savings (amount and percentage)
- Implementation difficulty (easy, medium, hard)
- Detailed recommendation
- Alternative suppliers if applicable

Include broader insights on cost trends and strategic purchasing opportunities.
`;
      break;
    
    case 'waste-reduction':
      basePrompt += `
Based on the waste log data, provide actionable waste reduction tips:
1. Identify patterns in waste causes (e.g., overproduction, spoilage)
2. Suggest specific process improvements to reduce waste
3. Estimate monthly cost savings per suggestion
4. Categorize tips (storage, ordering, preparation, training, menu design)

Format each tip with:
- Clear, actionable title
- Detailed explanation
- Expected impact (high, medium, low)
- Estimated monthly savings
- Implementation difficulty
- Category

Include industry best practices and innovative approaches to waste reduction.
`;
      break;
    
    case 'inventory-reports':
      basePrompt += `
Generate a comprehensive inventory analysis report with:
1. Summary of total inventory value and distribution by category
2. Key insights on inventory health (turnover, discrepancies, etc.)
3. Usage trend analysis for major categories
4. Projected inventory needs for the next 1-3 months
5. Recommendations for optimizing inventory levels

Format the report with:
- Clear sections with headings
- Bullet points for key insights
- Specific metrics and percentages
- Actionable recommendations

Include data visualization descriptions that could help interpret the data.
`;
      break;
    
    default:
      basePrompt += `
Please provide general inventory management advice based on the data provided.
`;
  }
  
  basePrompt += `
Respond in a professional, helpful tone. Use specific numbers and data points from the inventory to make your response detailed and relevant.
`;

  return basePrompt;
}

export async function POST(req: NextRequest) {
  try {
    // Get the authorization token from headers
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
    }
    
    // Verify the Firebase ID token
    let userId;
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { restaurantId, requestType } = body;
    
    if (!restaurantId || !requestType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate user has access to this restaurant
    const hasAccess = await validateUserAccess(userId, restaurantId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Not authorized to access this restaurant data' },
        { status: 403 }
      );
    }
    
    // Fetch inventory data
    const inventoryData = await fetchInventoryData(restaurantId);
    
    // Generate system prompt based on data and request type
    const systemPrompt = generateSystemPrompt(inventoryData, requestType);
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      stream: true,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Please analyze my restaurant's inventory data and provide ${requestType.replace('-', ' ')} recommendations.`
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    // Create a text encoder for streaming the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Iterate through the response
          for await (const chunk of response) {
            // Extract the text from the chunk
            const text = chunk.choices[0]?.delta?.content || '';
            // Encode the text and send it to the stream
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          console.error('Error processing OpenAI stream:', error);
          controller.error(error);
        }
      },
    });
    
    // Return the stream response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in AI inventory API:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
