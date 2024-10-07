// import { Outlet } from "react-router-dom";
// import Navbar from "./components/Navbar";
//import HealthRiskAssessment from "./components/HealthRiskAssessment";
import ProofVerification from "./components/ProofVerification";
import VideoUpload from "./components/VideoUpload";
import Vision from "./components/vision";


const App = () => {
  return (
    <div className="w-full p-6">
      
<ProofVerification/>
<Vision/>
<VideoUpload/>



    </div>
  );
};
export default App;
