import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import ErrorBoundary from '../components/ErrorBoundary'

interface SeizureRecord {
  id: string
  date: string
  time: string
  duration: number
  severity: number
  triggers: string
  notes: string
  created_at: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string
  account_type: string
  created_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [seizures, setSeizures] = useState<SeizureRecord[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [newSeizure, setNewSeizure] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: '',
    severity: 3,
    triggers: '',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }

      setUser(session.user)

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Get seizure records
      const { data: seizureData, error: seizureError } = await supabase
        .from('seizure_records')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false })

      if (seizureData) {
        setSeizures(seizureData)
      }

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
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
      const { data, error } = await supabase
        .from('seizure_records')
        .insert([
          {
            user_id: user.id,
            date: newSeizure.date,
            time: newSeizure.time,
            duration: parseInt(newSeizure.duration),
            severity: newSeizure.severity,
            triggers: newSeizure.triggers,
            notes: newSeizure.notes
          }
        ])
        .select()

      if (error) throw error

      // Refresh seizures
      checkUser()

      // Reset form
      setNewSeizure({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        duration: '',
        severity: 3,
        triggers: '',
        notes: ''
      })

      alert('Seizure record added successfully!')

    } catch (error: any) {
      console.error('Error adding seizure:', error)
      alert('Error adding seizure record')
    }
  }

  const deleteSeizure = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seizure record?')) return

    try {
      const { error } = await supabase
        .from('seizure_records')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSeizures(seizures.filter(s => s.id !== id))
    } catch (error: any) {
      console.error('Error deleting seizure:', error)
      alert('Error deleting seizure record')
    }
  }

  const exportData = (format: 'json' | 'pdf') => {
    if (format === 'json') {
      const exportData = {
        profile,
        seizures,
        exported_at: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `neurolog-export-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
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
          <p style={{ color: '#666' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
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
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px' }}>🧠</div>
              <div>
                <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>NeuroLog</h1>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>
                  Welcome back, {profile?.full_name || user?.email}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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

        {/* Navigation Tabs */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '24px',
            backgroundColor: 'white',
            padding: '8px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {[
              { key: 'dashboard', label: '📊 Dashboard', icon: '📊' },
              { key: 'add-seizure', label: '➕ Add Seizure', icon: '➕' },
              { key: 'history', label: '📋 History', icon: '📋' },
              { key: 'profile', label: '👤 Profile', icon: '👤' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: activeTab === tab.key ? '#005EB8' : 'transparent',
                  color: activeTab === tab.key ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#003087', fontSize: '18px' }}>Total Seizures</h3>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005EB8' }}>
                    {seizures.length}
                  </div>
                  <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                    All time records
                  </p>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#003087', fontSize: '18px' }}>This Month</h3>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                    {seizures.filter(s => new Date(s.date).getMonth() === new Date().getMonth()).length}
                  </div>
                  <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                    Recent activity
                  </p>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#003087', fontSize: '18px' }}>Average Severity</h3>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
                    {seizures.length > 0 ? (seizures.reduce((sum, s) => sum + s.severity, 0) / seizures.length).toFixed(1) : '0'}
                  </div>
                  <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                    Scale 1-10
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add Seizure Tab */}
          {activeTab === 'add-seizure' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>Add New Seizure Record</h2>

              <form onSubmit={handleAddSeizure}>
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                        Date
                      </label>
                      <input
                        type="date"
                        value={newSeizure.date}
                        onChange={(e) => setNewSeizure({...newSeizure, date: e.target.value})}
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
                      <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                        Time
                      </label>
                      <input
                        type="time"
                        value={newSeizure.time}
                        onChange={(e) => setNewSeizure({...newSeizure, time: e.target.value})}
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
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={newSeizure.duration}
                      onChange={(e) => setNewSeizure({...newSeizure, duration: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e1e5e9',
                        fontSize: '16px',
                        boxSizing: 'border-box'
                      }}
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                      Severity (1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newSeizure.severity}
                      onChange={(e) => setNewSeizure({...newSeizure, severity: parseInt(e.target.value)})}
                      style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                      {newSeizure.severity} / 10
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                      Triggers (optional)
                    </label>
                    <input
                      type="text"
                      value={newSeizure.triggers}
                      onChange={(e) => setNewSeizure({...newSeizure, triggers: e.target.value})}
                      placeholder="e.g., lack of sleep, stress, missed medication"
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
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                      Notes (optional)
                    </label>
                    <textarea
                      value={newSeizure.notes}
                      onChange={(e) => setNewSeizure({...newSeizure, notes: e.target.value})}
                      placeholder="Additional details about the seizure..."
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

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    Add Seizure Record
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>Seizure History</h2>
              </div>

              {seizures.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <p>No seizure records yet.</p>
                  <button
                    onClick={() => setActiveTab('add-seizure')}
                    style={{
                      background: '#005EB8',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginTop: '16px'
                    }}
                  >
                    Add Your First Record
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {seizures.map(seizure => (
                    <div key={seizure.id} style={{
                      border: '1px solid #e1e5e9',
                      borderRadius: '12px',
                      padding: '20px',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600', color: '#003087' }}>
                              {new Date(seizure.date).toLocaleDateString()}
                            </span>
                            <span style={{ color: '#666' }}>
                              {seizure.time}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: seizure.severity > 7 ? '#dc3545' : seizure.severity > 4 ? '#ffc107' : '#28a745',
                              color: 'white'
                            }}>
                              Severity {seizure.severity}/10
                            </span>
                          </div>
                          <p style={{ margin: '0', color: '#666' }}>
                            Duration: {seizure.duration} minutes
                          </p>
                          {seizure.triggers && (
                            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                              Triggers: {seizure.triggers}
                            </p>
                          )}
                          {seizure.notes && (
                            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                              Notes: {seizure.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteSeizure(seizure.id)}
                          style={{
                            background: '#dc3545',
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>Profile Information</h2>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                    Full Name
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    color: '#666'
                  }}>
                    {profile?.full_name || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                    Email
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    color: '#666'
                  }}>
                    {user?.email}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                    Account Type
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    color: '#666'
                  }}>
                    {profile?.account_type === 'personal' ? 'Personal Use' : 'Professional Care'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
                    Member Since
                  </label>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    color: '#666'
                  }}>
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}