import { useState } from 'react';
import './RecordRetrieval.css'; // Import your CSS for styling

const RecordRetrieval = () => {
  const [inputs, setInputs] = useState({
    patientId: '',
    verificationKey: '',  // Treat as a plain string 
  });
  const [decryptedData, setDecryptedData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value,
    });
  };

  const handleRetrieve = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setDecryptedData(null);
    setVerificationStatus('');
    setError('');

    console.log("Starting record retrieval...");

    try {
      console.log("Fetching data with patientId:", inputs.patientId, "and verificationKey:", inputs.verificationKey);
      const response = await fetch(`http://localhost:5050/record/retrieve?patientId=${encodeURIComponent(inputs.patientId)}&verification_key=${encodeURIComponent(inputs.verificationKey)}`);


      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response received:", errorData);
        throw new Error(errorData.error || 'Failed to retrieve record');
      }

      const data = await response.json();
      console.log("Record retrieved successfully:", data);

      setDecryptedData(data.decryptedData);
      setVerificationStatus(data.isValid ? 'Verification Successful' : 'Verification Failed');
    } catch (err) {
      console.error("Error during retrieval:", err);
      setError(err.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="retrieval-container">
      <h2>Retrieve and Verify Record</h2>
      <form onSubmit={handleRetrieve} className="retrieval-form">
        <div className="form-group">
          <label>Patient ID:</label>
          <input
            type="text"
            name="patientId"
            value={inputs.patientId}
            onChange={handleChange}
            required
            placeholder="Enter Patient ID"
          />
        </div>
        <div className="form-group">
          <label>Verification Key (String):</label>
          <textarea
            name="verificationKey"
            value={inputs.verificationKey}
            onChange={handleChange}
            required
            placeholder="Enter Verification Key here"
            rows="5"
          />
        </div>
        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? 'Retrieving...' : 'Retrieve Record'}
        </button>
      </form>

      {verificationStatus && (
        <div className={`status ${verificationStatus === 'Verification Successful' ? 'success' : 'failure'}`}>
          <p>{verificationStatus}</p>
        </div>
      )}

      {decryptedData && (
        <div className="decrypted-data">
          <h3>Decrypted Data:</h3>
          <pre>{JSON.stringify(decryptedData, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default RecordRetrieval;
