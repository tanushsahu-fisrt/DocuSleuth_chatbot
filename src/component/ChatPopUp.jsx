import React, { useState } from "react";
import { CiCircleChevDown } from "react-icons/ci";

const ChatPopUp = ({ setOpenChat, onHighlightLocations }) => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [botAnswering, setBotAnswering] = useState(false);

  const handleMessageQuery = (msg) => {
    if (!msg.trim()) return;

    setChatHistory((prev) => [...prev, { sender: "user", text: msg }]);
    setBotAnswering(true);

    const collection = sessionStorage.getItem("collection")
    
    fetch("http://localhost:8000/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: msg , collection : collection }),
    })
      .then((res) => res.json())
      .then((data) => {
        let parsed;
        try {
          parsed = JSON.parse(data.response);
        } catch {
          parsed = { answer: data.response };
        }

        setChatHistory((prev) => [
          ...prev,
          {
            sender: "bot",
            text: parsed.answer,
            locations: parsed.locations,
            summary: parsed.summary,
          },
        ]);

        // Send highlight data to PDF viewer
        if (parsed.locations && onHighlightLocations) {
          onHighlightLocations(parsed.locations);
        }

        setBotAnswering(false);
      })
      .catch((err) => {
        console.log("Fetching error:", err);
        setBotAnswering(false);
      });

    setMessage("");
  };

  const handleLocationClick = (location) => {
    console.log("Location clicked:", location?.highlightText);
    // Trigger highlight for specific location when clicked
    if (onHighlightLocations) {
      onHighlightLocations([location]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-[420px] h-[85vh] bg-white border border-gray-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 flex justify-between items-center shadow-md">
        <h2 className="text-lg font-semibold">📄 DocuSleuth</h2>
        <button
          className="text-gray-200 hover:text-white text-xl"
          onClick={() => setOpenChat(false)}
        >
          <CiCircleChevDown size={25} color="hover:bg-white" className="rounded-xl hover:bg-red-500"/>
        </button>
      </div>

      {/* CHAT BODY */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-gray-50">
      {
        chatHistory.length > 0 ? 
        chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`p-3 rounded-xl max-w-[80%] shadow-sm transition-all duration-300 ${
                msg.sender === "user"
                  ? "bg-purple-600 text-white rounded-br-none"
                  : "bg-white border border-gray-200 rounded-bl-none"
              }`}
            >
              {/* USER MESSAGE */}
              {msg.sender === "user" && <p>{msg.text}</p>}

              {/* BOT MESSAGE */}
              {msg.sender === "bot" && (
                <>
                  <p className="font-semibold text-gray-800">Answer:</p>
                  <p className="text-gray-700">{msg.text}</p>

                  {msg.locations?.length > 0 && (
                    <div className="mt-2 bg-gray-100 rounded-md p-2">
                      <p className="font-medium text-gray-700">Sources:</p>
                      {msg.locations.map((loc, i) => (
                        <div 
                          key={i} 
                          className="text-sm text-gray-600 ml-2 cursor-pointer hover:bg-yellow-200 hover:text-blue-500 p-1 rounded transition"
                          onClick={() => handleLocationClick(loc)}
                        >
                          • Page {loc.page}: <span className="italic">{loc.label}</span>
                          <br />
                          <span className="text-gray-500">"{loc.snippet}"</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.summary && (
                    <p className="mt-2 text-sm text-gray-500">
                      <strong>Summary:</strong> {msg.summary}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ))
        :
        <div className="w-full h-full flex items-center justify-center">
          <p className="font-bold text-gray-600 text-center">
            🤖--Ask your Query to Get Answers
          </p>
        </div>
        }

        {/* TYPING INDICATOR */}
        {botAnswering && (
          <div className="flex items-start gap-2">
            <div className="bg-gray-200 p-3 rounded-xl max-w-[70%]">
              <div className="flex gap-1 animate-pulse  items-center">
                <p>🤖</p>
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INPUT BOX */}
      <div className="p-3 bg-white border-t flex gap-2">
        <input
          type="text"
          className="flex-grow border border-gray-300 rounded-xl p-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          placeholder="Type your question…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleMessageQuery(message)}
        />
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-700 shadow-md transition"
          onClick={() => handleMessageQuery(message)}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatPopUp;