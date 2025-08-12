import { create } from 'zustand'
import { Venue, VenueTimeSlot, Reservation } from '@/types/database'

interface BookingState {
  selectedVenue: Venue | null
  selectedDate: string | null
  selectedTimeSlot: VenueTimeSlot | null
  availableSlots: VenueTimeSlot[]
  reservations: Reservation[]
  notes: string
  totalPrice: number
  duration: number
  loading: boolean
  isSubmitting: boolean
  setSelectedVenue: (venue: Venue | null) => void
  setSelectedDate: (date: string | null) => void
  setSelectedTimeSlot: (slot: VenueTimeSlot | null) => void
  setAvailableSlots: (slots: VenueTimeSlot[]) => void
  setReservations: (reservations: Reservation[]) => void
  setNotes: (notes: string) => void
  setLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void
  calculatePrice: () => void
  calculateDuration: () => void
  clearBooking: () => void
}

export const useBookingStore = create<BookingState>((set, get) => ({
  selectedVenue: null,
  selectedDate: null,
  selectedTimeSlot: null,
  availableSlots: [],
  reservations: [],
  notes: '',
  totalPrice: 0,
  duration: 0,
  loading: false,
  isSubmitting: false,
  setSelectedVenue: (venue) => {
    set({ selectedVenue: venue })
    get().calculatePrice()
  },
  setSelectedDate: (date) => {
    set({ selectedDate: date })
    get().calculatePrice()
  },
  setSelectedTimeSlot: (slot) => {
    set({ selectedTimeSlot: slot })
    get().calculatePrice()
    get().calculateDuration()
  },
  setAvailableSlots: (slots) => set({ availableSlots: slots }),
  setReservations: (reservations) => set({ reservations }),
  setNotes: (notes) => set({ notes }),
  setLoading: (loading) => set({ loading }),
  setSubmitting: (submitting) => set({ isSubmitting: submitting }),
  calculatePrice: () => {
    const { selectedDate, selectedTimeSlot } = get()
    
    if (!selectedDate || !selectedTimeSlot) {
      set({ totalPrice: 0 })
      return
    }
    
    const date = new Date(selectedDate)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    
    const price = isWeekend 
      ? selectedTimeSlot.price_weekend 
      : selectedTimeSlot.price_weekday
    
    set({ totalPrice: price })
  },
  calculateDuration: () => {
    const { selectedTimeSlot } = get()
    
    if (!selectedTimeSlot) {
      set({ duration: 0 })
      return
    }
    
    const start = new Date(`2000-01-01T${selectedTimeSlot.start_time}`)
    const end = new Date(`2000-01-01T${selectedTimeSlot.end_time}`)
    const durationMs = end.getTime() - start.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)
    
    set({ duration: durationHours })
  },
  clearBooking: () => set({
    selectedVenue: null,
    selectedDate: null,
    selectedTimeSlot: null,
    availableSlots: [],
    notes: '',
    totalPrice: 0,
    duration: 0,
    isSubmitting: false,
  }),
}))