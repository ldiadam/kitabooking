'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, MessageSquare, ThumbsUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Database } from '@/types/database'

type Review = {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: {
    full_name: string
    avatar_url?: string
  }
}

interface VenueReviewsProps {
  venueId: string
}

export default function VenueReviews({ venueId }: VenueReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0] // 1-5 stars
  })
  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
  }, [venueId])

  const fetchReviews = async () => {
    try {
      // For now, we'll simulate reviews since we don't have a reviews table
      // In a real implementation, you would fetch from a reviews table
      const mockReviews: Review[] = [
        {
          id: '1',
          rating: 5,
          comment: 'Excellent venue! Clean facilities and great staff. The court was in perfect condition.',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          profiles: {
            full_name: 'John Doe',
            avatar_url: undefined
          }
        },
        {
          id: '2',
          rating: 4,
          comment: 'Good venue with nice facilities. Parking could be better but overall a great experience.',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          profiles: {
            full_name: 'Sarah Wilson',
            avatar_url: undefined
          }
        },
        {
          id: '3',
          rating: 5,
          comment: 'Amazing place for futsal! The court surface is excellent and the lighting is perfect.',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          profiles: {
            full_name: 'Mike Johnson',
            avatar_url: undefined
          }
        },
        {
          id: '4',
          rating: 4,
          comment: 'Great venue, friendly staff. The only downside is that it can get quite busy during peak hours.',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          profiles: {
            full_name: 'Lisa Chen',
            avatar_url: undefined
          }
        }
      ]

      setReviews(mockReviews)
      
      // Calculate stats
      const totalReviews = mockReviews.length
      const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      const ratingDistribution = [0, 0, 0, 0, 0]
      
      mockReviews.forEach(review => {
        ratingDistribution[review.rating - 1]++
      })
      
      setStats({
        averageRating,
        totalReviews,
        ratingDistribution
      })
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Customer Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {stats.averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(stats.averageRating), 'md')}
            <div className="text-sm text-gray-600 mt-1">
              Based on {stats.totalReviews} reviews
            </div>
          </div>
          
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating - 1]
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
              
              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-600">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.profiles.avatar_url} />
                  <AvatarFallback className="bg-orange-100 text-orange-600">
                    {getInitials(review.profiles.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {review.profiles.full_name}
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <Button variant="ghost" size="sm" className="h-auto p-0">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Helpful
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {reviews.length > 0 && (
          <div className="text-center">
            <Button variant="outline">
              Load More Reviews
            </Button>
          </div>
        )}

        {/* No Reviews */}
        {reviews.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-500">
              Be the first to review this venue after your booking!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}