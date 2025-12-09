import React, { useState } from "react";
import PdfViewer from "./component/PdfViewer";

const App = () => {
  const [file, setFile] = useState(null);
  const [chatReady, setChatReady] = useState(false);
  const [message, setMessage] = useState("");
  const [queryAnswer, setQueryAnswer] = useState("");
  const [queryOutputPages, setQueryOutputPages] = useState([]);
  const [queryQuestion, setQueryQuestion] = useState("");


  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile);
    setChatReady(true);
  };

  const handleMessageQuery = (msg) => {
    
    setQueryQuestion(msg);  

    fetch("http://localhost:8000/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: msg }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data)

        if (!data.response) return;

        // remove code fences
        let clean = data.response
          .replace("```json","")
          .replace("```","")
          .trim();
        
        const parsed = JSON.parse(clean);

        // fill into UI states
        setQueryAnswer(parsed.answer);
        setQueryOutputPages(
          parsed.locations.map(loc => ({
            page: loc.page,
            content: loc.snippet
        }))
        
        );
      })
      .catch((err) => console.log("error fetching query res", err));

    setMessage("");
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      {/* Centered Container */}
      <div className="max-w-7xl mx-auto px-2">
        {/* Centered Header */}
        
        <header className="mb-2 text-center">
          <h1 className="text-xl font-bold text-gray-900">
            Document Finder Agent
          </h1>
        </header>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-10 gap-8">
          {/* Chat Section */}
          <div className="bg-white p-5 rounded-xl shadow-lg col-span-10 md:col-span-3 h-[85vh] flex flex-col">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Ask Your Question
            </h2>

            <div className="flex-1 border rounded-lg p-3 overflow-y-auto bg-gray-50">
              {!chatReady ? (
                <p className="text-gray-500 text-center mt-10">
                  Upload a PDF to start chatting…
                </p>
              ) : (
                <div className="text-gray-700 mt-4">

                  {queryQuestion && (
                    <div className="mb-4 p-3 bg-yellow-100 rounded">
                      <strong>Question:</strong> {queryQuestion}
                    </div>
                  )}


                  <div className="mb-4 p-3 bg-blue-100 rounded">
                    {queryAnswer}
                  </div>
                  
                  {queryOutputPages.length > 0 ? (
                    queryOutputPages.map((hit, idx) => (
                      <div
                        key={idx}
                        className="p-3 mb-3 bg-white rounded shadow-sm border"
                      >
                        <p className="text-sm font-semibold text-blue-700">
                          Page: {hit.page}
                        </p>
                        <p className="text-gray-800 whitespace-pre-wrap mt-1">
                          {hit.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center">
                      Document loaded. You can start asking questions.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                placeholder="How can I help you?"
                disabled={!chatReady}
                className={`flex-1 border px-4 py-2 rounded-lg shadow-sm text-gray-800
                  ${
                    !chatReady
                      ? "bg-gray-200 cursor-not-allowed"
                      : "focus:ring-2 focus:ring-blue-500"
                  }
                `}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                disabled={!chatReady}
                className={`px-5 py-2 rounded-lg text-white font-semibold transition
                  ${
                    chatReady
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }
                `}
                onClick={() => handleMessageQuery(message)}
              >
                Send
              </button>
            </div>
          </div>

          {/* PDF Viewer*/}
          <div className="bg-white p-5 rounded-xl shadow-lg col-span-10 md:col-span-7 h-[85vh] flex flex-col">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              PDF Viewer
            </h2>

            <div className="flex-1 overflow-y-auto border rounded-lg p-2 bg-gray-50">
              <PdfViewer onFileUpload={handleFileUpload} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
