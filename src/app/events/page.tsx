import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, MapPin, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  location: string
  max_participants: number
  current_participants: number
  registration_fee: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  image_url?: string
  created_at: string
}

async function getEvents(): Promise<Event[]> {
  const supabase = await createClient()
  
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'upcoming')
    .order('event_date', { ascending: true })
  
  if (error) {
    console.error('Error fetching events:', error)
    return []
  }
  
  return events || []
}

function EventCard({ event }: { event: Event }) {
  const eventDate = new Date(event.event_date)
  const isRegistrationOpen = event.current_participants < event.max_participants
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {event.image_url && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{event.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {event.description}
            </CardDescription>
          </div>
          <Badge 
            variant={event.status === 'upcoming' ? 'default' : 'secondary'}
            className="ml-2"
          >
            {event.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>{eventDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{event.start_time} - {event.end_time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{event.current_participants}/{event.max_participants}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="text-lg font-semibold">
            {event.registration_fee > 0 
              ? `Rp ${event.registration_fee.toLocaleString()}` 
              : 'Free'
            }
          </div>
          <Button 
            asChild
            disabled={!isRegistrationOpen}
            className={!isRegistrationOpen ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <Link href={`/events/${event.id}`}>
              {isRegistrationOpen ? 'Register' : 'Full'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EventsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video" />
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function EventsList() {
  const events = await getEvents()
  
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
        <p className="text-muted-foreground">
          Check back later for exciting events and tournaments!
        </p>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

export default function EventsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Events & Tournaments</h1>
        <p className="text-muted-foreground">
          Join our exciting sports events and tournaments. Connect with other players and compete!
        </p>
      </div>
      
      <Suspense fallback={<EventsSkeleton />}>
        <EventsList />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Events & Tournaments - Orange Sport Center',
  description: 'Join exciting sports events and tournaments at Orange Sport Center. Connect with players and compete in various sports activities.',
}