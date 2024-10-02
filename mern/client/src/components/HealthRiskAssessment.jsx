// src/HealthRiskAssessment.jsx

import { useState } from 'react';
import * as snarkjs from 'snarkjs';

//@ts-ignore
import { poseidon } from 'circomlibjs'; // This import does not work directly, an ongoing issue on the Circomlib library repo


const HealthRiskAssessment = () => {
  // State for risk assessment inputs
  const [riskData, setRiskData] = useState({
    patientId: '',
    realRiskScore: '',
    minRisk: '',
    maxRisk: '',
  });

  // State for results
  const [encryptedRiskScore, setEncryptedRiskScore] = useState('');
  const [proofResult, setProofResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');

  // Function to handle changes in risk assessment inputs
  const handleRiskDataChange = (e) => {
    const { name, value } = e.target;
    setRiskData({
      ...riskData,
      [name]: value,
    });
  };

  // Function to generate Poseidon hash
  const generateEncryptedRiskScore = async (realRiskScore) => {
    // Poseidon expects inputs as BigInts
    const realRisk = BigInt(realRiskScore);
    const hash = poseidon([realRisk]);
    // Convert to hexadecimal string
    return hash.toString();
  };

  // Function to send data to the server
  const sendRiskAssessmentToServer = async (
    patientId,
    encryptedRiskScore,
    realRiskScore,
    minRisk,
    maxRisk
  ) => {
    try {
      const response = await fetch('/api/record/verify-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          encryptedRiskScore,
          realRiskScore,
          minRisk,
          maxRisk,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissionStatus('Risk assessment successfully saved to the database.');
        setVerificationResult(
          data.isValid ? 'Risk Score is within range!' : 'Risk Score is out of range!'
        );
      } else {
        const errorData = await response.json();
        setSubmissionStatus(`Failed to save risk assessment: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending risk assessment to server:', error);
      setSubmissionStatus('Error sending risk assessment to server.');
    }
  };

  // Main function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProofResult(null);
    setVerificationResult(null);
    setSubmissionStatus('');

    try {
      const { patientId, realRiskScore, minRisk, maxRisk } = riskData;

      // Step 1: Generate encryptedRiskScore using Poseidon hash
      const generatedEncryptedRiskScore = await generateEncryptedRiskScore(realRiskScore);
      setEncryptedRiskScore(generatedEncryptedRiskScore);

      const input = {
        encryptedRiskScore: `0x${generatedEncryptedRiskScore}`, // Ensure hex format
        realRiskScore: parseInt(realRiskScore, 10),
        minRisk: parseInt(minRisk, 10),
        maxRisk: parseInt(maxRisk, 10),
      };

      // Step 2: Fetch necessary circuit files
      const [wasmResponse, zkeyResponse, vKeyResponse] = await Promise.all([
        fetch('/circuit2.wasm'),
        fetch('/circuit2.zkey'),
        fetch('/verification_key2.json'),
      ]);

      if (!wasmResponse.ok || !zkeyResponse.ok || !vKeyResponse.ok) {
        throw new Error('Failed to fetch necessary circuit files.');
      }

      const [wasmBuffer, zkeyBuffer, vKey] = await Promise.all([
        wasmResponse.arrayBuffer(),
        zkeyResponse.arrayBuffer(),
        vKeyResponse.json(),
      ]);

      // Step 3: Generate proof
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        new Uint8Array(wasmBuffer),
        new Uint8Array(zkeyBuffer)
      );

      setProofResult(JSON.stringify(proof, null, 2));
      console.log('Proof generated:', proof);
      console.log('Public signals:', publicSignals);

      // Step 4: Verify proof
      const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

      setVerificationResult(isValid ? 'Verification OK' : 'Invalid proof');
      console.log(isValid ? 'Verification OK' : 'Invalid proof');

      // Step 5: Send data to the server
      await sendRiskAssessmentToServer(
        patientId,
        generatedEncryptedRiskScore,
        realRiskScore,
        minRisk,
        maxRisk
      );
    } catch (err) {
      console.error('Error running risk assessment:', err);
      setVerificationResult('Error running risk assessment.');
      setSubmissionStatus('Error running risk assessment.');
    }

    setIsLoading(false);
  };

  return (
    <div
      style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ textAlign: 'center', color: '#343a40' }}>Health Risk Assessment</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>
            Patient ID:
          </label>
          <input
            type="text"
            name="patientId"
            value={riskData.patientId}
            onChange={handleRiskDataChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
            }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>
            Real Risk Score:
          </label>
          <input
            type="number"
            name="realRiskScore"
            value={riskData.realRiskScore}
            onChange={handleRiskDataChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
            }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>
            Min Risk:
          </label>
          <input
            type="number"
            name="minRisk"
            value={riskData.minRisk}
            onChange={handleRiskDataChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
            }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#495057' }}>
            Max Risk:
          </label>
          <input
            type="number"
            name="maxRisk"
            value={riskData.maxRisk}
            onChange={handleRiskDataChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {isLoading ? 'Generating Proof...' : 'Generate Proof and Verify'}
        </button>
      </form>

      {encryptedRiskScore && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ color: '#343a40' }}>Generated Encrypted Risk Score</h2>
          <p style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px' }}>
            <strong>Encrypted Risk Score:</strong> {encryptedRiskScore}
          </p>
        </div>
      )}

      {proofResult && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ color: '#343a40' }}>Proof</h2>
          <pre
            style={{
              backgroundColor: '#e9ecef',
              padding: '10px',
              borderRadius: '4px',
              overflowX: 'auto',
            }}
          >
            {proofResult}
          </pre>
        </div>
      )}

      {verificationResult && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ color: '#343a40' }}>Verification Result</h2>
          <p
            style={{
              backgroundColor: verificationResult.includes('OK') ? '#d4edda' : '#f8d7da',
              color: verificationResult.includes('OK') ? '#155724' : '#721c24',
              padding: '10px',
              borderRadius: '4px',
            }}
          >
            {verificationResult}
          </p>
        </div>
      )}

      {submissionStatus && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ color: '#343a40' }}>Submission Status</h2>
          <p
            style={{
              backgroundColor: submissionStatus.includes('successfully') ? '#d4edda' : '#f8d7da',
              color: submissionStatus.includes('successfully') ? '#155724' : '#721c24',
              padding: '10px',
              borderRadius: '4px',
            }}
          >
            {submissionStatus}
          </p>
        </div>
      )}
    </div>
  );
};

export default HealthRiskAssessment;
