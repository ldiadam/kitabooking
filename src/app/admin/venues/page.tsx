import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { 
  MapPin, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign,
  Clock,
  Users
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Venue {
  id: string
  name: string
  description: string
  image_url?: string
  base_price: number
  weekend_price: number
  is_active: boolean
  created_at: string
  venue_type: {
    name: string
  }
  _count?: {
    reservations: number
  }
}

interface VenueFromDB {
  id: string
  name: string
  description: string
  image_url?: string
  base_price: number
  weekend_price: number
  is_active: boolean
  created_at: string
  venue_type: {
    name: string
  }[] | null
}

interface VenueType {
  id: string
  name: string
  description: string
}

async function checkAdminAccess() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (error || !profile || !['admin', 'superadmin'].includes(profile.role)) {
    redirect('/dashboard')
  }
  
  return profile
}

async function getVenues(): Promise<Venue[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('venues')
    .select(`
      id,
      name,
      description,
      image_url,
      base_price,
      weekend_price,
      is_active,
      created_at,
      venue_type:venue_types(
        name
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching venues:', error)
    return []
  }
  
  // Get reservation counts for each venue
  const venuesWithCounts = await Promise.all(
    (data || []).map(async (venue: VenueFromDB) => {
      const { count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venue.id)
      
      return {
        ...venue,
        _count: {
          reservations: count || 0
        }
      }
    })
  )
  
  return venuesWithCounts.map(venue => ({
    ...venue,
    venue_type: {
      name: venue.venue_type && venue.venue_type.length > 0 
        ? venue.venue_type[0].name 
        : 'Unknown'
    }
  })) as Venue[]
}

async function getVenueTypes(): Promise<VenueType[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('venue_types')
    .select('id, name, description')
    .order('name')
  
  if (error) {
    console.error('Error fetching venue types:', error)
    return []
  }
  
  return data || []
}

function VenuesSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    </div>
  )
}

function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative bg-muted">
        {venue.image_url ? (
          <Image
            src={venue.image_url}
            alt={venue.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <Badge variant={venue.is_active ? 'default' : 'secondary'}>
            {venue.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{venue.name}</CardTitle>
            <CardDescription className="mt-1">
              {venue.venue_type.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {venue.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weekday:</span>
            <span className="font-medium">Rp {venue.base_price.toLocaleString()}/hour</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weekend:</span>
            <span className="font-medium">Rp {venue.weekend_price?.toLocaleString() || venue.base_price.toLocaleString()}/hour</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Bookings:</span>
            <span className="font-medium">{venue._count?.reservations || 0}</span>
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" asChild className="flex-1">
            <Link href={`/venues/${venue.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="flex-1">
            <Link href={`/admin/venues/${venue.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="px-3">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function VenueTypeCard({ venueType }: { venueType: VenueType }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{venueType.name}</CardTitle>
        <CardDescription>{venueType.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild className="flex-1">
            <Link href={`/admin/venue-types/${venueType.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="px-3">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

async function VenuesContent() {
  await checkAdminAccess()
  
  const [venues, venueTypes] = await Promise.all([
    getVenues(),
    getVenueTypes()
  ])
  
  const totalVenues = venues.length
  const activeVenues = venues.filter(v => v.is_active).length
  const totalBookings = venues.reduce((sum, v) => sum + (v._count?.reservations || 0), 0)
  const avgPrice = venues.length > 0 ? 
    venues.reduce((sum, v) => sum + v.base_price, 0) / venues.length : 0
  
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Venue Management</h1>
          <p className="text-muted-foreground">
            Manage your sport center venues and types
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/venues/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Venue
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/venue-types/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Type
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVenues}</div>
            <p className="text-xs text-muted-foreground">
              {activeVenues} active venues
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venue Types</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{venueTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              Available categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Across all venues
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {Math.round(avgPrice).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per hour weekday
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search venues..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          Filter by Type
        </Button>
        <Button variant="outline">
          Filter by Status
        </Button>
      </div>
      
      {/* Venues Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Venues ({venues.length})</h2>
        {venues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No venues found</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first venue to accept bookings.
              </p>
              <Button asChild>
                <Link href="/admin/venues/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Venue
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Venue Types */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Venue Types ({venueTypes.length})</h2>
        {venueTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venueTypes.map((venueType) => (
              <VenueTypeCard key={venueType.id} venueType={venueType} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No venue types found</h3>
              <p className="text-muted-foreground mb-4">
                Create venue types to categorize your facilities.
              </p>
              <Button asChild>
                <Link href="/admin/venue-types/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Type
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function AdminVenuesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<VenuesSkeleton />}>
        <VenuesContent />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Venue Management - Orange Sport Center',
  description: 'Manage venues and venue types for your sport center.',
}