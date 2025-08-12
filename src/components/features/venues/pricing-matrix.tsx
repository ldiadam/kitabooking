'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Plus, Trash2, Clock, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'

type VenueTimeSlot = Database['public']['Tables']['venue_time_slots']['Row']
type VenueTimeSlotInsert = Database['public']['Tables']['venue_time_slots']['Insert']
type VenueTimeSlotUpdate = Database['public']['Tables']['venue_time_slots']['Update']

interface PricingMatrixProps {
  venueId: string
  basePrice: number
  weekendPrice?: number
  onPricingUpdate?: () => void
}

interface TimeSlotForm {
  id?: string
  start_time: string
  end_time: string
  price_multiplier: number
  is_available: boolean
}

const DEFAULT_TIME_SLOTS = [
  { start: '06:00', end: '07:00', multiplier: 0.8 },
  { start: '07:00', end: '08:00', multiplier: 0.8 },
  { start: '08:00', end: '09:00', multiplier: 0.9 },
  { start: '09:00', end: '10:00', multiplier: 1.0 },
  { start: '10:00', end: '11:00', multiplier: 1.0 },
  { start: '11:00', end: '12:00', multiplier: 1.0 },
  { start: '12:00', end: '13:00', multiplier: 1.0 },
  { start: '13:00', end: '14:00', multiplier: 1.0 },
  { start: '14:00', end: '15:00', multiplier: 1.0 },
  { start: '15:00', end: '16:00', multiplier: 1.0 },
  { start: '16:00', end: '17:00', multiplier: 1.1 },
  { start: '17:00', end: '18:00', multiplier: 1.3 },
  { start: '18:00', end: '19:00', multiplier: 1.3 },
  { start: '19:00', end: '20:00', multiplier: 1.3 },
  { start: '20:00', end: '21:00', multiplier: 1.2 },
  { start: '21:00', end: '22:00', multiplier: 1.1 },
  { start: '22:00', end: '23:00', multiplier: 1.0 },
]

