'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface LatestReviewsProps {
  restaurantId: string;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: Date | { toDate: () => Date } | string; // Support for Firestore Timestamp, Date, or string
  sentiment: 'positive' | 'neutral' | 'negative';
  aiSummary?: string;
}

export default function LatestReviews({ restaurantId }: LatestReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sentimentSummary, setSentimentSummary] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestReviews = async () => {
      try {
        const reviewsRef = collection(db, 'restaurants', restaurantId, 'reviews');
        const reviewsQuery = query(
          reviewsRef,
          orderBy('date', 'desc'),
          limit(5)
        );

        const querySnapshot = await getDocs(reviewsQuery);
        
        const fetchedReviews: Review[] = [];
        const sentiments = {
          positive: 0,
          neutral: 0,
          negative: 0,
          total: 0
        };
        
        querySnapshot.forEach((doc) => {
          const review = { id: doc.id, ...doc.data() } as Review;
          fetchedReviews.push(review);
          
          if (review.sentiment === 'positive') sentiments.positive++;
          else if (review.sentiment === 'negative') sentiments.negative++;
          else sentiments.neutral++;
          
          sentiments.total++;
        });
        
        setReviews(fetchedReviews);
        setSentimentSummary(sentiments);
      } catch (error) {
        console.error('Error fetching latest reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchLatestReviews();
    }
  }, [restaurantId]);

  // Format date
  const formatDate = (date: Date | { toDate: () => Date } | string): string => {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      // If date is a Firestore Timestamp, convert to JS Date
      dateObj = date.toDate();
    } else {
      // If it's a string or other format, try to parse it
      dateObj = new Date(String(date));
    }
    
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(dateObj);
  };

  // Generate stars for rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <svg 
        key={i}
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return (
          <div className="p-1 bg-green-100 text-green-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'negative':
        return (
          <div className="p-1 bg-red-100 text-red-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-1 bg-gray-100 text-gray-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-3 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500/10 rounded-md p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-medium text-gray-900">Latest Reviews</h3>
          </div>
        </div>

        {/* Sentiment summary */}
        {!loading && sentimentSummary.total > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Sentiment Summary</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs">{Math.round((sentimentSummary.positive / sentimentSummary.total) * 100)}% Positive</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-gray-400 rounded-full mr-1"></div>
                <span className="text-xs">{Math.round((sentimentSummary.neutral / sentimentSummary.total) * 100)}% Neutral</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-red-500 rounded-full mr-1"></div>
                <span className="text-xs">{Math.round((sentimentSummary.negative / sentimentSummary.total) * 100)}% Negative</span>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div className="flex h-full rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full" 
                  style={{ width: `${(sentimentSummary.positive / sentimentSummary.total) * 100}%` }}
                ></div>
                <div 
                  className="bg-gray-400 h-full" 
                  style={{ width: `${(sentimentSummary.neutral / sentimentSummary.total) * 100}%` }}
                ></div>
                <div 
                  className="bg-red-500 h-full" 
                  style={{ width: `${(sentimentSummary.negative / sentimentSummary.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No reviews yet</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <li key={review.id} className="py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900">{review.customerName}</h4>
                      <span className="text-xs text-gray-500 ml-2">{formatDate(review.date)}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <div className="flex mr-2">{renderStars(review.rating)}</div>
                      {getSentimentIcon(review.sentiment)}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                    {review.aiSummary && (
                      <p className="mt-1 text-xs text-gray-500 italic">
                        <span className="font-medium">AI:</span> {review.aiSummary}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
