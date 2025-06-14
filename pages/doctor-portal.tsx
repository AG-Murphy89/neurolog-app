
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

interface Patient {
  id: string
  name: string
  age: number
  dateOfBirth: string
  nhsNumber: string
  email: string
  phone: string
  emergencyContact: string
  consentStatus: 'granted' | 'pending' | 'revoked'
  lastActivity: string
  riskLevel: 'low' | 'medium' | 'high'
  totalSeizures: number
  recentSeizures: number
  medicationCompliance: number
  lastSeizure: string
  currentMedications: string[]
  triggers: string[]
  seizureTypes: string[]
  notes: ClinicalNote[]
}

interface ClinicalNote {
  id: string
  date: string
  doctorId: string
  doctorName: string
  type: 'observation' | 'treatment' | 'follow-up' | 'emergency'
  content: string
  actionRequired: boolean
  followUpDate?: string
}

interface Alert {
  id: string
  patientId: string
  patientName: string
  type: 'medication' | 'seizure' | 'appointment' | 'emergency'
  priority: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  resolved: boolean
}

interface Doctor {
  id: string
  name: string
  title: string
  practiceName: string
  gmcNumber: string
  specialization: string
}

export default function DoctorPortal() {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [newNote, setNewNote] = useState({
    type: 'observation' as const,
    content: '',
    actionRequired: false,
    followUpDate: ''
  })
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const savedDoctor = localStorage.getItem('neurolog_doctor')
    if (!savedDoctor) {
      router.push('/auth/login')
      return
    }

    const doctorData = JSON.parse(savedDoctor)
    setDoctor(doctorData)

    // Load sample data
    loadSampleData(doctorData.id)
  }, [router])

  const loadSampleData = (doctorId: string) => {
    const samplePatients: Patient[] = [
      {
        id: 'p1',
        name: 'Sarah Johnson',
        age: 28,
        dateOfBirth: '1995-03-15',
        nhsNumber: 'ABC 123 456C',
        email: 'sarah.j@email.com',
        phone: '07123 456789',
        emergencyContact: 'Mike Johnson (husband) - 07987 654321',
        consentStatus: 'granted',
        lastActivity: '2024-01-15T10:30:00Z',
        riskLevel: 'high',
        totalSeizures: 45,
        recentSeizures: 8,
        medicationCompliance: 75,
        lastSeizure: '2024-01-14T14:20:00Z',
        currentMedications: ['Levetiracetam 500mg', 'Lamotrigine 200mg'],
        triggers: ['Sleep deprivation', 'Stress', 'Flashing lights'],
        seizureTypes: ['Tonic-clonic', 'Focal aware'],
        notes: []
      },
      {
        id: 'p2',
        name: 'James Wilson',
        age: 35,
        dateOfBirth: '1988-07-22',
        nhsNumber: 'DEF 789 123G',
        email: 'j.wilson@email.com',
        phone: '07234 567890',
        emergencyContact: 'Emma Wilson (wife) - 07876 543210',
        consentStatus: 'granted',
        lastActivity: '2024-01-15T08:15:00Z',
        riskLevel: 'medium',
        totalSeizures: 23,
        recentSeizures: 2,
        medicationCompliance: 95,
        lastSeizure: '2024-01-10T09:45:00Z',
        currentMedications: ['Carbamazepine 400mg', 'Valproate 500mg'],
        triggers: ['Alcohol', 'Missed medication'],
        seizureTypes: ['Focal impaired awareness'],
        notes: []
      },
      {
        id: 'p3',
        name: 'Emily Davis',
        age: 42,
        dateOfBirth: '1981-11-08',
        nhsNumber: 'GHI 456 789J',
        email: 'emily.davis@email.com',
        phone: '07345 678901',
        emergencyContact: 'David Davis (partner) - 07765 432109',
        consentStatus: 'granted',
        lastActivity: '2024-01-15T16:45:00Z',
        riskLevel: 'low',
        totalSeizures: 12,
        recentSeizures: 1,
        medicationCompliance: 98,
        lastSeizure: '2024-01-05T11:30:00Z',
        currentMedications: ['Topiramate 100mg'],
        triggers: ['Hormonal changes', 'Fatigue'],
        seizureTypes: ['Absence'],
        notes: []
      },
      {
        id: 'p4',
        name: 'Michael Brown',
        age: 19,
        dateOfBirth: '2004-05-30',
        nhsNumber: 'JKL 987 654M',
        email: 'm.brown@email.com',
        phone: '07456 789012',
        emergencyContact: 'Susan Brown (mother) - 07654 321098',
        consentStatus: 'granted',
        lastActivity: '2024-01-14T20:30:00Z',
        riskLevel: 'high',
        totalSeizures: 67,
        recentSeizures: 12,
        medicationCompliance: 60,
        lastSeizure: '2024-01-15T07:15:00Z',
        currentMedications: ['Phenytoin 300mg', 'Clobazam 10mg'],
        triggers: ['Gaming', 'Irregular sleep', 'Caffeine'],
        seizureTypes: ['Tonic-clonic', 'Myoclonic'],
        notes: []
      },
      {
        id: 'p5',
        name: 'Lisa Thompson',
        age: 31,
        dateOfBirth: '1992-09-12',
        nhsNumber: 'MNO 234 567P',
        email: 'lisa.t@email.com',
        phone: '07567 890123',
        emergencyContact: 'Robert Thompson (husband) - 07543 210987',
        consentStatus: 'granted',
        lastActivity: '2024-01-15T12:00:00Z',
        riskLevel: 'medium',
        totalSeizures: 31,
        recentSeizures: 4,
        medicationCompliance: 88,
        lastSeizure: '2024-01-12T15:20:00Z',
        currentMedications: ['Oxcarbazepine 600mg', 'Levetiracetam 750mg'],
        triggers: ['Pregnancy concerns', 'Medication timing'],
        seizureTypes: ['Focal aware', 'Secondary generalized'],
        notes: []
      }
    ]

    const sampleAlerts: Alert[] = [
      {
        id: 'a1',
        patientId: 'p1',
        patientName: 'Sarah Johnson',
        type: 'seizure',
        priority: 'critical',
        message: 'Multiple seizures reported in last 24 hours (3 episodes)',
        timestamp: '2024-01-15T08:30:00Z',
        resolved: false
      },
      {
        id: 'a2',
        patientId: 'p4',
        patientName: 'Michael Brown',
        type: 'medication',
        priority: 'high',
        message: 'Poor medication compliance (60%) - missed doses for 3 days',
        timestamp: '2024-01-15T09:15:00Z',
        resolved: false
      },
      {
        id: 'a3',
        patientId: 'p2',
        patientName: 'James Wilson',
        type: 'appointment',
        priority: 'medium',
        message: 'Follow-up appointment due - last seen 6 months ago',
        timestamp: '2024-01-15T10:00:00Z',
        resolved: false
      },
      {
        id: 'a4',
        patientId: 'p5',
        patientName: 'Lisa Thompson',
        type: 'medication',
        priority: 'medium',
        message: 'Reported side effects - drowsiness and dizziness',
        timestamp: '2024-01-15T11:30:00Z',
        resolved: false
      }
    ]

    setPatients(samplePatients)
    setAlerts(sampleAlerts)
  }

  const handleLogout = () => {
    localStorage.removeItem('neurolog_doctor')
    router.push('/auth/login')
  }

  const addClinicalNote = (patientId: string) => {
    if (!newNote.content.trim() || !doctor) return

    const note: ClinicalNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      doctorId: doctor.id,
      doctorName: doctor.name,
      type: newNote.type,
      content: newNote.content,
      actionRequired: newNote.actionRequired,
      followUpDate: newNote.followUpDate || undefined
    }

    setPatients(patients.map(patient => 
      patient.id === patientId 
        ? { ...patient, notes: [note, ...patient.notes] }
        : patient
    ))

    setNewNote({
      type: 'observation',
      content: '',
      actionRequired: false,
      followUpDate: ''
    })
  }

  const resolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.nhsNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRisk = filterRisk === 'all' || patient.riskLevel === filterRisk
    return matchesSearch && matchesRisk
  })

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return '#ff4757'
      case 'medium': return '#ffa726'
      case 'low': return '#4caf50'
      default: return '#666'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#d32f2f'
      case 'high': return '#f57c00'
      case 'medium': return '#fbc02d'
      case 'low': return '#388e3c'
      default: return '#666'
    }
  }

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved)
  const criticalAlerts = unresolvedAlerts.filter(alert => alert.priority === 'critical')
  const highRiskPatients = patients.filter(patient => patient.riskLevel === 'high')

  if (!doctor) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Head>
        <title>Doctor Portal - NeuroLog</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
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
            maxWidth: '1400px',
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
                🏥
              </div>
              <div>
                <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>NeuroLog Doctor Portal</h1>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>
                  {doctor.title} {doctor.name} • {doctor.practiceName}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {criticalAlerts.length > 0 && (
                <div style={{
                  background: '#ff4757',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  animation: 'pulse 2s infinite'
                }}>
                  {criticalAlerts.length} CRITICAL ALERT{criticalAlerts.length > 1 ? 'S' : ''}
                </div>
              )}
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
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            gap: '32px'
          }}>
            {['dashboard', 'patients', 'alerts', 'analytics'].map(tab => (
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
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '32px 24px'
        }}>
          {activeTab === 'dashboard' && (
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
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#005EB8', marginBottom: '8px' }}>
                    {patients.length}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Total Patients</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff4757', marginBottom: '8px' }}>
                    {highRiskPatients.length}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>High Risk Patients</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffa726', marginBottom: '8px' }}>
                    {unresolvedAlerts.length}
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Active Alerts</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50', marginBottom: '8px' }}>
                    {Math.round(patients.reduce((sum, p) => sum + p.medicationCompliance, 0) / patients.length)}%
                  </div>
                  <div style={{ color: '#666', fontSize: '16px' }}>Avg Compliance</div>
                </div>
              </div>

              {/* Critical Alerts */}
              {criticalAlerts.length > 0 && (
                <div style={{
                  background: '#fff5f5',
                  border: '2px solid #ff4757',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '32px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#d32f2f', fontSize: '18px' }}>
                    🚨 Critical Alerts Requiring Immediate Attention
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {criticalAlerts.map(alert => (
                      <div key={alert.id} style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #ff4757',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                            {alert.patientName}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            {alert.message}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              const patient = patients.find(p => p.id === alert.patientId)
                              if (patient) {
                                setSelectedPatient(patient)
                                setShowPatientModal(true)
                              }
                            }}
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
                            View Patient
                          </button>
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            style={{
                              padding: '8px 16px',
                              background: '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Patient Activity */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e1e5e9'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#003087', fontSize: '20px' }}>Recent Patient Activity</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {patients.slice(0, 6).map(patient => (
                    <div key={patient.id} style={{
                      border: '1px solid #e1e5e9',
                      borderRadius: '12px',
                      padding: '20px',
                      background: '#f8f9fa',
                      borderLeft: `4px solid ${getRiskColor(patient.riskLevel)}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#003087', fontSize: '16px' }}>
                            {patient.name}
                          </div>
                          <div style={{ color: '#666', fontSize: '12px' }}>
                            {patient.nhsNumber} • Age {patient.age}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: getRiskColor(patient.riskLevel) + '20',
                          color: getRiskColor(patient.riskLevel),
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {patient.riskLevel} RISK
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '12px' }}>
                        <div>
                          <strong>Recent seizures:</strong> {patient.recentSeizures}
                        </div>
                        <div>
                          <strong>Compliance:</strong> {patient.medicationCompliance}%
                        </div>
                        <div>
                          <strong>Last seizure:</strong> {new Date(patient.lastSeizure).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Last active:</strong> {new Date(patient.lastActivity).toLocaleDateString()}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedPatient(patient)
                          setShowPatientModal(true)
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: '#005EB8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div>
              {/* Search and Filter */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e1e5e9'
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search patients by name or NHS number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '300px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px'
                    }}
                  />
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e1e5e9',
                      fontSize: '16px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                  </select>
                </div>
              </div>

              {/* Patient List */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e1e5e9'
              }}>
                <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>
                  Patient List ({filteredPatients.length} patients)
                </h2>

                <div style={{ display: 'grid', gap: '16px' }}>
                  {filteredPatients.map(patient => (
                    <div key={patient.id} style={{
                      border: '1px solid #e1e5e9',
                      borderRadius: '12px',
                      padding: '24px',
                      background: '#f8fffe',
                      borderLeft: `6px solid ${getRiskColor(patient.riskLevel)}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', color: '#003087', fontSize: '20px' }}>
                            {patient.name}
                          </h3>
                          <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                            NHS: {patient.nhsNumber} • Age: {patient.age} • DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                          </div>
                          <div style={{ color: '#666', fontSize: '14px' }}>
                            📞 {patient.phone} • 📧 {patient.email}
                          </div>
                        </div>
                        <div style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          backgroundColor: getRiskColor(patient.riskLevel) + '20',
                          color: getRiskColor(patient.riskLevel),
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {patient.riskLevel} RISK
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <strong style={{ color: '#003087' }}>Total Seizures:</strong><br/>
                          <span style={{ color: '#666' }}>{patient.totalSeizures}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#003087' }}>Recent (30 days):</strong><br/>
                          <span style={{ color: patient.recentSeizures > 5 ? '#ff4757' : '#666' }}>
                            {patient.recentSeizures}
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: '#003087' }}>Medication Compliance:</strong><br/>
                          <span style={{ color: patient.medicationCompliance < 80 ? '#ff4757' : '#4caf50' }}>
                            {patient.medicationCompliance}%
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: '#003087' }}>Last Seizure:</strong><br/>
                          <span style={{ color: '#666' }}>
                            {new Date(patient.lastSeizure).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ color: '#003087' }}>Current Medications:</strong><br/>
                        <span style={{ color: '#666' }}>
                          {patient.currentMedications.join(', ') || 'None recorded'}
                        </span>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <strong style={{ color: '#003087' }}>Emergency Contact:</strong><br/>
                        <span style={{ color: '#666' }}>{patient.emergencyContact}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => {
                            setSelectedPatient(patient)
                            setShowPatientModal(true)
                          }}
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
                          View Full Record
                        </button>
                        <button
                          style={{
                            padding: '8px 16px',
                            background: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Add Note
                        </button>
                        <button
                          style={{
                            padding: '8px 16px',
                            background: '#ffa726',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Message Patient
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087' }}>Alert Management</h2>

              <div style={{ display: 'grid', gap: '16px' }}>
                {alerts.map(alert => (
                  <div key={alert.id} style={{
                    border: `2px solid ${getPriorityColor(alert.priority)}`,
                    borderRadius: '12px',
                    padding: '20px',
                    background: alert.resolved ? '#f0f0f0' : 'white',
                    opacity: alert.resolved ? 0.6 : 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          backgroundColor: getPriorityColor(alert.priority),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          marginBottom: '8px'
                        }}>
                          {alert.priority} • {alert.type}
                        </div>
                        <h3 style={{ margin: '0 0 4px 0', color: '#003087' }}>
                          {alert.patientName}
                        </h3>
                        <p style={{ margin: '0', color: '#666' }}>
                          {alert.message}
                        </p>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!alert.resolved && (
                          <>
                            <button
                              onClick={() => {
                                const patient = patients.find(p => p.id === alert.patientId)
                                if (patient) {
                                  setSelectedPatient(patient)
                                  setShowPatientModal(true)
                                }
                              }}
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
                              View Patient
                            </button>
                            <button
                              onClick={() => resolveAlert(alert.id)}
                              style={{
                                padding: '8px 16px',
                                background: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: 'pointer'
                              }}
                            >
                              Resolve
                            </button>
                          </>
                        )}
                        {alert.resolved && (
                          <div style={{
                            padding: '8px 16px',
                            background: '#4caf50',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}>
                            ✓ Resolved
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e1e5e9'
              }} id="doctor-analytics-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: '0', color: '#003087' }}>Practice Analytics</h2>
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
                        const element = document.getElementById('doctor-analytics-content')
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
                          pdf.text('NeuroLog - Practice Analytics Report', pdfWidth / 2, 20, { align: 'center' })
                          pdf.setFontSize(10)
                          pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pdfWidth / 2, 25, { align: 'center' })
                          
                          pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
                          pdf.save(`neurolog-practice-analytics-${new Date().toISOString().split('T')[0]}.pdf`)
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

                {/* Analytics Overview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '24px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    background: '#f8fffe',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e1e5e9'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#003087' }}>Average Medication Compliance</h4>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
                      {Math.round(patients.reduce((sum, p) => sum + p.medicationCompliance, 0) / patients.length)}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Target: 95% • Current: Above average
                    </div>
                  </div>

                  <div style={{
                    background: '#fff8f0',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e1e5e9'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#003087' }}>Average Seizures per Month</h4>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffa726' }}>
                      {Math.round(patients.reduce((sum, p) => sum + p.recentSeizures, 0) / patients.length)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Trend: Stable • Previous month: 5.2
                    </div>
                  </div>

                  <div style={{
                    background: '#fff0f0',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e1e5e9'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#003087' }}>Patients Requiring Attention</h4>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff4757' }}>
                      {patients.filter(p => p.riskLevel === 'high' || p.medicationCompliance < 80).length}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      High risk or poor compliance
                    </div>
                  </div>
                </div>

                {/* Risk Distribution */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Risk Level Distribution</h3>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'end', height: '200px', border: '1px solid #e1e5e9', borderRadius: '8px', padding: '20px' }}>
                    {['low', 'medium', 'high'].map(risk => {
                      const count = patients.filter(p => p.riskLevel === risk).length
                      const height = (count / patients.length) * 140
                      return (
                        <div key={risk} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div style={{
                            width: '60px',
                            height: `${height}px`,
                            backgroundColor: getRiskColor(risk),
                            borderRadius: '4px 4px 0 0',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'start',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            paddingTop: '8px'
                          }}>
                            {count}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666', textTransform: 'capitalize' }}>
                            {risk} Risk
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Medication Effectiveness */}
                <div>
                  <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Most Common Medications</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {Array.from(new Set(patients.flatMap(p => p.currentMedications))).map(med => {
                      const count = patients.filter(p => p.currentMedications.includes(med)).length
                      const percentage = (count / patients.length) * 100
                      return (
                        <div key={med} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #e1e5e9'
                        }}>
                          <span style={{ fontWeight: '500' }}>{med}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '100px',
                              height: '8px',
                              background: '#e1e5e9',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: '#005EB8',
                                borderRadius: '4px'
                              }} />
                            </div>
                            <span style={{ fontSize: '14px', color: '#666', minWidth: '60px' }}>
                              {count} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Patient Detail Modal */}
        {showPatientModal && selectedPatient && (
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
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#003087' }}>
                  {selectedPatient.name} - Patient Record
                </h2>
                <button
                  onClick={() => setShowPatientModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Patient Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <h3 style={{ margin: '0 0 12px 0', color: '#003087' }}>Patient Information</h3>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div><strong>NHS Number:</strong> {selectedPatient.nhsNumber}</div>
                    <div><strong>Date of Birth:</strong> {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</div>
                    <div><strong>Age:</strong> {selectedPatient.age}</div>
                    <div><strong>Phone:</strong> {selectedPatient.phone}</div>
                    <div><strong>Email:</strong> {selectedPatient.email}</div>
                    <div><strong>Emergency Contact:</strong> {selectedPatient.emergencyContact}</div>
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 12px 0', color: '#003087' }}>Medical Summary</h3>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div><strong>Risk Level:</strong> <span style={{ color: getRiskColor(selectedPatient.riskLevel) }}>{selectedPatient.riskLevel.toUpperCase()}</span></div>
                    <div><strong>Total Seizures:</strong> {selectedPatient.totalSeizures}</div>
                    <div><strong>Recent Seizures (30d):</strong> {selectedPatient.recentSeizures}</div>
                    <div><strong>Last Seizure:</strong> {new Date(selectedPatient.lastSeizure).toLocaleDateString()}</div>
                    <div><strong>Medication Compliance:</strong> {selectedPatient.medicationCompliance}%</div>
                    <div><strong>Seizure Types:</strong> {selectedPatient.seizureTypes.join(', ')}</div>
                  </div>
                </div>
              </div>

              {/* Current Medications */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#003087' }}>Current Medications</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {selectedPatient.currentMedications.map((med, index) => (
                    <div key={index} style={{
                      padding: '8px 12px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e1e5e9'
                    }}>
                      {med}
                    </div>
                  ))}
                </div>
              </div>

              {/* Triggers */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#003087' }}>Known Triggers</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedPatient.triggers.map((trigger, index) => (
                    <span key={index} style={{
                      padding: '4px 12px',
                      background: '#fff3cd',
                      color: '#856404',
                      borderRadius: '12px',
                      fontSize: '12px',
                      border: '1px solid #ffeaa7'
                    }}>
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>

              {/* Clinical Notes */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#003087' }}>Clinical Notes</h3>
                
                {/* Add New Note */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#003087' }}>Add New Clinical Note</h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <select
                      value={newNote.type}
                      onChange={(e) => setNewNote({...newNote, type: e.target.value as any})}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #e1e5e9',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="observation">Clinical Observation</option>
                      <option value="treatment">Treatment Plan</option>
                      <option value="follow-up">Follow-up Required</option>
                      <option value="emergency">Emergency Note</option>
                    </select>
                    <textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                      placeholder="Enter clinical note..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #e1e5e9',
                        minHeight: '80px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={newNote.actionRequired}
                          onChange={(e) => setNewNote({...newNote, actionRequired: e.target.checked})}
                        />
                        Action Required
                      </label>
                      {newNote.actionRequired && (
                        <input
                          type="date"
                          value={newNote.followUpDate}
                          onChange={(e) => setNewNote({...newNote, followUpDate: e.target.value})}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid #e1e5e9'
                          }}
                        />
                      )}
                      <button
                        onClick={() => addClinicalNote(selectedPatient.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#005EB8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing Notes */}
                <div style={{ display: 'grid', gap: '12px' }}>
                  {selectedPatient.notes.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                      No clinical notes yet. Add the first note above.
                    </div>
                  ) : (
                    selectedPatient.notes.map(note => (
                      <div key={note.id} style={{
                        padding: '16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e1e5e9',
                        borderLeft: `4px solid ${note.type === 'emergency' ? '#ff4757' : '#005EB8'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <span style={{
                              background: note.type === 'emergency' ? '#ff4757' : '#005EB8',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              textTransform: 'uppercase'
                            }}>
                              {note.type}
                            </span>
                            {note.actionRequired && (
                              <span style={{
                                background: '#ffa726',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                marginLeft: '8px'
                              }}>
                                ACTION REQUIRED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {new Date(note.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ color: '#333', marginBottom: '8px' }}>
                          {note.content}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          By: {note.doctorName}
                          {note.followUpDate && (
                            <span> • Follow-up: {new Date(note.followUpDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Close Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setShowPatientModal(false)}
                  style={{
                    padding: '12px 32px',
                    background: '#005EB8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  )
}
