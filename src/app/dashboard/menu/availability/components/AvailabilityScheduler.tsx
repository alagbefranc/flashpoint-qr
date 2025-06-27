'use client';

import { useState } from 'react';

export interface TimeSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
}

export interface MenuItemAvailability {
  itemId: string;
  alwaysAvailable: boolean;
  timeSlots: TimeSlot[];
  seasonalAvailability?: {
    startDate: string;
    endDate: string;
  };
}

interface AvailabilitySchedulerProps {
  itemId: string;
  itemName: string;
  availability: MenuItemAvailability;
  onSave: (availability: MenuItemAvailability) => void;
}

export const AvailabilityScheduler: React.FC<AvailabilitySchedulerProps> = ({
  itemId,
  itemName,
  availability,
  onSave,
}) => {
  const [currentAvailability, setCurrentAvailability] = useState<MenuItemAvailability>(availability);
  const [selectedDay, setSelectedDay] = useState<TimeSlot['day'] | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  
  const daysOfWeek: TimeSlot['day'][] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  
  const formatDay = (day: string): string => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };
  
  const handleAlwaysAvailableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isAlwaysAvailable = e.target.checked;
    
    setCurrentAvailability(prev => ({
      ...prev,
      alwaysAvailable: isAlwaysAvailable
    }));
  };
  
  const handleAddTimeSlot = () => {
    if (!selectedDay || !startTime || !endTime) {
      return;
    }
    
    // Validate time range
    if (startTime >= endTime) {
      alert('End time must be after start time.');
      return;
    }
    
    const newTimeSlot: TimeSlot = {
      day: selectedDay,
      startTime,
      endTime
    };
    
    // Check if a slot for this day already exists
    const existingSlotIndex = currentAvailability.timeSlots.findIndex(
      slot => slot.day === selectedDay
    );
    
    if (existingSlotIndex >= 0) {
      // Update existing slot
      const updatedTimeSlots = [...currentAvailability.timeSlots];
      updatedTimeSlots[existingSlotIndex] = newTimeSlot;
      
      setCurrentAvailability(prev => ({
        ...prev,
        timeSlots: updatedTimeSlots
      }));
    } else {
      // Add new slot
      setCurrentAvailability(prev => ({
        ...prev,
        timeSlots: [...prev.timeSlots, newTimeSlot]
      }));
    }
    
    // Reset selection
    setSelectedDay(null);
  };
  
  const handleRemoveTimeSlot = (day: TimeSlot['day']) => {
    setCurrentAvailability(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(slot => slot.day !== day)
    }));
  };
  
  const handleSeasonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setCurrentAvailability(prev => ({
      ...prev,
      seasonalAvailability: {
        ...prev.seasonalAvailability || { startDate: '', endDate: '' },
        [name]: value
      }
    }));
  };
  
  const handleRemoveSeasonal = () => {
    setCurrentAvailability(prev => {
      const { seasonalAvailability, ...rest } = prev;
      return rest;
    });
  };
  
  const handleSave = () => {
    onSave(currentAvailability);
  };
  
  const formatTime = (time: string) => {
    try {
      const [hour, minute] = time.split(':').map(Number);
      return new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return time;
    }
  };
  
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold">{itemName}</h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Always Available Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Always Available</h3>
            <p className="text-sm text-muted-foreground">This item is available at all times</p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={currentAvailability.alwaysAvailable}
                onChange={handleAlwaysAvailableChange}
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
        
        {!currentAvailability.alwaysAvailable && (
          <>
            {/* Time Slot Selection */}
            <div>
              <h3 className="font-medium mb-3">Availability Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-sm mb-1">Day</label>
                  <select
                    value={selectedDay || ''}
                    onChange={e => setSelectedDay(e.target.value as TimeSlot['day'] || null)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-md"
                  >
                    <option value="">Select Day</option>
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{formatDay(day)}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-md"
                  />
                </div>
              </div>
              
              <button
                onClick={handleAddTimeSlot}
                disabled={!selectedDay}
                className={`w-full py-2 rounded-md ${
                  selectedDay
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                Add Time Slot
              </button>
            </div>
            
            {/* Current Time Slots */}
            <div>
              <h3 className="font-medium mb-3">Current Time Slots</h3>
              
              {currentAvailability.timeSlots.length === 0 ? (
                <div className="bg-muted/20 border border-border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No time slots added yet.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/20">
                      <tr>
                        <th className="px-4 py-2 text-left">Day</th>
                        <th className="px-4 py-2 text-left">Hours</th>
                        <th className="px-4 py-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {daysOfWeek.map(day => {
                        const timeSlot = currentAvailability.timeSlots.find(
                          slot => slot.day === day
                        );
                        
                        if (!timeSlot) return null;
                        
                        return (
                          <tr key={day}>
                            <td className="px-4 py-3 font-medium">{formatDay(day)}</td>
                            <td className="px-4 py-3">
                              {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveTimeSlot(day)}
                                className="p-1 text-card-foreground hover:bg-error/10 hover:text-error rounded-md"
                                title="Remove time slot"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Seasonal Availability */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Seasonal Availability</h3>
                {!currentAvailability.seasonalAvailability && (
                  <button
                    onClick={() => setCurrentAvailability(prev => ({
                      ...prev,
                      seasonalAvailability: { startDate: '', endDate: '' }
                    }))}
                    className="text-sm text-primary"
                  >
                    Add Seasonal Availability
                  </button>
                )}
              </div>
              
              {currentAvailability.seasonalAvailability ? (
                <div className="bg-card border border-border rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={currentAvailability.seasonalAvailability.startDate}
                        onChange={handleSeasonalChange}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1">End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={currentAvailability.seasonalAvailability.endDate}
                        onChange={handleSeasonalChange}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleRemoveSeasonal}
                      className="text-sm text-error"
                    >
                      Remove Seasonal Availability
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/20 border border-border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No seasonal availability set.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <div className="p-4 border-t border-border">
        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90"
        >
          Save Availability
        </button>
      </div>
    </div>
  );
};
