import { useState } from "react";
import { IoDocumentsSharp } from "react-icons/io5";
import { FaRobot, FaGithub } from "react-icons/fa"; // Added FaGithub
import { AiFillThunderbolt } from "react-icons/ai";

const IntroPage = ({ onStart }) => {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      icon: <IoDocumentsSharp color="white" />,
      title: "Upload PDFs",
      description: "Drag & drop or click to upload your documents instantly"
    },
    {
      icon: <FaRobot color="white" />,
      title: "AI-Powered Chat",
      description: "Advanced natural language understanding for accurate answers"
    },
    {
      icon: <AiFillThunderbolt color="white" />,
      title: "Instant Results",
      description: "Get precise answers from your documents in seconds"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* HEADER SECTION */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="text-xl font-bold text-white tracking-tight">DocuSleuth</span>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl w-full mt-16"> {/* Added mt-16 to clear header */}
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block mb-6">
            <div className="text-5xl mb-4 animate-bounce-slow">📚</div>
            <h1 className="flex flex-wrap justify-center text-4xl md:text-7xl font-extrabold text-white mb-4 drop-shadow-2xl">
              DocuSleuth - 
              <span className="text-gray-300 ml-2">
                An AI Assistant
              </span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-white/95 mb-3 font-medium">
            Transform your documents into conversations
          </p>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            Upload PDFs and ask questions in natural language. Get instant, intelligent answers powered by AI.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 px-4">
          {features.map((feature, index) => (
            <div
              key={index}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`bg-white/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/30 transition-all duration-300 cursor-pointer ${
                hoveredFeature === index
                  ? "bg-white/30 scale-105 shadow-2xl shadow-white/20"
                  : "hover:bg-white/25"
              }`}
            >
              <div className={`text-5xl mb-4 transition-transform duration-300 ${
                hoveredFeature === index ? "scale-110 rotate-6" : ""
              }`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/90 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {/* CTA Section */}
        <div className="text-center mb-8">
          <button
            onClick={onStart}
            className="group relative px-10 py-4 bg-white text-purple-600 font-bold text-lg rounded-full shadow-2xl hover:shadow-white/30 transition-all duration-300 hover:scale-110 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Get Started
              <span className="text-2xl group-hover:translate-x-1 transition-transform duration-300">🚀</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 hover:border-white transition-opacity duration-300"></div>
          </button>
          <p className="text-sm mt-4 font-bold text-gray-800">
            No sign-up required • Start in seconds
          </p>
        </div>

        {/* How It Works Section */}
        <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 md:p-10 border-2 border-white/30 mb-6 mx-4">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Upload", desc: "Select your PDF document from your device" },
              { num: "2", title: "Ask", desc: "Type your questions in natural language" },
              { num: "3", title: "Learn", desc: "Receive accurate, instant answers" }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-purple-600 text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {step.num}
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-24 h-0.5 bg-white/40 transform -translate-y-1/2"></div>
                  )}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-white/80 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default IntroPage;