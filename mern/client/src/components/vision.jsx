import { useState } from 'react';


const Vision = () => {
  const [patientId, setPatientId] = useState('');
  const [metadata, setMetadata] = useState('');
  const [image, setImage] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!patientId || !image) {
      alert("Patient ID and Image are required.");
      return;
    }
  
    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('metadata', JSON.stringify({ info: metadata }));
    formData.append('image', image);
  
    try {
      setLoading(true);
  
      // Send form data to the server without setting 'Content-Type'
      const response = await fetch('http://localhost:5050/record/image', {
        method: 'POST',
        body: formData, // Send FormData directly
      });
  
      // Check if the response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      // Parse JSON response
      const data = await response.json();
      
      setDiagnosticResult(data.diagnosticResult);
      alert("Record submitted successfully!");
  
      // Reset form
      setPatientId('');
      setMetadata('');
      setImage(null);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit the record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Submit Medical Record</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Patient ID:</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Metadata:</label>
          <textarea
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder="Additional information..."
          />
        </div>
        <div>
          <label>Medical Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {diagnosticResult && (
        <div>
          <h3>Diagnostic Result:</h3>
          <p>{diagnosticResult}</p>
        </div>
      )}
    </div>
  );
};

export default Vision;
