import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  schedule_times: string[]
  start_date: string
  end_date?: string
  notes: string
  is_active: boolean
  reminder_enabled: boolean
  created_at: string
  updated_at: string
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
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    schedule_times: ['09:00'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
    reminder_enabled: true
  })
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    requestNotificationPermission()
  }, [])

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
      await loadMedications(session.user.id)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

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
        dosage: formData.dosage,
        frequency: formData.frequency,
        schedule_times: formData.schedule_times,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        notes: formData.notes,
        reminder_enabled: formData.reminder_enabled,
        is_active: true
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

      await loadMedications(user.id)
      resetForm()
      scheduleReminders()
    } catch (error: any) {
      console.error('Error saving medication:', error)
      showNotification('error', `Failed to save medication: ${error.message}`)
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
      if (user) await loadMedications(user.id)
    } catch (error: any) {
      console.error('Error deleting medication:', error)
      showNotification('error', `Failed to delete medication: ${error.message}`)
    }
  }

  const toggleMedication = async (medication: Medication) => {
    try {
      const { error } = await supabase
        .from('medications')
        .update({ is_active: !medication.is_active })
        .eq('id', medication.id)

      if (error) throw error

      showNotification('success', `Medication ${medication.is_active ? 'deactivated' : 'activated'}!`)
      if (user) await loadMedications(user.id)
    } catch (error: any) {
      console.error('Error updating medication:', error)
      showNotification('error', `Failed to update medication: ${error.message}`)
    }
  }

  const editMedication = (medication: Medication) => {
    setEditingMedication(medication)
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      schedule_times: medication.schedule_times,
      start_date: medication.start_date,
      end_date: medication.end_date || '',
      notes: medication.notes,
      reminder_enabled: medication.reminder_enabled
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: 'daily',
      schedule_times: ['09:00'],
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: '',
      reminder_enabled: true
    })
    setEditingMedication(null)
    setShowAddForm(false)
  }

  const addScheduleTime = () => {
    setFormData({
      ...formData,
      schedule_times: [...formData.schedule_times, '09:00']
    })
  }

  const updateScheduleTime = (index: number, time: string) => {
    const newTimes = [...formData.schedule_times]
    newTimes[index] = time
    setFormData({
      ...formData,
      schedule_times: newTimes
    })
  }

  const removeScheduleTime = (index: number) => {
    if (formData.schedule_times.length > 1) {
      const newTimes = formData.schedule_times.filter((_, i) => i !== index)
      setFormData({
        ...formData,
        schedule_times: newTimes
      })
    }
  }

  const scheduleReminders = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      medications.forEach(medication => {
        if (medication.reminder_enabled && medication.is_active) {
          medication.schedule_times.forEach(time => {
            const [hours, minutes] = time.split(':').map(Number)
            const now = new Date()
            const reminderTime = new Date()
            reminderTime.setHours(hours, minutes, 0, 0)

            if (reminderTime <= now) {
              reminderTime.setDate(reminderTime.getDate() + 1)
            }

            const timeUntilReminder = reminderTime.getTime() - now.getTime()

            setTimeout(() => {
              new Notification(`Medication Reminder: ${medication.name}`, {
                body: `Time to take ${medication.dosage} of ${medication.name}`,
                icon: '/favicon.ico'
              })
            }, timeUntilReminder)
          })
        }
      })
    }
  }

  const getNextDose = (medication: Medication) => {
    const now = new Date()
    const times = medication.schedule_times.map(time => {
      const [hours, minutes] = time.split(':').map(Number)
      const doseTime = new Date()
      doseTime.setHours(hours, minutes, 0, 0)
      if (doseTime <= now) {
        doseTime.setDate(doseTime.getDate() + 1)
      }
      return doseTime
    })
    return times.sort((a, b) => a.getTime() - b.getTime())[0]
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
          <div style={{ color: '#005EB8', fontSize: '18px' }}>Loading medications...</div>
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
                <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>💊 Medication Management</h1>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Track and manage your medications</p>
              </div>
            </div>
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

        {/* Main Content */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px'
        }}>
          {/* Quick Actions */}
          <div style={{ marginBottom: '32px' }}>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)',
                marginRight: '16px'
              }}
            >
              + Add New Medication
            </button>
            <button
              onClick={scheduleReminders}
              style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(40, 167, 69, 0.4)'
              }}
            >
              🔔 Update Reminders
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9',
              marginBottom: '32px'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>
                {editingMedication ? 'Edit Medication' : 'Add New Medication'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: '20px' }}>
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
                        Dosage *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 100mg, 2 tablets"
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
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Frequency *
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({...formData, frequency: e.target.value})}
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
                      <option value="daily">Daily</option>
                      <option value="twice-daily">Twice Daily</option>
                      <option value="three-times-daily">Three Times Daily</option>
                      <option value="four-times-daily">Four Times Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="as-needed">As Needed</option>
                    </select>
                  </div>

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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
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
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes about this medication"
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

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.reminder_enabled}
                        onChange={(e) => setFormData({...formData, reminder_enabled: e.target.checked})}
                        style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                      />
                      <span style={{ fontSize: '16px', color: '#333' }}>
                        Enable medication reminders
                      </span>
                    </label>
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
          )}

          {/* Medications List */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #e1e5e9'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#003087' }}>Your Medications</h2>

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
                    backgroundColor: medication.is_active ? 'white' : '#f8f9fa',
                    opacity: medication.is_active ? 1 : 0.7
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0', color: '#003087', fontSize: '20px' }}>
                          {medication.name}
                        </h3>
                        <div style={{ color: '#666', marginBottom: '8px' }}>
                          <strong>Dosage:</strong> {medication.dosage}
                        </div>
                        <div style={{ color: '#666', marginBottom: '8px' }}>
                          <strong>Frequency:</strong> {medication.frequency}
                        </div>
                        <div style={{ color: '#666', marginBottom: '8px' }}>
                          <strong>Times:</strong> {medication.schedule_times.join(', ')}
                        </div>
                        {medication.is_active && (
                          <div style={{ color: '#28a745', fontSize: '14px', fontWeight: '500' }}>
                            Next dose: {getNextDose(medication).toLocaleString()}
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
                          onClick={() => toggleMedication(medication)}
                          style={{
                            background: medication.is_active ? '#ffc107' : '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {medication.is_active ? 'Pause' : 'Activate'}
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

                    {medication.notes && (
                      <div style={{ 
                        background: '#f8f9fa', 
                        padding: '12px', 
                        borderRadius: '8px',
                        marginTop: '12px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        <strong>Notes:</strong> {medication.notes}
                      </div>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '12px',
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      <span>
                        Started: {new Date(medication.start_date).toLocaleDateString()}
                        {medication.end_date && ` • Ends: ${new Date(medication.end_date).toLocaleDateString()}`}
                      </span>
                      <span>
                        🔔 {medication.reminder_enabled ? 'Reminders On' : 'Reminders Off'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}