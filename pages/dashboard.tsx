
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

interface SeizureEntry {
  id: string
  date: string
  time: string
  duration: string
  type: string
  triggers: string
  severity: number
  symptoms: string
  medication: string
  notes: string
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  type: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [seizures, setSeizures] = useState<SeizureEntry[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    duration: '',
    type: '',
    triggers: '',
    severity: 3,
    symptoms: '',
    medication: '',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const savedUser = localStorage.getItem('neurolog_user')
    if (!savedUser) {
      router.push('/')
      return
    }
    
    const userData = JSON.parse(savedUser)
    setUser(userData)
    
    // Load seizure data
    const savedSeizures = localStorage.getItem(`neurolog_seizures_${userData.id}`)
    if (savedSeizures) {
      setSeizures(JSON.parse(savedSeizures))
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('neurolog_user')
    router.push('/')
  }

  const handleAddSeizure = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newSeizure: SeizureEntry = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    }
    
    const updatedSeizures = [newSeizure, ...seizures]
    setSeizures(updatedSeizures)
    localStorage.setItem(`neurolog_seizures_${user?.id}`, JSON.stringify(updatedSeizures))
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: '',
      duration: '',
      type: '',
      triggers: '',
      severity: 3,
      symptoms: '',
      medication: '',
      notes: ''
    })
    setShowAddForm(false)
  }

  const deleteSeizure = (id: string) => {
    const updatedSeizures = seizures.filter(s => s.id !== id)
    setSeizures(updatedSeizures)
    localStorage.setItem(`neurolog_seizures_${user?.id}`, JSON.stringify(updatedSeizures))
  }

  const getRecentSeizures = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return seizures.filter(s => new Date(s.date) >= thirtyDaysAgo)
  }

  const getAverageSeverity = () => {
    if (seizures.length === 0) return 0
    const total = seizures.reduce((sum, s) => sum + s.severity, 0)
    return (total / seizures.length).toFixed(1)
  }

  const getMostCommonTrigger = () => {
    if (seizures.length === 0) return 'None recorded'
    const triggers = seizures.map(s => s.triggers).filter(t => t)
    if (triggers.length === 0) return 'None recorded'
    
    const triggerCount: {[key: string]: number} = {}
    triggers.forEach(trigger => {
      triggerCount[trigger] = (triggerCount[trigger] || 0) + 1
    })
    
    return Object.entries(triggerCount).sort(([,a], [,b]) => b - a)[0][0]
  }

  if (!user) {
    return <div>Loading...</div>
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
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Welcome back, {user.name}</p>
              </div>
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
            {['overview', 'add', 'history', 'insights'].map(tab => (
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
                    boxShadow: '0 6px 20px rgba(0, 94, 184, 0.4)'
                  }}
                >
                  + Record New Seizure
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
                        {seizure.date} at {seizure.time}
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        {seizure.type} • Duration: {seizure.duration} • Severity: {seizure.severity}/5
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
                    No seizures recorded yet. Click "Record New Seizure" to get started.
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
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Time</label>
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
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Duration</label>
                      <input
                        type="text"
                        placeholder="e.g., 2 minutes"
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
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Type</label>
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
                        <option value="">Select type</option>
                        <option value="Tonic-clonic">Tonic-clonic (Grand mal)</option>
                        <option value="Focal">Focal (Partial)</option>
                        <option value="Absence">Absence (Petit mal)</option>
                        <option value="Myoclonic">Myoclonic</option>
                        <option value="Atonic">Atonic (Drop)</option>
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
                      value={formData.medication}
                      onChange={(e) => setFormData({...formData, medication: e.target.value})}
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
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>Seizure History</h2>
              
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
                          {seizure.date} at {seizure.time}
                        </div>
                        <div>
                          <strong style={{ color: '#003087' }}>Type:</strong><br/>
                          {seizure.type}
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
                      
                      {seizure.medication && (
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#003087' }}>Medication:</strong> {seizure.medication}
                        </div>
                      )}
                      
                      {seizure.notes && (
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#003087' }}>Notes:</strong> {seizure.notes}
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
              }}>
                <h2 style={{ margin: '0 0 20px 0', color: '#003087' }}>Seizure Insights</h2>
                
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
                            {(seizures.length / Math.max(1, Math.ceil((new Date().getTime() - new Date(seizures[seizures.length - 1]?.date || new Date()).getTime()) / (1000 * 60 * 60 * 24 * 30)))).toFixed(1)}
                          </div>
                          <div style={{ color: '#666' }}>Seizures per month</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#005EB8' }}>
                            {seizures.length > 1 ? Math.round((new Date(seizures[0].date).getTime() - new Date(seizures[1].date).getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'}
                          </div>
                          <div style={{ color: '#666' }}>Days since last seizure</div>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e1e5e9'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Pattern Recognition</h3>
                      <div style={{ color: '#666' }}>
                        <p>Most common seizure type: <strong style={{ color: '#005EB8' }}>
                          {seizures.length > 0 ? 
                            Object.entries(
                              seizures.reduce((acc: {[key: string]: number}, s) => {
                                acc[s.type] = (acc[s.type] || 0) + 1
                                return acc
                              }, {})
                            ).sort(([,a], [,b]) => b - a)[0][0] 
                            : 'None'
                          }
                        </strong></p>
                        <p>Average severity: <strong style={{ color: '#005EB8' }}>{getAverageSeverity()}/5</strong></p>
                        <p>Most common trigger: <strong style={{ color: '#005EB8' }}>{getMostCommonTrigger()}</strong></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
