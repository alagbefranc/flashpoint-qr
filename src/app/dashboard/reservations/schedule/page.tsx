'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';
import { Clock, Plus, Edit2, Trash2, Save, X, Calendar, Users, MessageSquare, Send, ChevronRight } from 'lucide-react';

interface TimeSlot {
  id: string;
  time: string;
  maxCapacity: number;
  isActive: boolean;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
}

interface SpecialHours {
  id: string;
  date: string;
  isOpen: boolean;
  customSlots?: TimeSlot[];
  note?: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  type: 'confirmation' | 'reminder' | 'followup';
  isActive: boolean;
}

interface SMSSettings {
  id: string;
  reminderHours: number;
  followupHours: number;
  isEnabled: boolean;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchedulePage() {
  const { user } = useAuth();
  const [timeSlots, setTimeSlots] = useState<{ [key: number]: TimeSlot[] }>({});
  const [specialHours, setSpecialHours] = useState<SpecialHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<{ dayOfWeek: number; slotId: string } | null>(null);
  const [newSlot, setNewSlot] = useState<{ dayOfWeek: number; time: string; maxCapacity: number } | null>(null);
  const [specialDate, setSpecialDate] = useState('');
  const [specialNote, setSpecialNote] = useState('');
  const [isAddingSpecial, setIsAddingSpecial] = useState(false);
  const [isSMSPanelOpen, setIsSMSPanelOpen] = useState(false);
  const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>([]);
  const [smsSettings, setSmsSettings] = useState<SMSSettings | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<{ name: string; message: string; type: 'confirmation' | 'reminder' | 'followup' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchScheduleData();
      fetchSMSData();
    }
  }, [user]);

  const fetchScheduleData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch regular time slots
      const slotsQuery = query(
        collection(db, 'timeSlots'),
        where('restaurantId', '==', user.uid)
      );
      const slotsSnapshot = await getDocs(slotsQuery);
      
      const slotsData: { [key: number]: TimeSlot[] } = {};
      slotsSnapshot.docs.forEach(doc => {
        const slot = { id: doc.id, ...doc.data() } as TimeSlot;
        if (!slotsData[slot.dayOfWeek]) {
          slotsData[slot.dayOfWeek] = [];
        }
        slotsData[slot.dayOfWeek].push(slot);
      });

      // Sort slots by time for each day
      Object.keys(slotsData).forEach(day => {
        slotsData[parseInt(day)].sort((a, b) => a.time.localeCompare(b.time));
      });

      setTimeSlots(slotsData);

      // Fetch special hours
      const specialQuery = query(
        collection(db, 'specialHours'),
        where('restaurantId', '==', user.uid)
      );
      const specialSnapshot = await getDocs(specialQuery);
      
      const specialData = specialSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SpecialHours[];

      setSpecialHours(specialData.sort((a, b) => a.date.localeCompare(b.date)));
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = async (dayOfWeek: number, time: string, maxCapacity: number) => {
    if (!user) return;

    try {
      const slotRef = doc(collection(db, 'timeSlots'));
      const newSlotData = {
        restaurantId: user.uid,
        dayOfWeek,
        time,
        maxCapacity,
        isActive: true,
        createdAt: new Date()
      };

      await setDoc(slotRef, newSlotData);
      
      const newSlot = { id: slotRef.id, ...newSlotData };
      
      setTimeSlots(prev => ({
        ...prev,
        [dayOfWeek]: [...(prev[dayOfWeek] || []), newSlot].sort((a, b) => a.time.localeCompare(b.time))
      }));

      setNewSlot(null);
    } catch (error) {
      console.error('Error adding time slot:', error);
    }
  };

  const updateTimeSlot = async (slotId: string, updates: Partial<TimeSlot>) => {
    if (!user) return;

    try {
      const slotRef = doc(db, 'timeSlots', slotId);
      await updateDoc(slotRef, updates);

      setTimeSlots(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(day => {
          updated[parseInt(day)] = updated[parseInt(day)].map(slot =>
            slot.id === slotId ? { ...slot, ...updates } : slot
          );
        });
        return updated;
      });

      setEditingSlot(null);
    } catch (error) {
      console.error('Error updating time slot:', error);
    }
  };

  const deleteTimeSlot = async (slotId: string, dayOfWeek: number) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'timeSlots', slotId));
      
      setTimeSlots(prev => ({
        ...prev,
        [dayOfWeek]: prev[dayOfWeek].filter(slot => slot.id !== slotId)
      }));
    } catch (error) {
      console.error('Error deleting time slot:', error);
    }
  };

  const addSpecialHours = async (date: string, isOpen: boolean, note?: string) => {
    if (!user) return;

    try {
      const specialRef = doc(collection(db, 'specialHours'));
      const specialData = {
        restaurantId: user.uid,
        date,
        isOpen,
        note: note || '',
        createdAt: new Date()
      };

      await setDoc(specialRef, specialData);
      
      const newSpecial = { id: specialRef.id, ...specialData };
      setSpecialHours(prev => [...prev, newSpecial].sort((a, b) => a.date.localeCompare(b.date)));
      
      setIsAddingSpecial(false);
      setSpecialDate('');
      setSpecialNote('');
    } catch (error) {
      console.error('Error adding special hours:', error);
    }
  };

  const deleteSpecialHours = async (specialId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'specialHours', specialId));
      setSpecialHours(prev => prev.filter(special => special.id !== specialId));
    } catch (error) {
      console.error('Error deleting special hours:', error);
    }
  };

  const fetchSMSData = async () => {
    if (!user) return;

    try {
      // Fetch SMS templates
      const templatesQuery = query(
        collection(db, 'smsTemplates'),
        where('restaurantId', '==', user.uid)
      );
      const templatesSnapshot = await getDocs(templatesQuery);
      const templatesData = templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SMSTemplate[];
      setSmsTemplates(templatesData);

      // Fetch SMS settings
      const settingsQuery = query(
        collection(db, 'smsSettings'),
        where('restaurantId', '==', user.uid)
      );
      const settingsSnapshot = await getDocs(settingsQuery);
      if (settingsSnapshot.docs.length > 0) {
        const settingsData = {
          id: settingsSnapshot.docs[0].id,
          ...settingsSnapshot.docs[0].data()
        } as SMSSettings;
        setSmsSettings(settingsData);
      } else {
        // Create default settings
        const defaultSettings = {
          restaurantId: user.uid,
          reminderHours: 24,
          followupHours: 2,
          isEnabled: true,
          createdAt: new Date()
        };
        const settingsRef = doc(collection(db, 'smsSettings'));
        await setDoc(settingsRef, defaultSettings);
        setSmsSettings({ id: settingsRef.id, ...defaultSettings });
      }
    } catch (error) {
      console.error('Error fetching SMS data:', error);
    }
  };

  const addSMSTemplate = async (name: string, message: string, type: 'confirmation' | 'reminder' | 'followup') => {
    if (!user) return;

    try {
      const templateRef = doc(collection(db, 'smsTemplates'));
      const templateData = {
        restaurantId: user.uid,
        name,
        message,
        type,
        isActive: true,
        createdAt: new Date()
      };

      await setDoc(templateRef, templateData);
      const newTemplate = { id: templateRef.id, ...templateData };
      setSmsTemplates(prev => [...prev, newTemplate]);
      setNewTemplate(null);
    } catch (error) {
      console.error('Error adding SMS template:', error);
    }
  };

  const updateSMSTemplate = async (templateId: string, updates: Partial<SMSTemplate>) => {
    if (!user) return;

    try {
      const templateRef = doc(db, 'smsTemplates', templateId);
      await updateDoc(templateRef, updates);
      setSmsTemplates(prev => prev.map(template => 
        template.id === templateId ? { ...template, ...updates } : template
      ));
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error updating SMS template:', error);
    }
  };

  const deleteSMSTemplate = async (templateId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'smsTemplates', templateId));
      setSmsTemplates(prev => prev.filter(template => template.id !== templateId));
    } catch (error) {
      console.error('Error deleting SMS template:', error);
    }
  };

  const updateSMSSettings = async (updates: Partial<SMSSettings>) => {
    if (!user || !smsSettings) return;

    try {
      const settingsRef = doc(db, 'smsSettings', smsSettings.id);
      await updateDoc(settingsRef, updates);
      setSmsSettings(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating SMS settings:', error);
    }
  };

  const renderTimeSlot = (slot: TimeSlot, dayOfWeek: number) => {
    const isEditing = editingSlot?.dayOfWeek === dayOfWeek && editingSlot?.slotId === slot.id;

    if (isEditing) {
      return (
        <div key={slot.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <input
              type="time"
              defaultValue={slot.time}
              onChange={(e) => {
                const updatedSlot = { ...slot, time: e.target.value };
                setTimeSlots(prev => ({
                  ...prev,
                  [dayOfWeek]: prev[dayOfWeek].map(s => s.id === slot.id ? updatedSlot : s)
                }));
              }}
              className="px-2 py-1 border rounded text-sm"
            />
            <Users className="h-4 w-4 text-blue-600" />
            <input
              type="number"
              defaultValue={slot.maxCapacity}
              onChange={(e) => {
                const updatedSlot = { ...slot, maxCapacity: parseInt(e.target.value) };
                setTimeSlots(prev => ({
                  ...prev,
                  [dayOfWeek]: prev[dayOfWeek].map(s => s.id === slot.id ? updatedSlot : s)
                }));
              }}
              className="px-2 py-1 border rounded text-sm w-20"
              min="1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={slot.isActive}
                onChange={(e) => {
                  const updatedSlot = { ...slot, isActive: e.target.checked };
                  setTimeSlots(prev => ({
                    ...prev,
                    [dayOfWeek]: prev[dayOfWeek].map(s => s.id === slot.id ? updatedSlot : s)
                  }));
                }}
              />
              Active
            </label>
            <div className="flex gap-1 ml-auto">
              <button
                onClick={() => updateTimeSlot(slot.id, timeSlots[dayOfWeek].find(s => s.id === slot.id)!)}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditingSlot(null)}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={slot.id} className={`border rounded-lg p-3 ${slot.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{slot.time}</span>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{slot.maxCapacity} seats</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs ${
              slot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {slot.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setEditingSlot({ dayOfWeek, slotId: slot.id })}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => deleteTimeSlot(slot.id, dayOfWeek)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Schedule & Time Slots</h1>
            <p className="text-gray-600">Manage your restaurant's availability and booking time slots</p>
          </div>
          <button
            onClick={() => setIsSMSPanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            SMS Reminders
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Regular Schedule */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
          <p className="text-gray-600 text-sm">Set your regular operating hours and time slots</p>
        </div>
        
        <div className="p-6 space-y-6">
          {DAYS_OF_WEEK.map((day, dayIndex) => (
            <div key={dayIndex} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">{day}</h3>
                <button
                  onClick={() => setNewSlot({ dayOfWeek: dayIndex, time: '12:00', maxCapacity: 4 })}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Slot
                </button>
              </div>

              {/* New Slot Form */}
              {newSlot?.dayOfWeek === dayIndex && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <input
                      type="time"
                      value={newSlot.time}
                      onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                      className="px-2 py-1 border rounded text-sm"
                    />
                    <Users className="h-4 w-4 text-yellow-600" />
                    <input
                      type="number"
                      value={newSlot.maxCapacity}
                      onChange={(e) => setNewSlot({ ...newSlot, maxCapacity: parseInt(e.target.value) })}
                      className="px-2 py-1 border rounded text-sm w-20"
                      min="1"
                      placeholder="Seats"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addTimeSlot(newSlot.dayOfWeek, newSlot.time, newSlot.maxCapacity)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setNewSlot(null)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Time Slots */}
              <div className="space-y-2">
                {timeSlots[dayIndex]?.length > 0 ? (
                  timeSlots[dayIndex].map(slot => renderTimeSlot(slot, dayIndex))
                ) : (
                  <p className="text-gray-500 text-sm italic">No time slots configured for this day</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Hours */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Special Hours</h2>
              <p className="text-gray-600 text-sm">Override regular hours for holidays, events, or closures</p>
            </div>
            <button
              onClick={() => setIsAddingSpecial(true)}
              className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Add Special Hours
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Add Special Hours Form */}
          {isAddingSpecial && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={specialDate}
                    onChange={(e) => setSpecialDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    onChange={(e) => {
                      // Handle status change if needed
                    }}
                  >
                    <option value="closed">Closed</option>
                    <option value="open">Open (Custom Hours)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <input
                    type="text"
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    placeholder="Holiday, Event, etc."
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addSpecialHours(specialDate, false, specialNote)}
                  disabled={!specialDate}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsAddingSpecial(false);
                    setSpecialDate('');
                    setSpecialNote('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Special Hours List */}
          <div className="space-y-3">
            {specialHours.length > 0 ? (
              specialHours.map(special => (
                <div key={special.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium">{new Date(special.date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-600">
                        {special.isOpen ? 'Custom Hours' : 'Closed'}
                        {special.note && ` • ${special.note}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSpecialHours(special.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No special hours configured</p>
            )}
          </div>
        </div>
      </div>

      {/* SMS Reminders Sliding Panel */}
      {isSMSPanelOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSMSPanelOpen(false)}
          />
          
          {/* Sliding Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              {/* Panel Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">SMS Reminders</h2>
                  <p className="text-gray-600 text-sm">Manage automated SMS notifications for reservations</p>
                </div>
                <button
                  onClick={() => setIsSMSPanelOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* SMS Settings */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable SMS Reminders</label>
                    <input
                      type="checkbox"
                      checked={smsSettings?.isEnabled || false}
                      onChange={(e) => updateSMSSettings({ isEnabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reminder Hours Before
                      </label>
                      <input
                        type="number"
                        value={smsSettings?.reminderHours || 24}
                        onChange={(e) => updateSMSSettings({ reminderHours: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        min="1"
                        max="168"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Follow-up Hours After
                      </label>
                      <input
                        type="number"
                        value={smsSettings?.followupHours || 2}
                        onChange={(e) => updateSMSSettings({ followupHours: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        min="1"
                        max="72"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SMS Templates */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Message Templates</h3>
                  <button
                    onClick={() => setNewTemplate({ name: '', message: '', type: 'confirmation' })}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Template
                  </button>
                </div>

                {/* New Template Form */}
                {newTemplate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                            placeholder="Template name"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={newTemplate.type}
                            onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as 'confirmation' | 'reminder' | 'followup' })}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="confirmation">Confirmation</option>
                            <option value="reminder">Reminder</option>
                            <option value="followup">Follow-up</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                          value={newTemplate.message}
                          onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                          placeholder="Your message template (use {name}, {date}, {time} for dynamic values)"
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addSMSTemplate(newTemplate.name, newTemplate.message, newTemplate.type)}
                          disabled={!newTemplate.name || !newTemplate.message}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setNewTemplate(null)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Templates List */}
                <div className="space-y-3">
                  {smsTemplates.length > 0 ? (
                    smsTemplates.map(template => (
                      <div key={template.id} className="border rounded-lg p-4">
                        {editingTemplate === template.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                defaultValue={template.name}
                                onChange={(e) => {
                                  const updated = { ...template, name: e.target.value };
                                  setSmsTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
                                }}
                                className="px-3 py-2 border rounded-lg text-sm"
                              />
                              <select
                                defaultValue={template.type}
                                onChange={(e) => {
                                  const updated = { ...template, type: e.target.value as 'confirmation' | 'reminder' | 'followup' };
                                  setSmsTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
                                }}
                                className="px-3 py-2 border rounded-lg text-sm"
                              >
                                <option value="confirmation">Confirmation</option>
                                <option value="reminder">Reminder</option>
                                <option value="followup">Follow-up</option>
                              </select>
                            </div>
                            <textarea
                              defaultValue={template.message}
                              onChange={(e) => {
                                const updated = { ...template, message: e.target.value };
                                setSmsTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
                              }}
                              rows={3}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                            <div className="flex justify-between items-center">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={template.isActive}
                                  onChange={(e) => {
                                    const updated = { ...template, isActive: e.target.checked };
                                    setSmsTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
                                  }}
                                  className="h-4 w-4 text-blue-600 rounded"
                                />
                                Active
                              </label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateSMSTemplate(template.id, smsTemplates.find(t => t.id === template.id)!)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingTemplate(null)}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900">{template.name}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  template.type === 'confirmation' ? 'bg-green-100 text-green-800' :
                                  template.type === 'reminder' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {template.type}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {template.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingTemplate(template.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteSMSTemplate(template.id)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{template.message}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No SMS templates configured</p>
                  )}
                </div>
              </div>

              {/* Test SMS */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-3">Test SMS</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Send Test Message</span>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="tel"
                      placeholder="Phone number (e.g., +1234567890)"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <select className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="">Select a template to test</option>
                      {smsTemplates.filter(t => t.isActive).map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                    >
                      <Send className="h-4 w-4" />
                      Send Test SMS
                    </button>
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    Note: Test messages will replace template variables with sample data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
