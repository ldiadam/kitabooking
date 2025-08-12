'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUpload } from '@/components/ui/image-upload'
import { PricingMatrix } from '@/components/features/venues/pricing-matrix'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { z } from 'zod'
import type { Database } from '@/types/database'

type Venue = Database['public']['Tables']['venues']['Row'] & {
  venue_types: Database['public']['Tables']['venue_types']['Row']
}

type VenueType = Database['public']['Tables']['venue_types']['Row']

const venueSchema = z.object({
  name: z.string().min(1, 'Venue name is required'),
  description: z.string().optional(),
  venue_type_id: z.string().min(1, 'Venue type is required'),
  base_price: z.number().min(0, 'Base price must be positive'),
  weekend_price: z.number().min(0, 'Weekend price must be positive').optional(),
  is_active: z.boolean(),
  image_url: z.string().optional(),
})

type VenueFormData = z.infer<typeof venueSchema>

interface EditVenuePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditVenuePage({ params }: EditVenuePageProps) {
  const [venue, setVenue] = useState<Venue | null>(null)
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [venueId, setVenueId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: '',
      description: '',
      venue_type_id: '',
      base_price: 0,
      weekend_price: 0,
      is_active: true,
      image_url: '',
    },
  })

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setVenueId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (venueId) {
      fetchData()
    }
  }, [venueId])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      // Fetch venue data
      const { data: venueData, error: venueError } = await supabase
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
        .single()

      if (venueError) {
        throw new Error('Venue not found')
      }

      // Fetch venue types
      const { data: venueTypesData, error: venueTypesError } = await supabase
        .from('venue_types')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (venueTypesError) {
        throw new Error('Failed to load venue types')
      }

      setVenue(venueData as Venue)
      setVenueTypes(venueTypesData || [])

      // Set form values
      form.reset({
        name: venueData.name,
        description: venueData.description || '',
        venue_type_id: venueData.venue_type_id,
        base_price: venueData.base_price,
        weekend_price: venueData.weekend_price || venueData.base_price,
        is_active: venueData.is_active,
        image_url: venueData.image_url || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venue data')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(data: VenueFormData) {
    try {
      setSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('venues')
        .update({
          name: data.name,
          description: data.description || null,
          venue_type_id: data.venue_type_id,
          base_price: data.base_price,
          weekend_price: data.weekend_price || null,
          is_active: data.is_active,
          image_url: data.image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', venueId)

      if (updateError) {
        throw new Error('Failed to update venue')
      }

      router.push('/admin/venues')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update venue')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Venue not found</h3>
            <p className="text-muted-foreground mb-4">
              The venue youre looking for doesnt exist or has been deleted.
            </p>
            <Button asChild>
              <Link href="/admin/venues">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Venues
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/venues">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Venue</h1>
            <p className="text-muted-foreground">Update venue information and settings</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Venue Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Current Image */}
                {venue.image_url && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Image</label>
                    <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={venue.image_url}
                        alt={venue.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Venue Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter venue name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter venue description"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Venue Type */}
                <FormField
                  control={form.control}
                  name="venue_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select venue type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {venueTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="base_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price (Weekday)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weekend_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weekend Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Image Upload */}
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Image</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ''}
                          onChange={field.onChange}
                          bucket="venues"
                          folder="venue-images"
                          disabled={saving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Active Status */}
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable this venue for bookings
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/venues">Cancel</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Pricing Matrix */}
        {venue && (
          <PricingMatrix
            venueId={venue.id}
            basePrice={venue.base_price}
            weekendPrice={venue.weekend_price === null ? undefined : venue.weekend_price}
            onPricingUpdate={() => {
              // Optionally refresh venue data or show success message
            }}
          />
        )}
      </div>
    </div>
  )
}