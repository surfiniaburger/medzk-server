import ProofVerification from "./components/ProofVerification";
import VideoUpload from "./components/VideoUpload";
import Vision from "./components/vision";

const App = () => {
  return (
    <div className="w-full p-6">
      <Vision/>
      <ProofVerification/>
      <VideoUpload/>
    </div>
  );
};

export default App;
