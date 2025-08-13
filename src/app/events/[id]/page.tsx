import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
//import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CalendarDays, MapPin, Users, Clock, DollarSign, Info } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

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
  rules?: string
  requirements?: string
  contact_info?: string
  created_at: string
}

async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching event:', error)
    return null
  }

  return event
}

function EventDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="aspect-video w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}

async function EventDetail({ id }: { id: string }) {
  const event = await getEvent(id)

  if (!event) {
    notFound()
  }

  const eventDate = new Date(event.event_date)
  const isRegistrationOpen = event.current_participants < event.max_participants && event.status === 'upcoming'
  const spotsLeft = event.max_participants - event.current_participants

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        {event.image_url && (
          <div className="aspect-video relative overflow-hidden rounded-lg mb-8">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute top-4 right-4">
              <Badge
                variant={event.status === 'upcoming' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {event.status}
              </Badge>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {event.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-sm text-muted-foreground">
                        {eventDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-sm text-muted-foreground">
                        {event.start_time} - {event.end_time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Registration Fee</p>
                      <p className="text-sm text-muted-foreground">
                        {event.registration_fee > 0
                          ? `Rp ${event.registration_fee.toLocaleString()}`
                          : 'Free'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rules & Requirements */}
            {(event.rules || event.requirements) && (
              <Card>
                <CardHeader>
                  <CardTitle>Rules & Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.rules && (
                    <div>
                      <h4 className="font-medium mb-2">Event Rules</h4>
                      <div className="text-sm text-muted-foreground whitespace-pre-line">
                        {event.rules}
                      </div>
                    </div>
                  )}

                  {event.requirements && (
                    <div>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <div className="text-sm text-muted-foreground whitespace-pre-line">
                        {event.requirements}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            {event.contact_info && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground whitespace-pre-line">
                    {event.contact_info}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {event.current_participants}/{event.max_participants}
                  </div>
                  <p className="text-sm text-muted-foreground">Participants</p>
                </div>

                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${(event.current_participants / event.max_participants) * 100}%`
                    }}
                  />
                </div>

                {spotsLeft > 0 && spotsLeft <= 5 && (
                  <p className="text-sm text-orange-600 font-medium text-center">
                    Only {spotsLeft} spots left!
                  </p>
                )}

                <Separator />

                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">
                    {event.registration_fee > 0
                      ? `Rp ${event.registration_fee.toLocaleString()}`
                      : 'Free Registration'
                    }
                  </div>

                  <Button
                    className="w-full"
                    disabled={!isRegistrationOpen}
                    asChild={isRegistrationOpen}
                  >
                    {isRegistrationOpen ? (
                      <Link href={`/events/${event.id}/register`}>
                        Register Now
                      </Link>
                    ) : (
                      <span>
                        {event.status === 'completed' ? 'Event Completed' :
                          event.status === 'cancelled' ? 'Event Cancelled' :
                            spotsLeft === 0 ? 'Registration Full' : 'Registration Closed'}
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventDetail id={id} />
    </Suspense>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    return {
      title: 'Event Not Found - Orange Sport Center',
      description: 'The requested event could not be found.'
    }
  }

  return {
    title: `${event.title} - Orange Sport Center`,
    description: event.description,
  }
}