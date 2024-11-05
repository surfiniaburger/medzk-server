import { useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const PredictForm = () => {
  const [patientId, setPatientId] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [predictionResult, setPredictionResults] = useState(null);
  const [sdohInsights, setSdohInsights] = useState([]);
  const [geminiInsights, setGeminiInsights] = useState(null);
  
  // Enhanced loading states
  const [processingStates, setProcessingStates] = useState({
    images: false,
    video: false,
    prediction: false
  });
  
  const [completedSteps, setCompletedSteps] = useState({
    images: false,
    video: false,
    prediction: false
  });

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    setProcessingStates(prev => ({ ...prev, images: true }));
    setError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    formData.append('patientId', patientId);

    try {
      const response = await axios.post('http://localhost:5050/record/upload/image', formData);
      setUploadedImageUrls(response.data.uploadedImageUrls);
      setSdohInsights(response.data.sdohInsights);
      setGeminiInsights(response.data.geminiInsights);
      setCompletedSteps(prev => ({ ...prev, images: true }));
    } catch (err) {
      setError(`Error uploading images: ${err.message}`);
    } finally {
      setProcessingStates(prev => ({ ...prev, images: false }));
    }
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessingStates(prev => ({ ...prev, video: true }));
    setError(null);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('patientId', patientId);

    try {
      const response = await axios.post('http://localhost:5050/record/upload/video', formData);
      setUploadedVideoUrl(response.data.uploadedVideoUrl);
      setGeminiAnalysis(response.data.geminiAnalysis);
      setCompletedSteps(prev => ({ ...prev, video: true }));
    } catch (err) {
      setError(`Error uploading video: ${err.message}`);
    } finally {
      setProcessingStates(prev => ({ ...prev, video: false }));
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'patientId') {
      setPatientId(value);
    } else if (name === 'medicalHistory') {
      setMedicalHistory(value);
    }
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!patientId) {
      setError('Patient ID is required');
      return;
    }

    setProcessingStates(prev => ({ ...prev, prediction: true }));
    setError(null);

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
      setCompletedSteps(prev => ({ ...prev, prediction: true }));
    } catch (err) {
      setError(`Error getting prediction: ${err.message}`);
    } finally {
      setProcessingStates(prev => ({ ...prev, prediction: false }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">Medical Prediction Form</h2>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="patientId" className="block text-sm font-medium mb-1">
              Patient ID
            </label>
            <input
              type="text"
              id="patientId"
              name="patientId"
              value={patientId}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="medicalHistory" className="block text-sm font-medium mb-1">
              Medical History
            </label>
            <textarea
              id="medicalHistory"
              name="medicalHistory"
              value={medicalHistory}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md h-32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Images {processingStates.images && <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />}
              {completedSteps.images && <span className="text-green-500 ml-2">✓</span>}
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full"
              disabled={processingStates.images}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Video {processingStates.video && <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />}
              {completedSteps.video && <span className="text-green-500 ml-2">✓</span>}
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="w-full"
              disabled={processingStates.video}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={processingStates.prediction || processingStates.images || processingStates.video}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {processingStates.prediction ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Prediction...
            </span>
          ) : (
            'Get Prediction'
          )}
        </button>
      </form>

      {predictionResult && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Prediction Results</h3>
          <pre className="bg-white p-4 rounded-md overflow-auto">
            {JSON.stringify(predictionResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <h4 className="font-medium">Processing Status:</h4>
        <ul className="list-none space-y-1">
          <li className="flex items-center">
            <span className={`mr-2 ${completedSteps.images ? 'text-green-500' : 'text-gray-500'}`}>
              {completedSteps.images ? '✓' : '○'}
            </span>
            Image Processing {processingStates.images && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </li>
          <li className="flex items-center">
            <span className={`mr-2 ${completedSteps.video ? 'text-green-500' : 'text-gray-500'}`}>
              {completedSteps.video ? '✓' : '○'}
            </span>
            Video Processing {processingStates.video && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </li>
          <li className="flex items-center">
            <span className={`mr-2 ${completedSteps.prediction ? 'text-green-500' : 'text-gray-500'}`}>
              {completedSteps.prediction ? '✓' : '○'}
            </span>
            Prediction {processingStates.prediction && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PredictForm;