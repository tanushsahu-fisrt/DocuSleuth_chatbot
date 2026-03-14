import { useState } from "react";
import ChatPopUp from "./ChatPopUp";

const FloatingButton = ({ onHighlightLocations }) => {
  const [openChat, setOpenChat] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Container for the PopUp with a CSS transition for appearance */}
      <div 
        className={`transition-all duration-300 transform ${
          openChat 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-10 scale-95 pointer-events-none"
        }`}
      >
        {openChat && (
          <ChatPopUp 
            setOpenChat={setOpenChat} 
            onHighlightLocations={onHighlightLocations}
          />
        )}
      </div>

      {/* Main Interactive Button */}
      {!openChat && (
        <button
          onClick={() => setOpenChat(true)}
          className="
            group flex items-center gap-3 
            bg-gradient-to-r from-purple-600 to-indigo-600 
            hover:from-purple-700 hover:to-indigo-300
            text-white font-semibold py-4 px-6 rounded-2xl
            shadow-[0_10px_25px_-5px_rgba(124,58,237,0.4)]
            hover:shadow-[0_20px_35px_-10px_rgba(124,58,237,0.6)]
            active:scale-95 transition-all duration-200 ease-out
          "
        >
          {/* Pulsing Notification Dot (Simulated Interactivity) */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="tracking-wide">Ask Document AI</span>
        </button>
      )}
    </div>
  );
};

export default FloatingButton;