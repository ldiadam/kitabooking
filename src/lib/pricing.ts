import { createClient } from '@/lib/supabase/client'
import { VenueTimeSlot } from '@/types/database'

export interface PricingRule {
  id: string
  venueTypeId: string
  timeSlot: { start: string; end: string }
  weekdayPrice: number
  weekendPrice: number
  isActive: boolean
}

export interface PricingCalculation {
  basePrice: number
  discountAmount: number
  totalPrice: number
  duration: number
  isWeekend: boolean
}

export async function calculatePrice(
  venueId: string,
  date: Date,
  startTime: string,
  endTime: string,
  discountPercent: number = 0
): Promise<PricingCalculation> {
  const supabase = createClient()
  
  // Check if the date is weekend (Saturday = 6, Sunday = 0)
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  
  // Calculate duration in minutes
  const start = new Date(`2000-01-01T${startTime}:00`)
  const end = new Date(`2000-01-01T${endTime}:00`)
  const duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes
  
  // Get venue time slots that overlap with the requested time
  const { data: timeSlots, error } = await supabase
    .from('venue_time_slots')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
  
  if (error) {
    throw new Error(`Failed to fetch pricing: ${error.message}`)
  }
  
  if (!timeSlots || timeSlots.length === 0) {
    throw new Error('No pricing information available for this venue')
  }
  
  // Find the applicable time slot
  const applicableSlot = timeSlots.find(slot => {
    const slotStart = new Date(`2000-01-01T${slot.start_time}`)
    const slotEnd = new Date(`2000-01-01T${slot.end_time}`)
    
    // Check if requested time falls within this slot
    return start >= slotStart && end <= slotEnd
  })
  
  if (!applicableSlot) {
    throw new Error('No pricing available for the selected time slot')
  }
  
  // Calculate base price
  const hourlyRate = isWeekend 
    ? (applicableSlot.price_weekend || 0)
    : (applicableSlot.price_weekday || 0)
  
  const basePrice = (hourlyRate * duration) / 60 // Convert to hourly rate
  
  // Calculate discount
  const discountAmount = (basePrice * discountPercent) / 100
  const totalPrice = basePrice - discountAmount
  
  return {
    basePrice: Math.round(basePrice),
    discountAmount: Math.round(discountAmount),
    totalPrice: Math.round(totalPrice),
    duration,
    isWeekend,
  }
}

export async function getVenuePricing(venueId: string): Promise<VenueTimeSlot[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('venue_time_slots')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('start_time')
  
  if (error) {
    throw new Error(`Failed to fetch venue pricing: ${error.message}`)
  }
  
  return data || []
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function generateReservationCode(): string {
  const prefix = 'OSC'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}${timestamp}${random}`
}