// FloatingButton.jsx
import { useState } from "react";
import ChatPopUp from "./ChatPopUp";

const FloatingButton = ({ onHighlightLocations }) => {
  const [openChat, setOpenChat] = useState(false);

  return (
    <>
      {openChat && (
        <ChatPopUp 
          setOpenChat={setOpenChat} 
          onHighlightLocations={onHighlightLocations}
        />
      )}
      
      {!openChat && (
        <button
          onClick={() => setOpenChat(true)}
          className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition"
        >
          💬 Chat
        </button>
      )}
    </>
  );
};

export default FloatingButton;