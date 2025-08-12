import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VenueFilters from '@/components/features/venues/venue-filters'
import VenueList from '@/components/features/venues/venue-list'
import { Skeleton } from '@/components/ui/skeleton'
import type { Database } from '@/types/database'

// Use the database types directly
type Venue = Database['public']['Tables']['venues']['Row'] & {
  venue_types: Database['public']['Tables']['venue_types']['Row'] | null
}

type VenueType = Database['public']['Tables']['venue_types']['Row']

interface VenuesPageProps {
  searchParams: Promise<{
    type?: string
    search?: string
    sort?: string
  }>
}

async function getVenues(searchParams: Awaited<VenuesPageProps['searchParams']>): Promise<Venue[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('venues')
    .select(`
      id,
      name,
      description,
      image_url,
      base_price,
      weekend_price,
      is_active,
      venue_type_id,
      venue_types (
        id,
        name,
        description
      )
    `)
    .eq('is_active', true)

  // Apply filters
  if (searchParams.type) {
    query = query.eq('venue_type_id', searchParams.type)
  }

  if (searchParams.search) {
    query = query.or(`name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }

  // Apply sorting
  switch (searchParams.sort) {
    case 'name':
      query = query.order('name')
      break
    case 'price_low':
      query = query.order('base_price')
      break
    case 'price_high':
      query = query.order('base_price', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data: venues, error } = await query

  if (error) {
    console.error('Error fetching venues:', error)
    return []
  }

  return (venues as unknown as Venue[]) || []
}

async function getVenueTypes(): Promise<VenueType[]> {
  const supabase = await createClient()
  
  const { data: venueTypes, error } = await supabase
    .from('venue_types')
    .select('id, name, description')
    .order('name')

  if (error) {
    console.error('Error fetching venue types:', error)
    return []
  }

  return (venueTypes as VenueType[]) || []
}

function VenuesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function VenuesContent({ searchParams }: VenuesPageProps) {
  const resolvedSearchParams = await searchParams
  const [venues, venueTypes] = await Promise.all([
    getVenues(resolvedSearchParams),
    getVenueTypes()
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Venues</h1>
        <p className="text-gray-600">
          Discover our premium sports facilities and book your perfect venue
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <VenueFilters
                venueTypes={venueTypes}
                currentFilters={{
                  type: resolvedSearchParams.type || '',
                  search: resolvedSearchParams.search || '',
                  sort: resolvedSearchParams.sort || 'newest'
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Venues Grid */}
        <div className="lg:w-3/4">
          <VenueList venues={venues} />
        </div>
      </div>
    </div>
  )
}

export default function VenuesPage({ searchParams }: VenuesPageProps) {
  return (
    <Suspense fallback={<VenuesSkeleton />}>
      <VenuesContent searchParams={searchParams} />
    </Suspense>
  )
}

export const metadata = {
  title: 'Venues - Orange Sport Center',
  description: 'Browse and book our premium sports facilities and venues.',
}