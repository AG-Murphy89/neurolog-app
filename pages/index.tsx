import React from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";

export default function NeuroLog() {
  return (
    <div className={styles.container}>
      <Head>
        <title>NeuroLog</title>
        <meta name="description" content="NeuroLog - Seizure Tracking" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span style={{ color: "#0070f3" }}>NeuroLog</span>
        </h1>

        <p className={styles.description}>
          "Professional Seizure Management System"
        </p>

        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => {
              // Mock user login
              const mockUser = {
                id: 'user123',
                name: 'Demo User',
                email: 'demo@example.com',
                type: 'patient'
              };
              localStorage.setItem('neurolog_user', JSON.stringify(mockUser));
              window.location.href = '/dashboard';
            }}
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
            Access Dashboard
          </button>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Clinical Data Management &rarr;</h2>
            <p>
              Securely collect and organize seizure patterns, medication
              responses, and clinical outcomes for better patient care.
              real-time.
            </p>
          </div>

          <div className={styles.card}>
            <h2>Seizure Pattern Analysis &rarr;</h2>
            <p>
              Generate comprehensive reports and visualizations of seizure
              frequency, triggers, and medication effectiveness for clinical
              review.
            </p>
          </div>

          <div className={styles.card}>
            <h2>Treatment Monitoring &rarr;</h2>
            <p>
              Monitor medication changes, dosage adjustments, and treatment
              responses to optimize patient care.
            </p>
          </div>

          <div className={styles.card}>
            <h2>CQC Compliance&rarr;</h2>
            <p>
              Full audit trails, GDPR compliance, and professional documentation
              standards for healthcare providers.
            </p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          Powered by{" "}
          <span style={{ fontWeight: "bold", color: "#0070f3" }}>NeuroLog</span>
        </p>
      </footer>
    </div>
  );
}
