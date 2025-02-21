import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { addDays, format, parseISO, startOfDay, endOfDay } from 'date-fns';

export interface Booking {
  id: string;
  service_id: string;
  provider_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_price: number;
  special_requirements?: string;
  notes?: string;
  created_at: string;
  service?: {
    title: string;
    category: string;
    provider?: {
      full_name: string;
    };
  };
  client?: {
    full_name: string;
  };
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
}

export async function getBookings(
  status?: Booking['status'],
  startDate?: Date,
  endDate?: Date
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  let query = supabase
    .from('bookings')
    .select(`
      id,
      service_id,
      provider_id,
      client_id,
      start_time,
      end_time,
      status,
      total_price,
      special_requirements,
      notes,
      created_at,
      service:services (
        title,
        category,
        provider:profiles (
          full_name
        )
      ),
      client:profiles!client_id (
        full_name
      )
    `);

  // Filter by client
  query = query.eq('client_id', user.id);

  // Filter by status if provided
  if (status) {
    query = query.eq('status', status);
  }

  // Filter by date range if provided
  if (startDate) {
    query = query.gte('start_time', startOfDay(startDate).toISOString());
  }
  if (endDate) {
    query = query.lte('end_time', endOfDay(endDate).toISOString());
  }

  // Order by start time
  query = query.order('start_time', { ascending: false });

  const { data: bookings, error } = await query;

  if (error) throw error;
  return bookings || [];
}

export async function updateBookingStatus(
  bookingId: string,
  status: Booking['status'],
  notes?: string
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('bookings')
    .update({ 
      status,
      notes: notes ? notes : undefined,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .eq('provider_id', user.id);

  if (error) throw error;
}

export async function getProviderAvailability(providerId: string, date: Date) {
  const { data: availability, error: availabilityError } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId)
    .eq('day_of_week', date.getDay());

  if (availabilityError) throw availabilityError;

  const { data: blockedDates, error: blockedError } = await supabase
    .from('blocked_dates')
    .select('*')
    .eq('provider_id', providerId)
    .lte('start_date', endOfDay(date).toISOString())
    .gte('end_date', startOfDay(date).toISOString());

  if (blockedError) throw blockedError;

  const { data: existingBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('provider_id', providerId)
    .lte('start_time', endOfDay(date).toISOString())
    .gte('end_time', startOfDay(date).toISOString())
    .in('status', ['pending', 'confirmed']);

  if (bookingsError) throw bookingsError;

  // If no availability set for this day or date is blocked, return empty array
  if (!availability?.length || blockedDates?.length) {
    return [];
  }

  // Convert existing bookings to unavailable time slots
  const unavailableSlots = existingBookings?.map(booking => ({
    start: parseISO(booking.start_time),
    end: parseISO(booking.end_time)
  })) || [];

  // Generate available time slots based on provider's availability
  const availableSlots: AvailabilitySlot[] = [];
  
  availability.forEach(slot => {
    const [startHour, startMinute] = slot.start_time.split(':');
    const [endHour, endMinute] = slot.end_time.split(':');
    
    const slotStart = new Date(date);
    slotStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    
    const slotEnd = new Date(date);
    slotEnd.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    // Check if slot overlaps with any unavailable slots
    const isAvailable = !unavailableSlots.some(
      unavailable =>
        (slotStart >= unavailable.start && slotStart < unavailable.end) ||
        (slotEnd > unavailable.start && slotEnd <= unavailable.end)
    );

    if (isAvailable) {
      availableSlots.push({
        start_time: slotStart.toISOString(),
        end_time: slotEnd.toISOString()
      });
    }
  });

  return availableSlots;
}

export async function createBooking(data: {
  service_id: string;
  provider_id: string;
  start_time: string;
  end_time: string;
  total_price: number;
  special_requirements?: string;
}): Promise<Booking> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      ...data,
      client_id: user.id,
      status: 'pending'
    })
    .select(`
      *,
      service:services (
        title,
        provider:profiles (
          full_name
        )
      )
    `)
    .single();

  if (error) throw error;
  if (!booking) throw new Error('Failed to create booking');

  return booking;
}

// Subscribe to booking updates
export function subscribeToBookingUpdates(callback: (booking: Booking) => void) {
  return supabase
    .channel('booking_updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings'
      },
      (payload) => {
        callback(payload.new as Booking);
      }
    )
    .subscribe();
}