import { useState } from "react";

const Header = () => {
  return (
    <>
      {/* HEADER SECTION */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="text-xl font-bold text-white tracking-tight">DocuSleuth</span>
        </div>
      </header>
      
      <header className="text-center mb-8 animate-fade-in mt-8">
        <div className="inline-block mb-4"></div>
        <p className="text-md text-white/90 max-w-2xl mx-auto">
          Your intelligent document AI assistant - Upload a PDF and start asking questions
        </p>
      </header>
    </>
  );
};

export default Header;