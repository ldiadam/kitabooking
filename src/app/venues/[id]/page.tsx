import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import VenueGallery from '@/components/features/venues/venue-gallery'
import VenueAvailability from '@/components/features/venues/venue-availability'
import VenueReviews from '@/components/features/venues/venue-reviews'
import { 
  MapPin, 
  Users, 
  Clock, 
  Wifi, 
  Car, 
  Shield, 
  Star,
  Calendar,
  Phone,
  Mail
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'

type Venue = Database['public']['Tables']['venues']['Row'] & {
  venue_types: Database['public']['Tables']['venue_types']['Row']
}

interface VenuePageProps {
  params: Promise<{
    id: string
  }>
}

async function getVenue(id: string): Promise<Venue | null> {
  const supabase = await createClient()
  
  const { data: venue, error } = await supabase
    .from('venues')
    .select(`
      *,
      venue_types (
        id,
        name,
        description
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching venue:', error)
    return null
  }

  return venue as Venue
}

export default async function VenuePage({ params }: VenuePageProps) {
  const resolvedParams = await params
  const venue = await getVenue(resolvedParams.id)

  if (!venue) {
    notFound()
  }

  const imageUrl = venue.image_url || '/images/venue-placeholder.jpg'
  const facilityIcons: Record<string, any> = {
    'WiFi': Wifi,
    'Parking': Car,
    'Security': Shield,
    'Air Conditioning': Clock,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/venues" className="hover:text-gray-700">Venues</Link>
        <span>/</span>
        <span className="text-gray-900">{venue.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary">{venue.venue_types.name}</Badge>
                  {venue.is_featured && (
                    <Badge className="bg-orange-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{venue.location || 'Orange Sport Center'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Up to {venue.capacity} people</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Image */}
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={imageUrl}
                alt={venue.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
              />
            </div>
          </div>

          {/* Gallery */}
          <VenueGallery venueId={venue.id} />

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Venue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{venue.description}</p>
            </CardContent>
          </Card>

          {/* Facilities */}
          {venue.facilities && venue.facilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Facilities & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.facilities.map((facility, index) => {
                    const IconComponent = facilityIcons[facility] || Clock
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-orange-500" />
                        <span className="text-gray-700">{facility}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules */}
          {venue.rules && (
            <Card>
              <CardHeader>
                <CardTitle>Venue Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {venue.rules.split(',').map((rule, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-gray-700">{rule.trim()}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <VenueReviews venueId={venue.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Card */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Book This Venue</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(venue.base_price)}
                  </div>
                  <div className="text-sm text-gray-500">per hour</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>• Base price may vary by time slot</p>
                <p>• Weekend rates may apply</p>
                <p>• Minimum booking: 1 hour</p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Link href={`/booking?venue=${venue.id}`}>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call for Inquiry
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <VenueAvailability venueId={venue.id} venue={venue} />

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">+62 123 456 7890</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">info@orangesportcenter.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Orange Sport Center, Jakarta</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: VenuePageProps) {
  const resolvedParams = await params
  const venue = await getVenue(resolvedParams.id)
  
  if (!venue) {
    return {
      title: 'Venue Not Found - Orange Sport Center',
    }
  }

  return {
    title: `${venue.name} - Orange Sport Center`,
    description: venue.description,
  }
}