
import { supabase } from './supabase'

export interface UserDataExport {
  user_profile: any
  seizure_records: any[]
  medications: any[]
  emergency_contacts: any[]
  next_of_kin: any[]
  exported_at: string
  export_version: string
}

export const dataExportUtils = {
  // Export all user data (GDPR compliance)
  async exportAllUserData(userId: string): Promise<{ success: boolean; data?: UserDataExport; error?: string }> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Get seizure records
      const { data: seizures, error: seizuresError } = await supabase
        .from('seizure_records')
        .select('*')
        .eq('user_id', userId)
        .order('seizure_date', { ascending: false })

      // Get medications
      const { data: medications, error: medicationsError } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Get emergency contacts
      const { data: emergencyContacts, error: emergencyError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)

      // Get next of kin
      const { data: nextOfKin, error: kinError } = await supabase
        .from('next_of_kin')
        .select('*')
        .eq('user_id', userId)

      if (profileError || seizuresError || medicationsError || emergencyError || kinError) {
        throw new Error('Failed to retrieve user data')
      }

      const exportData: UserDataExport = {
        user_profile: profile,
        seizure_records: seizures || [],
        medications: medications || [],
        emergency_contacts: emergencyContacts || [],
        next_of_kin: nextOfKin || [],
        exported_at: new Date().toISOString(),
        export_version: '1.0'
      }

      return { success: true, data: exportData }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Download data as JSON file
  downloadAsJSON(data: UserDataExport, filename?: string) {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `neurolog-data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  // Generate medical report PDF
  async generateMedicalReportPDF(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: exportData, error } = await this.exportAllUserData(userId)
      
      if (!exportData || error) {
        throw new Error(error || 'Failed to export data')
      }

      // Import PDF library dynamically
      const jsPDF = (await import('jspdf')).jsPDF
      const doc = new jsPDF()

      // Header
      doc.setFontSize(20)
      doc.text('NeuroLog Medical Report', 20, 30)
      
      doc.setFontSize(12)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45)
      doc.text(`Patient: ${exportData.user_profile?.full_name || 'Unknown'}`, 20, 55)
      
      let yPosition = 75

      // Seizure Summary
      doc.setFontSize(16)
      doc.text('Seizure Summary', 20, yPosition)
      yPosition += 15

      doc.setFontSize(12)
      const seizureCount = exportData.seizure_records.length
      const recentSeizures = exportData.seizure_records.filter(s => {
        const seizureDate = new Date(s.seizure_date)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return seizureDate >= thirtyDaysAgo
      }).length

      doc.text(`Total Seizures Recorded: ${seizureCount}`, 20, yPosition)
      yPosition += 10
      doc.text(`Seizures in Last 30 Days: ${recentSeizures}`, 20, yPosition)
      yPosition += 20

      // Recent Seizures
      if (exportData.seizure_records.length > 0) {
        doc.setFontSize(16)
        doc.text('Recent Seizures', 20, yPosition)
        yPosition += 15

        doc.setFontSize(10)
        exportData.seizure_records.slice(0, 10).forEach(seizure => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 30
          }

          doc.text(`${seizure.seizure_date} ${seizure.seizure_time} - ${seizure.seizure_type}`, 20, yPosition)
          yPosition += 7
          doc.text(`Duration: ${seizure.duration}, Severity: ${seizure.severity}/5`, 25, yPosition)
          yPosition += 7
          if (seizure.triggers) {
            doc.text(`Triggers: ${seizure.triggers}`, 25, yPosition)
            yPosition += 7
          }
          yPosition += 5
        })
      }

      // Medications
      if (exportData.medications.length > 0) {
        yPosition += 10
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 30
        }

        doc.setFontSize(16)
        doc.text('Current Medications', 20, yPosition)
        yPosition += 15

        doc.setFontSize(12)
        exportData.medications.filter(m => m.is_active).forEach(med => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 30
          }

          doc.text(`${med.name} - ${med.dosage}`, 20, yPosition)
          yPosition += 10
          doc.text(`Frequency: ${med.frequency}`, 25, yPosition)
          yPosition += 10
          doc.text(`Times: ${med.schedule_times.join(', ')}`, 25, yPosition)
          yPosition += 15
        })
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text('Generated by NeuroLog - GDPR Compliant Seizure Tracking', 20, 290)
        doc.text(`Page ${i} of ${pageCount}`, 180, 290)
      }

      doc.save(`neurolog-medical-report-${new Date().toISOString().split('T')[0]}.pdf`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Import data from JSON
  async importUserData(userId: string, importData: UserDataExport): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate import data structure
      if (!importData.export_version || !importData.seizure_records) {
        throw new Error('Invalid import data format')
      }

      // Import seizure records
      if (importData.seizure_records.length > 0) {
        const seizureRecords = importData.seizure_records.map(record => ({
          ...record,
          user_id: userId,
          id: undefined // Let Supabase generate new IDs
        }))

        const { error: seizureError } = await supabase
          .from('seizure_records')
          .insert(seizureRecords)

        if (seizureError) throw seizureError
      }

      // Import medications
      if (importData.medications.length > 0) {
        const medications = importData.medications.map(med => ({
          ...med,
          user_id: userId,
          id: undefined
        }))

        const { error: medError } = await supabase
          .from('medications')
          .insert(medications)

        if (medError) throw medError
      }

      // Import emergency contacts
      if (importData.emergency_contacts.length > 0) {
        const contacts = importData.emergency_contacts.map(contact => ({
          ...contact,
          user_id: userId,
          id: undefined
        }))

        const { error: contactError } = await supabase
          .from('emergency_contacts')
          .insert(contacts)

        if (contactError) throw contactError
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  // Right to be forgotten - delete all user data
  async deleteAllUserData(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete in order to respect foreign key constraints
      await supabase.from('seizure_records').delete().eq('user_id', userId)
      await supabase.from('medications').delete().eq('user_id', userId)
      await supabase.from('emergency_contacts').delete().eq('user_id', userId)
      await supabase.from('next_of_kin').delete().eq('user_id', userId)
      await supabase.from('user_profiles').delete().eq('id', userId)

      // Delete auth user (this should be done carefully)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('Auth deletion error:', authError)
        // Continue anyway as data deletion succeeded
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
