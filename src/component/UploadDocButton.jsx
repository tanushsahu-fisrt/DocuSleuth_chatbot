import { useState } from "react";
import { RiUploadCloud2Fill } from "react-icons/ri";
import { RiLockStarFill } from "react-icons/ri";
import { IoDocumentLockSharp } from "react-icons/io5";
import { AiFillThunderbolt } from "react-icons/ai";


const UploadDocButton = ({
  setFile,
  setIsFileUploaded,
  setFileName,
  fileName,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = (uploadedFile) => {
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    const formdata = new FormData();
    formdata.append("file", uploadedFile);

    fetch("http://localhost:8000/api/upload", {
      method: "POST",
      body: formdata,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("File uploaded successfully:", data.collection);
        sessionStorage.setItem("collection", data.collection);
        setUploadProgress(100);
        setTimeout(() => {
          setIsFileUploaded(true);
          setIsUploading(false);
        }, 500);
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
        setIsUploading(false);
        setUploadProgress(0);
      });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      handleFileUpload(droppedFile);
    }
  };

  const handleFileInput = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      handleFileUpload(uploadedFile);
    }
  };

  const cardsInfo = [
          { icon: <IoDocumentLockSharp color="white"/>, title: "PDF Only", desc: "Clear, readable PDFs work best" },
          { icon: <RiLockStarFill color="white"/>, title: "Secure", desc: "Your documents are processed safely" },
          { icon: <AiFillThunderbolt color="white"/>, title: "Fast", desc: "Processing takes just seconds" }
        ]

  return (
    <div className="w-full max-w-3xl px-4 animate-slide-up">
      {/* Upload Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-3xl transition-all duration-300 ${
          isDragging
            ? "scale-105 shadow-2xl shadow-purple-500/50"
            : "hover:scale-102 shadow-xl"
        }`}
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl"></div>
        
        {/* Border animation */}
        <div className={`absolute inset-0 rounded-3xl transition-all duration-300 ${
          isDragging
            ? "border-4 border-white animate-pulse"
            : "border-2 border-white/40"
        }`}></div>

        <label className="relative block cursor-pointer p-12">
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileInput}
            disabled={isUploading}
          />

          <div className="flex flex-col items-center text-center">
            {/* Upload Icon */}
            <div
              className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl transition-all duration-300 ${
                isDragging ? "scale-110 rotate-6" : "hover:scale-105"
              } ${isUploading ? "animate-pulse" : ""}`}
            >
              <RiUploadCloud2Fill size={48} />
            </div>

            {/* Main Text */}
            <h3 className="mb-2 text-3xl font-bold text-white drop-shadow-lg">
              {isDragging
                ? "Drop your PDF here!"
                : isUploading
                ? "Uploading..."
                : "Upload Your Document"}
            </h3>
            
            <p className="mb-6 text-lg text-white/90">
              {isUploading
                ? "Processing your document..."
                : "Drag and drop your PDF or click to browse"}
            </p>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="w-full max-w-md mb-6">
                <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-white/80 text-sm mt-2">{uploadProgress}%</p>
              </div>
            )}

            {/* File Name Display */}
            {fileName !== "No file chosen" && !isUploading && (
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-white/90 px-6 py-3 shadow-lg animate-fade-in">
                <span className="text-2xl">📄</span>
                <div className="text-left">
                  <p className="text-xs text-gray-500 font-medium">Selected File</p>
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-xs">
                    {fileName}
                  </p>
                </div>
              </div>
            )}

          </div>
        </label>
      </div>

      {/* Info Cards */}
      <div className="mt-8 grid md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        {cardsInfo.map((info, index) => (
          <div
            key={index}
            className="group bg-white/20 backdrop-blur-md rounded-xl p-5 border border-white/30 hover:bg-white/30 hover:scale-105 transition-all duration-300"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
              {info.icon}
            </div>
            <h4 className="text-white font-bold mb-1">{info.title}</h4>
            <p className="text-white/80 text-sm">{info.desc}</p>
          </div>
        ))}
      </div>

      {/* File Requirements */}
      <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <p className="text-white/70 text-sm">
          📋 Maximum file size: 10MB • Supported format: PDF only
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};


export default UploadDocButton;
