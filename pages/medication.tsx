
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

interface Medication {
  id: string
  name: string
  genericName: string
  dose: number
  unit: string
  frequency: string
  times: {
    am?: string
    midday?: string
    pm?: string
  }
  startDate: string
  prescribingDoctor: string
  doctorContact: string
  pharmacyName: string
  pharmacyPhone: string
  sideEffects: string[]
  effectiveness: number
  daysSupply: number
  nextRefillDate: string
  specialInstructions: string
  notes: string
  status: 'active' | 'paused' | 'discontinued'
  createdAt: string
}

interface DoseSchedule {
  medicationId: string
  medicationName: string
  dose: string
  time: string
  taken: boolean
}

interface User {
  id: string
  name: string
  email: string
  type: string
}

export default function Medication() {
  const [user, setUser] = useState<User | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [todaySchedule, setTodaySchedule] = useState<DoseSchedule[]>([])
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    dose: '',
    unit: 'mg',
    frequency: 'once_daily',
    timeAm: '',
    timeMidday: '',
    timePm: '',
    startDate: new Date().toISOString().split('T')[0],
    prescribingDoctor: '',
    doctorContact: '',
    pharmacyName: '',
    pharmacyPhone: '',
    sideEffects: '',
    effectiveness: 3,
    daysSupply: '',
    nextRefillDate: '',
    specialInstructions: '',
    notes: '',
    status: 'active' as const
  })
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date())
  const router = useRouter()

  // Update dates every minute to keep them current
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() + mondayOffset)
      setCurrentWeekStart(monday)
    }, 60000) // Update every minute

    // Set initial week start
    const now = new Date()
    const mondayOffset = now.getDay() === 0 ? -6 : 1 - now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    setCurrentWeekStart(monday)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Check authentication
    const savedUser = localStorage.getItem('neurolog_user')
    if (!savedUser) {
      router.push('/auth/login')
      return
    }
    
    const userData = JSON.parse(savedUser)
    setUser(userData)
    
    // Load medication data
    const savedMedications = localStorage.getItem(`neurolog_medications_${userData.id}`)
    if (savedMedications) {
      setMedications(JSON.parse(savedMedications))
    } else {
      // Initialize with sample medications
      const sampleMedications: Medication[] = [
        {
          id: '1',
          name: 'Levetiracetam',
          genericName: 'Keppra',
          dose: 500,
          unit: 'mg',
          frequency: 'twice_daily',
          times: { am: '08:00', pm: '20:00' },
          startDate: '2024-01-15',
          prescribingDoctor: 'Dr. Sarah Johnson',
          doctorContact: '01234 567890',
          pharmacyName: 'Central Pharmacy',
          pharmacyPhone: '01234 987654',
          sideEffects: ['Drowsiness', 'Dizziness'],
          effectiveness: 4,
          daysSupply: 28,
          nextRefillDate: '2024-02-15',
          specialInstructions: 'Take with food',
          notes: 'Helps control tonic-clonic seizures effectively',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Lamotrigine',
          genericName: 'Lamictal',
          dose: 100,
          unit: 'mg',
          frequency: 'twice_daily',
          times: { am: '08:00', pm: '20:00' },
          startDate: '2024-01-01',
          prescribingDoctor: 'Dr. Sarah Johnson',
          doctorContact: '01234 567890',
          pharmacyName: 'Central Pharmacy',
          pharmacyPhone: '01234 987654',
          sideEffects: ['Mild headache'],
          effectiveness: 5,
          daysSupply: 25,
          nextRefillDate: '2024-02-12',
          specialInstructions: 'Increase dose gradually',
          notes: 'Primary seizure medication, very effective',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Lorazepam',
          genericName: 'Ativan',
          dose: 1,
          unit: 'mg',
          frequency: 'as_needed',
          times: {},
          startDate: '2024-01-15',
          prescribingDoctor: 'Dr. Sarah Johnson',
          doctorContact: '01234 567890',
          pharmacyName: 'Central Pharmacy',
          pharmacyPhone: '01234 987654',
          sideEffects: ['Sedation'],
          effectiveness: 4,
          daysSupply: 10,
          nextRefillDate: '2024-03-01',
          specialInstructions: 'Use only for prolonged seizures',
          notes: 'Emergency rescue medication',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ]
      setMedications(sampleMedications)
      localStorage.setItem(`neurolog_medications_${userData.id}`, JSON.stringify(sampleMedications))
    }
  }, [router])

  useEffect(() => {
    // Generate today's schedule
    const schedule: DoseSchedule[] = []
    const today = new Date().toDateString()
    const savedSchedule = localStorage.getItem(`neurolog_schedule_${user?.id}_${today}`)
    
    if (savedSchedule) {
      setTodaySchedule(JSON.parse(savedSchedule))
    } else {
      medications.forEach(med => {
        if (med.status === 'active') {
          if (med.times.am) {
            schedule.push({
              medicationId: med.id,
              medicationName: med.name,
              dose: `${med.dose}${med.unit}`,
              time: med.times.am,
              taken: false
            })
          }
          if (med.times.midday) {
            schedule.push({
              medicationId: med.id,
              medicationName: med.name,
              dose: `${med.dose}${med.unit}`,
              time: med.times.midday,
              taken: false
            })
          }
          if (med.times.pm) {
            schedule.push({
              medicationId: med.id,
              medicationName: med.name,
              dose: `${med.dose}${med.unit}`,
              time: med.times.pm,
              taken: false
            })
          }
        }
      })
      setTodaySchedule(schedule)
    }
  }, [medications, user])

  const handleLogout = () => {
    localStorage.removeItem('neurolog_user')
    router.push('/auth/login')
  }

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault()
    
    const times: { am?: string; midday?: string; pm?: string } = {}
    if (formData.timeAm) times.am = formData.timeAm
    if (formData.timeMidday) times.midday = formData.timeMidday
    if (formData.timePm) times.pm = formData.timePm

    const newMedication: Medication = {
      id: editingMedication?.id || Date.now().toString(),
      name: formData.name,
      genericName: formData.genericName,
      dose: parseFloat(formData.dose),
      unit: formData.unit,
      frequency: formData.frequency,
      times,
      startDate: formData.startDate,
      prescribingDoctor: formData.prescribingDoctor,
      doctorContact: formData.doctorContact,
      pharmacyName: formData.pharmacyName,
      pharmacyPhone: formData.pharmacyPhone,
      sideEffects: formData.sideEffects.split(',').map(s => s.trim()).filter(s => s),
      effectiveness: formData.effectiveness,
      daysSupply: parseInt(formData.daysSupply),
      nextRefillDate: formData.nextRefillDate,
      specialInstructions: formData.specialInstructions,
      notes: formData.notes,
      status: formData.status,
      createdAt: editingMedication?.createdAt || new Date().toISOString()
    }
    
    let updatedMedications
    if (editingMedication) {
      updatedMedications = medications.map(med => med.id === editingMedication.id ? newMedication : med)
    } else {
      updatedMedications = [newMedication, ...medications]
    }
    
    setMedications(updatedMedications)
    localStorage.setItem(`neurolog_medications_${user?.id}`, JSON.stringify(updatedMedications))
    
    // Reset form
    setFormData({
      name: '',
      genericName: '',
      dose: '',
      unit: 'mg',
      frequency: 'once_daily',
      timeAm: '',
      timeMidday: '',
      timePm: '',
      startDate: new Date().toISOString().split('T')[0],
      prescribingDoctor: '',
      doctorContact: '',
      pharmacyName: '',
      pharmacyPhone: '',
      sideEffects: '',
      effectiveness: 3,
      daysSupply: '',
      nextRefillDate: '',
      specialInstructions: '',
      notes: '',
      status: 'active'
    })
    setShowAddForm(false)
    setEditingMedication(null)
  }

  const editMedication = (medication: Medication) => {
    setFormData({
      name: medication.name,
      genericName: medication.genericName,
      dose: medication.dose.toString(),
      unit: medication.unit,
      frequency: medication.frequency,
      timeAm: medication.times.am || '',
      timeMidday: medication.times.midday || '',
      timePm: medication.times.pm || '',
      startDate: medication.startDate,
      prescribingDoctor: medication.prescribingDoctor,
      doctorContact: medication.doctorContact,
      pharmacyName: medication.pharmacyName,
      pharmacyPhone: medication.pharmacyPhone,
      sideEffects: medication.sideEffects.join(', '),
      effectiveness: medication.effectiveness,
      daysSupply: medication.daysSupply.toString(),
      nextRefillDate: medication.nextRefillDate,
      specialInstructions: medication.specialInstructions,
      notes: medication.notes,
      status: medication.status
    })
    setEditingMedication(medication)
    setShowAddForm(true)
  }

  const deleteMedication = (id: string) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      const updatedMedications = medications.filter(med => med.id !== id)
      setMedications(updatedMedications)
      localStorage.setItem(`neurolog_medications_${user?.id}`, JSON.stringify(updatedMedications))
    }
  }

  const toggleDoseTaken = (index: number) => {
    const updatedSchedule = [...todaySchedule]
    updatedSchedule[index].taken = !updatedSchedule[index].taken
    setTodaySchedule(updatedSchedule)
    
    const today = new Date().toDateString()
    localStorage.setItem(`neurolog_schedule_${user?.id}_${today}`, JSON.stringify(updatedSchedule))
  }

  const getNextDoseTime = () => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const upcomingDoses = todaySchedule
      .filter(dose => !dose.taken && dose.time > currentTime)
      .sort((a, b) => a.time.localeCompare(b.time))
    
    return upcomingDoses[0]?.time || 'No more doses today'
  }

  const getActiveMedicationsCount = () => medications.filter(med => med.status === 'active').length
  const getTodayDosesCount = () => todaySchedule.length
  const getTakenDosesCount = () => todaySchedule.filter(dose => dose.taken).length

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Head>
        <title>Medications - NeuroLog</title>
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
                💊
              </div>
              <div>
                <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>My Medications</h1>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>
                  {user.name} • Medication Management
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => router.push('/dashboard')}
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
                Dashboard
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
            {['overview', 'schedule', 'medications', 'add', 'history'].map(tab => (
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
              {/* Quick Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                    {getActiveMedicationsCount()}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Active Medications</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005EB8', marginBottom: '8px' }}>
                    {getTakenDosesCount()}/{getTodayDosesCount()}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Doses Today</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#005EB8', marginBottom: '8px' }}>
                    {getNextDoseTime()}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Next Dose</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#005EB8', marginBottom: '8px' }}>
                    {Math.round((getTakenDosesCount() / Math.max(1, getTodayDosesCount())) * 100)}%
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Adherence</div>
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
                  + Add New Medication
                </button>
              </div>

              {/* Today's Schedule Preview */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9',
                marginBottom: '32px'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#003087', fontSize: '20px' }}>Today's Schedule</h3>
                {todaySchedule.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>
                    No scheduled doses for today
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {todaySchedule.slice(0, 5).map((dose, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: dose.taken ? '#e8f5e8' : '#f8f9fa',
                        borderRadius: '8px',
                        border: dose.taken ? '1px solid #4caf50' : '1px solid #e1e5e9'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#003087' }}>
                            {dose.time} - {dose.medicationName}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            {dose.dose}
                          </div>
                        </div>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: dose.taken ? '#4caf50' : '#ddd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px'
                        }}>
                          {dose.taken ? '✓' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Medications */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#003087', fontSize: '20px' }}>Current Medications</h3>
                {medications.filter(med => med.status === 'active').length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                    No active medications. Add your first medication to get started.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    {medications.filter(med => med.status === 'active').map(medication => (
                      <div key={medication.id} style={{
                        border: '1px solid #e1e5e9',
                        borderRadius: '12px',
                        padding: '20px',
                        background: '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#003087', fontSize: '18px' }}>
                              {medication.name}
                            </div>
                            <div style={{ color: '#666', fontSize: '14px' }}>
                              {medication.genericName} • {medication.dose}{medication.unit}
                            </div>
                          </div>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#e8f5e8',
                            color: '#2e7d32',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            Active
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                            <strong>Frequency:</strong> {medication.frequency.replace('_', ' ')}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                            <strong>Times:</strong> {Object.values(medication.times).join(', ') || 'As needed'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            <strong>Next refill:</strong> {new Date(medication.nextRefillDate).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => editMedication(medication)}
                            style={{
                              flex: 1,
                              padding: '8px 16px',
                              background: '#005EB8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMedication(medication.id)}
                            style={{
                              padding: '8px 16px',
                              background: '#ff4757',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
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
            </div>
          )}

          {activeTab === 'schedule' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>Weekly Medication Schedule</h2>
              
              {/* Current Week Navigation */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px' }}>
                <button style={{
                  background: 'none',
                  border: 'none',
                  color: '#005EB8',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '8px'
                }}>
                  ←
                </button>
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#003087',
                  margin: '0 24px'
                }}>
                  {currentWeekStart.toLocaleDateString('en-GB', { 
                    day: 'numeric',
                    month: 'short'
                  })} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { 
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                <button style={{
                  background: 'none',
                  border: 'none',
                  color: '#005EB8',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '8px'
                }}>
                  →
                </button>
              </div>

              {/* Weekly Calendar Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '12px',
                marginBottom: '24px'
              }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, dayIndex) => {
                  const today = new Date()
                  const currentDay = new Date(currentWeekStart)
                  currentDay.setDate(currentWeekStart.getDate() + dayIndex)
                  const isToday = currentDay.toDateString() === today.toDateString()
                  
                  return (
                    <div key={day} style={{
                      border: isToday ? '2px solid #005EB8' : '1px solid #e1e5e9',
                      borderRadius: '12px',
                      padding: '16px',
                      background: isToday ? '#f0f8ff' : '#f8f9fa',
                      minHeight: '300px'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        marginBottom: '16px',
                        borderBottom: '1px solid #e1e5e9',
                        paddingBottom: '8px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: isToday ? '#005EB8' : '#003087',
                          marginBottom: '4px'
                        }}>
                          {day.slice(0, 3)}
                        </div>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: isToday ? '#005EB8' : '#666'
                        }}>
                          {currentDay.getDate()}
                        </div>
                      </div>

                      {/* Time slots for the day */}
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {['08:00', '12:00', '20:00'].map(time => {
                          // For today, show actual schedule, for other days show sample
                          const hasMedication = isToday && todaySchedule.some(dose => dose.time === time)
                          const medication = isToday ? todaySchedule.find(dose => dose.time === time) : null
                          
                          return (
                            <div key={time} style={{
                              padding: '8px',
                              borderRadius: '6px',
                              border: hasMedication ? '1px solid #4caf50' : '1px dashed #ddd',
                              background: hasMedication ? (medication?.taken ? '#e8f5e8' : '#fff9c4') : 'transparent',
                              minHeight: '40px',
                              fontSize: '12px'
                            }}>
                              <div style={{
                                fontWeight: '500',
                                color: '#666',
                                marginBottom: '2px'
                              }}>
                                {time}
                              </div>
                              {hasMedication && medication && (
                                <div>
                                  <div style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#003087',
                                    marginBottom: '2px'
                                  }}>
                                    {medication.medicationName}
                                  </div>
                                  <div style={{
                                    fontSize: '10px',
                                    color: '#666'
                                  }}>
                                    {medication.dose}
                                  </div>
                                  {isToday && (
                                    <button
                                      onClick={() => toggleDoseTaken(todaySchedule.indexOf(medication))}
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        border: medication.taken ? '1px solid #4caf50' : '1px solid #ddd',
                                        backgroundColor: medication.taken ? '#4caf50' : 'white',
                                        color: medication.taken ? 'white' : '#666',
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '4px'
                                      }}
                                    >
                                      {medication.taken ? '✓' : ''}
                                    </button>
                                  )}
                                </div>
                              )}
                              {!hasMedication && isToday && (
                                <div style={{
                                  color: '#ccc',
                                  fontSize: '10px',
                                  fontStyle: 'italic'
                                }}>
                                  No medication
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Today's Progress Summary */}
              {todaySchedule.length > 0 && (
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Today's Progress</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '500' }}>Completed</span>
                    <span>{getTakenDosesCount()}/{getTodayDosesCount()} doses</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e1e5e9',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(getTakenDosesCount() / Math.max(1, getTodayDosesCount())) * 100}%`,
                      height: '100%',
                      backgroundColor: '#4caf50',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
                    Next dose: {getNextDoseTime()}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e1e5e9'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#003087', marginBottom: '8px' }}>
                  Legend:
                </div>
                <div style={{ display: 'flex', gap: '24px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#e8f5e8',
                      border: '1px solid #4caf50',
                      borderRadius: '4px'
                    }} />
                    <span>Taken</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#fff9c4',
                      border: '1px solid #4caf50',
                      borderRadius: '4px'
                    }} />
                    <span>Scheduled</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#f0f8ff',
                      border: '2px solid #005EB8',
                      borderRadius: '4px'
                    }} />
                    <span>Today</span>
                  </div>
                </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>All Medications</h2>
                <button
                  onClick={() => setActiveTab('add')}
                  style={{
                    background: '#005EB8',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add Medication
                </button>
              </div>
              
              {medications.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
                  <div>No medications added yet.</div>
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
                    Add Your First Medication
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {medications.map(medication => (
                    <div key={medication.id} style={{
                      border: '1px solid #e1e5e9',
                      borderRadius: '12px',
                      padding: '24px',
                      background: medication.status === 'active' ? '#f8fffe' : 
                                 medication.status === 'paused' ? '#fff8e1' : '#fafafa'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', color: '#003087', fontSize: '20px' }}>
                            {medication.name}
                          </h3>
                          <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                            {medication.genericName} • {medication.dose}{medication.unit} • {medication.frequency.replace('_', ' ')}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          backgroundColor: medication.status === 'active' ? '#e8f5e8' : 
                                          medication.status === 'paused' ? '#fff3cd' : '#f0f0f0',
                          color: medication.status === 'active' ? '#2e7d32' : 
                                medication.status === 'paused' ? '#856404' : '#666',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {medication.status}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <strong style={{ color: '#003087' }}>Prescribing Doctor:</strong><br/>
                          <span style={{ color: '#666' }}>{medication.prescribingDoctor}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#003087' }}>Times:</strong><br/>
                          <span style={{ color: '#666' }}>{Object.values(medication.times).join(', ') || 'As needed'}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#003087' }}>Effectiveness:</strong><br/>
                          <span style={{ color: '#666' }}>{medication.effectiveness}/5</span>
                        </div>
                        <div>
                          <strong style={{ color: '#003087' }}>Days Supply:</strong><br/>
                          <span style={{ color: medication.daysSupply < 7 ? '#ff4757' : '#666' }}>
                            {medication.daysSupply} days
                          </span>
                        </div>
                      </div>
                      
                      {medication.sideEffects.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ color: '#003087' }}>Side Effects:</strong> {medication.sideEffects.join(', ')}
                        </div>
                      )}
                      
                      {medication.notes && (
                        <div style={{ marginBottom: '16px', fontStyle: 'italic', color: '#666' }}>
                          "{medication.notes}"
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => editMedication(medication)}
                          style={{
                            padding: '8px 16px',
                            background: '#005EB8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            const updatedMeds = medications.map(med => 
                              med.id === medication.id 
                                ? { ...med, status: med.status === 'active' ? 'paused' : 'active' as const }
                                : med
                            )
                            setMedications(updatedMeds)
                            localStorage.setItem(`neurolog_medications_${user?.id}`, JSON.stringify(updatedMeds))
                          }}
                          style={{
                            padding: '8px 16px',
                            background: medication.status === 'active' ? '#ff9800' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          {medication.status === 'active' ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={() => deleteMedication(medication.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#ff4757',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
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

          {activeTab === 'add' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087', textAlign: 'center' }}>
                {editingMedication ? 'Edit Medication' : 'Add New Medication'}
              </h2>
              
              <form onSubmit={handleAddMedication}>
                <div style={{ display: 'grid', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Medication Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Levetiracetam"
                        required
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
                        Generic Name
                      </label>
                      <input
                        type="text"
                        value={formData.genericName}
                        onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                        placeholder="e.g., Keppra"
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Dose Amount *
                      </label>
                      <input
                        type="number"
                        value={formData.dose}
                        onChange={(e) => setFormData({...formData, dose: e.target.value})}
                        placeholder="500"
                        required
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
                        Unit
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
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
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="tablets">tablets</option>
                        <option value="capsules">capsules</option>
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Frequency *
                      </label>
                      <select
                        value={formData.frequency}
                        onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                        required
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
                        <option value="once_daily">Once daily</option>
                        <option value="twice_daily">Twice daily</option>
                        <option value="three_times_daily">Three times daily</option>
                        <option value="four_times_daily">Four times daily</option>
                        <option value="as_needed">As needed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Dosing Times
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>AM</label>
                        <input
                          type="time"
                          value={formData.timeAm}
                          onChange={(e) => setFormData({...formData, timeAm: e.target.value})}
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
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Midday</label>
                        <input
                          type="time"
                          value={formData.timeMidday}
                          onChange={(e) => setFormData({...formData, timeMidday: e.target.value})}
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
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>PM</label>
                        <input
                          type="time"
                          value={formData.timePm}
                          onChange={(e) => setFormData({...formData, timePm: e.target.value})}
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
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
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
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'paused' | 'discontinued'})}
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
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Prescribing Doctor
                      </label>
                      <input
                        type="text"
                        value={formData.prescribingDoctor}
                        onChange={(e) => setFormData({...formData, prescribingDoctor: e.target.value})}
                        placeholder="Dr. John Smith"
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
                        Doctor Contact
                      </label>
                      <input
                        type="text"
                        value={formData.doctorContact}
                        onChange={(e) => setFormData({...formData, doctorContact: e.target.value})}
                        placeholder="01234 567890"
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Pharmacy Name
                      </label>
                      <input
                        type="text"
                        value={formData.pharmacyName}
                        onChange={(e) => setFormData({...formData, pharmacyName: e.target.value})}
                        placeholder="Central Pharmacy"
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
                        Pharmacy Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.pharmacyPhone}
                        onChange={(e) => setFormData({...formData, pharmacyPhone: e.target.value})}
                        placeholder="01234 987654"
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Effectiveness (1-5): {formData.effectiveness}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={formData.effectiveness}
                        onChange={(e) => setFormData({...formData, effectiveness: parseInt(e.target.value)})}
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
                        value={formData.daysSupply}
                        onChange={(e) => setFormData({...formData, daysSupply: e.target.value})}
                        placeholder="30"
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
                        Next Refill Date
                      </label>
                      <input
                        type="date"
                        value={formData.nextRefillDate}
                        onChange={(e) => setFormData({...formData, nextRefillDate: e.target.value})}
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
                      Side Effects (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.sideEffects}
                      onChange={(e) => setFormData({...formData, sideEffects: e.target.value})}
                      placeholder="e.g., drowsiness, dizziness, nausea"
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
                      Special Instructions
                    </label>
                    <textarea
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                      placeholder="e.g., take with food, avoid alcohol"
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
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Notes (effectiveness, seizure impact, etc.)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="How does this medication affect your seizures? Any observations?"
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
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingMedication(null)
                      setActiveTab('overview')
                    }}
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
                    {editingMedication ? 'Update Medication' : 'Save Medication'}
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
              <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>Medication History</h2>
              
              {medications.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div>No medication history yet.</div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {/* Timeline line */}
                  <div style={{
                    position: 'absolute',
                    left: '20px',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    backgroundColor: '#e1e5e9'
                  }} />
                  
                  <div style={{ display: 'grid', gap: '24px' }}>
                    {medications
                      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                      .map((medication, index) => (
                        <div key={medication.id} style={{ position: 'relative', paddingLeft: '60px' }}>
                          {/* Timeline dot */}
                          <div style={{
                            position: 'absolute',
                            left: '10px',
                            top: '20px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: medication.status === 'active' ? '#4caf50' : 
                                            medication.status === 'paused' ? '#ff9800' : '#666',
                            border: '3px solid white',
                            boxShadow: '0 0 0 2px #e1e5e9'
                          }} />
                          
                          <div style={{
                            border: '1px solid #e1e5e9',
                            borderRadius: '12px',
                            padding: '20px',
                            background: '#f8f9fa'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                              <div>
                                <h3 style={{ margin: '0 0 4px 0', color: '#003087' }}>
                                  {medication.name}
                                </h3>
                                <div style={{ color: '#666', fontSize: '14px' }}>
                                  Started: {new Date(medication.startDate).toLocaleDateString()}
                                </div>
                              </div>
                              <div style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                backgroundColor: medication.status === 'active' ? '#e8f5e8' : 
                                                medication.status === 'paused' ? '#fff3cd' : '#f0f0f0',
                                color: medication.status === 'active' ? '#2e7d32' : 
                                      medication.status === 'paused' ? '#856404' : '#666',
                                fontSize: '12px',
                                fontWeight: '500',
                                textTransform: 'capitalize'
                              }}>
                                {medication.status}
                              </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '14px' }}>
                              <div><strong>Dose:</strong> {medication.dose}{medication.unit}</div>
                              <div><strong>Frequency:</strong> {medication.frequency.replace('_', ' ')}</div>
                              <div><strong>Effectiveness:</strong> {medication.effectiveness}/5</div>
                              <div><strong>Doctor:</strong> {medication.prescribingDoctor || 'Not specified'}</div>
                            </div>
                            
                            {medication.notes && (
                              <div style={{ marginTop: '12px', fontStyle: 'italic', color: '#666', fontSize: '14px' }}>
                                "{medication.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
