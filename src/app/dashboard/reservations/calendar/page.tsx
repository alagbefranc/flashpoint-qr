'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/components/ui/use-toast';

interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  partySize: number;
  date: Date;
  time: string;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  tableId?: string;
  specialRequests?: string;
  source: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  reservations: Reservation[];
}

function Calendar() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchReservations();
  }, [user, currentDate]);

  const fetchReservations = async () => {
    if (!user?.restaurantId) return;

    try {
      setLoading(true);
      
      // Get start and end of the month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const reservationsQuery = query(
        collection(db, 'restaurants', user.restaurantId, 'reservations'),
        where('date', '>=', startOfMonth),
        where('date', '<=', endOfMonth),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(reservationsQuery);
      const fetchedReservations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate()
        };
      }) as Reservation[];

      setReservations(fetchedReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reservations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        reservations: []
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayReservations = reservations.filter(reservation => 
        reservation.date.toDateString() === date.toDateString()
      );
      
      days.push({
        date,
        isCurrentMonth: true,
        reservations: dayReservations
      });
    }
    
    // Add days from next month to complete the week
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        reservations: []
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'seated':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (dateTime: Date) => {
    return dateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reservation Calendar</h1>
          <p className="text-sm text-muted-foreground">
            View your reservations in calendar format
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/reservations'}
          >
            Back to List
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard/reservations/add'}
          >
            Add Reservation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  →
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      min-h-[100px] p-2 border border-border cursor-pointer hover:bg-muted/50 transition-colors
                      ${!day.isCurrentMonth ? 'text-muted-foreground bg-muted/20' : ''}
                      ${isToday ? 'bg-primary/10 border-primary' : ''}
                      ${isSelected ? 'bg-primary/20' : ''}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    
                    {day.reservations.slice(0, 3).map(reservation => (
                      <div
                        key={reservation.id}
                        className={`text-xs p-1 mb-1 rounded border ${getStatusColor(reservation.status)}`}
                      >
                        <div className="font-medium truncate">
                          {formatTime(reservation.date)} - {reservation.customerName}
                        </div>
                        <div className="truncate">
                          Party of {reservation.partySize}
                        </div>
                      </div>
                    ))}
                    
                    {day.reservations.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{day.reservations.length - 3} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-4">
              {selectedDate ? selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              }) : 'Select a Date'}
            </h3>

            {selectedDate && (
              <div className="space-y-3">
                {reservations
                  .filter(res => res.date.toDateString() === selectedDate.toDateString())
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map(reservation => (
                    <div
                      key={reservation.id}
                      className={`p-3 rounded-lg border ${getStatusColor(reservation.status)}`}
                    >
                      <div className="font-medium">{formatTime(reservation.date)}</div>
                      <div className="text-sm">{reservation.customerName}</div>
                      <div className="text-xs">Party of {reservation.partySize}</div>
                      <div className="text-xs capitalize mt-1">{reservation.status}</div>
                    </div>
                  ))}

                {reservations.filter(res => res.date.toDateString() === selectedDate.toDateString()).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No reservations for this date
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Legend */}
          <Card className="p-4 mt-4">
            <h4 className="font-medium text-foreground mb-3">Status Legend</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded border ${getStatusColor('confirmed')}`}></div>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded border ${getStatusColor('seated')}`}></div>
                <span>Seated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded border ${getStatusColor('completed')}`}></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded border ${getStatusColor('cancelled')}`}></div>
                <span>Cancelled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded border ${getStatusColor('no-show')}`}></div>
                <span>No Show</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
