import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import ErrorBoundary from '../components/ErrorBoundary'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = () => {
      const userData = localStorage.getItem('neurolog_user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    }
    checkUser()
  }, [])

  const handleQuickStart = () => {
    router.push('/auth/signup')
  }

  return (
    <ErrorBoundary>
      <Head>
        <title>NeuroLog - Seizure Tracking & Management</title>
        <meta name="description" content="Professional seizure tracking and management platform for patients, families, and healthcare providers" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Navigation */}
        <nav style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e1e5e9',
          padding: '16px 0',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#003087',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🧠 NeuroLog
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {user ? (
                <>
                  <span style={{ color: '#666' }}>Welcome, {user.name}</span>
                  <Link 
                    href="/dashboard"
                    style={{
                      background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" style={{ color: '#005EB8', textDecoration: 'none', fontWeight: '500' }}>
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signup"
                    style={{
                      background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontWeight: '500'
                    }}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section style={{
          padding: '80px 20px',
          textAlign: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#003087',
            margin: '0 0 24px 0',
            lineHeight: '1.2'
          }}>
            Professional Seizure Tracking &amp; Management
          </h1>

          <p style={{
            fontSize: '20px',
            color: '#666',
           
  maxWidth: '600px',
  margin: '0 auto 40px auto'
}
          }>
            Comprehensive platform for patients, families, and healthcare providers to track, monitor, and manage epilepsy with precision and care.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleQuickStart}
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
              Start Tracking Today
            </button>

            <Link 
              href="/doctor-portal"
              style={{
                background: 'transparent',
                color: '#005EB8',
                border: '2px solid #005EB8',
                textDecoration: 'none',
                padding: '14px 30px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                display: 'inline-block'
              }}
            >
              Healthcare Provider Portal
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section style={{
          padding: '80px 20px',
          background: 'white',
          margin: '0 20px',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#003087',
              textAlign: 'center',
              margin: '0 0 60px 0'
            }}>
              Why Choose NeuroLog?
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '40px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>📊</div>
                <h3 style={{ color: '#003087', margin: '0 0 16px 0' }}>Comprehensive Tracking</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  Record seizures, medications, triggers, and symptoms with detailed analytics and insights.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>👨‍⚕️</div>
                <h3 style={{ color: '#003087', margin: '0 0 16px 0' }}>Healthcare Integration</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  Share data securely with your healthcare team for better treatment decisions.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>🔒</div>
                <h3 style={{ color: '#003087', margin: '0 0 16px 0' }}>GDPR Compliant</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  Your data is protected with enterprise-grade security and privacy controls.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #005EB8 0%, #003087 100%)',
            padding: '60px 40px',
            borderRadius: '24px',
            color: 'white',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              margin: '0 0 16px 0'
            }}>
              Ready to Take Control?
            </h2>
            <p style={{
              fontSize: '18px',
              margin: '0 0 32px 0',
              opacity: 0.9
            }}>
              Join thousands of patients and healthcare providers using NeuroLog for better seizure management.
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link 
                href="/auth/signup"
                style={{
                  background: 'white',
                  color: '#003087',
                  textDecoration: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Create Free Account
              </Link>

              <Link 
                href="/doctor-portal"
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: '2px solid white',
                  textDecoration: 'none',
                  padding: '14px 30px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Healthcare Access
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          background: '#003087',
          color: 'white',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              🧠 NeuroLog
            </div>
            <p style={{ margin: '0', opacity: 0.8 }}>
              Professional seizure tracking and management platform
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}