export function PricingMatrix({ venueId, basePrice, weekendPrice, onPricingUpdate }: PricingMatrixProps) {
  const [timeSlots, setTimeSlots] = useState<VenueTimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingSlots, setEditingSlots] = useState<TimeSlotForm[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchTimeSlots()
  }, [venueId])

  async function fetchTimeSlots() {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('venue_time_slots')
        .select('*')
        .eq('venue_id', venueId)
        .order('start_time')

      if (fetchError) throw fetchError

      setTimeSlots(data || [])
      setEditingSlots(data?.map(slot => ({
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        price_multiplier: slot.price_multiplier || 1,
        is_available: slot.is_available
      })) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load time slots')
    } finally {
      setLoading(false)
    }
  }

  async function generateDefaultSlots() {
    try {
      setSaving(true)
      setError(null)

      // Delete existing slots
      const { error: deleteError } = await supabase
        .from('venue_time_slots')
        .delete()
        .eq('venue_id', venueId)

      if (deleteError) throw deleteError

      // Insert default slots
      const slotsToInsert: VenueTimeSlotInsert[] = DEFAULT_TIME_SLOTS.map(slot => ({
        venue_id: venueId,
        start_time: slot.start,
        end_time: slot.end,
        price_multiplier: slot.multiplier,
        is_available: true
      }))

      const { error: insertError } = await supabase
        .from('venue_time_slots')
        .insert(slotsToInsert)

      if (insertError) throw insertError

      setSuccess('Default time slots generated successfully!')
      await fetchTimeSlots()
      onPricingUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate default slots')
    } finally {
      setSaving(false)
    }
  }

  async function saveTimeSlots() {
    try {
      setSaving(true)
      setError(null)

      // Validate slots
      for (const slot of editingSlots) {
        if (!slot.start_time || !slot.end_time) {
          throw new Error('All time slots must have start and end times')
        }
        if (slot.start_time >= slot.end_time) {
          throw new Error('End time must be after start time')
        }
        if (slot.price_multiplier < 0) {
          throw new Error('Price multiplier cannot be negative')
        }
      }

      // Update existing slots and insert new ones
      for (const slot of editingSlots) {
        if (slot.id) {
          // Update existing slot
          const { error: updateError } = await supabase
            .from('venue_time_slots')
            .update({
              start_time: slot.start_time,
              end_time: slot.end_time,
              price_multiplier: slot.price_multiplier,
              is_available: slot.is_available
            })
            .eq('id', slot.id)

          if (updateError) throw updateError
        } else {
          // Insert new slot
          const { error: insertError } = await supabase
            .from('venue_time_slots')
            .insert({
              venue_id: venueId,
              start_time: slot.start_time,
              end_time: slot.end_time,
              price_multiplier: slot.price_multiplier,
              is_available: slot.is_available
            })

          if (insertError) throw insertError
        }
      }

      setSuccess('Time slots updated successfully!')
      await fetchTimeSlots()
      onPricingUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save time slots')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTimeSlot(slotId: string) {
    try {
      setSaving(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('venue_time_slots')
        .delete()
        .eq('id', slotId)

      if (deleteError) throw deleteError

      setSuccess('Time slot deleted successfully!')
      await fetchTimeSlots()
      onPricingUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete time slot')
    } finally {
      setSaving(false)
    }
  }

  function addNewSlot() {
    setEditingSlots([...editingSlots, {
      start_time: '09:00',
      end_time: '10:00',
      price_multiplier: 1.0,
      is_available: true
    }])
  }

  function updateSlot(index: number, field: keyof TimeSlotForm, value: any) {
    const updated = [...editingSlots]
    updated[index] = { ...updated[index], [field]: value }
    setEditingSlots(updated)
  }

  function removeSlot(index: number) {
    const slot = editingSlots[index]
    if (slot.id) {
      deleteTimeSlot(slot.id)
    } else {
      const updated = editingSlots.filter((_, i) => i !== index)
      setEditingSlots(updated)
    }
  }

  function calculatePrice(multiplier: number, isWeekend: boolean = false) {
    const price = isWeekend && weekendPrice ? weekendPrice : basePrice
    return price * multiplier
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pricing Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Base Pricing Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-sm font-medium">Weekday Base Price</Label>
              <div className="text-lg font-semibold text-primary">
                {formatCurrency(basePrice)}/hour
              </div>
            </div>
            {weekendPrice && (
              <div>
                <Label className="text-sm font-medium">Weekend Base Price</Label>
                <div className="text-lg font-semibold text-primary">
                  {formatCurrency(weekendPrice)}/hour
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={generateDefaultSlots}
              disabled={saving}
              variant="outline"
            >
              Generate Default Slots
            </Button>
            <Button
              onClick={addNewSlot}
              disabled={saving}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </Button>
            <Button
              onClick={saveTimeSlots}
              disabled={saving || editingSlots.length === 0}
            >
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
          </div>

          {/* Time Slots Table */}
          {editingSlots.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Start Time</div>
                <div className="col-span-2">End Time</div>
                <div className="col-span-2">Multiplier</div>
                <div className="col-span-2">Weekday Price</div>
                <div className="col-span-2">Weekend Price</div>
                <div className="col-span-1">Available</div>
                <div className="col-span-1">Actions</div>
              </div>

              {editingSlots.map((slot, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-lg">
                  <div className="col-span-2">
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={slot.price_multiplier}
                      onChange={(e) => updateSlot(index, 'price_multiplier', parseFloat(e.target.value) || 0)}
                      disabled={saving}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium">
                      {formatCurrency(calculatePrice(slot.price_multiplier, false))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium">
                      {formatCurrency(calculatePrice(slot.price_multiplier, true))}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Switch
                      checked={slot.is_available}
                      onCheckedChange={(checked) => updateSlot(index, 'is_available', checked)}
                      disabled={saving}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlot(index)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {editingSlots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time slots configured</p>
              <p className="text-sm">Generate default slots or add custom time slots to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}