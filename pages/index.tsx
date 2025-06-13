
import React from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function NeuroLog() {
  return (
    <div className={styles.container}>
      <Head>
        <title>NeuroLog</title>
        <meta name="description" content="NeuroLog - Neural Network Logging and Analysis" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span style={{ color: '#0070f3' }}>NeuroLog</span>
        </h1>

        <p className={styles.description}>
          Neural Network Logging and Analysis Platform
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Data Collection &rarr;</h2>
            <p>Collect and organize neural network training data and metrics in real-time.</p>
          </div>

          <div className={styles.card}>
            <h2>Model Analytics &rarr;</h2>
            <p>Analyze model performance with detailed visualizations and insights.</p>
          </div>

          <div className={styles.card}>
            <h2>Experiment Tracking &rarr;</h2>
            <p>Track experiments, hyperparameters, and compare model versions.</p>
          </div>

          <div className={styles.card}>
            <h2>Collaborative Research &rarr;</h2>
            <p>Share findings and collaborate with your research team seamlessly.</p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          Powered by{' '}
          <span style={{ fontWeight: 'bold', color: '#0070f3' }}>NeuroLog</span>
        </p>
      </footer>
    </div>
  );
}
