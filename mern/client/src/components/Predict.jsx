import { useState } from 'react';
import axios from 'axios';
function PredictForm() {
  const [patientId, setPatientId] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [predictionResult, setPredictionResults] = useState(null);
  const [sdohInsights, setSdohInsights] = useState([]);
  const [geminiInsights, setGeminiInsights] = useState(null);

  const handleImageUpload = async (event) => {
    const formData = new FormData();
    for (let i = 0; i < event.target.files.length; i++) {
      formData.append('images', event.target.files[i]);
    }
    formData.append('patientId', patientId);

    try {
      const response = await axios.post('http://localhost:5050/record/upload/image', formData);
      setUploadedImageUrls(response.data.uploadedImageUrls);
      setSdohInsights(response.data.sdohInsights);
      setGeminiInsights(response.data.geminiInsights)
    } catch (error) {
      console.error('Error uploading images:', error);
      // Handle error (e.g., display error message to the user)
    }
  };

  

  const handleVideoUpload = async (event) => {
    const formData = new FormData();
    formData.append('video', event.target.files[0]);
    formData.append('patientId', patientId);

    try {
      const response = await axios.post('http://localhost:5050/record/upload/video', formData);
      setUploadedVideoUrl(response.data.uploadedVideoUrl);
      setGeminiAnalysis(response.data.geminiAnalysis)
    } catch (error) {
      console.error('Error uploading video:', error);
      // Handle error
    }
  };

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

  const handlePredict = async () => {
    try {
      const response = await axios.post('http://localhost:5050/record/predict', {
        patientId,
        uploadedImageUrls,
        uploadedVideoUrl,
        medicalHistory,
        sdohInsights,
        geminiInsights,
        geminiAnalysis

      });
      setPredictionResults(response.data);
      setIsLoading()
    } catch (error) {
      console.error('Error getting prediction:', error);
      // Handle error
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
      <form onSubmit={handlePredict} className="space-y-4">
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
            multiple
            accept="image/*"
            onChange={handleImageUpload}
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
            onChange={handleVideoUpload}
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