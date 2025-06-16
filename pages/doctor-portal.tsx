
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

interface Patient {
  id: string
  full_name: string
  email: string
  age: number
  consent_status: 'pending' | 'approved' | 'revoked'
  risk_level: 'low' | 'medium' | 'high'
  last_seizure_date?: string
  total_seizures: number
  medication_compliance: number
  assigned_doctor: string
  emergency_contact: string
  next_appointment?: string
}

interface SeizureRecord {
  id: string
  patient_id: string
  patient_name: string
  seizure_date: string
  seizure_time: string
  duration: string
  seizure_type: string
  severity: number
  triggers: string
  symptoms: string
  medication_taken: string
  notes: string
}

interface ClinicalNote {
  id: string
  patient_id: string
  doctor_id: string
  note_type: 'observation' | 'diagnosis' | 'treatment' | 'followup'
  title: string
  content: string
  created_at: string
  is_confidential: boolean
}

interface Doctor {
  id: string
  full_name: string
  email: string
  gmc_number: string
  speciality: string
  practice_name: string
  subscription_status: 'trial' | 'active' | 'expired'
  trial_ends_at?: string
  created_at: string
}

export default function DoctorPortal() {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [recentSeizures, setRecentSeizures] = useState<SeizureRecord[]>([])
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'analytics' | 'notes' | 'settings'>('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddNote, setShowAddNote] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [newNote, setNewNote] = useState({
    patient_id: '',
    note_type: 'observation' as 'observation' | 'diagnosis' | 'treatment' | 'followup',
    title: '',
    content: '',
    is_confidential: false
  })
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkDoctorAuth()
  }, [router])

  const checkDoctorAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        router.push('/doctor-login')
        return
      }

      // Check if user is a verified doctor
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (doctorError || !doctorData) {
        // Redirect to doctor verification page
        router.push('/doctor-verification')
        return
      }

      setDoctor(doctorData)
      await Promise.all([
        loadPatients(doctorData.id),
        loadRecentSeizures(doctorData.id),
        loadClinicalNotes(doctorData.id)
      ])
    } catch (error) {
      console.error('Error checking doctor auth:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPatients = async (doctorId: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_doctor_relationships')
        .select(`
          *,
          patient:user_profiles!patient_id (
            id,
            full_name,
            email,
            consent_status,
            emergency_contact
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'active')

      if (error) throw error

      // Transform data and calculate metrics
      const patientsWithMetrics = await Promise.all(
        (data || []).map(async (relationship) => {
          const patient = relationship.patient
          
          // Get seizure count
          const { count: seizureCount } = await supabase
            .from('seizure_records')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', patient.id)

          // Get last seizure
          const { data: lastSeizure } = await supabase
            .from('seizure_records')
            .select('seizure_date')
            .eq('user_id', patient.id)
            .order('seizure_date', { ascending: false })
            .limit(1)

          // Calculate risk level based on recent seizures
          const { count: recentSeizures } = await supabase
            .from('seizure_records')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', patient.id)
            .gte('seizure_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

          let riskLevel: 'low' | 'medium' | 'high' = 'low'
          if (recentSeizures && recentSeizures > 10) riskLevel = 'high'
          else if (recentSeizures && recentSeizures > 5) riskLevel = 'medium'

          return {
            id: patient.id,
            full_name: patient.full_name,
            email: patient.email,
            age: 35, // This would come from patient profile
            consent_status: patient.consent_status || 'pending',
            risk_level: riskLevel,
            last_seizure_date: lastSeizure?.[0]?.seizure_date,
            total_seizures: seizureCount || 0,
            medication_compliance: 85, // This would be calculated from medication tracking
            assigned_doctor: relationship.doctor_id,
            emergency_contact: patient.emergency_contact || '',
            next_appointment: relationship.next_appointment
          }
        })
      )

      setPatients(patientsWithMetrics)
    } catch (error) {
      console.error('Error loading patients:', error)
    }
  }

  const loadRecentSeizures = async (doctorId: string) => {
    try {
      // Get all patients for this doctor first
      const { data: relationships } = await supabase
        .from('patient_doctor_relationships')
        .select('patient_id')
        .eq('doctor_id', doctorId)
        .eq('status', 'active')

      if (!relationships || relationships.length === 0) return

      const patientIds = relationships.map(r => r.patient_id)

      const { data: seizures, error } = await supabase
        .from('seizure_records')
        .select(`
          *,
          patient:user_profiles!user_id (full_name)
        `)
        .in('user_id', patientIds)
        .order('seizure_date', { ascending: false })
        .order('seizure_time', { ascending: false })
        .limit(20)

      if (error) throw error

      const formattedSeizures = (seizures || []).map(seizure => ({
        id: seizure.id,
        patient_id: seizure.user_id,
        patient_name: seizure.patient?.full_name || 'Unknown',
        seizure_date: seizure.seizure_date,
        seizure_time: seizure.seizure_time,
        duration: seizure.duration,
        seizure_type: seizure.seizure_type,
        severity: seizure.severity,
        triggers: seizure.triggers,
        symptoms: seizure.symptoms,
        medication_taken: seizure.medication_taken,
        notes: seizure.additional_notes
      }))

      setRecentSeizures(formattedSeizures)
    } catch (error) {
      console.error('Error loading recent seizures:', error)
    }
  }

  const loadClinicalNotes = async (doctorId: string) => {
    try {
      const { data, error } = await supabase
        .from('clinical_notes')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClinicalNotes(data || [])
    } catch (error) {
      console.error('Error loading clinical notes:', error)
    }
  }

  const addClinicalNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctor) return

    try {
      const { error } = await supabase
        .from('clinical_notes')
        .insert([{
          ...newNote,
          doctor_id: doctor.id
        }])

      if (error) throw error

      showNotification('success', 'Clinical note added successfully')
      setNewNote({
        patient_id: '',
        note_type: 'observation',
        title: '',
        content: '',
        is_confidential: false
      })
      setShowAddNote(false)
      await loadClinicalNotes(doctor.id)
    } catch (error: any) {
      showNotification('error', `Failed to add note: ${error.message}`)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#dc3545'
      case 'medium': return '#ffc107'
      case 'low': return '#28a745'
      default: return '#6c757d'
    }
  }

  const getConsentColor = (status: string) => {
    switch (status) {
      case 'approved': return '#28a745'
      case 'pending': return '#ffc107'
      case 'revoked': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const isTrialExpired = () => {
    if (!doctor || doctor.subscription_status !== 'trial') return false
    if (!doctor.trial_ends_at) return false
    return new Date() > new Date(doctor.trial_ends_at)
  }

  const getDaysLeftInTrial = () => {
    if (!doctor || !doctor.trial_ends_at) return 0
    const daysLeft = Math.ceil((new Date(doctor.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysLeft)
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚕️</div>
          <div style={{ color: '#005EB8', fontSize: '18px' }}>Loading Doctor Portal...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Doctor Portal - NeuroLog Professional</title>
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
          padding: '16px 24px',
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
                width: '40px',
                height: '40px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                fontSize: '16px'
              }}>
                ⚕️
              </div>
              <div>
                <h1 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>NeuroLog Professional</h1>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '12px' }}>
                  Dr. {doctor?.full_name} • {doctor?.practice_name}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Subscription Status */}
              {doctor?.subscription_status === 'trial' && (
                <div style={{
                  background: isTrialExpired() ? '#dc3545' : '#ffc107',
                  color: isTrialExpired() ? 'white' : '#000',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {isTrialExpired() ? 'Trial Expired' : `Trial: ${getDaysLeftInTrial()} days left`}
                </div>
              )}
              
              {doctor?.subscription_status === 'active' && (
                <div style={{
                  background: '#28a745',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  Pro Plan Active
                </div>
              )}

              <button
                onClick={() => setShowUpgradeModal(true)}
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
                💳 Upgrade
              </button>
              
              <button
                onClick={() => supabase.auth.signOut()}
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
                Logout
              </button>
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
            {['dashboard', 'patients', 'analytics', 'notes', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 0',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === tab ? '#005EB8' : '#666',
                  borderBottom: activeTab === tab ? '2px solid #005EB8' : 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'dashboard' ? '📊 Dashboard' : 
                 tab === 'patients' ? '👥 Patients' :
                 tab === 'analytics' ? '📈 Analytics' :
                 tab === 'notes' ? '📝 Notes' :
                 '⚙️ Settings'}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px'
        }}>
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Quick Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#005EB8', marginBottom: '4px' }}>
                    {patients.length}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Total Patients</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
                    {patients.filter(p => p.risk_level === 'high').length}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>High Risk</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', marginBottom: '4px' }}>
                    {patients.filter(p => p.consent_status === 'approved').length}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Consented</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#005EB8', marginBottom: '4px' }}>
                    {recentSeizures.length}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Recent Seizures</div>
                </div>
              </div>

              {/* Patients Requiring Attention */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#003087', fontSize: '18px' }}>
                  🚨 Patients Requiring Attention
                </h3>
                
                {patients.filter(p => p.risk_level === 'high' || p.consent_status === 'pending').length === 0 ? (
                  <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                    No patients require immediate attention
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {patients
                      .filter(p => p.risk_level === 'high' || p.consent_status === 'pending')
                      .map(patient => (
                        <div key={patient.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #e1e5e9'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#003087' }}>
                              {patient.full_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {patient.risk_level === 'high' && 'High seizure frequency • '}
                              {patient.consent_status === 'pending' && 'Consent pending'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: getRiskColor(patient.risk_level)
                            }} />
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: getConsentColor(patient.consent_status)
                            }} />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Recent Seizures */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#003087', fontSize: '18px' }}>
                  📊 Recent Seizures Across All Patients
                </h3>
                
                {recentSeizures.length === 0 ? (
                  <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                    No recent seizures recorded
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {recentSeizures.slice(0, 10).map(seizure => (
                      <div key={seizure.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e1e5e9'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#003087' }}>
                            {seizure.patient_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {seizure.seizure_date} at {seizure.seizure_time} • {seizure.seizure_type} • {seizure.duration}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: seizure.severity > 3 ? '#fee' : seizure.severity > 2 ? '#fef0e0' : '#efe',
                          color: seizure.severity > 3 ? '#c33' : seizure.severity > 2 ? '#d2691e' : '#363'
                        }}>
                          Severity {seizure.severity}/5
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patients Tab */}
          {activeTab === 'patients' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>Patient Management</h2>
                <button
                  onClick={() => setShowAddNote(true)}
                  style={{
                    background: '#005EB8',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  + Add Clinical Note
                </button>
              </div>
              
              {patients.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                  <div>No patients have consented to share data with you yet.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {patients.map(patient => (
                    <div key={patient.id} style={{
                      border: '1px solid #e1e5e9',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: patient.consent_status === 'approved' ? 'white' : '#f8f9fa'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h4 style={{ margin: '0', color: '#003087', fontSize: '16px' }}>
                              {patient.full_name}
                            </h4>
                            <div style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: getConsentColor(patient.consent_status),
                              color: 'white'
                            }}>
                              {patient.consent_status}
                            </div>
                            <div style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: getRiskColor(patient.risk_level),
                              color: 'white'
                            }}>
                              {patient.risk_level} risk
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '14px', color: '#666' }}>
                            <div><strong>Total Seizures:</strong> {patient.total_seizures}</div>
                            <div><strong>Last Seizure:</strong> {patient.last_seizure_date ? new Date(patient.last_seizure_date).toLocaleDateString() : 'None'}</div>
                            <div><strong>Compliance:</strong> {patient.medication_compliance}%</div>
                            <div><strong>Emergency Contact:</strong> {patient.emergency_contact || 'Not provided'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            style={{
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setNewNote({ ...newNote, patient_id: patient.id })
                              setShowAddNote(true)
                            }}
                            style={{
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Add Note
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#003087' }}>Practice Analytics</h2>
              
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#003087', fontSize: '16px' }}>
                    Patient Risk Distribution
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '20px', height: '20px', backgroundColor: '#dc3545', borderRadius: '4px' }} />
                      <span>High Risk: {patients.filter(p => p.risk_level === 'high').length}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '20px', height: '20px', backgroundColor: '#ffc107', borderRadius: '4px' }} />
                      <span>Medium Risk: {patients.filter(p => p.risk_level === 'medium').length}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '20px', height: '20px', backgroundColor: '#28a745', borderRadius: '4px' }} />
                      <span>Low Risk: {patients.filter(p => p.risk_level === 'low').length}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#003087', fontSize: '16px' }}>
                    Seizure Trends (Last 30 Days)
                  </h3>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Total seizures: {recentSeizures.length}
                    <br />
                    Average severity: {recentSeizures.length > 0 ? (recentSeizures.reduce((sum, s) => sum + s.severity, 0) / recentSeizures.length).toFixed(1) : 'N/A'}
                    <br />
                    Most active patient: {recentSeizures.length > 0 ? recentSeizures.reduce((prev, current) => 
                      recentSeizures.filter(s => s.patient_id === current.patient_id).length > 
                      recentSeizures.filter(s => s.patient_id === prev.patient_id).length ? current : prev
                    ).patient_name : 'N/A'}
                  </div>
                </div>

                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#003087', fontSize: '16px' }}>
                    Common Seizure Types
                  </h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {Array.from(new Set(recentSeizures.map(s => s.seizure_type))).map(type => {
                      const count = recentSeizures.filter(s => s.seizure_type === type).length
                      const percentage = recentSeizures.length > 0 ? ((count / recentSeizures.length) * 100).toFixed(1) : '0'
                      return (
                        <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span>{type}</span>
                          <span>{count} ({percentage}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Notes Tab */}
          {activeTab === 'notes' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>Clinical Notes</h2>
                <button
                  onClick={() => setShowAddNote(true)}
                  style={{
                    background: '#005EB8',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  + Add Note
                </button>
              </div>
              
              {clinicalNotes.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                  <div>No clinical notes yet.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {clinicalNotes.map(note => (
                    <div key={note.id} style={{
                      border: '1px solid #e1e5e9',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: note.is_confidential ? '#fff3cd' : 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ margin: '0', color: '#003087', fontSize: '16px' }}>
                            {note.title}
                          </h4>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {note.note_type} • {new Date(note.created_at).toLocaleDateString()}
                            {note.is_confidential && ' • Confidential'}
                          </div>
                        </div>
                        <div style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: '#005EB8',
                          color: 'white'
                        }}>
                          {note.note_type}
                        </div>
                      </div>
                      <div style={{ color: '#333', fontSize: '14px', lineHeight: '1.5' }}>
                        {note.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#003087' }}>Settings & Subscription</h2>
              
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#003087', fontSize: '16px' }}>
                    Subscription Status
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: doctor?.subscription_status === 'active' ? '#28a745' : 
                                     doctor?.subscription_status === 'trial' ? '#ffc107' : '#dc3545',
                      color: doctor?.subscription_status === 'trial' ? '#000' : 'white'
                    }}>
                      {doctor?.subscription_status === 'active' ? 'Pro Plan Active' :
                       doctor?.subscription_status === 'trial' ? `Trial (${getDaysLeftInTrial()} days left)` :
                       'Subscription Expired'}
                    </div>
                  </div>
                  
                  {doctor?.subscription_status !== 'active' && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      style={{
                        background: '#005EB8',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Upgrade to Pro Plan - £35/month
                    </button>
                  )}
                </div>

                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#003087', fontSize: '16px' }}>
                    Practice Information
                  </h3>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                    <div><strong>GMC Number:</strong> {doctor?.gmc_number}</div>
                    <div><strong>Speciality:</strong> {doctor?.speciality}</div>
                    <div><strong>Practice:</strong> {doctor?.practice_name}</div>
                    <div><strong>Email:</strong> {doctor?.email}</div>
                  </div>
                </div>

                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#003087', fontSize: '16px' }}>
                    Usage Statistics
                  </h3>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                    <div><strong>Patients Managed:</strong> {patients.length}</div>
                    <div><strong>Clinical Notes:</strong> {clinicalNotes.length}</div>
                    <div><strong>Account Created:</strong> {doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Clinical Note Modal */}
        {showAddNote && (
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
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#003087' }}>Add Clinical Note</h3>
              
              <form onSubmit={addClinicalNote}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Patient</label>
                    <select
                      value={newNote.patient_id}
                      onChange={(e) => setNewNote({ ...newNote, patient_id: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                      required
                    >
                      <option value="">Select patient</option>
                      {patients.filter(p => p.consent_status === 'approved').map(patient => (
                        <option key={patient.id} value={patient.id}>{patient.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Note Type</label>
                    <select
                      value={newNote.note_type}
                      onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="observation">Observation</option>
                      <option value="diagnosis">Diagnosis</option>
                      <option value="treatment">Treatment</option>
                      <option value="followup">Follow-up</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Title</label>
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '14px'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Content</label>
                    <textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '14px',
                        minHeight: '100px',
                        resize: 'vertical'
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="confidential"
                      checked={newNote.is_confidential}
                      onChange={(e) => setNewNote({ ...newNote, is_confidential: e.target.checked })}
                    />
                    <label htmlFor="confidential" style={{ fontSize: '14px' }}>
                      Mark as confidential
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddNote(false)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#f8f9fa',
                      color: '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#005EB8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Add Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
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
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#003087', fontSize: '24px' }}>
                Upgrade to NeuroLog Pro
              </h3>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#005EB8', marginBottom: '8px' }}>
                  £35/month
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Per doctor • Cancel anytime
                </div>
              </div>

              <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#003087' }}>
                  Pro Features Include:
                </div>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#666' }}>
                  <li>Unlimited patient management</li>
                  <li>Advanced analytics and reporting</li>
                  <li>Real-time seizure alerts</li>
                  <li>Clinical notes system</li>
                  <li>Medication compliance tracking</li>
                  <li>Export capabilities</li>
                  <li>Priority support</li>
                  <li>GDPR-compliant data handling</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f8f9fa',
                    color: '#333',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Upgrade functionality would integrate with Stripe/payment processor')
                    setShowUpgradeModal(false)
                  }}
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Start Pro Subscription
                </button>
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                7-day free trial • No commitment • Cancel anytime
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
