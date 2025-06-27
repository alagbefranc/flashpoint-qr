'use client';

import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

/**
 * Generates sample review data for the restaurant dashboard
 * @param restaurantId The restaurant ID to create reviews for
 */
export async function seedReviews(restaurantId: string): Promise<void> {
  console.log('Seeding reviews data...');
  
  try {
    // Sample customer names
    const customerNames = [
      'Alex Thompson', 'Morgan Lee', 'Jordan Smith', 'Taylor Williams',
      'Casey Johnson', 'Riley Davis', 'Jamie Wilson', 'Quinn Brown',
      'Avery Garcia', 'Cameron Rodriguez', 'Drew Martinez', 'Jordan Lewis',
      'Parker Hall', 'Reese Campbell', 'Sam Rivera', 'Dakota Turner'
    ];
    
    // Positive reviews data
    const positiveReviews = [
      {
        comment: "The food was absolutely incredible! Every dish was bursting with flavor, and the staff was extremely attentive. Will definitely come back again!",
        aiSummary: "Customer loved the food quality and service. Strong positive sentiment about returning."
      },
      {
        comment: "What a fantastic dining experience! The atmosphere was perfect for our anniversary dinner, and the chef even came out to greet us. 10/10 would recommend!",
        aiSummary: "Special occasion diner extremely satisfied with ambiance and special attention."
      },
      {
        comment: "Best Italian food in the city! The pasta was cooked to perfection and the wine selection is impressive. Our server was knowledgeable and friendly.",
        aiSummary: "High praise for food quality, beverage selection, and staff knowledge."
      },
      {
        comment: "We had a wonderful experience with the new menu items. The seasonal specials were creative and delicious. Service was prompt and professional.",
        aiSummary: "Positive feedback on menu innovation and efficient service."
      }
    ];
    
    // Neutral reviews data
    const neutralReviews = [
      {
        comment: "The food was good but the portions were smaller than expected. Service was okay, though we had to wait a bit for our drinks. Might come back.",
        aiSummary: "Mixed feedback on portion sizes and service timing. Moderate likelihood of return."
      },
      {
        comment: "Decent spot for lunch. Nothing extraordinary but nothing to complain about either. Prices are fair for what you get.",
        aiSummary: "Average satisfaction with value perception. No strong sentiment either way."
      },
      {
        comment: "The appetizers were excellent, but the main courses were just average. Our server was friendly though somewhat inattentive during busy periods.",
        aiSummary: "Inconsistency between menu items. Service has room for improvement during peak times."
      }
    ];
    
    // Negative reviews data
    const negativeReviews = [
      {
        comment: "Disappointed with our visit. The food took over 45 minutes to arrive and was cold when it did. The manager did not seem concerned when we complained.",
        aiSummary: "Serious issues with food timing, temperature, and management response."
      },
      {
        comment: "Overpriced for the quality. The menu online showed different prices than what we were charged, and one dish was completely bland. Would not recommend.",
        aiSummary: "Customer dissatisfied with value and transparency. Menu item quality issues."
      }
    ];
    
    // Get current date
    const now = new Date();
    
    // Track created reviews to calculate sentiment summary
    const reviewStats = {
      positive: 0,
      neutral: 0,
      negative: 0,
      total: 0
    };
    
    // Create reviews from the past 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      // More recent dates have more reviews (recency bias)
      const reviewsToday = dayOffset < 7 ? 
                           1 + Math.floor(Math.random() * 2) : // 1-2 reviews for recent days
                           Math.random() < 0.4 ? 1 : 0; // 40% chance of 1 review for older days
      
      if (reviewsToday === 0) continue;
      
      const date = new Date(now);
      date.setDate(now.getDate() - dayOffset);
      
      for (let i = 0; i < reviewsToday; i++) {
        // Generate a random review
        // 60% positive, 25% neutral, 15% negative - realistic restaurant review distribution
        const sentiment = Math.random() < 0.6 ? 'positive' : (Math.random() < 0.625 ? 'neutral' : 'negative');
        
        let reviewPool;
        let rating;
        
        switch (sentiment) {
          case 'positive':
            reviewPool = positiveReviews;
            rating = 4 + (Math.random() < 0.7 ? 1 : 0); // 4 or 5 stars, 70% chance of 5
            reviewStats.positive++;
            break;
          case 'neutral':
            reviewPool = neutralReviews;
            rating = 3; // 3 stars
            reviewStats.neutral++;
            break;
          case 'negative':
            reviewPool = negativeReviews;
            rating = 1 + Math.floor(Math.random() * 2); // 1 or 2 stars
            reviewStats.negative++;
            break;
        }
        
        reviewStats.total++;
        
        const review = reviewPool[Math.floor(Math.random() * reviewPool.length)];
        const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
        
        // Random time during the day
        const reviewHour = 11 + Math.floor(Math.random() * 10); // Between 11 AM and 9 PM
        const reviewMinute = Math.floor(Math.random() * 60);
        date.setHours(reviewHour, reviewMinute, 0, 0);
        
        const reviewId = `review-${dayOffset}-${i}-${Date.now()}`;
        const reviewRef = doc(collection(db, 'restaurants', restaurantId, 'reviews'), reviewId);
        
        await setDoc(reviewRef, {
          customerName: customerName,
          rating: rating,
          comment: review.comment,
          sentiment: sentiment,
          aiSummary: review.aiSummary,
          date: Timestamp.fromDate(date),
          tableNumber: Math.floor(Math.random() * 20) + 1,
          orderId: `order-${Math.floor(Math.random() * 1000)}`
        });
      }
    }
    
    console.log(`Created ${reviewStats.total} reviews with sentiment distribution: ${reviewStats.positive} positive, ${reviewStats.neutral} neutral, ${reviewStats.negative} negative.`);
  } catch (error) {
    console.error('Error generating reviews data:', error);
  }
}
