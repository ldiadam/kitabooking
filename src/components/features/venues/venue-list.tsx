'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Users, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'

// Use the database types directly
type Venue = Database['public']['Tables']['venues']['Row'] & {
  venue_types: Database['public']['Tables']['venue_types']['Row'] | null
}

interface VenueListProps {
  venues: Venue[]
}

export default function VenueList({ venues }: VenueListProps) {
  if (venues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MapPin className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
        <p className="text-gray-500 mb-4">
          Try adjusting your search criteria or browse all venues.
        </p>
        <Link href="/venues">
          <Button variant="outline">View All Venues</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {venues.length} venue{venues.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
    </div>
  )
}

function VenueCard({ venue }: { venue: Venue }) {
  const imageUrl = venue.image_url || '/images/venue-placeholder.jpg'
  const minPrice = Math.min(venue.base_price, venue.weekend_price || venue.base_price)
  
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <Image
            src={imageUrl}
            alt={venue.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-900">
              {venue.venue_types?.name || 'General'}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant={venue.is_active ? 'default' : 'secondary'}>
              {venue.is_active ? 'Available' : 'Unavailable'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
              {venue.name}
            </h3>
            {venue.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {venue.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Group Friendly</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Per Hour</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">Starting from</span>
              <div className="font-semibold text-lg text-orange-600">
                {formatCurrency(minPrice)}
                <span className="text-sm text-gray-500 font-normal">/hour</span>
              </div>
              {venue.weekend_price && venue.base_price !== venue.weekend_price && (
                <div className="text-xs text-gray-500">
                  Weekday: {formatCurrency(venue.base_price)} | Weekend: {formatCurrency(venue.weekend_price)}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Link href={`/venues/${venue.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          {venue.is_active ? (
            <Link href={`/booking?venue=${venue.id}`} className="flex-1">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                Book Now
              </Button>
            </Link>
          ) : (
            <Button disabled className="w-full flex-1">
              Unavailable
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}