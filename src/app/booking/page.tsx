import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookingForm from '@/components/features/booking/booking-form'
import BookingSummary from '@/components/features/booking/booking-summary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Database } from '@/types/database'

type Venue = Database['public']['Tables']['venues']['Row'] & {
  venue_types: Database['public']['Tables']['venue_types']['Row']
}

interface BookingPageProps {
  searchParams: Promise<{
    venue?: string
    date?: string
    time?: string
  }>
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

async function getVenue(venueId: string): Promise<Venue | null> {
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
    .eq('id', venueId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching venue:', error)
    return null
  }

  return venue as Venue
}

async function getVenues(): Promise<Venue[]> {
  const supabase = await createClient()
  
  const { data: venues, error } = await supabase
    .from('venues')
    .select(`
      *,
      venue_types (
        id,
        name,
        description
      )
    `)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching venues:', error)
    return []
  }

  return venues as Venue[]
}

function BookingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const { user } = await getUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login?redirect=/booking')
  }

  const params = await searchParams
  const [selectedVenue, allVenues] = await Promise.all([
    params.venue ? getVenue(params.venue) : null,
    getVenues()
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Venue</h1>
        <p className="text-gray-600">
          Select your preferred venue, date, and time to make a reservation
        </p>
      </div>

      <Suspense fallback={<BookingSkeleton />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <BookingForm 
              venues={allVenues}
              selectedVenue={selectedVenue}
              initialDate={params.date}
              initialTime={params.time}
              user={user}
            />
          </div>

          {/* Booking Summary */}
          <div>
            <BookingSummary />
          </div>
        </div>
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Book a Venue - Orange Sport Center',
  description: 'Book your preferred sports venue at Orange Sport Center. Easy online booking with instant confirmation.',
}