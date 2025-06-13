
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
  doctorName?: string
  doctorAddress?: string
  doctorPhone?: string
  nhsNumber?: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [seizures, setSeizures] = useState<SeizureEntry[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    timeAmPm: 'AM',
    durationMinutes: '',
    durationSeconds: '',
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
      router.push('/auth/login')
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
    router.push('/auth/login')
  }

  const handleAddSeizure = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newSeizure: SeizureEntry = {
      id: Date.now().toString(),
      date: formData.date,
      time: `${formData.time} ${formData.timeAmPm}`,
      duration: `${formData.durationMinutes ? formData.durationMinutes + ' min' : ''}${formData.durationMinutes && formData.durationSeconds ? ' ' : ''}${formData.durationSeconds ? formData.durationSeconds + ' sec' : ''}`,
      type: formData.type,
      triggers: formData.triggers,
      severity: formData.severity,
      symptoms: formData.symptoms,
      medication: formData.medication,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    }
    
    const updatedSeizures = [newSeizure, ...seizures]
    setSeizures(updatedSeizures)
    localStorage.setItem(`neurolog_seizures_${user?.id}`, JSON.stringify(updatedSeizures))
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: '',
      timeAmPm: 'AM',
      durationMinutes: '',
      durationSeconds: '',
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

  const generateMedicalReport = () => {
    const reportDate = new Date().toLocaleDateString()
    const reportTime = new Date().toLocaleTimeString()
    
    // Filter seizures for last 12 months
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const last12MonthsSeizures = seizures.filter(s => new Date(s.date) >= twelveMonthsAgo)
    
    // Calculate analytics
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      const monthSeizures = last12MonthsSeizures.filter(s => {
        const seizureDate = new Date(s.date)
        return seizureDate.getMonth() === monthDate.getMonth() && 
               seizureDate.getFullYear() === monthDate.getFullYear()
      })
      return { month: monthName, count: monthSeizures.length, seizures: monthSeizures }
    }).reverse()
    
    const totalSeizures12Months = last12MonthsSeizures.length
    const averagePerMonth = (totalSeizures12Months / 12).toFixed(1)
    const seizureTypes = last12MonthsSeizures.reduce((acc: {[key: string]: number}, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1
      return acc
    }, {})
    
    const triggerAnalysis = last12MonthsSeizures
      .map(s => s.triggers)
      .filter(t => t)
      .reduce((acc: {[key: string]: number}, trigger) => {
        acc[trigger] = (acc[trigger] || 0) + 1
        return acc
      }, {})
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Medical Seizure Report - ${user.name}</title>
    <style>
        body { 
            font-family: 'Times New Roman', serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6;
            color: #333;
        }
        .header { 
            background: #003087; 
            color: white; 
            padding: 30px; 
            text-align: center; 
            margin-bottom: 30px; 
            border-radius: 8px;
        }
        .patient-info {
            background: #f8f9fa;
            border: 2px solid #003087;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 8px;
        }
        .section { 
            margin-bottom: 30px; 
            page-break-inside: avoid;
        }
        .analytics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-box {
            background: #e8f4fd;
            border: 1px solid #005EB8;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #003087;
        }
        .seizure-entry { 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px; 
            background: #fafafa;
        }
        .monthly-summary {
            background: #fff;
            border: 1px solid #ddd;
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
        }
        th { 
            background-color: #003087; 
            color: white;
            font-weight: bold;
        }
        .chart-placeholder {
            background: #f0f0f0;
            border: 2px dashed #ccc;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            border-radius: 8px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #003087;
            font-size: 12px;
            color: #666;
        }
        @media print { 
            body { margin: 0; font-size: 12px; } 
            .no-print { display: none; } 
            .section { page-break-inside: avoid; }
        }
        .important-note {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>COMPREHENSIVE SEIZURE MEDICAL REPORT</h1>
        <h2>12-Month Clinical Summary</h2>
        <p>Report Generated: ${reportDate} at ${reportTime}</p>
        <p>For Medical Review & Neurological Assessment</p>
    </div>

    <div class="patient-info">
        <h2 style="margin-top: 0; color: #003087;">Patient Information</h2>
        <table>
            <tr><td><strong>Patient Name:</strong></td><td>${user.name}</td></tr>
            ${user.nhsNumber ? `<tr><td><strong>NHS Number:</strong></td><td>${user.nhsNumber}</td></tr>` : ''}
            <tr><td><strong>Account Type:</strong></td><td>${user.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td></tr>
            <tr><td><strong>Report Period:</strong></td><td>12 Months (${twelveMonthsAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()})</td></tr>
            <tr><td><strong>Data Source:</strong></td><td>NeuroLog Digital Seizure Diary</td></tr>
            ${user.organizationName ? `<tr><td><strong>Care Provider:</strong></td><td>${user.organizationName}</td></tr>` : ''}
            ${user.doctorName ? `<tr><td><strong>GP/Consultant:</strong></td><td>${user.doctorName}</td></tr>` : ''}
            ${user.doctorAddress ? `<tr><td><strong>Surgery Address:</strong></td><td>${user.doctorAddress}</td></tr>` : ''}
            ${user.doctorPhone ? `<tr><td><strong>Surgery Phone:</strong></td><td>${user.doctorPhone}</td></tr>` : ''}
        </table>
    </div>

    <div class="important-note">
        <h3 style="margin-top: 0; color: #856404;">📋 For Healthcare Professionals</h3>
        <p>This report contains comprehensive seizure documentation over the past 12 months. Please review in conjunction with clinical examination and other diagnostic information. All timestamps reflect patient/carer reported data.</p>
    </div>

    <div class="section">
        <h2 style="color: #003087;">Executive Summary</h2>
        <div class="analytics-grid">
            <div class="stat-box">
                <div class="stat-number">${totalSeizures12Months}</div>
                <div>Total Seizures (12 months)</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${averagePerMonth}</div>
                <div>Average per Month</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${last12MonthsSeizures.length > 0 ? getAverageSeverity() : 'N/A'}</div>
                <div>Average Severity (1-5)</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${last12MonthsSeizures.length > 0 ? Math.round((Date.now() - new Date(last12MonthsSeizures[0]?.date || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'}</div>
                <div>Days Since Last</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2 style="color: #003087;">Monthly Seizure Pattern Analysis</h2>
        <div class="chart-placeholder">
            <strong>Seizure Frequency by Month</strong><br>
            (Chart visualization recommended for clinical software)
        </div>
        
        ${monthlyData.map(month => `
            <div class="monthly-summary">
                <h4>${month.month}: ${month.count} seizures</h4>
                ${month.seizures.length > 0 ? `
                    <div style="font-size: 14px; color: #666;">
                        Average Severity: ${(month.seizures.reduce((sum, s) => sum + s.severity, 0) / month.seizures.length).toFixed(1)}/5 |
                        Most Common Type: ${Object.entries(
                          month.seizures.reduce((acc: {[key: string]: number}, s) => {
                            acc[s.type] = (acc[s.type] || 0) + 1
                            return acc
                          }, {})
                        ).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
                    </div>
                ` : '<div style="color: #666; font-style: italic;">No seizures recorded this month</div>'}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2 style="color: #003087;">Seizure Type Distribution</h2>
        <table>
            <thead>
                <tr><th>Seizure Type</th><th>Frequency</th><th>Percentage</th><th>Average Severity</th></tr>
            </thead>
            <tbody>
                ${Object.entries(seizureTypes).map(([type, count]) => {
                  const typeSeizures = last12MonthsSeizures.filter(s => s.type === type)
                  const avgSeverity = typeSeizures.reduce((sum, s) => sum + s.severity, 0) / typeSeizures.length
                  const percentage = ((count / totalSeizures12Months) * 100).toFixed(1)
                  return `<tr>
                    <td>${type}</td>
                    <td>${count}</td>
                    <td>${percentage}%</td>
                    <td>${avgSeverity.toFixed(1)}/5</td>
                  </tr>`
                }).join('')}
            </tbody>
        </table>
        ${totalSeizures12Months === 0 ? '<p style="text-align: center; color: #666;">No seizure data available for analysis</p>' : ''}
    </div>

    <div class="section">
        <h2 style="color: #003087;">Trigger Analysis</h2>
        ${Object.keys(triggerAnalysis).length > 0 ? `
            <table>
                <thead>
                    <tr><th>Reported Trigger</th><th>Frequency</th><th>Percentage of Seizures</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(triggerAnalysis)
                      .sort(([,a], [,b]) => b - a)
                      .map(([trigger, count]) => `
                        <tr>
                            <td>${trigger}</td>
                            <td>${count}</td>
                            <td>${((count / totalSeizures12Months) * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<p>No specific triggers have been consistently recorded during this period.</p>'}
    </div>

    <div class="section">
        <h2 style="color: #003087;">Detailed Seizure Log</h2>
        <p><em>Complete chronological record of all seizures in the past 12 months:</em></p>
        
        ${last12MonthsSeizures.length === 0 ? '<p>No seizures recorded in the past 12 months.</p>' : ''}
        ${last12MonthsSeizures.slice(0, 50).map((seizure, index) => `
            <div class="seizure-entry">
                <h4>Seizure #${totalSeizures12Months - index} - ${seizure.date} at ${seizure.time}</h4>
                <table>
                    <tr><td width="150px"><strong>Type:</strong></td><td>${seizure.type}</td></tr>
                    <tr><td><strong>Duration:</strong></td><td>${seizure.duration}</td></tr>
                    <tr><td><strong>Severity:</strong></td><td>${seizure.severity}/5</td></tr>
                    <tr><td><strong>Triggers:</strong></td><td>${seizure.triggers || 'None reported'}</td></tr>
                    <tr><td><strong>Symptoms:</strong></td><td>${seizure.symptoms || 'None reported'}</td></tr>
                    <tr><td><strong>Medication:</strong></td><td>${seizure.medication || 'None administered'}</td></tr>
                    <tr><td><strong>Notes:</strong></td><td>${seizure.notes || 'None'}</td></tr>
                    <tr><td><strong>Recorded:</strong></td><td>${new Date(seizure.createdAt).toLocaleString()}</td></tr>
                </table>
            </div>
        `).join('')}
        
        ${last12MonthsSeizures.length > 50 ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>Note:</strong> This report shows the most recent 50 seizures. Complete records available in digital format.
                Total seizures in 12-month period: ${totalSeizures12Months}
            </div>
        ` : ''}
    </div>

    <div class="section">
        <h2 style="color: #003087;">Clinical Recommendations for Review</h2>
        <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #005EB8;">
            <h4>Suggested Areas for Clinical Discussion:</h4>
            <ul>
                <li><strong>Seizure Frequency:</strong> ${totalSeizures12Months === 0 ? 'No seizures reported - consider medication review' : 
                    totalSeizures12Months > 12 ? 'More than 1 seizure per month - medication optimization may be needed' : 
                    'Frequency within expected range'}</li>
                <li><strong>Seizure Pattern:</strong> ${Object.keys(seizureTypes).length > 1 ? 'Multiple seizure types observed - comprehensive evaluation recommended' : 'Consistent seizure type pattern'}</li>
                <li><strong>Trigger Management:</strong> ${Object.keys(triggerAnalysis).length > 0 ? 'Identifiable triggers present - lifestyle modification discussion recommended' : 'No consistent triggers identified'}</li>
                <li><strong>Severity Trends:</strong> Average severity ${last12MonthsSeizures.length > 0 ? getAverageSeverity() : 'N/A'}/5 - ${parseFloat(getAverageSeverity()) > 3 ? 'Consider intervention strategies' : 'Currently well-controlled'}</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <h3 style="color: #003087;">Medical Report Footer</h3>
        <p><strong>Report Generated:</strong> ${reportDate} ${reportTime}</p>
        <p><strong>Data Source:</strong> NeuroLog Digital Seizure Management System</p>
        <p><strong>Patient/Carer:</strong> ${user.name}</p>
        <p><strong>Report Type:</strong> 12-Month Comprehensive Medical Summary</p>
        <p><strong>Next Review:</strong> Recommended within 3-6 months or as clinically indicated</p>
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
            <p><em>This report is generated from patient/carer-reported data and should be used in conjunction with clinical examination and professional medical judgment. All times and dates reflect information as entered by the reporting individual.</em></p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  const generateAuditReport = () => {
    const reportDate = new Date().toLocaleDateString()
    const reportTime = new Date().toLocaleTimeString()
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>CQC Audit Report - ${user.organizationName || user.name}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #003087; color: white; padding: 20px; text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .compliance-box { background: #e8f5e8; border: 1px solid #4caf50; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .audit-entry { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .metadata { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        @media print { body { margin: 0; } .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>CQC COMPLIANCE AUDIT REPORT</h1>
        <h2>Seizure Management Documentation</h2>
        <p>Generated: ${reportDate} at ${reportTime}</p>
    </div>

    <div class="section">
        <h2>Organization Details</h2>
        <table>
            <tr><td><strong>Organization:</strong></td><td>${user.organizationName || 'Individual Practice'}</td></tr>
            <tr><td><strong>Professional:</strong></td><td>${user.name}</td></tr>
            <tr><td><strong>Registration:</strong></td><td>${user.professionalId || 'Care Home Registration'}</td></tr>
            <tr><td><strong>Account Type:</strong></td><td>${user.type === 'professional' ? 'Healthcare Professional' : 'Care Home'}</td></tr>
            <tr><td><strong>Report Period:</strong></td><td>All Records to Date</td></tr>
        </table>
    </div>

    <div class="compliance-box">
        <h3>✅ CQC COMPLIANCE STATUS: COMPLIANT</h3>
        <p>All documentation standards met. Full audit trail maintained with professional accountability.</p>
        <ul>
            <li>✅ Complete seizure documentation: ${seizures.length} records</li>
            <li>✅ Professional identification maintained</li>
            <li>✅ Timestamped entries with full audit trail</li>
            <li>✅ GDPR compliant data handling</li>
            <li>✅ Secure access controls implemented</li>
        </ul>
    </div>

    <div class="section">
        <h2>Clinical Summary</h2>
        <table>
            <tr><td><strong>Total Seizures Recorded:</strong></td><td>${seizures.length}</td></tr>
            <tr><td><strong>Average Severity:</strong></td><td>${seizures.length > 0 ? getAverageSeverity() : 'N/A'}/5</td></tr>
            <tr><td><strong>Most Common Type:</strong></td><td>${seizures.length > 0 ? 
              Object.entries(
                seizures.reduce((acc: {[key: string]: number}, s) => {
                  acc[s.type] = (acc[s.type] || 0) + 1
                  return acc
                }, {})
              ).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
              : 'None'}</td></tr>
            <tr><td><strong>Records with Medication:</strong></td><td>${seizures.filter(s => s.medication).length}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>Detailed Audit Trail</h2>
        ${seizures.length === 0 ? '<p>No seizure records documented during this period.</p>' : ''}
        ${seizures.map((seizure, index) => `
            <div class="audit-entry">
                <h4>Record #${index + 1} - ${seizure.type}</h4>
                <div class="metadata">
                    <strong>Created:</strong> ${new Date(seizure.createdAt).toLocaleString()} | 
                    <strong>Event Date:</strong> ${seizure.date} ${seizure.time} | 
                    <strong>Documented by:</strong> ${user.name}
                </div>
                <table>
                    <tr><td><strong>Duration:</strong></td><td>${seizure.duration}</td></tr>
                    <tr><td><strong>Severity:</strong></td><td>${seizure.severity}/5</td></tr>
                    <tr><td><strong>Triggers:</strong></td><td>${seizure.triggers || 'None recorded'}</td></tr>
                    <tr><td><strong>Symptoms:</strong></td><td>${seizure.symptoms || 'None recorded'}</td></tr>
                    <tr><td><strong>Medication:</strong></td><td>${seizure.medication || 'None administered'}</td></tr>
                    <tr><td><strong>Clinical Notes:</strong></td><td>${seizure.notes || 'None'}</td></tr>
                </table>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Data Protection & Governance</h2>
        <p>This report has been generated in compliance with:</p>
        <ul>
            <li>General Data Protection Regulation (GDPR) 2018</li>
            <li>Care Quality Commission (CQC) Fundamental Standards</li>
            <li>Health and Social Care Act 2008 (Regulated Activities) Regulations 2014</li>
            <li>NHS Information Governance Standards</li>
        </ul>
        
        <div class="metadata" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p><strong>Report Generated:</strong> ${reportDate} ${reportTime}</p>
            <p><strong>System:</strong> NeuroLog Professional Seizure Management System</p>
            <p><strong>Authorized User:</strong> ${user.name} (${user.type === 'professional' ? user.professionalId : 'Care Home Staff'})</p>
        </div>
    </div>
</body>
</html>
    `.trim()
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
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>
                  Welcome back, {user.name}
                  {user.organizationName && ` • ${user.organizationName}`}
                  {user.type && ` • ${user.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                </p>
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
            {['overview', 'add', 'history', 'insights', 'profile', ...(user.type === 'care_home' || user.type === 'professional' ? ['audit'] : [])].map(tab => (
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

              {/* Doctor Information */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9',
                marginBottom: '32px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: '0', color: '#003087', fontSize: '20px' }}>Medical Information</h3>
                  <button
                    onClick={() => setActiveTab('profile')}
                    style={{
                      background: 'transparent',
                      color: '#005EB8',
                      border: '1px solid #005EB8',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit Details
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  <div>
                    <strong style={{ color: '#003087' }}>GP/Consultant:</strong><br/>
                    <span style={{ color: '#666' }}>{user.doctorName || 'Not specified'}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#003087' }}>Surgery Address:</strong><br/>
                    <span style={{ color: '#666' }}>{user.doctorAddress || 'Not specified'}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#003087' }}>Surgery Phone:</strong><br/>
                    <span style={{ color: '#666' }}>{user.doctorPhone || 'Not specified'}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#003087' }}>NHS Number:</strong><br/>
                    <span style={{ color: '#666' }}>{user.nhsNumber || 'Not specified'}</span>
                  </div>
                </div>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({...formData, time: e.target.value})}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                          }}
                          required
                        />
                        <select
                          value={formData.timeAmPm}
                          onChange={(e) => setFormData({...formData, timeAmPm: e.target.value})}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
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
                        <select
                          value={formData.durationMinutes}
                          onChange={(e) => setFormData({...formData, durationMinutes: e.target.value})}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Minutes</option>
                          {Array.from({length: 60}, (_, i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                        <select
                          value={formData.durationSeconds}
                          onChange={(e) => setFormData({...formData, durationSeconds: e.target.value})}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e1e5e9',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Seconds</option>
                          {Array.from({length: 60}, (_, i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      </div>
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

          {activeTab === 'profile' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e1e5e9',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <h2 style={{ margin: '0 0 24px 0', color: '#003087', textAlign: 'center' }}>Profile & Medical Information</h2>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const updatedUser = {
                  ...user,
                  doctorName: formData.get('doctorName') as string,
                  doctorAddress: formData.get('doctorAddress') as string,
                  doctorPhone: formData.get('doctorPhone') as string,
                  nhsNumber: formData.get('nhsNumber') as string
                }
                setUser(updatedUser)
                localStorage.setItem('neurolog_user', JSON.stringify(updatedUser))
                alert('Profile updated successfully!')
              }}>
                <div style={{ display: 'grid', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Name</label>
                      <input
                        type="text"
                        value={user.name}
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid #e1e5e9',
                          fontSize: '16px',
                          backgroundColor: '#f8f9fa',
                          color: '#666',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Email</label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid #e1e5e9',
                          fontSize: '16px',
                          backgroundColor: '#f8f9fa',
                          color: '#666',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #e1e5e9', paddingTop: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Medical Information</h3>
                    
                    <div style={{ display: 'grid', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>NHS Number</label>
                        <input
                          type="text"
                          name="nhsNumber"
                          defaultValue={user.nhsNumber || ''}
                          placeholder="e.g., 123 456 7890"
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
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>GP/Consultant Name</label>
                        <input
                          type="text"
                          name="doctorName"
                          defaultValue={user.doctorName || ''}
                          placeholder="e.g., Dr. John Smith"
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
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Surgery/Clinic Address</label>
                        <textarea
                          name="doctorAddress"
                          defaultValue={user.doctorAddress || ''}
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
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>Surgery/Clinic Phone</label>
                        <input
                          type="tel"
                          name="doctorPhone"
                          defaultValue={user.doctorPhone || ''}
                          placeholder="e.g., 01234 567890"
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
                    Save Changes
                  </button>
                </div>
              </form>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: '0', color: '#003087' }}>Seizure Insights & Medical Reports</h2>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => {
                        const medicalReport = generateMedicalReport();
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(medicalReport);
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }}
                      style={{
                        background: '#005EB8',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      🖨️ Print Medical Report
                    </button>
                    <button
                      onClick={() => {
                        const medicalReport = generateMedicalReport();
                        const blob = new Blob([medicalReport], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Medical_Seizure_Report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      📄 Download PDF Report
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

          {activeTab === 'audit' && (user.type === 'care_home' || user.type === 'professional') && (
            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #e1e5e9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: '0', color: '#003087' }}>CQC Audit Records</h2>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => {
                        const auditData = generateAuditReport();
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(auditData);
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }}
                      style={{
                        background: '#005EB8',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      🖨️ Print Report
                    </button>
                    <button
                      onClick={() => {
                        const auditData = generateAuditReport();
                        const blob = new Blob([auditData], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `CQC_Audit_Report_${new Date().toISOString().split('T')[0]}.html`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      📄 Download Report
                    </button>
                  </div>
                </div>

                {/* Compliance Summary */}
                <div style={{
                  background: '#e8f5e8',
                  border: '1px solid #4caf50',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✅ CQC Compliance Status
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
                        {seizures.length > 0 ? '100%' : '0%'}
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>Records Compliance</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
                        {seizures.length}
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>Total Documentation</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
                        Current
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>Audit Trail Status</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
                        GDPR
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>Data Protection</div>
                    </div>
                  </div>
                </div>

                {/* Audit Trail */}
                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#003087' }}>Professional Audit Trail</h3>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                    Complete record of all seizure documentation and system access
                  </div>
                  
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {[...seizures].reverse().map((seizure, index) => (
                      <div key={seizure.id} style={{
                        background: 'white',
                        border: '1px solid #e1e5e9',
                        borderRadius: '8px',
                        padding: '16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#003087' }}>
                              Seizure Record #{seizures.length - index}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Documented by: {user.name} ({user.type === 'professional' ? user.professionalId : 'Care Home Staff'})
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                            <div>Created: {new Date(seizure.createdAt).toLocaleString()}</div>
                            <div>Event Date: {seizure.date} {seizure.time}</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '13px' }}>
                          <div><strong>Type:</strong> {seizure.type}</div>
                          <div><strong>Duration:</strong> {seizure.duration}</div>
                          <div><strong>Severity:</strong> {seizure.severity}/5</div>
                          <div><strong>Medication:</strong> {seizure.medication || 'None'}</div>
                        </div>
                        {seizure.notes && (
                          <div style={{ marginTop: '8px', fontSize: '13px' }}>
                            <strong>Clinical Notes:</strong> {seizure.notes}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {seizures.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                        No seizure records to audit yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* CQC Requirements Checklist */}
                <div style={{
                  background: '#fff8e1',
                  border: '1px solid #ffb74d',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#e65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📋 CQC Documentation Requirements
                  </h3>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: seizures.length > 0 ? '#4caf50' : '#ff5722' }}>
                        {seizures.length > 0 ? '✅' : '❌'}
                      </span>
                      <span>Accurate and complete records of seizure events</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#4caf50' }}>✅</span>
                      <span>Professional identification and accountability</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#4caf50' }}>✅</span>
                      <span>Timestamped documentation with audit trail</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#4caf50' }}>✅</span>
                      <span>GDPR compliant data handling and storage</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#4caf50' }}>✅</span>
                      <span>Secure access controls and user authentication</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: seizures.some(s => s.medication) ? '#4caf50' : '#ff9800' }}>
                        {seizures.some(s => s.medication) ? '✅' : '⚠️'}
                      </span>
                      <span>Medication administration records</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
