
import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

interface SeizureLog {
  id: string
  date: string
  time: string
  type: string
  duration: string
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
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [seizureLogs, setSeizureLogs] = useState<SeizureLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: '',
    duration: '',
    severity: 5,
    triggers: '',
    notes: ''
  })
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUser(profile)
      }

      // Get seizure logs
      const { data: logs } = await supabase
        .from('seizure_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (logs) {
        setSeizureLogs(logs)
      }

      setIsLoading(false)
    }

    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!user) return

    try {
      const { data, error } = await supabase
        .from('seizure_logs')
        .insert([
          {
            user_id: user.id,
            date: formData.date,
            time: formData.time,
            type: formData.type,
            duration: formData.duration,
            severity: formData.severity,
            triggers: formData.triggers,
            notes: formData.notes
          }
        ])
        .select()

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Seizure log added successfully!')
        setFormData({
          date: '',
          time: '',
          type: '',
          duration: '',
          severity: 5,
          triggers: '',
          notes: ''
        })
        setShowForm(false)
        
        // Refresh logs
        const { data: logs } = await supabase
          .from('seizure_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (logs) {
          setSeizureLogs(logs)
        }
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const deleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seizure log?')) return

    const { error } = await supabase
      .from('seizure_logs')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(`Error deleting log: ${error.message}`)
    } else {
      setMessage('Log deleted successfully')
      setSeizureLogs(seizureLogs.filter(log => log.id !== id))
    }
  }

  const getRecentStats = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentLogs = seizureLogs.filter(log => 
      new Date(log.created_at) >= thirtyDaysAgo
    )
    
    const avgSeverity = recentLogs.length > 0 
      ? recentLogs.reduce((sum, log) => sum + log.severity, 0) / recentLogs.length
      : 0

    return {
      total: recentLogs.length,
      avgSeverity: avgSeverity.toFixed(1)
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
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #005EB8',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#666' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = getRecentStats()

  return (
    <React.Fragment>
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
          backgroundColor: 'white',
          borderBottom: '1px solid #e1e5e9',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'white',
              marginRight: '12px'
            }}>
              🧠
            </div>
            <div>
              <h1 style={{ 
                color: '#003087', 
                fontSize: '24px', 
                fontWeight: 'bold',
                margin: '0'
              }}>
                NeuroLog
              </h1>
              <p style={{ 
                color: '#666', 
                fontSize: '14px',
                margin: '0'
              }}>
                Welcome back, {user?.full_name}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => router.push('/medication')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              💊 Medication
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#003087' }}>Total Seizures</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#005EB8' }}>
                {seizureLogs.length}
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#003087' }}>Last 30 Days</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#005EB8' }}>
                {stats.total}
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#003087' }}>Avg Severity</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#005EB8' }}>
                {stats.avgSeverity}/10
              </p>
            </div>
          </div>

          {/* Add New Log Button */}
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 94, 184, 0.3)'
              }}
            >
              {showForm ? 'Cancel' : '+ Add New Seizure Log'}
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginBottom: '32px'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>Add Seizure Log</h2>
              
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
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
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Time *</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
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
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
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
                      <option value="">Select seizure type</option>
                      <option value="tonic-clonic">Tonic-clonic (Grand Mal)</option>
                      <option value="focal">Focal (Partial)</option>
                      <option value="absence">Absence (Petit Mal)</option>
                      <option value="myoclonic">Myoclonic</option>
                      <option value="atonic">Atonic (Drop)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Duration</label>
                    <input
                      type="text"
                      placeholder="e.g., 2 minutes, 30 seconds"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
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

                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Severity (1-10): {formData.severity}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: parseInt(e.target.value)})}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Triggers</label>
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

                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Notes</label>
                  <textarea
                    placeholder="Additional details about the seizure..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
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

                <button 
                  type="submit"
                  style={{ 
                    marginTop: '24px',
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Save Seizure Log
                </button>
              </form>
            </div>
          )}

          {/* Message */}
          {message && (
            <div style={{ 
              marginBottom: '24px', 
              padding: '16px', 
              backgroundColor: message.includes('Error') ? '#fee' : '#efe',
              color: message.includes('Error') ? '#c33' : '#363',
              borderRadius: '8px',
              fontSize: '15px'
            }}>
              {message}
            </div>
          )}

          {/* Seizure Logs */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '24px 32px', 
              borderBottom: '1px solid #e1e5e9',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{ margin: '0', color: '#003087' }}>Seizure History</h2>
            </div>

            <div style={{ padding: '24px 32px' }}>
              {seizureLogs.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', margin: '40px 0' }}>
                  No seizure logs yet. Click "Add New Seizure Log" to get started.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {seizureLogs.map((log) => (
                    <div 
                      key={log.id}
                      style={{
                        border: '1px solid #e1e5e9',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
                            <strong style={{ color: '#003087' }}>
                              {new Date(log.date).toLocaleDateString()} at {log.time}
                            </strong>
                            <span style={{ 
                              backgroundColor: '#005EB8', 
                              color: 'white', 
                              padding: '2px 8px', 
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {log.type}
                            </span>
                            <span style={{ color: '#666' }}>
                              Severity: {log.severity}/10
                            </span>
                          </div>
                          
                          {log.duration && (
                            <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                              <strong>Duration:</strong> {log.duration}
                            </p>
                          )}
                          
                          {log.triggers && (
                            <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                              <strong>Triggers:</strong> {log.triggers}
                            </p>
                          )}
                          
                          {log.notes && (
                            <p style={{ margin: '0', color: '#666' }}>
                              <strong>Notes:</strong> {log.notes}
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => deleteLog(log.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginLeft: '16px'
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
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </React.Fragment>
  )
}
