
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function DoctorVerification() {
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    gmc_number: '',
    speciality: '',
    practice_name: '',
    practice_address: '',
    phone_number: ''
  })
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        router.push('/doctor-login')
        return
      }

      // Check if already verified
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!doctorError && doctorData) {
        // Already verified, redirect to portal
        router.push('/doctor-portal')
        return
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error checking auth status:', error)
      router.push('/doctor-login')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/doctor-login')
        return
      }

      // Create doctor profile
      const { error } = await supabase.from('doctors').insert([{
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || 'Doctor',
        email: session.user.email,
        gmc_number: formData.gmc_number,
        speciality: formData.speciality,
        practice_name: formData.practice_name,
        practice_address: formData.practice_address,
        phone_number: formData.phone_number,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }])

      if (error) throw error

      setMessage('Verification submitted successfully! Redirecting to portal...')
      setTimeout(() => router.push('/doctor-portal'), 2000)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      setIsLoading(false)
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
          <div style={{ color: '#005EB8', fontSize: '18px' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Doctor Verification - NeuroLog Professional</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '48px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
              borderRadius: '20px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: '#00A651'
            }}>
              ✚
            </div>
            <h1 style={{ 
              color: '#003087', 
              fontSize: '32px', 
              fontWeight: 'bold',
              margin: '0 0 12px 0'
            }}>
              Doctor Verification
            </h1>
            <p style={{ 
              color: '#666', 
              fontSize: '16px',
              margin: '0',
              lineHeight: '1.6'
            }}>
              Please complete your professional details to access the doctor portal
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  GMC Number *
                </label>
                <input
                  type="text"
                  value={formData.gmc_number}
                  onChange={(e) => setFormData({ ...formData, gmc_number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  required
                  placeholder="Enter your GMC number"
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Speciality *
                </label>
                <select
                  value={formData.speciality}
                  onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    outline: 'none'
                  }}
                  required
                >
                  <option value="">Select speciality</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatric Neurology">Pediatric Neurology</option>
                  <option value="Epileptology">Epileptology</option>
                  <option value="General Practice">General Practice</option>
                  <option value="Emergency Medicine">Emergency Medicine</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Practice Name *
                </label>
                <input
                  type="text"
                  value={formData.practice_name}
                  onChange={(e) => setFormData({ ...formData, practice_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  required
                  placeholder="Enter practice name"
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Practice Address
                </label>
                <textarea
                  value={formData.practice_address}
                  onChange={(e) => setFormData({ ...formData, practice_address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    fontSize: '16px',
                    minHeight: '80px',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                  placeholder="Enter practice address"
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              style={{ 
                width: '100%',
                padding: '18px',
                background: isLoading ? '#ccc' : 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginTop: '32px',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? 'Submitting...' : 'Complete Verification'}
            </button>
          </form>

          {message && (
            <div style={{ 
              marginTop: '24px', 
              padding: '18px', 
              backgroundColor: message.includes('Error') ? '#fee' : '#efe',
              color: message.includes('Error') ? '#c33' : '#363',
              borderRadius: '16px',
              textAlign: 'center',
              fontSize: '15px',
              fontWeight: '500'
            }}>
              {message}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                textDecoration: 'underline',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
