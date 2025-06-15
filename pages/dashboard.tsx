import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { dataExportUtils } from '../lib/dataExport'

interface SeizureEntry {
  id: string
  seizure_date: string
  seizure_time: string
  duration: string
  seizure_type: string
  triggers: string
  severity: number
  symptoms: string
  medication_taken: string
  additional_notes: string
  created_at: string
}

interface User {
  id: string
  full_name: string
  email: string
  account_type: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [seizures, setSeizures] = useState<SeizureEntry[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    seizure_date: new Date().toISOString().split('T')[0],
    seizure_time: '',
    seizure_hour: '12',
    seizure_minute: '00',
    seizure_ampm: 'PM',
    duration: '',
    duration_value: '',
    duration_unit: 'minutes',
    seizure_type: '',
    triggers: '',
    severity: 3,
    symptoms: '',
    medication_taken: '',
    additional_notes: ''
  })
  const router = useRouter()

  const checkUser = async () => {
    try {
      // Check if user is authenticated
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        router.push('/')
        return
      }

      // Get user profile or use session data
      let userData = {
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || session.user.email,
        email: session.user.email,
        account_type: session.user.user_metadata?.account_type || 'personal'
      }

      // Try to get profile from user_profiles table
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        userData = profile
      } else {
        // Create user profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([{
            id: session.user.id,
            full_name: userData.full_name,
            email: userData.email,
            account_type: userData.account_type,
            created_at: new Date().toISOString()
          }])

        if (insertError) {
          console.error('Error creating user profile:', insertError)
        }
      }

      setUser(userData)
      await loadSeizures(session.user.id)
    } catch (error) {
      console.error('Error checking user:', error)
      // Don't redirect on error - user might still be valid
      setUser({
        id: 'temp',
        full_name: 'User',
        email: 'user@example.com',
        account_type: 'personal'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkUser()
  }, [])

  const loadSeizures = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('seizure_records')
        .select('*')
        .eq('user_id', userId)
        .order('seizure_date', { ascending: false })
        .order('seizure_time', { ascending: false })

      if (error) {
        console.error('Error loading seizures:', error)
        return
      }

      setSeizures(data || [])
    } catch (error) {
      console.error('Error loading seizures:', error)
      // Keep seizures as empty array on error
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAddSeizure = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      // Format time from dropdowns
      let hour = parseInt(formData.seizure_hour)
      if (formData.seizure_ampm === 'PM' && hour !== 12) {
        hour += 12
      } else if (formData.seizure_ampm === 'AM' && hour === 12) {
        hour = 0
      }
      const formattedTime = `${hour.toString().padStart(2, '0')}:${formData.seizure_minute}`

      // Format duration
      const formattedDuration = `${formData.duration_value} ${formData.duration_unit}`

      const { data, error } = await supabase
        .from('seizure_records')
        .insert([
          {
            user_id: user.id,
            seizure_date: formData.seizure_date,
            seizure_time: formattedTime,
            duration: formattedDuration,
            seizure_type: formData.seizure_type,
            triggers: formData.triggers,
            severity: formData.severity,
            symptoms: formData.symptoms,
            medication_taken: formData.medication_taken,
            additional_notes: formData.additional_notes
          }
        ])
        .select()

      if (error) {
        console.error('Error adding seizure:', error)
        alert('Error saving seizure. Please try again.')
        return
      }

      // Reload seizures
      await loadSeizures(user.id)

      // Reset form
      setFormData({
        seizure_date: new Date().toISOString().split('T')[0],
        seizure_time: '',
        seizure_hour: '12',
        seizure_minute: '00',
        seizure_ampm: 'PM',
        duration: '',
        duration_value: '',
        duration_unit: 'minutes',
        seizure_type: '',
        triggers: '',
        severity: 3,
        symptoms: '',
        medication_taken: '',
        additional_notes: ''
      })
      setActiveTab('overview')
      alert('Seizure recorded successfully!')
    } catch (error) {
      console.error('Error adding seizure:', error)
      alert('Error saving seizure. Please try again.')
    }
  }

  const deleteSeizure = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seizure record?')) return

    try {
      const { error } = await supabase
        .from('seizure_records')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting seizure:', error)
        alert('Error deleting seizure. Please try again.')
        return
      }

      // Reload seizures
      if (user) {
        await loadSeizures(user.id)
      }
      alert('Seizure record deleted.')
    } catch (error) {
      console.error('Error deleting seizure:', error)
      alert('Error deleting seizure. Please try again.')
    }
  }

  const exportData = async (format: 'json' | 'pdf' = 'json') => {
    if (!user) return

    try {
      if (format === 'pdf') {
        const result = await dataExportUtils.generateMedicalReportPDF(user.id)
        if (!result.success) {
          alert(`Failed to generate PDF: ${result.error}`)
        }
      } else {
        const result = await dataExportUtils.exportAllUserData(user.id)
        if (result.success && result.data) {
          dataExportUtils.downloadAsJSON(result.data)
        } else {
          alert(`Failed to export data: ${result.error}`)
        }
      }
    } catch (error: any) {
      alert(`Export failed: ${error.message}`)
    }
  }

  const getRecentSeizures = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return seizures.filter(s => new Date(s.seizure_date) >= thirtyDaysAgo)
  }

  const getAverageSeverity = () => {
    if (seizures.length === 0) return 0
    const total = seizures.reduce((sum, s) => sum + s.severity, 0)
    return (total / seizures.length).toFixed(1)
  }

  const getMostCommonTrigger = () => {
    if (seizures.length === 0) return 'None recorded'
    const triggers = seizures.map(s => s.triggers).filter(t => t && t.trim())
    if (triggers.length === 0) return 'None recorded'

    const triggerCount: {[key: string]: number} = {}
    triggers.forEach(trigger => {
      triggerCount[trigger] = (triggerCount[trigger] || 0) + 1
    })

    return Object.entries(triggerCount).sort(([,a], [,b]) => b - a)[0][0]
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
          <div style={{ color: '#005EB8', fontSize: '18px' }}>Loading NeuroLog...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#005EB8', fontSize: '18px' }}>Redirecting to login...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Dashboard - NeuroLog</title>
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
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                fontSize: '20px'
              }}>
                🧠
              </div>
              <div>
                <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>NeuroLog</h1>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Welcome back, {user.full_name}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => exportData('json')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  📄 Export JSON
                </button>
                <button
                  onClick={() => exportData('pdf')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  📋 Medical Report
                </button>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

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
            {['overview', 'add', 'history', 'insights', 'medications', 'profile'].filter(tab => !['emergency-contacts', 'next-of-kin'].includes(tab)).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 0',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: activeTab === tab ? '#005EB8' : '#666',
                  borderBottom: activeTab === tab ? '3px solid #005EB8' : 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
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
          {activeTab === 'overview' && (
            <div>
              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005EB8', marginBottom: '8px' }}>
                    {seizures.length}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Total Seizures Recorded</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005EB8', marginBottom: '8px' }}>
                    {getRecentSeizures().length}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Last 30 Days</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005EB8', marginBottom: '8px' }}>
                    {getAverageSeverity()}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Average Severity</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#005EB8', marginBottom: '8px' }}>
                    {getMostCommonTrigger()}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Most Common Trigger</div>
                </div>
              </div>

              {/* Quick Add Button */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <button
                  onClick={() => setActiveTab('add')}
                  style={{
                    background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)',
                    marginRight: '16px'
                  }}
                >
                  + Record New Seizure
                </button>
                <button
                  onClick={() => setActiveTab('medications')}
                  style={{
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(40, 167, 69, 0.4)'
                  }}
                >
                  💊 Manage Medications
                </button>
              </div>

              {/* Recent Seizures */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#003087', fontSize: '20px' }}>Recent Seizures</h3>
                {seizures.slice(0, 5).map(seizure => (
                  <div key={seizure.id} style={{
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#003087', marginBottom: '4px' }}>
                        {seizure.seizure_date} at {seizure.seizure_time}
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        {seizure.seizure_type} • Duration: {seizure.duration} • Severity: {seizure.severity}/5
                      </div>
                    </div>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: seizure.severity > 3 ? '#ff4757' : seizure.severity > 2 ? '#ffa502' : '#2ed573'
                    }} />
                  </div>
                ))}
                {seizures.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <div>No seizures recorded yet. Click "Record New Seizure" to get started.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'add' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087', textAlign: 'center' }}>Record New Seizure</h2>

              <form onSubmit={handleAddSeizure}>
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Date</label>
                      <input
                        type="date"
                        value={formData.seizure_date}
                        onChange={(e) => setFormData({...formData, seizure_date: e.target.value})}
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
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Time</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={formData.seizure_hour}
                          onChange={(e) => setFormData({...formData, seizure_hour: e.target.value})}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
                          required
                        >
                          {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                            <option key={hour} value={hour.toString()}>{hour}</option>
                          ))}
                        </select>
                        <select
                          value={formData.seizure_minute}
                          onChange={(e) => setFormData({...formData, seizure_minute: e.target.value})}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
                          required
                        >
                          {Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                            <option key={minute} value={minute}>{minute}</option>
                          ))}
                        </select>
                        <select
                          value={formData.seizure_ampm}
                          onChange={(e) => setFormData({...formData, seizure_ampm: e.target.value})}
                          style={{
                            flex: '0 0 auto',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
                          required
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Duration</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={formData.duration_value}
                          onChange={(e) => setFormData({...formData, duration_value: e.target.value})}
                          style={{
                            flex: 2,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                          }}
                          required
                        />
                        <select
                          value={formData.duration_unit}
                          onChange={(e) => setFormData({...formData, duration_unit: e.target.value})}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
                          required
                        >
                          <option value="seconds">Seconds</option>
                          <option value="minutes">Minutes</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Type</label>
                      <select
                        value={formData.seizure_type}
                        onChange={(e) => setFormData({...formData, seizure_type: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid #e1e5e9',
                          fontSize: '16px',
                          backgroundColor: 'white',
                          boxSizing: 'border-box'
                        }}
                        required
                      >
                        <option value="">Select type</option>
                        <option value="Tonic-clonic">Tonic-clonic (Grand mal)</option>
                        <option value="Focal">Focal (Partial)</option>
                        <option value="Absence">Absence (Petit mal)</option>
                        <option value="Myoclonic">Myoclonic</option>
                        <option value="Atonic">Atonic (Drop)</option>
                        <option value="Status Epilepticus">Status Epilepticus</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Severity (1-5): {formData.severity}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formData.severity}
                      onChange={(e) => setFormData({...formData, severity: parseInt(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      <span>Mild</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Triggers (if known)</label>
                    <input
                      type="text"
                      placeholder="e.g., stress, lack of sleep, flashing lights"
                      value={formData.triggers}
                      onChange={(e) => setFormData({...formData, triggers: e.target.value})}
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Symptoms</label>
                    <textarea
                      placeholder="Describe any symptoms before, during, or after the seizure"
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
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
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Medication Taken</label>
                    <input
                      type="text"
                      placeholder="e.g., rescue medication, regular medication missed"
                      value={formData.medication_taken}
                      onChange={(e) => setFormData({...formData, medication_taken: e.target.value})}
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Additional Notes</label>
                    <textarea
                      placeholder="Any other observations or details"
                      value={formData.additional_notes}
                      onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
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
                </div>

                <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
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
                    Save Seizure Record
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>Seizure History</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => exportData('json')}
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
                    📄 Export JSON
                  </button>
                  <button
                    onClick={() => exportData('pdf')}
                    style={{
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📋 Medical Report
                  </button>
                </div>
              </div>

              {seizures.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <div>No seizures recorded yet.</div>
                  <button
                    onClick={() => setActiveTab('add')}
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
                    Record Your First Seizure
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {seizures.map(seizure => (
                    <div key={seizure.id} style={{
                      border: '1px solid #e1e5e9',
                      borderRadius: '12px',
                      padding: '20px',
                      position: 'relative'
                    }}>
                      <button
                        onClick={() => deleteSeizure(seizure.id)}
                        style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          background: '#ff4757',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <strong style={{ color: '#003087' }}>Date & Time:</strong><br/>
                          {seizure.seizure_date} at {seizure.seizure_time}
                        </div>
                        <div>
                          <strong style={{ color: '#003087' }}>Type:</strong><br/>
                          {seizure.seizure_type}
                        </div>
                        <div>
                          <strong style={{ color: '#003087' }}>Duration:</strong><br/>
                          {seizure.duration}
                        </div>
                        <div>
                          <strong style={{ color: '#003087' }}>Severity:</strong><br/>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {seizure.severity}/5
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: seizure.severity > 3 ? '#ff4757' : seizure.severity > 2 ? '#ffa502' : '#2ed573'
                            }} />
                          </div>
                        </div>
                      </div>

                      {seizure.triggers && (
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#003087' }}>Triggers:</strong> {seizure.triggers}
                        </div>
                      )}

                      {seizure.symptoms && (
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#003087' }}>Symptoms:</strong> {seizure.symptoms}
                        </div>
                      )}

                      {seizure.medication_taken && (
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#003087' }}>Medication:</strong> {seizure.medication_taken}
                        </div>
                      )}

                      {seizure.additional_notes && (
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#003087' }}>Notes:</strong> {seizure.additional_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }} id="insights-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: '0', color: '#003087' }}>Seizure Insights & Analytics</h2>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => window.print()}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      🖨️ Print
                    </button>
                    <button
                      onClick={async () => {
                        const element = document.getElementById('insights-content')
                        if (!element) return

                        try {
                          const html2canvas = (await import('html2canvas')).default
                          const jsPDF = (await import('jspdf')).jsPDF

                          const canvas = await html2canvas(element, {
                            scale: 2,
                            useCORS: true,
                            backgroundColor: '#ffffff'
                          })

                          const imgData = canvas.toDataURL('image/png')
                          const pdf = new jsPDF('p', 'mm', 'a4')
                          const pdfWidth = pdf.internal.pageSize.getWidth()
                          const pdfHeight = pdf.internal.pageSize.getHeight()
                          const imgWidth = canvas.width
                          const imgHeight = canvas.height
                          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
                          const imgX = (pdfWidth - imgWidth * ratio) / 2
                          const imgY = 30

                          pdf.setFontSize(16)
                          pdf.text('NeuroLog - Seizure Insights Report', pdfWidth / 2, 20, { align: 'center' })
                          pdf.setFontSize(10)
                          pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pdfWidth / 2, 25, { align: 'center' })

                          pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
                          pdf.save(`neurolog-insights-${new Date().toISOString().split('T')[0]}.pdf`)
                        } catch (error) {
                          console.error('Error generating PDF:', error)
                          alert('Error generating PDF. Please try again.')
                        }
                      }}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📄 Export PDF
                    </button>
                  </div>
                </div>

                {seizures.length < 3 ? (
                  <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                    <div>Record at least 3 seizures to see insights and patterns.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '24px' }}>
                    <div style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e1e5e9'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Frequency Analysis</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#005EB8' }}>
                            {(seizures.length / Math.max(1, Math.ceil((new Date().getTime() - new Date(seizures[seizures.length - 1]?.seizure_date || new Date()).getTime()) / (1000 * 60 * 60 * 24 * 30)))).toFixed(1)}
                          </div>
                          <div style={{ color: '#666' }}>Seizures per month</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#005EB8' }}>
                            {seizures.length > 1 ? Math.abs(Math.round((new Date(seizures[0].seizure_date).getTime() - new Date(seizures[1].seizure_date).getTime()) / (1000 * 60 * 60 * 24))) : 'N/A'}
                          </div>
                          <div style={{ color: '#666' }}>Days between recent seizures</div>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e1e5e9'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Seizure Types</h3>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {Array.from(new Set(seizures.map(s => s.seizure_type))).map(type => {
                          const count = seizures.filter(s => s.seizure_type === type).length
                          const percentage = ((count / seizures.length) * 100).toFixed(1)
                          return (
                            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{type}</span>
                              <span style={{ color: '#005EB8', fontWeight: 'bold' }}>{count} ({percentage}%)</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e1e5e9'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Common Triggers</h3>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {Array.from(new Set(seizures.map(s => s.triggers).filter(t => t && t.trim()))).slice(0, 5).map(trigger => {
                          const count = seizures.filter(s => s.triggers === trigger).length
                          return (
                            <div key={trigger} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{trigger}</span>
                              <span style={{ color: '#005EB8', fontWeight: 'bold' }}>{count}</span>
                            </div>
                          )
                        })}
                        {seizures.filter(s => s.triggers && s.triggers.trim()).length === 0 && (
                          <div style={{ color: '#666', fontStyle: 'italic' }}>No triggers recorded yet</div>
                        )}
                      </div>
                    </div>

                    <div style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e1e5e9'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Severity Trends</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
                        {[1, 2, 3, 4, 5].map(severity => {
                          const count = seizures.filter(s => s.severity === severity).length
                          const percentage = seizures.length > 0 ? ((count / seizures.length) * 100).toFixed(0) : 0
                          return (
                            <div key={severity} style={{ textAlign: 'center' }}>
                              <div style={{
                                height: `${Math.max(20, Number(percentage) * 2)}px`,
                                backgroundColor: severity > 3 ? '#ff4757' : severity > 2 ? '#ffa502' : '#2ed573',
                                marginBottom: '8px',
                                borderRadius: '4px'
                              }} />
                              <div style={{ fontSize: '12px', color: '#666' }}>{severity}</div>
                              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{count}</div>
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                        Severity scale: 1 (Mild) to 5 (Severe)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'medications' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#003087' }}>Medication Management</h2>
              <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
                <div style={{ marginBottom: '16px' }}>Professional medication tracking and management</div>
                <div style={{ marginBottom: '24px', fontSize: '14px', color: '#666' }}>
                  Track medications, schedule reminders, monitor adherence, and manage side effects.
                </div>
                <button
                  onClick={() => router.push('/medication')}
                  style={{
                    background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)'
                  }}
                >
                  Open Medication Manager
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#003087' }}>Profile & Settings</h2>

              <div style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Account Information</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <strong>Name:</strong> {user.full_name}
                    </div>
                    <div>
                      <strong>Email:</strong> {user.email}
                    </div>
                    <div>
                      <strong>Account Type:</strong> {user.account_type}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Emergency Information</h3>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                    Complete your emergency information for safety during seizures.
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setActiveTab('emergency-contacts')}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🚨 Emergency Contacts
                    </button>
                  </div>
                </div>

                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Data & Privacy</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button
                      onClick={() => exportData('json')}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left'
                      }}
                    >
                      📄 Export All My Data (GDPR)
                    </button>
                    <button
                      onClick={() => exportData('pdf')}
                      style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left'
                      }}
                    >
                      📋 Generate Medical Report
                    </button>
                    <button
                      onClick={() => alert('Privacy settings coming soon! This will allow you to control data sharing preferences.')}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left'
                      }}
                    >
                      🔒 Privacy Settings
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your seizure data.')) {
                          alert('Account deletion feature coming soon. For immediate assistance, please contact support.')
                        }
                      }}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left'
                      }}
                    >
                      🗑️ Delete Account (Right to be Forgotten)
                    </button>
                  </div>
                </div>

                <div style={{
                  background: '#e3f2fd',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #bbdefb'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#1976d2' }}>🔒 Data Security</h3>
                  <div style={{ fontSize: '14px', color: '#1565c0', lineHeight: '1.6' }}>
                    Your seizure data is stored securely in EU servers with bank-grade encryption. 
                    NeuroLog is fully GDPR compliant and your data never leaves European borders.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'emergency-contacts' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <button
                  onClick={() => setActiveTab('profile')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    marginRight: '16px',
                    color: '#666'
                  }}
                >
                  ←
                </button>
                <h2 style={{ margin: '0', color: '#003087' }}>Emergency Contacts</h2>
              </div>

              <div style={{ background: '#fff3cd', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #ffeaa7' }}>
                <strong style={{ color: '#856404' }}>Important:</strong> These contacts will be notified in case of emergency during seizures.
              </div>

              <form onSubmit={(e) => { e.preventDefault(); alert('Emergency contact saved! This feature will be fully implemented soon.'); }}>
                <div style={{ display: 'grid', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Primary Contact Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Full name"
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
                        Relationship *
                      </label>
                      <select
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid #e1e5e9',
                          fontSize: '16px',
                          backgroundColor: 'white',
                          boxSizing: 'border-box'
                        }}
                        required
                      >
                        <option value="">Select relationship</option>
                        <option value="spouse">Spouse/Partner</option>
                        <option value="parent">Parent</option>
                        <option value="child">Child</option>
                        <option value="sibling">Sibling</option>
                        <option value="friend">Friend</option>
                        <option value="caregiver">Caregiver</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="+44 7000 000000"
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
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="email@example.com"
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
                      Secondary Contact Name
                    </label>
                    <input
                      type="text"
                      placeholder="Full name (optional)"
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Secondary Contact Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+44 7000 000000"
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
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Relationship
                      </label>
                      <select
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
                        <option value="">Select relationship</option>
                        <option value="spouse">Spouse/Partner</option>
                        <option value="parent">Parent</option>
                        <option value="child">Child</option>
                        <option value="sibling">Sibling</option>
                        <option value="friend">Friend</option>
                        <option value="caregiver">Caregiver</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Medical Information to Share
                    </label>
                    <textarea
                      placeholder="Brief medical information that emergency contacts should know (allergies, current medications, seizure type, etc.)"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e1e5e9',
                        fontSize: '16px',
                        minHeight: '100px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Emergency Instructions
                    </label>
                    <textarea
                      placeholder="What should your emergency contacts do during a seizure? (e.g., call 999 if seizure lasts more than 5 minutes, position on side, etc.)"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e1e5e9',
                        fontSize: '16px',
                        minHeight: '100px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
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
                      background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(220, 53, 69, 0.4)'
                    }}
                  >
                    Save Emergency Contacts
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  )
}