import React from 'react'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

interface Resident {
  id: string
  full_name: string
  date_of_birth: string
  room_number: string
  care_level: 'low' | 'medium' | 'high' | 'critical'
  seizure_type: string
  last_seizure_date?: string
  next_of_kin: string
  gp_name: string
  medications_count: number
  risk_assessment: 'green' | 'amber' | 'red'
  mobility_level: string
  dietary_requirements: string
  emergency_contact: string
  admission_date: string
  care_plan_review_date: string
}

interface Staff {
  id: string
  name: string
  role: 'senior_carer' | 'healthcare_assistant' | 'nurse' | 'manager'
  shift_start: string
  shift_end: string
  on_duty: boolean
  training_expires: string
  competency_level: number
}

interface Incident {
  id: string
  resident_id: string
  resident_name: string
  incident_type: 'seizure' | 'fall' | 'medication_error' | 'behavioral' | 'other'
  severity: 1 | 2 | 3 | 4 | 5
  description: string
  staff_witness: string
  date_time: string
  actions_taken: string
  family_notified: boolean
  gp_contacted: boolean
  status: 'open' | 'investigating' | 'closed'
}

interface MedicationSchedule {
  id: string
  resident_id: string
  resident_name: string
  medication_name: string
  dosage: string
  time_due: string
  administered: boolean
  administered_by?: string
  administered_time?: string
  notes?: string
}

interface CareHome {
  id: string
  name: string
  address: string
  cqc_rating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate'
  manager_name: string
  subscription_plan: 'standard' | 'premium' | 'enterprise'
  resident_capacity: number
  current_occupancy: number
}

