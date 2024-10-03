// src/ProofVerification.jsx

import { useState } from 'react';
import * as snarkjs from 'snarkjs';
import './ProofVerification.css'; // Import the CSS file

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

    const [recordData, setRecordData] = useState({
        name: '',
        age: '',
        bloodType: '',
        allergies: '',
        riskScore: ''
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
    const [submissionStatus, setSubmissionStatus] = useState('');

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

    const handleRecordDataChange = (e) => {
        const { name, value } = e.target;
        setRecordData({ ...recordData, [name]: value });
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

    // Function to send data to the server
    const sendDataToServer = async (patientId, recordHash, criteriaHash, verificationKeyHash, recordData) => {
        try {
            const response = await fetch('http://localhost:5050/record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientId,
                    recordHash,
                    criteriaHash,
                    verificationKeyHash, 
                    recordData
                }),
            });

            if (response.ok) {
                setSubmissionStatus('Record successfully saved to the database.');
            } else {
                const errorData = await response.json();
                setSubmissionStatus(`Failed to save record: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error sending data to server:', error);
            setSubmissionStatus('Error sending data to server.');
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
            const { proof} = await snarkjs.groth16.fullProve(
                input,
                new Uint8Array(wasmBuffer),
                new Uint8Array(zkeyBuffer)
            );

            setProofResult(JSON.stringify(proof, null, 2));
            

           // Step 4: Hash the verification key and send data to server
        const verificationKeyHash = await generateHash(vKey);

        // Send data to the server (remove proof)
        await sendDataToServer(medicalReport.patientId, generatedRecordHash, generatedCriteriaHash, verificationKeyHash, recordData);
        } catch (err) {
            console.error('Error running proof verification:', err);
            setVerificationResult('Error running proof verification.');
            setSubmissionStatus('Error running proof verification.');
        }

        setIsLoading(false);
    };

    return (
        <div className="container">
            <h1>Health Record Proof Verification</h1>
            <form onSubmit={handleSubmit} className="form">
                <h2>Medical Report</h2>

                <div className="form-group">
    <label>Name:</label>
    <input
        type="text"
        name="name"
        value={recordData.name}
        onChange={handleRecordDataChange}
        required
        placeholder="Enter name"
    />
</div>
<div className="form-group">
    <label>Age:</label>
    <input
        type="number"
        name="age"
        value={recordData.age}
        onChange={handleRecordDataChange}
        required
        placeholder="Enter age"
    />
</div>
<div className="form-group">
    <label>Blood Type:</label>
    <input
        type="text"
        name="bloodType"
        value={recordData.bloodType}
        onChange={handleRecordDataChange}
        required
        placeholder="Enter blood type"
    />
</div>
<div className="form-group">
    <label>Allergies (comma-separated):</label>
    <input
        type="text"
        name="allergies"
        value={recordData.allergies}
        onChange={handleRecordDataChange}
        required
        placeholder="Enter allergies"
    />
</div>
<div className="form-group">
    <label>Risk Score:</label>
    <input
        type="number"
        name="riskScore"
        value={recordData.riskScore}
        onChange={handleRecordDataChange}
        required
        placeholder="Enter risk score"
    />
</div>
                <div className="form-group">
                    <label>Patient ID:</label>
                    <input
                        type="text"
                        name="patientId"
                        value={medicalReport.patientId}
                        onChange={handleMedicalReportChange}
                        required
                        placeholder="Enter Patient ID"
                    />
                </div>
                <div className="form-group">
                    <label>Date of Visit:</label>
                    <input
                        type="date"
                        name="dateOfVisit"
                        value={medicalReport.dateOfVisit}
                        onChange={handleMedicalReportChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Diagnosis:</label>
                    <input
                        type="text"
                        name="diagnosis"
                        value={medicalReport.diagnosis}
                        onChange={handleMedicalReportChange}
                        required
                        placeholder="Enter Diagnosis"
                    />
                </div>
                <div className="form-group">
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
                            placeholder={`Medication ${index + 1}`}
                        />
                    ))}
                    <button type="button" onClick={addMedication} className="add-button">Add Medication</button>
                </div>
                <div className="form-group">
                    <label>Test Results:</label>
                    <div className="nested-group">
                        <label>Blood Pressure:</label>
                        <input
                            type="text"
                            name="testResults.bloodPressure"
                            value={medicalReport.testResults.bloodPressure}
                            onChange={handleMedicalReportChange}
                            required
                            placeholder="e.g., 140/90"
                        />
                    </div>
                    <div className="nested-group">
                        <label>Cholesterol Level:</label>
                        <input
                            type="text"
                            name="testResults.cholesterolLevel"
                            value={medicalReport.testResults.cholesterolLevel}
                            onChange={handleMedicalReportChange}
                            required
                            placeholder="e.g., 200 mg/dL"
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Doctor ID:</label>
                    <input
                        type="text"
                        name="doctorId"
                        value={medicalReport.doctorId}
                        onChange={handleMedicalReportChange}
                        required
                        placeholder="Enter Doctor ID"
                    />
                </div>

                <h2>Criteria</h2>
                <div className="form-group">
                    <label>Required Diagnosis:</label>
                    <input
                        type="text"
                        name="requiredDiagnosis"
                        value={criteria.requiredDiagnosis}
                        onChange={handleCriteriaChange}
                        required
                        placeholder="Enter Required Diagnosis"
                    />
                </div>
                <div className="form-group">
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
                            placeholder={`Required Medication ${index + 1}`}
                        />
                    ))}
                    <button type="button" onClick={addRequiredMedication} className="add-button">Add Required Medication</button>
                </div>
                <div className="form-group">
                    <label>Test Thresholds:</label>
                    <div className="nested-group">
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
                <button type="submit" disabled={isLoading} className="submit-button">
                    {isLoading ? 'Generating Proof...' : 'Generate Proof and Verify'}
                </button>
            </form>

            {recordHash && criteriaHash && (
                <div className="result-section">
                    <h2>Generated Hashes</h2>
                    <p><strong>Record Hash:</strong> {recordHash}</p>
                    <p><strong>Criteria Hash:</strong> {criteriaHash}</p>
                </div>
            )}

            {proofResult && (
                <div className="result-section">
                    <h2>Proof</h2>
                    <pre>{proofResult}</pre>
                </div>
            )}

            {verificationResult && (
                <div className="result-section">
                    <h2>Verification Result</h2>
                    <p>{verificationResult}</p>
                </div>
            )}

            {submissionStatus && (
                <div className="result-section">
                    <h2>Submission Status</h2>
                    <p>{submissionStatus}</p>
                </div>
            )}
        </div>
    );

};

export default ProofVerification;
