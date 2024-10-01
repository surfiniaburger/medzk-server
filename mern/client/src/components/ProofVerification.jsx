import { useState } from 'react';
import * as snarkjs from 'snarkjs';

const ProofVerification = () => {
    const [recordHash, setRecordHash] = useState('');
    const [criteriaHash, setCriteriaHash] = useState('');
    const [proofResult, setProofResult] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchFile = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}`);
        }
        return await response.arrayBuffer();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Step 1: Generate proof
            const input = {
                recordHash,
                criteriaHash
            };

            // Fetch necessary files
            const wasmBuffer = await fetchFile('/circuit.wasm');
            const zkeyBuffer = await fetchFile('/circuit_final.zkey');
            const vKeyResponse = await fetch('/verification_key.json');
            const vKey = await vKeyResponse.json();

            // Run the proof generation
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                new Uint8Array(wasmBuffer),
                new Uint8Array(zkeyBuffer)
            );

            setProofResult(JSON.stringify(proof, null, 2));
            console.log('Proof generated:', proof);
            console.log('Public signals:', publicSignals);

            // Step 2: Verify the proof
            const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

            setVerificationResult(isValid ? 'Verification OK' : 'Invalid proof');
            console.log(isValid ? 'Verification OK' : 'Invalid proof');
        } catch (err) {
            console.error('Error running proof verification:', err);
            setVerificationResult('Error running proof verification');
        }
        setIsLoading(false);
    };

    return (
        <div>
            <h1>Health Record Proof Verification</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Record Hash:</label>
                    <input
                        type="text"
                        value={recordHash}
                        onChange={(e) => setRecordHash(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Criteria Hash:</label>
                    <input
                        type="text"
                        value={criteriaHash}
                        onChange={(e) => setCriteriaHash(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Generating Proof...' : 'Generate Proof and Verify'}
                </button>
            </form>
            {proofResult && (
                <div>
                    <h2>Proof</h2>
                    <pre>{proofResult}</pre>
                </div>
            )}
            {verificationResult && (
                <div>
                    <h2>Verification Result</h2>
                    <p>{verificationResult}</p>
                </div>
            )}
        </div>
    );
};

export default ProofVerification;