export default function CareHomePortal() {
  const [careHome, setCareHome] = useState<CareHome | null>(null)
  const [residents, setResidents] = useState<Resident[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [medicationSchedule, setMedicationSchedule] = useState<MedicationSchedule[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'residents' | 'staff' | 'medication' | 'incidents' | 'compliance' | 'family' | 'reports'>('dashboard')
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [showAddIncident, setShowAddIncident] = useState(false)
  const [showHandover, setShowHandover] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{name: string, role: string} | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null)
  const router = useRouter()

  // Sample data for demonstration
  const sampleResidents: Resident[] = [
    {
      id: '1', full_name: 'Margaret Thompson', date_of_birth: '1935-03-15', room_number: '12A',
      care_level: 'high', seizure_type: 'Focal seizures', last_seizure_date: '2024-01-15',
      next_of_kin: 'Susan Thompson (Daughter)', gp_name: 'Dr. Wilson', medications_count: 5,
      risk_assessment: 'amber', mobility_level: 'Wheelchair', dietary_requirements: 'Diabetic diet',
      emergency_contact: '07700 900123', admission_date: '2023-08-10', care_plan_review_date: '2024-02-10'
    },
    {
      id: '2', full_name: 'Arthur Davies', date_of_birth: '1940-07-22', room_number: '8B',
      care_level: 'medium', seizure_type: 'Generalized tonic-clonic', last_seizure_date: '2024-01-12',
      next_of_kin: 'Michael Davies (Son)', gp_name: 'Dr. Patel', medications_count: 3,
      risk_assessment: 'green', mobility_level: 'Walking frame', dietary_requirements: 'Low sodium',
      emergency_contact: '07700 900456', admission_date: '2023-11-02', care_plan_review_date: '2024-02-15'
    },
    {
      id: '3', full_name: 'Dorothy Williams', date_of_birth: '1938-12-03', room_number: '15C',
      care_level: 'critical', seizure_type: 'Status epilepticus', last_seizure_date: '2024-01-18',
      next_of_kin: 'Robert Williams (Son)', gp_name: 'Dr. Singh', medications_count: 8,
      risk_assessment: 'red', mobility_level: 'Bed bound', dietary_requirements: 'Pureed diet',
      emergency_contact: '07700 900789', admission_date: '2023-05-20', care_plan_review_date: '2024-01-25'
    }
  ]

  const sampleStaff: Staff[] = [
    {
      id: '1', name: 'Sarah Johnson', role: 'senior_carer', shift_start: '07:00', shift_end: '19:00',
      on_duty: true, training_expires: '2024-06-15', competency_level: 95
    },
    {
      id: '2', name: 'Michael Brown', role: 'healthcare_assistant', shift_start: '19:00', shift_end: '07:00',
      on_duty: true, training_expires: '2024-04-20', competency_level: 88
    },
    {
      id: '3', name: 'Emma Wilson', role: 'nurse', shift_start: '07:00', shift_end: '15:00',
      on_duty: true, training_expires: '2024-08-10', competency_level: 98
    }
  ]

  const sampleIncidents: Incident[] = [
    {
      id: '1', resident_id: '1', resident_name: 'Margaret Thompson',
      incident_type: 'seizure', severity: 3, description: 'Focal seizure lasting 2 minutes in dining room',
      staff_witness: 'Sarah Johnson', date_time: '2024-01-18T14:30:00',
      actions_taken: 'Positioned safely, timed seizure, post-ictal care provided',
      family_notified: true, gp_contacted: false, status: 'closed'
    },
    {
      id: '2', resident_id: '3', resident_name: 'Dorothy Williams',
      incident_type: 'seizure', severity: 5, description: 'Prolonged seizure requiring emergency medication',
      staff_witness: 'Emma Wilson', date_time: '2024-01-18T09:15:00',
      actions_taken: 'Emergency medication administered, 999 called, family contacted',
      family_notified: true, gp_contacted: true, status: 'investigating'
    }
  ]

  const sampleMedicationSchedule: MedicationSchedule[] = [
    {
      id: '1', resident_id: '1', resident_name: 'Margaret Thompson',
      medication_name: 'Levetiracetam 500mg', dosage: '1 tablet', time_due: '08:00',
      administered: true, administered_by: 'Emma Wilson', administered_time: '08:05'
    },
    {
      id: '2', resident_id: '1', resident_name: 'Margaret Thompson',
      medication_name: 'Lamotrigine 100mg', dosage: '1 tablet', time_due: '20:00',
      administered: false
    },
    {
      id: '3', resident_id: '2', resident_name: 'Arthur Davies',
      medication_name: 'Phenytoin 100mg', dosage: '2 capsules', time_due: '12:00',
      administered: true, administered_by: 'Sarah Johnson', administered_time: '12:10'
    }
  ]

  useEffect(() => {
    // Simulate authentication check
    const checkAuth = () => {
      setCurrentUser({ name: 'Sarah Johnson', role: 'Senior Carer' })
      setCareHome({
        id: '1',
        name: 'Sunnydale Care Home',
        address: '123 Care Street, Manchester, M1 1AA',
        cqc_rating: 'good',
        manager_name: 'Patricia Matthews',
        subscription_plan: 'premium',
        resident_capacity: 45,
        current_occupancy: 42
      })
      setResidents(sampleResidents)
      setStaff(sampleStaff)
      setIncidents(sampleIncidents)
      setMedicationSchedule(sampleMedicationSchedule)
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'red': return '#dc3545'
      case 'amber': return '#ffc107'
      case 'green': return '#28a745'
      default: return '#6c757d'
    }
  }

  const getCareLevel = (level: string) => {
    switch (level) {
      case 'critical': return { color: '#dc3545', label: 'Critical' }
      case 'high': return { color: '#fd7e14', label: 'High' }
      case 'medium': return { color: '#ffc107', label: 'Medium' }
      case 'low': return { color: '#28a745', label: 'Low' }
      default: return { color: '#6c757d', label: 'Unknown' }
    }
  }

  const getTodaysDate = () => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
          <div style={{ color: '#005EB8', fontSize: '18px' }}>Loading Care Home Portal...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Care Home Portal - {careHome?.name} - NeuroLog</title>
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
                fontSize: '20px'
              }}>
                🏠
              </div>
              <div>
                <h1 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
                  {careHome?.name}
                </h1>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '12px' }}>
                  {currentUser?.name} • {currentUser?.role} • {getTodaysDate()}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* CQC Rating */}
              <div style={{
                background: careHome?.cqc_rating === 'outstanding' ? '#28a745' : 
                           careHome?.cqc_rating === 'good' ? '#20c997' : 
                           careHome?.cqc_rating === 'requires_improvement' ? '#ffc107' : '#dc3545',
                color: careHome?.cqc_rating === 'requires_improvement' ? '#000' : 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                CQC: {careHome?.cqc_rating?.replace('_', ' ')}
              </div>

              {/* Occupancy */}
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {careHome?.current_occupancy}/{careHome?.resident_capacity} Residents
              </div>

              {/* Emergency Button */}
              <button
                onClick={() => alert('Emergency procedures activated')}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                🚨 Emergency
              </button>

              <button
                onClick={() => setShowHandover(true)}
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
                📋 Handover
              </button>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div style={{
            background: notification.type === 'success' ? '#d4edda' : 
                       notification.type === 'warning' ? '#fff3cd' : '#f8d7da',
            color: notification.type === 'success' ? '#155724' : 
                   notification.type === 'warning' ? '#856404' : '#721c24',
            padding: '12px 24px',
            textAlign: 'center',
            border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : 
                                 notification.type === 'warning' ? '#ffeaa7' : '#f5c6cb'}`
          }}>
            {notification.message}
          </div>
        )}

        {/* Navigation */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e1e5e9',
          padding: '0 24px',
          overflowX: 'auto'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            gap: '24px',
            minWidth: 'max-content'
          }}>
            {[
              { key: 'dashboard', label: '📊 Dashboard' },
              { key: 'residents', label: '👴 Residents' },
              { key: 'medication', label: '💊 Medication' },
              { key: 'incidents', label: '⚠️ Incidents' },
              { key: 'staff', label: '👥 Staff' },
              { key: 'compliance', label: '✅ CQC' },
              { key: 'family', label: '👨‍👩‍👧‍👦 Family' },
              { key: 'reports', label: '📈 Reports' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 0',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === tab.key ? '#005EB8' : '#666',
                  borderBottom: activeTab === tab.key ? '2px solid #005EB8' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
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
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#005EB8', marginBottom: '4px' }}>
                    {residents.length}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Total Residents</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
                    {residents.filter(r => r.risk_assessment === 'red').length}
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
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745', marginBottom: '4px' }}>
                    {staff.filter(s => s.on_duty).length}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Staff On Duty</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e1e5e9'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffc107', marginBottom: '4px' }}>
                    {medicationSchedule.filter(m => !m.administered).length}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Medications Due</div>
                </div>
              </div>

              {/* Today's Priority Actions */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#003087', fontSize: '18px' }}>
                  🎯 Priority Actions Today
                </h3>

                <div style={{ display: 'grid', gap: '16px' }}>
                  {residents.map(resident => {
                    const careLevel = getCareLevel(resident.care_level)
                    return (
                      <div key={resident.id} style={{
                        border: '1px solid #e1e5e9',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <h4 style={{ margin: '0', color: '#003087', fontSize: '18px' }}>
                                {resident.full_name}
                              </h4>
                              <div style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: getRiskColor(resident.risk_assessment),
                                color: 'white'
                              }}>
                                {resident.risk_assessment.toUpperCase()}
                              </div>
                              <div style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: careLevel.color,
                                color: 'white'
                              }}>
                                {careLevel.label} Care
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px', color: '#666' }}>
                              <div><strong>Room:</strong> {resident.room_number}</div>
                              <div><strong>DOB:</strong> {new Date(resident.date_of_birth).toLocaleDateString()}</div>
                              <div><strong>Seizure Type:</strong> {resident.seizure_type}</div>
                              <div><strong>Last Seizure:</strong> {resident.last_seizure_date ? new Date(resident.last_seizure_date).toLocaleDateString() : 'None recorded'}</div>
                              <div><strong>GP:</strong> {resident.gp_name}</div>
                              <div><strong>Medications:</strong> {resident.medications_count} active</div>
                              <div><strong>Next of Kin:</strong> {resident.next_of_kin}</div>
                              <div><strong>Mobility:</strong> {resident.mobility_level}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setSelectedResident(resident)}
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
                              View Profile
                            </button>
                            <button
                              onClick={() => showNotification('success', `Care plan opened for ${resident.full_name}`)}
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
                              Care Plan
                            </button>
                            <button
                              onClick={() => showNotification('warning', `Emergency contact called for ${resident.full_name}`)}
                              style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Emergency
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Priority Actions */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#003087', fontSize: '18px' }}>
                  🚨 Urgent Actions Required
                </h3>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '8px',
                    border: '1px solid #ffeaa7'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#856404' }}>
                        Care Plan Review Due: Dorothy Williams
                      </div>
                      <div style={{ fontSize: '12px', color: '#856404' }}>
                        Due: 25/01/2024 • High priority resident
                      </div>
                    </div>
                    <button style={{
                      background: '#005EB8',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      Review
                    </button>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f8d7da',
                    borderRadius: '8px',
                    border: '1px solid #f5c6cb'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#721c24' }}>
                        Incident Follow-up Required: Dorothy Williams
                      </div>
                      <div style={{ fontSize: '12px', color: '#721c24' }}>
                        Status epilepticus yesterday • GP contact pending
                      </div>
                    </div>
                    <button style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      Follow Up
                    </button>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#d4edda',
                    borderRadius: '8px',
                    border: '1px solid #c3e6cb'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#155724' }}>
                        Staff Training Update Required: Michael Brown
                      </div>
                      <div style={{ fontSize: '12px', color: '#155724' }}>
                        Epilepsy training expires: 20/04/2024
                      </div>
                    </div>
                    <button style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      Schedule
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Incidents */}
              {/* Recent Incidents */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: '0', color: '#003087', fontSize: '18px' }}>
                    📋 Recent Incidents
                  </h3>
                  <button
                    onClick={() => setShowAddIncident(true)}
                    style={{
                      background: '#005EB8',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Report Incident
                  </button>
                </div>

                {incidents.length === 0 ? (
                  <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                    No recent incidents
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {incidents.slice(0, 5).map(incident => (
                      <div key={incident.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e1e5e9'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#003087', marginBottom: '4px' }}>
                            {incident.resident_name} - {incident.incident_type.replace('_', ' ')}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            {new Date(incident.date_time).toLocaleDateString()} at {new Date(incident.date_time).toLocaleTimeString()} • 
                            Witnessed by: {incident.staff_witness}
                          </div>
                          <div style={{ fontSize: '13px', color: '#333' }}>
                            {incident.description}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                          <div style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: incident.severity >= 4 ? '#dc3545' : 
                                           incident.severity >= 3 ? '#fd7e14' : '#28a745',
                            color: 'white'
                          }}>
                            Severity {incident.severity}
                          </div>
                          <div style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: incident.status === 'open' ? '#dc3545' : 
                                           incident.status === 'investigating' ? '#ffc107' : '#28a745',
                            color: incident.status === 'investigating' ? '#000' : 'white'
                          }}>
                            {incident.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Residents Tab */}
          {activeTab === 'residents' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>Resident Management</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '14px'
                  }}>
                    <option>All Residents</option>
                    <option>High Risk Only</option>
                    <option>Critical Care</option>
                    <option>Medication Due</option>
                  </select>
                  <button style={{
                    background: '#005EB8',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    + New Resident
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {residents.map(resident => {
                  const careLevel = getCareLevel(resident.care_level)
                  return (
                    <div key={resident.id} style={{
                      border: '1px solid #e1e5e9',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h4 style={{ margin: '0', color: '#003087', fontSize: '18px' }}>
                              {resident.full_name}
                            </h4>
                            <div style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: getRiskColor(resident.risk_assessment),
                              color: 'white'
                            }}>
                              {resident.risk_assessment.toUpperCase()}
                            </div>
                            <div style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: careLevel.color,
                              color: 'white'
                            }}>
                              {careLevel.label} Care
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px', color: '#666' }}>
                            <div><strong>Room:</strong> {resident.room_number}</div>
                            <div><strong>DOB:</strong> {new Date(resident.date_of_birth).toLocaleDateString()}</div>
                            <div><strong>Seizure Type:</strong> {resident.seizure_type}</div>
                            <div><strong>Last Seizure:</strong> {resident.last_seizure_date ? new Date(resident.last_seizure_date).toLocaleDateString() : 'None recorded'}</div>
                            <div><strong>GP:</strong> {resident.gp_name}</div>
                            <div><strong>Next of Kin:</strong> {resident.next_of_kin}</div>
                            <div><strong>Emergency Contact:</strong> {resident.emergency_contact}</div>
                            <div><strong>Mobility:</strong> {resident.mobility_level}</div>
                            <div><strong>Diet:</strong> {resident.dietary_requirements}</div>
                            <div><strong>Medications:</strong> {resident.medications_count} active</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedResident(resident)}
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
                            View Profile
                          </button>
                          <button
                            onClick={() => showNotification('success', `Care plan opened for ${resident.full_name}`)}
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
                            Care Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Medication Tab */}
          {activeTab === 'medication' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>Medication Administration</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    📋 MAR Chart
                  </button>
                  <button style={{
                    background: '#005EB8',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    📊 Compliance Report
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#003087', marginBottom: '12px' }}>Today&apos;s Medication Schedule</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {medicationSchedule.map(med => (
                    <div key={med.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: med.administered ? '#d4edda' : '#fff3cd',
                      borderRadius: '8px',
                      border: `1px solid ${med.administered ? '#c3e6cb' : '#ffeaa7'}`
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#003087', marginBottom: '4px' }}>
                          {med.resident_name} - {med.medication_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {med.dosage} • Due: {med.time_due}
                          {med.administered && med.administered_by && (
                            <span> • Given by: {med.administered_by} at {med.administered_time}</span>
                          )}
                        </div>
                        {med.notes && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Notes: {med.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!med.administered ? (
                          <>
                            <button
                              onClick={() => {
                                showNotification('success', `Medication administered for ${med.resident_name}`)
                                // Update medication status
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
                              ✓ Given
                            </button>
                            <button
                              onClick={() => showNotification('warning', `Medication refused by ${med.resident_name}`)}
                              style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✗ Refused
                            </button>
                          </>
                        ) : (
                          <div style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#28a745',
                            color: 'white'
                          }}>
                            ✓ Completed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>Staff Management</h2>
                <button style={{
                  background: '#005EB8',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  + Add Staff Member
                </button>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {staff.map(member => (
                  <div key={member.id} style={{
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: member.on_duty ? '#f8f9fa' : '#fff3cd'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h4 style={{ margin: '0', color: '#003087', fontSize: '18px' }}>
                            {member.name}
                          </h4>
                          <div style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: member.on_duty ? '#28a745' : '#6c757d',
                            color: 'white'
                          }}>
                            {member.on_duty ? 'ON DUTY' : 'OFF DUTY'}
                          </div>
                          <div style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: '#005EB8',
                            color: 'white'
                          }}>
                            {member.role.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px', color: '#666' }}>
                          <div><strong>Shift:</strong> {member.shift_start} - {member.shift_end}</div>
                          <div><strong>Training Expires:</strong> {new Date(member.training_expires).toLocaleDateString()}</div>
                          <div><strong>Competency:</strong> {member.competency_level}%</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
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
                          View Profile
                        </button>
                        <button
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
                          Training
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incidents Tab */}
          {activeTab === 'incidents' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>Incident Management</h2>
                <button
                  onClick={() => setShowAddIncident(true)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  📋 Report New Incident
                </button>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {incidents.map(incident => (
                  <div key={incident.id} style={{
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h4 style={{ margin: '0', color: '#003087', fontSize: '18px' }}>
                            {incident.resident_name} - {incident.incident_type.replace('_', ' ')}
                          </h4>
                          <div style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: incident.severity >= 4 ? '#dc3545' : 
                                           incident.severity >= 3 ? '#fd7e14' : '#28a745',
                            color: 'white'
                          }}>
                            Severity {incident.severity}
                          </div>
                          <div style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: incident.status === 'open' ? '#dc3545' : 
                                           incident.status === 'investigating' ? '#ffc107' : '#28a745',
                            color: incident.status === 'investigating' ? '#000' : 'white'
                          }}>
                            {incident.status.toUpperCase()}
                          </div>
                        </div>

                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                          <strong>Date/Time:</strong> {new Date(incident.date_time).toLocaleDateString()} at {new Date(incident.date_time).toLocaleTimeString()}<br/>
                          <strong>Witnessed by:</strong> {incident.staff_witness}<br/>
                          <strong>Family Notified:</strong> {incident.family_notified ? 'Yes' : 'No'} • 
                          <strong> GP Contacted:</strong> {incident.gp_contacted ? 'Yes' : 'No'}
                        </div>

                        <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>
                          <strong>Description:</strong> {incident.description}
                        </div>

                        <div style={{ fontSize: '14px', color: '#333' }}>
                          <strong>Actions Taken:</strong> {incident.actions_taken}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
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
                        {incident.status !== 'closed' && (
                          <button
                            onClick={() => showNotification('success', `Incident ${incident.id} updated`)}
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
                            Update Status
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#003087' }}>CQC Compliance Dashboard</h2>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e1e5e9'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#003087', fontSize: '16px' }}>
                    Compliance Checklist
                  </h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {[
                      { item: 'Staff training records up to date', status: 'complete' },
                      { item: 'Incident reports submitted on time', status: 'complete' },
                      { item: 'Medication administration records', status: 'complete' },
                      { item: 'Care plan reviews completed', status: 'warning' },
                      { item: 'Risk assessments updated', status: 'complete' },
                      { item: 'Family contact logs maintained', status: 'complete' }
                    ].map((check, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '4px'
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: check.status === 'complete' ? '#28a745' : '#ffc107',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {check.status === 'complete' ? '✓' : '!'}
                        </div>
                        <span style={{ fontSize: '14px' }}>{check.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Family Tab */}
          {activeTab === 'family' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#003087' }}>Family Communications</h2>
              <p style={{ color: '#666' }}>Family portal and communication features would be implemented here.</p>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#003087' }}>Reports & Analytics</h2>
              <p style={{ color: '#666' }}>Reporting and analytics features would be implemented here.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
