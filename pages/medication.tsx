
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

interface Medication {
  id: string
  user_id: string
  name: string
  generic_name?: string
  dosage: string
  dosage_unit: string
  frequency: string
  schedule_times: string[]
  start_date: string
  end_date?: string
  prescribing_doctor: string
  pharmacy_name?: string
  pharmacy_phone?: string
  side_effects: string[]
  effectiveness_rating: number
  days_supply: number
  next_refill_date?: string
  special_instructions: string
  notes: string
  status: 'active' | 'paused' | 'discontinued'
  reminder_enabled: boolean
  created_at: string
  updated_at: string
}

interface MedicationTaken {
  id: string
  user_id: string
  medication_id: string
  taken_date: string
  taken_time: string
  scheduled_time: string
  taken: boolean
  notes?: string
  created_at: string
}

interface User {
  id: string
  full_name: string
  email: string
  account_type: string
}

export default function MedicationPage() {
  const [user, setUser] = useState<User | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [todaysMedications, setTodaysMedications] = useState<any[]>([])
  const [medicationsTaken, setMedicationsTaken] = useState<MedicationTaken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [activeSection, setActiveSection] = useState<'schedule' | 'medications' | 'history' | 'statistics'>('schedule')
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    dosage: '',
    dosage_unit: 'mg',
    frequency: 'twice-daily',
    schedule_times: ['08:00', '20:00'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    prescribing_doctor: '',
    pharmacy_name: '',
    pharmacy_phone: '',
    side_effects: [] as string[],
    effectiveness_rating: 3,
    days_supply: 30,
    next_refill_date: '',
    special_instructions: '',
    notes: '',
    status: 'active' as 'active' | 'paused' | 'discontinued',
    reminder_enabled: true
  })
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [newSideEffect, setNewSideEffect] = useState('')
  const router = useRouter()

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        router.push('/')
        return
      }

      const userData = {
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || session.user.email,
        email: session.user.email,
        account_type: session.user.user_metadata?.account_type || 'personal'
      }

      setUser(userData)
      await Promise.all([
        loadMedications(session.user.id),
        loadTodaysMedications(session.user.id),
        loadMedicationsTaken(session.user.id)
      ])
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkUser()
    requestNotificationPermission()
  }, [])

  const loadMedications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading medications:', error)
        showNotification('error', 'Failed to load medications')
        return
      }

      setMedications(data || [])
    } catch (error) {
      console.error('Error loading medications:', error)
      showNotification('error', 'Failed to load medications')
    }
  }

  const loadTodaysMedications = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { data: meds, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (error) throw error

      const todaysSchedule = (meds || []).flatMap(med => 
        med.schedule_times.map((time: string) => ({
          medication: med,
          scheduled_time: time,
          period: getTimePeriod(time),
          taken: false
        }))
      )

      setTodaysMedications(todaysSchedule)
    } catch (error) {
      console.error('Error loading today\'s medications:', error)
    }
  }

  const loadMedicationsTaken = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { data, error } = await supabase
        .from('medication_taken')
        .select('*')
        .eq('user_id', userId)
        .eq('taken_date', today)

      if (error) throw error
      setMedicationsTaken(data || [])
    } catch (error) {
      console.error('Error loading medications taken:', error)
    }
  }

  const getTimePeriod = (time: string) => {
    const hour = parseInt(time.split(':')[0])
    if (hour < 12) return 'AM'
    if (hour < 17) return 'Midday'
    return 'PM'
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      const medicationData = {
        user_id: user.id,
        name: formData.name,
        generic_name: formData.generic_name || null,
        dosage: formData.dosage,
        dosage_unit: formData.dosage_unit,
        frequency: formData.frequency,
        schedule_times: formData.schedule_times,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        prescribing_doctor: formData.prescribing_doctor,
        pharmacy_name: formData.pharmacy_name || null,
        pharmacy_phone: formData.pharmacy_phone || null,
        side_effects: formData.side_effects,
        effectiveness_rating: formData.effectiveness_rating,
        days_supply: formData.days_supply,
        next_refill_date: formData.next_refill_date || null,
        special_instructions: formData.special_instructions,
        notes: formData.notes,
        status: formData.status,
        reminder_enabled: formData.reminder_enabled
      }

      if (editingMedication) {
        const { error } = await supabase
          .from('medications')
          .update(medicationData)
          .eq('id', editingMedication.id)

        if (error) throw error
        showNotification('success', 'Medication updated successfully!')
      } else {
        const { error } = await supabase
          .from('medications')
          .insert([medicationData])

        if (error) throw error
        showNotification('success', 'Medication added successfully!')
      }

      await Promise.all([
        loadMedications(user.id),
        loadTodaysMedications(user.id)
      ])
      resetForm()
    } catch (error: any) {
      console.error('Error saving medication:', error)
      showNotification('error', `Failed to save medication: ${error.message}`)
    }
  }

  const markMedicationTaken = async (medication: Medication, scheduledTime: string, taken: boolean) => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toTimeString().slice(0, 5)

    try {
      const { error } = await supabase
        .from('medication_taken')
        .upsert({
          user_id: user.id,
          medication_id: medication.id,
          taken_date: today,
          taken_time: now,
          scheduled_time: scheduledTime,
          taken: taken
        }, {
          onConflict: 'user_id,medication_id,taken_date,scheduled_time'
        })

      if (error) throw error

      await loadMedicationsTaken(user.id)
      showNotification('success', taken ? 'Medication marked as taken!' : 'Medication marked as missed')
    } catch (error: any) {
      console.error('Error updating medication status:', error)
      showNotification('error', 'Failed to update medication status')
    }
  }

  const deleteMedication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) return

    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id)

      if (error) throw error

      showNotification('success', 'Medication deleted successfully!')
      if (user) {
        await Promise.all([
          loadMedications(user.id),
          loadTodaysMedications(user.id)
        ])
      }
    } catch (error: any) {
      console.error('Error deleting medication:', error)
      showNotification('error', `Failed to delete medication: ${error.message}`)
    }
  }

  const editMedication = (medication: Medication) => {
    setEditingMedication(medication)
    setFormData({
      name: medication.name,
      generic_name: medication.generic_name || '',
      dosage: medication.dosage,
      dosage_unit: medication.dosage_unit,
      frequency: medication.frequency,
      schedule_times: medication.schedule_times,
      start_date: medication.start_date,
      end_date: medication.end_date || '',
      prescribing_doctor: medication.prescribing_doctor,
      pharmacy_name: medication.pharmacy_name || '',
      pharmacy_phone: medication.pharmacy_phone || '',
      side_effects: medication.side_effects,
      effectiveness_rating: medication.effectiveness_rating,
      days_supply: medication.days_supply,
      next_refill_date: medication.next_refill_date || '',
      special_instructions: medication.special_instructions,
      notes: medication.notes,
      status: medication.status,
      reminder_enabled: medication.reminder_enabled
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      generic_name: '',
      dosage: '',
      dosage_unit: 'mg',
      frequency: 'twice-daily',
      schedule_times: ['08:00', '20:00'],
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      prescribing_doctor: '',
      pharmacy_name: '',
      pharmacy_phone: '',
      side_effects: [],
      effectiveness_rating: 3,
      days_supply: 30,
      next_refill_date: '',
      special_instructions: '',
      notes: '',
      status: 'active',
      reminder_enabled: true
    })
    setEditingMedication(null)
    setShowAddForm(false)
    setNewSideEffect('')
  }

  const addSideEffect = () => {
    if (newSideEffect.trim() && !formData.side_effects.includes(newSideEffect.trim())) {
      setFormData({
        ...formData,
        side_effects: [...formData.side_effects, newSideEffect.trim()]
      })
      setNewSideEffect('')
    }
  }

  const removeSideEffect = (effect: string) => {
    setFormData({
      ...formData,
      side_effects: formData.side_effects.filter(e => e !== effect)
    })
  }

  const updateScheduleTime = (index: number, time: string) => {
    const newTimes = [...formData.schedule_times]
    newTimes[index] = time
    setFormData({ ...formData, schedule_times: newTimes })
  }

  const addScheduleTime = () => {
    setFormData({
      ...formData,
      schedule_times: [...formData.schedule_times, '09:00']
    })
  }

  const removeScheduleTime = (index: number) => {
    if (formData.schedule_times.length > 1) {
      const newTimes = formData.schedule_times.filter((_, i) => i !== index)
      setFormData({ ...formData, schedule_times: newTimes })
    }
  }

  const getAdherenceRate = () => {
    if (medicationsTaken.length === 0) return 0
    const taken = medicationsTaken.filter(m => m.taken).length
    return Math.round((taken / medicationsTaken.length) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745'
      case 'paused': return '#ffc107'
      case 'discontinued': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const isMedicationTaken = (medicationId: string, scheduledTime: string) => {
    return medicationsTaken.some(mt => 
      mt.medication_id === medicationId && 
      mt.scheduled_time === scheduledTime && 
      mt.taken
    )
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
          <div style={{ color: '#005EB8', fontSize: '18px' }}>Loading medication management...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Medication Management - NeuroLog</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
          color: 'white',
          padding: '20px 24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginRight: '16px'
                }}
              >
                ← Back
              </button>
              <div>
                <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>💊 My Medications</h1>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Comprehensive medication management</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              + Add Medication
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div style={{
            background: notification.type === 'success' ? '#d4edda' : '#f8d7da',
            color: notification.type === 'success' ? '#155724' : '#721c24',
            padding: '12px 24px',
            textAlign: 'center',
            border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {notification.message}
          </div>
        )}

        {/* Navigation */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e1e5e9',
          padding: '0 24px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '32px'
          }}>
            {['schedule', 'medications', 'history', 'statistics'].map(section => (
              <button
                key={section}
                onClick={() => setActiveSection(section as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 0',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: activeSection === section ? '#005EB8' : '#666',
                  borderBottom: activeSection === section ? '3px solid #005EB8' : 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {section === 'schedule' ? "Today's Schedule" : section}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px'
        }}>
          {/* Today's Schedule */}
          {activeSection === 'schedule' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }}>
                <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>Today&apos;s Medication Schedule</h2>
                
                {['AM', 'Midday', 'PM'].map(period => {
                  const periodMeds = todaysMedications.filter(m => m.period === period)
                  
                  return (
                    <div key={period} style={{ marginBottom: '24px' }}>
                      <h3 style={{ 
                        color: '#005EB8', 
                        fontSize: '18px', 
                        marginBottom: '16px',
                        padding: '8px 16px',
                        backgroundColor: '#f0f8ff',
                        borderRadius: '8px',
                        border: '1px solid #e3f2fd'
                      }}>
                        {period} ({periodMeds.length} medications)
                      </h3>
                      
                      {periodMeds.length === 0 ? (
                        <div style={{ 
                          padding: '20px', 
                          textAlign: 'center', 
                          color: '#666',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px'
                        }}>
                          No medications scheduled for {period.toLowerCase()}
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {periodMeds.map((item, index) => {
                            const taken = isMedicationTaken(item.medication.id, item.scheduled_time)
                            
                            return (
                              <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px',
                                backgroundColor: taken ? '#e8f5e8' : 'white',
                                border: `2px solid ${taken ? '#28a745' : '#e1e5e9'}`,
                                borderRadius: '12px'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={taken}
                                  onChange={(e) => markMedicationTaken(item.medication, item.scheduled_time, e.target.checked)}
                                  style={{ 
                                    marginRight: '16px', 
                                    transform: 'scale(1.3)',
                                    accentColor: '#005EB8'
                                  }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontWeight: 'bold', 
                                    fontSize: '16px', 
                                    color: '#003087',
                                    marginBottom: '4px'
                                  }}>
                                    {item.medication.name}
                                  </div>
                                  <div style={{ color: '#666', fontSize: '14px' }}>
                                    {item.medication.dosage} {item.medication.dosage_unit} at {item.scheduled_time}
                                  </div>
                                  {item.medication.special_instructions && (
                                    <div style={{ 
                                      color: '#e67e22', 
                                      fontSize: '12px', 
                                      marginTop: '4px',
                                      fontStyle: 'italic'
                                    }}>
                                      {item.medication.special_instructions}
                                    </div>
                                  )}
                                </div>
                                <div style={{
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  backgroundColor: getStatusColor(item.medication.status),
                                  color: 'white'
                                }}>
                                  {item.medication.status}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Medications List */}
          {activeSection === 'medications' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>Current Medications</h2>

              {medications.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
                  <div>No medications added yet.</div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    style={{
                      marginTop: '16px',
                      background: '#005EB8',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Your First Medication
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {medications.map(medication => (
                    <div key={medication.id} style={{
                      border: '1px solid #e1e5e9',
                      borderRadius: '12px',
                      padding: '20px',
                      position: 'relative',
                      backgroundColor: medication.status === 'active' ? 'white' : '#f8f9fa'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h3 style={{ margin: '0', color: '#003087', fontSize: '20px' }}>
                              {medication.name}
                            </h3>
                            <div style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: getStatusColor(medication.status),
                              color: 'white'
                            }}>
                              {medication.status}
                            </div>
                          </div>
                          
                          {medication.generic_name && (
                            <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                              Generic: {medication.generic_name}
                            </div>
                          )}
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ color: '#666' }}>
                              <strong>Dosage:</strong> {medication.dosage} {medication.dosage_unit}
                            </div>
                            <div style={{ color: '#666' }}>
                              <strong>Frequency:</strong> {medication.frequency}
                            </div>
                            <div style={{ color: '#666' }}>
                              <strong>Times:</strong> {medication.schedule_times.join(', ')}
                            </div>
                            <div style={{ color: '#666' }}>
                              <strong>Doctor:</strong> {medication.prescribing_doctor}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                            <div style={{ color: '#666' }}>
                              <strong>Effectiveness:</strong> {'★'.repeat(medication.effectiveness_rating)}{'☆'.repeat(5-medication.effectiveness_rating)}
                            </div>
                            <div style={{ color: '#666' }}>
                              <strong>Days Supply:</strong> {medication.days_supply} days
                            </div>
                            {medication.next_refill_date && (
                              <div style={{ color: '#666' }}>
                                <strong>Next Refill:</strong> {new Date(medication.next_refill_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {medication.side_effects.length > 0 && (
                            <div style={{ color: '#e74c3c', fontSize: '14px', marginBottom: '8px' }}>
                              <strong>Side Effects:</strong> {medication.side_effects.join(', ')}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => editMedication(medication)}
                            style={{
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMedication(medication.id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {(medication.special_instructions || medication.notes) && (
                        <div style={{ 
                          background: '#f8f9fa', 
                          padding: '12px', 
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {medication.special_instructions && (
                            <div><strong>Instructions:</strong> {medication.special_instructions}</div>
                          )}
                          {medication.notes && (
                            <div><strong>Notes:</strong> {medication.notes}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics */}
          {activeSection === 'statistics' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005EB8', marginBottom: '8px' }}>
                    {medications.filter(m => m.status === 'active').length}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Active Medications</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745', marginBottom: '8px' }}>
                    {getAdherenceRate()}%
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Today&apos;s Adherence</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107', marginBottom: '8px' }}>
                    {medications.filter(m => m.next_refill_date && new Date(m.next_refill_date) <= new Date(Date.now() + 7*24*60*60*1000)).length}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Refills Due Soon</div>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Form Modal */}
          {showAddForm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto'
              }}>
                <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>
                  {editingMedication ? 'Edit Medication' : 'Add New Medication'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {/* Basic Information */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                          Medication Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                          Generic Name
                        </label>
                        <input
                          type="text"
                          value={formData.generic_name}
                          onChange={(e) => setFormData({...formData, generic_name: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Dosage */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                          Dosage *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 100, 2.5, 1/2"
                          value={formData.dosage}
                          onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                          Unit *
                        </label>
                        <select
                          value={formData.dosage_unit}
                          onChange={(e) => setFormData({...formData, dosage_unit: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="mg">mg</option>
                          <option value="ml">ml</option>
                          <option value="tablets">tablets</option>
                          <option value="capsules">capsules</option>
                          <option value="drops">drops</option>
                          <option value="sprays">sprays</option>
                          <option value="patches">patches</option>
                        </select>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Frequency *
                      </label>
                      <select
                        value={formData.frequency}
                        onChange={(e) => {
                          const freq = e.target.value
                          setFormData({
                            ...formData, 
                            frequency: freq,
                            schedule_times: freq === 'once-daily' ? ['08:00'] :
                                          freq === 'twice-daily' ? ['08:00', '20:00'] :
                                          freq === 'three-times-daily' ? ['08:00', '14:00', '20:00'] :
                                          freq === 'four-times-daily' ? ['08:00', '12:00', '16:00', '20:00'] :
                                          ['08:00']
                          })
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid #e1e5e9',
                          fontSize: '16px',
                          backgroundColor: 'white',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="once-daily">Once Daily</option>
                        <option value="twice-daily">Twice Daily</option>
                        <option value="three-times-daily">Three Times Daily</option>
                        <option value="four-times-daily">Four Times Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="as-needed">As Needed</option>
                      </select>
                    </div>

                    {/* Schedule Times */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Schedule Times
                      </label>
                      {formData.schedule_times.map((time, index) => (
                        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => updateScheduleTime(index, e.target.value)}
                            style={{
                              flex: 1,
                              padding: '12px',
                              borderRadius: '8px',
                              border: '2px solid #e1e5e9',
                              fontSize: '16px'
                            }}
                          />
                          {formData.schedule_times.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeScheduleTime(index)}
                              style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addScheduleTime}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        + Add Time
                      </button>
                    </div>

                    {/* Doctor and Pharmacy */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                          Prescribing Doctor *
                        </label>
                        <input
                          type="text"
                          value={formData.prescribing_doctor}
                          onChange={(e) => setFormData({...formData, prescribing_doctor: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                          Pharmacy Name
                        </label>
                        <input
                          type="text"
                          value={formData.pharmacy_name}
                          onChange={(e) => setFormData({...formData, pharmacy_name: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Effectiveness and Days Supply */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                          Effectiveness (1-5 stars): {formData.effectiveness_rating}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={formData.effectiveness_rating}
                          onChange={(e) => setFormData({...formData, effectiveness_rating: parseInt(e.target.value)})}
                          style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                          Days Supply
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.days_supply}
                          onChange={(e) => setFormData({...formData, days_supply: parseInt(e.target.value)})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Side Effects */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Side Effects
                      </label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          placeholder="Enter side effect"
                          value={newSideEffect}
                          onChange={(e) => setNewSideEffect(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={addSideEffect}
                          style={{
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {formData.side_effects.map(effect => (
                          <span
                            key={effect}
                            style={{
                              background: '#e74c3c',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {effect}
                            <button
                              type="button"
                              onClick={() => removeSideEffect(effect)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '16px'
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Instructions and Notes */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Special Instructions
                      </label>
                      <textarea
                        value={formData.special_instructions}
                        onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                        placeholder="e.g., Take with food, Avoid alcohol"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid #e1e5e9',
                          fontSize: '16px',
                          minHeight: '80px',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Status and Reminders */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="discontinued">Discontinued</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '32px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.reminder_enabled}
                            onChange={(e) => setFormData({...formData, reminder_enabled: e.target.checked})}
                            style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                          />
                          <span style={{ fontSize: '16px', color: '#333' }}>
                            Enable reminders
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{
                        flex: 1,
                        padding: '16px',
                        background: 'transparent',
                        color: '#666',
                        border: '2px solid #e1e5e9',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        flex: 2,
                        padding: '16px',
                        background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)'
                      }}
                    >
                      {editingMedication ? 'Update Medication' : 'Add Medication'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
