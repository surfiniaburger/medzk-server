import { useState } from 'react';
import './Vision.css'; // Assuming you have a separate CSS file for styling

const Vision = () => {
  const [patientId, setPatientId] = useState('');
  const [metadata, setMetadata] = useState('');
  const [images, setImages] = useState([]);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle image upload and preview
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prevImages) => [...prevImages, ...files]);
  };

  // Remove an image from the list (unstaging)
  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!patientId || images.length === 0) {
      alert("Patient ID and at least one image are required.");
      return;
    }
    
  
    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('metadata', JSON.stringify({ info: metadata }));
    
    // Append all images
    images.forEach((image) => {
      formData.append('images', image); // Use 'images' as the key for all uploaded files
    });
  
    try {
      setLoading(true);
  
      const response = await fetch('http://localhost:5050/record/image', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      setDiagnosticResult(data.diagnosticResult);
      alert("Record submitted successfully!");
  
      // Reset form
      setPatientId('');
      setMetadata('');
      setImages([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit the record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vision-container">
      <h2>Submit Medical Record</h2>
      <form onSubmit={handleSubmit} className="vision-form">
        <div className="form-group">
          <label>Patient ID:</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label>Metadata:</label>
          <textarea
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder="Additional information..."
            className="textarea-field"
          />
        </div>
        <div className="form-group">
          <label>Medical Images:</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="input-file"
          />
          {images.length > 0 && (
            <div className="image-preview-container">
              {images.map((image, index) => (
                <div key={index} className="image-preview">
                  <img src={URL.createObjectURL(image)} alt={`preview ${index}`} />
                  <button
                    type="button"
                    className="remove-image-button"
                    onClick={() => handleRemoveImage(index)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {diagnosticResult && (
        <div className="result-container">
          <h3>Diagnostic Result:</h3>
          <p>{diagnosticResult}</p>
        </div>
      )}
    </div>
  );
};

export default Vision;
