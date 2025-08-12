import { z } from 'zod'

export const bookingSchema = z.object({
  venueId: z.string().min(1, 'Please select a venue'),
  date: z.string().min(1, 'Please select a date'),
  startTime: z.string().min(1, 'Please select a start time'),
  endTime: z.string().min(1, 'Please select an end time'),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    const start = new Date(`2000-01-01T${data.startTime}`)
    const end = new Date(`2000-01-01T${data.endTime}`)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return end > start && durationHours >= 1
  }
  return true
}, {
  message: 'Minimum booking duration is 1 hour',
  path: ['endTime']
})

export type BookingFormData = z.infer<typeof bookingSchema>

export const reservationSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  reservationDate: z.string().refine((date) => {
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate >= today
  }, 'Reservation date must be today or in the future'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 characters'),
  customerEmail: z.string().email('Invalid email address').optional(),
  notes: z.string().optional(),
  discountPercent: z.number().min(0).max(100).default(0),
}).refine((data) => {
  const start = new Date(`2000-01-01T${data.startTime}:00`)
  const end = new Date(`2000-01-01T${data.endTime}:00`)
  return end > start
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export const venueSchema = z.object({
  name: z.string().min(2, 'Venue name must be at least 2 characters'),
  venueTypeId: z.string().uuid('Invalid venue type ID'),
  description: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  isActive: z.boolean().default(true),
})

export const venueTypeSchema = z.object({
  name: z.string().min(2, 'Venue type name must be at least 2 characters'),
  slotDuration: z.number().min(15).max(480).default(60), // 15 minutes to 8 hours
})

export const timeSlotSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  priceWeekday: z.number().min(0, 'Price must be positive'),
  priceWeekend: z.number().min(0, 'Price must be positive'),
  isActive: z.boolean().default(true),
}).refine((data) => {
  const start = new Date(`2000-01-01T${data.startTime}:00`)
  const end = new Date(`2000-01-01T${data.endTime}:00`)
  return end > start
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export const financialTransactionSchema = z.object({
  reservationId: z.string().uuid('Invalid reservation ID').optional(),
  transactionType: z.enum(['income', 'expense']),
  amount: z.number().min(0, 'Amount must be positive'),
  description: z.string().optional(),
  transactionDate: z.string().optional(),
})

export type ReservationFormData = z.infer<typeof reservationSchema>
export type VenueFormData = z.infer<typeof venueSchema>
export type VenueTypeFormData = z.infer<typeof venueTypeSchema>
export type TimeSlotFormData = z.infer<typeof timeSlotSchema>
export type FinancialTransactionFormData = z.infer<typeof financialTransactionSchema>