import { useState } from 'react';

function PredictForm() {
  const [patientId, setPatientId] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'patientId') {
      setPatientId(value);
    } else if (name === 'medicalHistory') {
      setMedicalHistory(value);
    }
    // Clear any previous errors when user makes changes
    setError(null);
  };

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    const file = files[0];
    
    if (file) {
      // Validate file size
      if (file.size > 50 * 1024 * 1024) { // 50MB
        setError(`${name} file is too large. Maximum size is 50MB.`);
        event.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file type
      if (name === 'images' && !file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        event.target.value = '';
        return;
      }
      if (name === 'video' && !file.type.startsWith('video/')) {
        setError('Please select a valid video file.');
        event.target.value = '';
        return;
      }
    }
    
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('patientId', patientId);
      formData.append('medicalHistory', medicalHistory);

      const imageInput = document.getElementById('imageUpload');
      const videoInput = document.getElementById('videoUpload');

      if (imageInput.files[0]) {
        formData.append('images', imageInput.files[0]);
      }
      if (videoInput.files[0]) {
        formData.append('video', videoInput.files[0]);
      }

      const response = await fetch('http://localhost:5050/record/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }

      setPredictionResult(data);
      
    } catch (error) {
      console.error('Error making prediction:', error);
      setError(error.message || 'An error occurred while making the prediction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Predict</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="patientId" className="block mb-1">Patient ID:</label>
          <input
            type="text"
            id="patientId"
            name="patientId"
            value={patientId}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="medicalHistory" className="block mb-1">Medical History:</label>
          <textarea
            id="medicalHistory"
            name="medicalHistory"
            value={medicalHistory}
            onChange={handleInputChange}
            className="w-full p-2 border rounded h-32"
          />
        </div>
        <div>
          <label htmlFor="imageUpload" className="block mb-1">Upload Image:</label>
          <input
            type="file"
            id="imageUpload"
            name="images"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="videoUpload" className="block mb-1">Upload Video:</label>
          <input
            type="file"
            id="videoUpload"
            name="video"
            accept="video/*"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? 'Processing...' : 'Get Prediction'}
        </button>
      </form>

      {predictionResult && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-2">Prediction Results:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(predictionResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default PredictForm;