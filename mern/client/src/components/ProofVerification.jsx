// ProofVerification.jsx

import { useState } from 'react';
import * as snarkjs from 'snarkjs';

const ProofVerification = () => {
    // State for medical report inputs
    const [medicalReport, setMedicalReport] = useState({
        patientId: '',
        dateOfVisit: '',
        diagnosis: '',
        prescribedMedications: [''],
        testResults: { bloodPressure: '', cholesterolLevel: '' },
        doctorId: ''
    });

    // State for criteria inputs
    const [criteria, setCriteria] = useState({
        requiredDiagnosis: '',
        requiredMedications: [''],
        testThresholds: { bloodPressure: '' }
    });

    // State for results
    const [recordHash, setRecordHash] = useState('');
    const [criteriaHash, setCriteriaHash] = useState('');
    const [proofResult, setProofResult] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Function to handle changes in medical report inputs
    const handleMedicalReportChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('prescribedMedications')) {
            const index = parseInt(e.target.dataset.index, 10);
            const newMedications = [...medicalReport.prescribedMedications];
            newMedications[index] = value;
            setMedicalReport({ ...medicalReport, prescribedMedications: newMedications });
        } else if (name.startsWith('testResults')) {
            const field = name.split('.')[1];
            setMedicalReport({
                ...medicalReport,
                testResults: { ...medicalReport.testResults, [field]: value }
            });
        } else {
            setMedicalReport({ ...medicalReport, [name]: value });
        }
    };

    // Function to handle changes in criteria inputs
    const handleCriteriaChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('requiredMedications')) {
            const index = parseInt(e.target.dataset.index, 10);
            const newMedications = [...criteria.requiredMedications];
            newMedications[index] = value;
            setCriteria({ ...criteria, requiredMedications: newMedications });
        } else if (name.startsWith('testThresholds')) {
            const field = name.split('.')[1];
            setCriteria({
                ...criteria,
                testThresholds: { ...criteria.testThresholds, [field]: value }
            });
        } else {
            setCriteria({ ...criteria, [name]: value });
        }
    };

    // Function to add a new medication field in medical report
    const addMedication = () => {
        setMedicalReport({
            ...medicalReport,
            prescribedMedications: [...medicalReport.prescribedMedications, '']
        });
    };

    // Function to add a new required medication field in criteria
    const addRequiredMedication = () => {
        setCriteria({
            ...criteria,
            requiredMedications: [...criteria.requiredMedications, '']
        });
    };

    // Function to generate SHA-256 hash
    const generateHash = async (data) => {
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(JSON.stringify(data));
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    // Function to fetch files from public directory
    const fetchFile = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}`);
        }
        return await response.arrayBuffer();
    };

    // Main function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setProofResult(null);
        setVerificationResult(null);

        try {
            // Step 1: Generate hashes
            const generatedRecordHash = await generateHash(medicalReport);
            const generatedCriteriaHash = await generateHash(criteria);
            setRecordHash(generatedRecordHash);
            setCriteriaHash(generatedCriteriaHash);

            const input = {
                recordHash: `0x${generatedRecordHash}`,
                criteriaHash: `0x${generatedCriteriaHash}`
            };

            // Step 2: Fetch necessary files
            const wasmBuffer = await fetchFile('/circuit.wasm');
            const zkeyBuffer = await fetchFile('/circuit_final.zkey');
            const vKeyResponse = await fetch('/verification_key.json');
            const vKey = await vKeyResponse.json();

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
        } catch (err) {
            console.error('Error running proof verification:', err);
            setVerificationResult('Error running proof verification.');
        }

        setIsLoading(false);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Health Record Proof Verification</h1>
            <form onSubmit={handleSubmit}>
                <h2>Medical Report</h2>
                <div>
                    <label>Patient ID:</label>
                    <input
                        type="text"
                        name="patientId"
                        value={medicalReport.patientId}
                        onChange={handleMedicalReportChange}
                        required
                    />
                </div>
                <div>
                    <label>Date of Visit:</label>
                    <input
                        type="date"
                        name="dateOfVisit"
                        value={medicalReport.dateOfVisit}
                        onChange={handleMedicalReportChange}
                        required
                    />
                </div>
                <div>
                    <label>Diagnosis:</label>
                    <input
                        type="text"
                        name="diagnosis"
                        value={medicalReport.diagnosis}
                        onChange={handleMedicalReportChange}
                        required
                    />
                </div>
                <div>
                    <label>Prescribed Medications:</label>
                    {medicalReport.prescribedMedications.map((med, index) => (
                        <input
                            key={index}
                            type="text"
                            name="prescribedMedications"
                            data-index={index}
                            value={med}
                            onChange={handleMedicalReportChange}
                            required
                        />
                    ))}
                    <button type="button" onClick={addMedication}>Add Medication</button>
                </div>
                <div>
                    <label>Test Results:</label>
                    <div>
                        <label>Blood Pressure:</label>
                        <input
                            type="text"
                            name="testResults.bloodPressure"
                            value={medicalReport.testResults.bloodPressure}
                            onChange={handleMedicalReportChange}
                            required
                        />
                    </div>
                    <div>
                        <label>Cholesterol Level:</label>
                        <input
                            type="text"
                            name="testResults.cholesterolLevel"
                            value={medicalReport.testResults.cholesterolLevel}
                            onChange={handleMedicalReportChange}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label>Doctor ID:</label>
                    <input
                        type="text"
                        name="doctorId"
                        value={medicalReport.doctorId}
                        onChange={handleMedicalReportChange}
                        required
                    />
                </div>

                <h2>Criteria</h2>
                <div>
                    <label>Required Diagnosis:</label>
                    <input
                        type="text"
                        name="requiredDiagnosis"
                        value={criteria.requiredDiagnosis}
                        onChange={handleCriteriaChange}
                        required
                    />
                </div>
                <div>
                    <label>Required Medications:</label>
                    {criteria.requiredMedications.map((med, index) => (
                        <input
                            key={index}
                            type="text"
                            name="requiredMedications"
                            data-index={index}
                            value={med}
                            onChange={handleCriteriaChange}
                            required
                        />
                    ))}
                    <button type="button" onClick={addRequiredMedication}>Add Required Medication</button>
                </div>
                <div>
                    <label>Test Thresholds:</label>
                    <div>
                        <label>Blood Pressure:</label>
                        <input
                            type="text"
                            name="testThresholds.bloodPressure"
                            value={criteria.testThresholds.bloodPressure}
                            onChange={handleCriteriaChange}
                            placeholder="e.g., below 140/90"
                            required
                        />
                    </div>
                </div>
                <button type="submit" disabled={isLoading} style={{ marginTop: '20px' }}>
                    {isLoading ? 'Generating Proof...' : 'Generate Proof and Verify'}
                </button>
            </form>

            {recordHash && criteriaHash && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Generated Hashes</h2>
                    <p><strong>Record Hash:</strong> {recordHash}</p>
                    <p><strong>Criteria Hash:</strong> {criteriaHash}</p>
                </div>
            )}

            {proofResult && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Proof</h2>
                    <pre>{proofResult}</pre>
                </div>
            )}

            {verificationResult && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Verification Result</h2>
                    <p>{verificationResult}</p>
                </div>
            )}
        </div>
    );

};

export default ProofVerification;
