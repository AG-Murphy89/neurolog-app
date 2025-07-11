import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { dataExportUtils } from '../lib/dataExport'
import dynamic from 'next/dynamic'
declare global {
  interface Window {
    exportData: (format: 'json' | 'pdf') => Promise<void>;
  }
}

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

  useEffect(() => {
    const checkUser = async () => {
      try {
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

        setUser(userData);
        await loadSeizures(session.user.id)
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router])

  useEffect(() => {
    if (!user || !user.id) return;

    // Attach export function to window after user state is available
    window.exportData = async (format = 'json') => {
      try {
        if (format === 'pdf') {
          const result = await dataExportUtils.generateMedicalReportPDF(user.id);
          if (!result || !result.success) {
            alert(`Failed to generate PDF: ${result?.error || 'Something went wrong'}`);
            return;
          }
          console.log('PDF generated successfully.');
        } else {
          const result = await dataExportUtils.exportAllUserData(user.id);
          if (result?.success && result.data) {
            dataExportUtils.downloadAsJSON(result.data);
          } else {
            alert(`Failed to export data: ${result?.error || 'Something went wrong'}`);
          }
        }
      } catch (err: any) {
        alert(`Export failed: ${err.message || 'Unexpected error'}`);
      }
    };
  }, [user])

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
// Export function that uses window.exportData (attached after user loads)
  const exportData = async (format: 'json' | 'pdf' = 'json') => {
    if (window.exportData) {
      await window.exportData(format);
    } else {
      alert("Export function not ready. Please wait for the page to fully load.");
    }
  };

  const exportDataAsCSV = async () => {
  if (!user) return;
  
  try {
    // Use your seizures data (I can see you have "seizures" variable)
    const seizureData = seizures || [];
    
    if (seizureData.length === 0) {
      alert('No seizure data to export');
      return;
    }

    // CSV headers
    const headers = ['Date', 'Time', 'Type', 'Duration', 'Severity', 'Triggers', 'Symptoms', 'Medication Taken', 'Notes'];
    
    // Convert data to CSV rows
    const csvRows = [
      headers.join(','),
      ...seizureData.map(seizure => [
        seizure.seizure_date || '',
        seizure.seizure_time || '',
        `"${seizure.seizure_type || ''}"`,
        seizure.duration || '',
        seizure.severity || '',
        `"${seizure.triggers || ''}"`,
        `"${seizure.symptoms || ''}"`,
        `"${seizure.medication_taken || ''}"`,
        `"${seizure.additional_notes || ''}"`
      ].join(','))
    ];

    // Create and download CSV file
    const csvContent = '\uFEFF' + csvRows.join('\n'); // Added BOM for Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `neurolog-seizure-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('CSV exported successfully');
  } catch (error) {
    console.error('CSV export failed:', error);
    alert(`CSV export failed: ${error.message}`);
  }
};
const exportDataAsPDF = () => {
  if (!user) return;
  
  try {
    const seizureData = seizures || [];
    
    if (seizureData.length === 0) {
      alert('No seizure data to export');
      return;
    }

    // Create a simple data URL that browsers will treat as PDF
    const pdfContent = `
NeuroLog Seizure Report
Patient: ${user.full_name}
Generated: ${new Date().toLocaleDateString()}

Seizure Records:
${seizureData.map((seizure, index) => `
${index + 1}. Date: ${seizure.seizure_date || 'N/A'}
   Time: ${seizure.seizure_time || 'N/A'}  
   Type: ${seizure.seizure_type || 'N/A'}
   Duration: ${seizure.duration || 'N/A'}
   Severity: ${seizure.severity || 'N/A'}
   Triggers: ${seizure.triggers || 'N/A'}
   Notes: ${seizure.additional_notes || 'N/A'}
`).join('\n')}
    `;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neurolog-seizure-report-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('PDF export failed:', error);
    alert(`Export failed: ${error.message}`);
  }
};
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

  const getMostCommonSeizureType = () => {
    if (seizures.length === 0) return 'None recorded'
    const types = seizures.map(s => s.seizure_type).filter(t => t && t.trim())
    if (types.length === 0) return 'None recorded'

    const typeCount: {[key: string]: number} = {}
    types.forEach(type => {
      typeCount[type] = (typeCount[type] || 0) + 1
    })

    return Object.entries(typeCount).sort(([,a], [,b]) => b - a)[0][0]
  }

  const getAverageDuration = () => {
    if (seizures.length === 0) return 'No data'
    const durations = seizures.map(s => s.duration).filter(d => d && d.trim())
    if (durations.length === 0) return 'No data'

    // Simple average calculation - could be improved to handle different units
    const avgLength = durations.reduce((acc, curr) => acc + curr.length, 0) / durations.length
    return `${avgLength.toFixed(1)} characters avg`
  }

  const handlePrintInsights = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print the report')
      return
    }

    const printContent = document.getElementById('insights-content')
    if (!printContent) {
      alert('Content not found. Please try again.')
      return
    }

    // Create print-friendly HTML
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NeuroLog - Seizure Insights Report</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 20px;
              line-height: 1.6;
              color: #333;
            }
            .print-header {
              display: block !important;
              margin-bottom: 20px;
              border-bottom: 2px solid #003087;
              padding-bottom: 10px;
            }
            .no-print {
              display: none !important;
            }
            h1, h2, h3 {
              color: #003087;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 16px;
              margin: 20px 0;
            }
            .stat-card {
              padding: 15px;
              border: 1px solid #e1e5e9;
              border-radius: 8px;
              background: #f8f9fa;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #005EB8;
            }
            .seizure-entry {
              padding: 12px;
              margin: 8px 0;
              border: 1px solid #e1e5e9;
              border-radius: 8px;
              background: white;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>NeuroLog - Seizure Insights Report</h1>
            <p>Patient: ${user?.full_name} | Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `

    printWindow.document.write(printHTML)
    printWindow.document.close()

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const handleDownloadInsightsPDF = async () => {
    if (!user) return

    try {
      // Use the medical report PDF generation from dataExportUtils
      const result = await dataExportUtils.generateMedicalReportPDF(user.id)
      if (!result.success) {
        console.error('PDF generation error:', result.error)
        alert(`Failed to generate PDF: ${result.error}`)
      }
      // Success message is handled in the PDF generation function
    } catch (error: any) {
      console.error('PDF generation failed:', error)
      alert(`PDF generation failed: ${error.message}`)
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
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#28a745' }}>✚</div>
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
      );
  }

  return (
    <>
      <Head>
        <title>Dashboard - NeuroLog</title>
        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-header {
              display: block !important;
            }
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
          .print-header {
            display: none;
          }
        `}</style>
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
                fontSize: '20px',
                color: '#28a745'
              }}>
                ✚
              </div>
              <div>
                <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>NeuroLog</h1>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Welcome back, {user.full_name}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
            {['overview', 'add', 'history', 'insights', 'medications', 'profile'].map(tab => (
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
                    <div>No seizures recorded yet. Click &quot;Record New Seizure&quot; to get started.</div>
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
                        ```
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
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        background: '#e1e5e9',
                        outline: 'none',
                        opacity: '0.7',
                        transition: 'opacity 0.2s',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666',marginTop: '4px' }}>
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
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>Seizure History</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                 <button
  onClick={() => exportDataAsPDF()}
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
  📊 Download PDF

                  </button>
                  <button
                    onClick={() => window.print()}
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
                    🖨️ Print
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
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0', color: '#003087' }}>Seizure Insights & Analytics</h2>
                <div className="no-print" style={{ display: 'flex', gap: '8px' }}>

                 <button
  onClick={() => exportDataAsPDF()}
  style={{
    background: '#28a745',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }}
>
  📊 Download PDF
</button>

                  <button
                    onClick={() => handlePrintInsights()}
                    style={{
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    🖨️ Print Report
                  </button>
                </div>
              </div>

              <div id="insights-content">
                {seizures.length < 3 ? (
                  <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                    <div>Record at least 3 seizures to see insights and patterns.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '24px' }}>
                    {/* Header for print */}
                    <div className="print-header" style={{ display: 'none' }}>
                      <h1 style={{ color: '#003087', marginBottom: '8px' }}>NeuroLog - Seizure Insights Report</h1>
                      <p style={{ color: '#666', marginBottom: '20px' }}>
                        Patient: {user?.full_name} | Generated: {new Date().toLocaleDateString()}
                      </p>
                    </div>

                    {/* Summary Statistics */}
                    <div style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e1e5e9'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Summary Statistics</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#005EB8' }}>
                            {seizures.length}
                          </div>
                          <div style={{ color: '#666' }}>Total Seizures</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#005EB8' }}>
                            {getRecentSeizures().length}
                          </div>
                          <div style={{ color: '#666' }}>Last 30 Days</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#005EB8' }}>
                            {getAverageSeverity()}
                          </div>
                          <div style={{ color: '#666' }}>Average Severity</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#005EB8' }}>
                            {(seizures.length / Math.max(1, Math.ceil((new Date().getTime() - new Date(seizures[seizures.length - 1]?.seizure_date || new Date()).getTime()) / (1000 * 60 * 60 * 24 * 30)))).toFixed(1)}
                          </div>
                          <div style={{ color: '#666' }}>Seizures per month</div>
                        </div>
                      </div>
                    </div>

                    {/* Frequency Analysis */}
                    <div style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e1e5e9'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Frequency Analysis</h3>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <div style={{ padding: '12px', background: 'white', borderRadius: '8px' }}>
                          <strong>Most Common Trigger:</strong> {getMostCommonTrigger()}
                        </div>
                        <div style={{ padding: '12px', background: 'white', borderRadius: '8px' }}>
                          <strong>Most Common Type:</strong> {getMostCommonSeizureType()}
                        </div>
                        <div style={{ padding: '12px', background: 'white', borderRadius: '8px' }}>
                          <strong>Average Duration:</strong> {getAverageDuration()}
                        </div>
                      </div>
                    </div>

                    {/* Recent Trends */}
                    <div style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e1e5e9'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Recent Trends (Last 30 Days)</h3>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {getRecentSeizures().map((seizure, index) => (
                          <div key={seizure.id} style={{
                            padding: '12px',
                            background: 'white',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <strong>{seizure.seizure_date} {seizure.seizure_time}</strong>
                              <div style={{ fontSize: '14px', color: '#666' }}>
                                {seizure.seizure_type} • {seizure.duration}
                              </div>
                            </div>
                            <div style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: seizure.severity > 3 ? '#ff4757' : seizure.severity > 2 ? '#ffa502' : '#2ed573',
                              color: 'white'
                            }}>
                              Severity {seizure.severity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div style={{
                      background: '#e3f2fd',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #bbdefb'
                    }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#1976d2' }}>📋 Clinical Recommendations</h3>
                      <ul style={{ margin: '0', paddingLeft: '20px', color: '#1565c0' }}>
                        <li>Share this report with your healthcare provider</li>
                        <li>Monitor patterns in seizure frequency and triggers</li>
                        <li>Continue tracking medications and their effectiveness</li>
                        <li>Note any lifestyle factors that may influence seizure activity</li>
                      </ul>
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

                {/* Patient Information Section */}
                <div style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e1e5e9'
                  }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Patient Information</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <label htmlFor="name"><strong>Name:</strong></label>
                        <input type="text" id="name" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                      <div>
                        <label htmlFor="address"><strong>Address:</strong></label>
                        <input type="text" id="address" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                      <div>
                        <label htmlFor="gpSurgery"><strong>GP Surgery and Address:</strong></label>
                        <input type="text" id="gpSurgery" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                      <div>
                        <label htmlFor="nhsNumber"><strong>NHS Number:</strong></label>
                        <input type="text" id="nhsNumber" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                      <div>
                        <label htmlFor="contactDetails"><strong>Contact Details:</strong></label>
                        <input type="text" id="contactDetails" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                    </div>
                  </div>

                  {/* Next of Kin Section */}
                  <div style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e1e5e9'
                    }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Next of Kin Information</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <label htmlFor="kinName"><strong>Name:</strong></label>
                        <input type="text" id="kinName" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                      <div>
                        <label htmlFor="kinRelationship"><strong>Relationship:</strong></label>
                        <input type="text" id="kinRelationship" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                      <div>
                        <label htmlFor="kinAddress"><strong>Address:</strong></label>
                        <input type="text" id="kinAddress" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                      <div>
                        <label htmlFor="kinContactDetails"><strong>Contact Details:</strong></label>
                        <input type="text" id="kinContactDetails" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
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

          {activeTab === 'next-of-kin' && (
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
                <h2 style={{ margin: '0', color: '#003087' }}>Next of Kin Information</h2>
              </div>

              <div style={{ background: '#d1ecf1', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #bee5eb' }}>
                <strong style={{ color: '#0c5460' }}>Legal Information:</strong> This person will be contacted for medical decisions if you are unable to make them yourself.
              </div>

              <form onSubmit={(e) => { e.preventDefault(); alert('Next of kin information saved! This feature will be fully implemented soon.'); }}>
                <div style={{ display: 'grid', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Full legal name"
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
                        <option value="spouse">Spouse</option>
                        <option value="civil-partner">Civil Partner</option>
                        <option value="parent">Parent</option>
                        <option value="child">Adult Child</option>
                        <option value="sibling">Sibling</option>
                        <option value="guardian">Legal Guardian</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
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
                      Address *
                    </label>
                    <textarea
                      placeholder="Full address including postcode"
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
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                        Primary Phone *
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
                        Alternative Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+44 20 0000 0000"
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
                      Email Address *
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
                      required
                    />
                  </div>

                  <div style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e1e5e9'
                  }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#003087', fontSize: '18px' }}>Medical Decision Authority</h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                        />
                        <span style={{ fontSize: '15px', color: '#333' }}>
                          This person has the authority to make medical decisions on my behalf if I am unable to do so
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                        />
                        <span style={{ fontSize: '15px', color: '#333' }}>
                          This person can access my seizure records and medical information
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                        />
                        <span style={{ fontSize: '15px', color: '#333' }}>
                          This person should be contacted for all medical emergencies
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                      Additional Notes
                    </label>
                    <textarea
                      placeholder="Any additional information about this person or special circumstances"
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
                      background: 'linear-gradient(135deg, #fd7e14 0%, #e55a00 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(253, 126, 20, 0.4)'
                    }}
                  >
                    Save Next of Kin Information
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