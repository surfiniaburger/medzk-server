/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom'; 
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider"
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { HeartPulse, ShieldCheck, Video, Camera, ArrowRight, BarChart3, Quote} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, to }) => (
  <Card className="group hover:shadow-2xl transition-all bg-green-900 text-white rounded-lg p-6">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Icon className="w-6 h-6 text-white" />
        <CardTitle className="text-white">{title}</CardTitle>
      </div>
      <CardDescription className="text-white/80">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Link to={to}>
        <Button className="bg-green-800 text-white group-hover:translate-x-1 transition-transform mt-4">
          Learn More <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </Link>
    </CardContent>
  </Card>
);

const App = () => {
  const features = [
    {
      icon: HeartPulse,
      title: "Pregnancy Predictions",
      description: "Receive insights and personalized predictions for your pregnancy journey.",
      to: "/predict"
    },
    {
      icon: Camera,
      title: "Image Analysis",
      description: "Analyze ultrasound images for health indicators and recommendations.",
      to: "/vision"
    },
    {
      icon: ShieldCheck,
      title: "Medical Proof Verification",
      description: "Securely upload and verify medical records with zero-knowledge proofs.",
      to: "/proof-verification"
    },
    {
      icon: Video,
      title: "Video Analysis",
      description: "Upload and process ultrasound videos for tailored medical insights.",
      to: "/video-upload"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Access detailed analytics on your health data.",
      to: "/analytics"
    },
   
  ];

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-900 to-black py-20">
        <div className="container mx-auto px-6 lg:px-8 text-center max-w-4xl border-y-slate-400  rounded-lg shadow-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-700 bg-clip-text text-transparent">
            Empowering Your Pregnancy with AI
          </h1>
          <p className="text-xl text-black max-w-2xl mx-auto mb-8">
            Get personalized predictions, secure record storage, and advanced analytics tailored for expecting mothers.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/predict">
              <Button size="lg" className="gap-2 bg-green-800 text-white">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/vision">
              <Button size="lg" variant="outline" className="gap-2 text-white border-green-400">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6 lg:px-8 max-w-5xl bg-green-900 rounded-lg shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-green-900">
            AI-Powered Features for Expecting Mothers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {features.map((feature) => (
              <FeatureCard key={feature.to} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-black py-20">
        <div className="container mx-auto px-6 lg:px-8 max-w-5xl bg-green-900 rounded-lg shadow-2xl text-center">
          <h2 className="text-3xl font-bold mb-12 text-green-900">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
            <div className="p-6 bg-green-900 rounded-lg shadow-2xl">
              <Quote className="w-6 h-6 text-green-400 mb-4" />
              <p className="text-lg mb-4 text-green-200">&quot;This platform made me feel so supported during my pregnancy. The predictions were accurate and the insights were extremely helpful!&quot;</p>
              <p className="font-bold text-green-400">- Sarah, Expecting Mother</p>
            </div>
            <div className="p-6 bg-green-900 rounded-lg shadow-2xl">
              <Quote className="w-6 h-6 text-green-400 mb-4" />
              <p className="text-lg mb-4 text-green-200">&quot;The image analysis feature helped me understand my ultrasound better. I felt more informed and at ease.&quot;</p>
              <p className="font-bold text-green-400">- Emily, First-time Mom</p>
            </div>
            <div className="p-6 bg-green-900 rounded-lg shadow-2xl">
              <Quote className="w-6 h-6 text-green-400 mb-4" />
              <p className="text-lg mb-4 text-green-200">&quot;I loved the secure record storage. Knowing my data is safe and private is invaluable.&quot;</p>
              <p className="font-bold text-green-400">- Anna, Expecting Mother</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6 lg:px-8 max-w-5xl bg-green-900 rounded-lg shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-green-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-green-900">How are my records stored?</h3>
              <p className="text-black">
                All your medical records are encrypted and stored in a secure database. Only you can access them using zero-knowledge proofs, ensuring privacy and security.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-green-900">What can I expect from the prediction feature?</h3>
              <p className="text-black">
                Our prediction feature provides tailored insights based on your medical data, giving you personalized health guidance during your pregnancy.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-green-900">Is my image data secure?</h3>
              <p className="text-black">
                Yes, all image and video records are encrypted before being stored. When analyzed, they are processed securely, and only the final insights are stored.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-green-900">How can I access advanced analytics?</h3>
              <p className="text-black">
                Advanced analytics are available in your dashboard, providing you with comprehensive data insights to track and monitor your pregnancy journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-900 py-20">
        <div className="container mx-auto px-6 lg:px-8 text-center max-w-4xl bg-green-900 rounded-lg shadow-2xl">
          <h2 className="text-3xl font-bold mb-6 text-green-900">
            Start Your AI-Powered Pregnancy Journey Today
          </h2>
          <p className="text-lg text-black max-w-2xl mx-auto mb-8">
            Join other expecting mothers who are using AI for secure health insights.
          </p>
          <Link to="/predict">
            <Button size="lg" className="gap-2 bg-green-800 text-white">
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-black">
        <div className="container mx-auto px-6 lg:px-8 text-center text-black">
          <p>© 2024 Zero Kare AI Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
    </ThemeProvider>
  );
};

export default App;