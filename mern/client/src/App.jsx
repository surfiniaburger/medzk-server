/* eslint-disable react/prop-types */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { HeartPulse, ShieldCheck, Video, Camera, ArrowRight, BarChart3, Quote } from 'lucide-react';
import Navbar from "./components/Navbar";
import grootBg from './assets/groot.jpg';

// Animated feature card component
const FeatureCard = ({ icon: Icon, title, description, to, index }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="group hover:shadow-2xl transition-all bg-green-900 text-white rounded-lg p-6 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-green-800 to-green-900"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-6 h-6 text-white" />
            </motion.div>
            <CardTitle className="text-white">{title}</CardTitle>
          </div>
          <CardDescription className="text-white/80">{description}</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <Link to={to}>
            <Button className="bg-green-800 text-white group-hover:translate-x-1 transition-transform mt-4 w-full flex items-center justify-center gap-2">
              <motion.span
                className="flex items-center"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                Learn More <ArrowRight className="ml-2 w-4 h-4" />
              </motion.span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Animated testimonial card
const TestimonialCard = ({ quote, author, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    whileHover={{ y: -10 }}
    className="p-6 bg-green-900 rounded-lg shadow-2xl"
  >
    <motion.div
      initial={{ rotate: 0 }}
      whileHover={{ rotate: 15 }}
    >
      <Quote className="w-6 h-6 text-green-400 mb-4" />
    </motion.div>
    <p className="text-lg mb-4 text-green-200">{quote}</p>
    <p className="font-bold text-green-400">{author}</p>
  </motion.div>
);

const App = () => {
  const { scrollYProgress } = useScroll();
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const springProgress = useSpring(scaleProgress, { stiffness: 100, damping: 30 });

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
    <>
   
    <Navbar/>

<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-black text-white relative">
      
        
        {/* Progress indicator */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-green-500 origin-left z-50"
          style={{ scaleX: scrollYProgress }}
        />

                  {/* Hero Section with Background Image */}
                  <motion.section 
            className="relative min-h-screen flex items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url(${grootBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-60 z-10" />
            
            {/* Gradient Overlay */}
            <motion.div
              className="absolute inset-0 z-20"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(34,197,94,0.3) 0%, transparent 80%)",
                scale: springProgress
              }}
            />

            {/* Content */}
            <motion.div 
              className="container mx-auto px-6 lg:px-8 text-center max-w-4xl relative z-30"
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-green-700 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ["0%", "100%"],
                transition: { 
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }
              }}
            >
              Empowering Your Pregnancy with AI
            </motion.h1>
            <motion.p 
              className="text-xl text-black max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Get personalized predictions, secure record storage, and advanced analytics tailored for expecting mothers.
            </motion.p>
            <motion.div 
              className="flex gap-4 justify-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Link to="/predict">
                <Button size="lg" className="gap-2 bg-green-800 text-white">
                  <motion.span
                    whileHover={{ x: 5 }}
                    className="flex items-center"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </motion.span>
                </Button>
              </Link>
              <Link to="/vision">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 text-white border-green-400"
                >
                  Explore Features
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <section className="py-20 bg-black">
          <div className="container mx-auto px-6 lg:px-8 max-w-5xl bg-green-900 rounded-lg shadow-2xl">
            <motion.h2 
              className="text-3xl font-bold text-center mb-12 text-green-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              AI-Powered Features for Expecting Mothers
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {features.map((feature, index) => (
                <FeatureCard key={feature.to} {...feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-black py-20">
          <div className="container mx-auto px-6 lg:px-8 max-w-5xl bg-green-900 rounded-lg shadow-2xl text-center">
            <motion.h2 
              className="text-3xl font-bold mb-12 text-green-900"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              What Our Users Say
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
              <TestimonialCard 
                quote="This platform made me feel so supported during my pregnancy. The predictions were accurate and the insights were extremely helpful!"
                author="Sarah, Expecting Mother"
                delay={0}
              />
              <TestimonialCard 
                quote="The image analysis feature helped me understand my ultrasound better. I felt more informed and at ease."
                author="Emily, First-time Mom"
                delay={0.2}
              />
              <TestimonialCard 
                quote="I loved the secure record storage. Knowing my data is safe and private is invaluable."
                author="Anna, Expecting Mother"
                delay={0.4}
              />
            </div>
          </div>
        </section>

        {/* FAQ Section with stagger animation */}
        <motion.section className="py-20 bg-black">
          <div className="container mx-auto px-6 lg:px-8 max-w-5xl bg-green-900 rounded-lg shadow-2xl">
            <motion.h2 
              className="text-3xl font-bold text-center mb-12 text-green-900"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              How It Works
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
              {[
                {
                  title: "How are my records stored?",
                  content: "All your medical records are encrypted and stored in a secure database. Only you can access them using zero-knowledge proofs, ensuring privacy and security."
                },
                {
                  title: "What can I expect from the prediction feature?",
                  content: "Our prediction feature provides tailored insights based on your medical data, giving you personalized health guidance during your pregnancy."
                },
                {
                  title: "Is my image data secure?",
                  content: "Yes, all image and video records are encrypted before being stored. When analyzed, they are processed securely, and only the final insights are stored."
                },
                {
                  title: "How can I access advanced analytics?",
                  content: "Advanced analytics are available in your dashboard, providing you with comprehensive data insights to track and monitor your pregnancy journey."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-xl font-semibold mb-2 text-green-900">{faq.title}</h3>
                  <p className="text-black">{faq.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="bg-green-900 py-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-6 lg:px-8 text-center max-w-4xl bg-green-900 rounded-lg shadow-2xl">
            <motion.h2 
              className="text-3xl font-bold mb-6 text-green-900"
              initial={{ scale: 0.8 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
            >
              Start Your AI-Powered Pregnancy Journey Today
            </motion.h2>
            <motion.p 
              className="text-lg text-black max-w-2xl mx-auto mb-8"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              Join other expecting mothers who are using AI for secure health insights.
            </motion.p>
            <Link to="/predict">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="gap-2 bg-green-800 text-white">
                  Get Started Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t py-8 bg-black">
          <motion.div 
            className="container mx-auto px-6 lg:px-8 text-center text-black"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p>© 2024 Zero Kare AI Solutions. All rights reserved.</p>
          </motion.div>
        </footer>
      </div>
    </ThemeProvider>
    </>
    
  );
};

export default App;