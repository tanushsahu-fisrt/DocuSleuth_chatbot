import { useState, useEffect } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { highlightPlugin } from "@react-pdf-viewer/highlight";
import { themePlugin } from '@react-pdf-viewer/theme';
import { searchPlugin } from '@react-pdf-viewer/search';
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin  , RenderCurrentPageLabelProps  } from '@react-pdf-viewer/page-navigation';

// Import styles
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import '@react-pdf-viewer/search/lib/styles/index.css';

import FloatingButton from "./FloatingButton";
import Header from "./Header";
import UploadNewDocButton from "./UploadNewDocButton";
import CustomizeZoomButton from "./Document/CustomizeZoomButton";

const PdfViewerV1 = ({ file, setFile, setIsFileUploaded, setFileName }) => {
  const [highlights, setHighlights] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  
  // Initialize plugins
  const zoomPluginInstance = zoomPlugin();

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { CurrentPageLabel  , NumberOfPages } = pageNavigationPluginInstance;
  
  const searchPluginInstance = searchPlugin({
    keyword: searchKeyword,
  });
  const { highlight, jumpToMatch, clearHighlights, jumpToNextMatch, jumpToPreviousMatch } = searchPluginInstance;

  const themePluginInstance = themePlugin();
  
  // Convert file to URL
  useEffect(() => {
    if (!file) {
      setFileUrl(null);
      return;
    }

    if (typeof file === "string") {
      setFileUrl(file);
    } else if (file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);
  
  // Create highlight plugin
  const highlightPluginInstance = highlightPlugin({
    renderHighlights: (props) => (
      <div>
        {highlights
          .filter((h) => h.pageIndex === props.pageIndex)
          .map((h) => (
            <div
              key={h.id}
              style={{
                background: "rgba(255, 255, 0, 0.4)",
                position: "absolute",
                left: `${h.position.left}%`,
                top: `${h.position.top}%`,
                width: `${h.position.width}%`,
                height: `${h.position.height}%`,
                mixBlendMode: "multiply",
              }}
              data-highlight-id={h.id}
              title={h.content.text}
            />
          ))}
      </div>
    ),
  });

  // Handle search
  const handleSearch = () => {
    if (searchKeyword.trim()) {
      highlight(searchKeyword);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchKeyword("");
    clearHighlights();
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!file) return <div>No file uploaded</div>;

  return (
    <div className="w-full flex flex-col items-center">
      <Header />

      {/* Search Bar */}
      <div className="w-[80%] bg-white shadow-md rounded-lg p-4 mb-1 flex items-center gap-3">

        <CurrentPageLabel>
                {(props) => (
                    <span>{`${props.currentPage + 1} of ${props.numberOfPages}`}</span>
                )}
        </CurrentPageLabel>
        
        <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
          <svg 
            className="w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search in document..."
            className="flex-1 outline-none text-gray-700"
          />
          {searchKeyword && (
            <button
              onClick={handleClearSearch}
              className="text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Pass the zoom plugin instance */}
        <CustomizeZoomButton 
          zoomPluginInstance={zoomPluginInstance} 
        />

        <button
          onClick={handleSearch}
          disabled={!searchKeyword.trim()}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Search
        </button>

        {/* Navigation buttons */}
        <div className="flex gap-2">
          <button
            onClick={jumpToPreviousMatch}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            title="Previous match"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={jumpToNextMatch}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            title="Next match"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {fileUrl && (
        <div 
          className="shadow-xl mx-4 w-[80%]" 
          style={{ 
            border: '1px solid rgba(0, 0, 0, 0.3)',
            height: "calc(100vh - 220px)",
          }}
        >
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer 
              fileUrl={fileUrl} 
              plugins={[
                highlightPluginInstance, 
                themePluginInstance, 
                searchPluginInstance,
                zoomPluginInstance,
                pageNavigationPluginInstance
              ]}
              defaultScale={0.75}
              theme="auto"
            />
          </Worker>
        </div>
      )}

      <UploadNewDocButton
        setFile={setFile}
        setIsFileUploaded={setIsFileUploaded}
        setFileName={setFileName}
      />

      <FloatingButton />
    </div>
  );
};

export default PdfViewerV1;