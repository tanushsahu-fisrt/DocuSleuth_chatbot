import { useState, useEffect, useRef } from "react";
import { Viewer, Worker , ThemeContext  } from "@react-pdf-viewer/core";
import { highlightPlugin } from "@react-pdf-viewer/highlight";
import { themePlugin } from '@react-pdf-viewer/theme';
import { searchPlugin } from '@react-pdf-viewer/search';
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';

// Import styles
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import '@react-pdf-viewer/search/lib/styles/index.css';

import { FaChevronLeft  } from "react-icons/fa6";
import { FaChevronRight } from "react-icons/fa";

import FloatingButton from "./FloatingButton";
import DocHeader from "./DocHeader";

const PdfViewerV1 = ({ file, setFile, setIsFileUploaded, setFileName }) => {
  const [highlights, setHighlights] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentScale, setCurrentScale] = useState(0.75);

  const themePluginInstance = themePlugin();
  const { SwitchThemeButton } = themePluginInstance;

  const [currentTheme, setCurrentTheme] = useState('light');
  const themeContext = { currentTheme, setCurrentTheme };

  // Initialize plugins
  const zoomPluginInstance = zoomPlugin();
  const { CurrentScale } = zoomPluginInstance;
  
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { CurrentPageLabel, jumpToPage } = pageNavigationPluginInstance;
  
  const searchPluginInstance = searchPlugin({
    keyword: searchKeyword,
  });
  const { highlight, clearHighlights, jumpToNextMatch, jumpToPreviousMatch } = searchPluginInstance;

  const normalizeText = (text) =>
  text
    .replace(/\s+/g, " ")
    .replace(/•/g, "")
    .replace(/\n/g, " ")
    .trim()
    .toLowerCase();


  // Function to find text coordinates using the search plugin approach
  const findTextInPage = async (pageIndex, searchText) => {
    if (!pdfDocument) {
      console.log("PDF document not loaded yet");
      return [];
    }
    
    try {
      const page = await pdfDocument.getPage(pageIndex + 1);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      const highlights = [];
      const textItems = textContent.items;

      // Build complete text with character positions
      let fullText = '';
      const charToItemMap = [];
      
      textItems.forEach((item, itemIndex) => {
        const startPos = fullText.length;
        fullText += item.str;
        const endPos = fullText.length;
        
        // Map each character to its text item
        for (let i = startPos; i < endPos; i++) {
          charToItemMap[i] = itemIndex;
        }
      });
      
      
      // Find all occurrences of search text
      const searchLower = normalizeText(searchText)
      const fullTextLower = normalizeText(fullText)
      
      let startIdx = 0;
      
      while ((startIdx = fullTextLower.indexOf(searchLower, startIdx)) !== -1) {
        const endIdx = startIdx + searchText.length;
        
        // Get item indices that contain this match
        const firstItemIdx = charToItemMap[startIdx];
        const lastItemIdx = charToItemMap[Math.min(endIdx - 1, charToItemMap.length - 1)];
        
        if (firstItemIdx !== undefined && lastItemIdx !== undefined) {
          // Calculate bounding box
          let minX = Infinity, minY = Infinity;
          let maxX = -Infinity, maxY = -Infinity;
          
          for (let i = firstItemIdx; i <= lastItemIdx; i++) {
            if (!textItems[i]) continue;
            
            const item = textItems[i];
            const transform = item.transform;
            
            // Extract position from transform matrix
            // transform = [scaleX, skewY, skewX, scaleY, translateX, translateY]
            const x = transform[4];
            const y = transform[5];
            const itemWidth = item.width || 0;
            const itemHeight = item.height || Math.abs(transform[3]) || 12;
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + itemWidth);
            maxY = Math.max(maxY, y + itemHeight);
          }
          
          // Convert to percentage coordinates
          if (minX !== Infinity && maxX !== -Infinity) {
            const left = (minX / viewport.width) * 100;
            const top = ((viewport.height - maxY) / viewport.height) * 100;
            const width = ((maxX - minX) / viewport.width) * 100;
            const height = ((maxY - minY) / viewport.height) * 100;
            
            const maxHeight = 8;
            const maxWidth = 90;

            highlights.push({
              id: `highlight-${pageIndex}-${startIdx}-${Date.now()}`,
              pageIndex,
              position: {
                left: Math.max(0, left),
                top: Math.max(0, top),
                width: Math.min(maxWidth, width),
                height: Math.min(maxHeight, height),
              },
              content: {
                text: searchText
              }
            });
          }
        }
        
        startIdx += 1; // Move forward to find next occurrence
      }
      
      console.log(`Found ${highlights.length} highlights on page ${pageIndex + 1}`);
      return highlights;
      
    } catch (error) {
      console.error('Error finding text in page:', error);
      return [];
    }
  };

  // Handle highlights from chatbot
  const handleHighlightLocations = async (locations) => {
    if (!locations || locations.length === 0) {
      setHighlights([]);
      return;
    }

    console.log("Processing highlights for locations:", locations);
    
    // Wait a bit for PDF to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 500));

    const newHighlights = [];
    
    for (const loc of locations) {
      const pageIndex = loc.pageIndex !== undefined ? loc.pageIndex : (loc.page - 1);
      const textToHighlight =  loc.highlightText.substring(0,50) || loc.snippet  || loc.full_text;
      
      if (textToHighlight && pdfDocument) {
        console.log(`Searching for text on page ${pageIndex + 1}:`, textToHighlight.substring(0, 50) + "...");
        
        const pageHighlights = await findTextInPage(pageIndex, textToHighlight);
        newHighlights.push(...pageHighlights);
      }
    }
    
    console.log(`Total highlights created: ${newHighlights.length}`);
    setHighlights(newHighlights);
    
    // Jump to first highlight
    if (locations[0]) {
      const pageIndex = locations[0].pageIndex !== undefined ? locations[0].pageIndex : (locations[0].page - 1);
      jumpToPage(pageIndex);
    }
  };
  
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
  
  // Create highlight plugin with dynamic highlights
  const highlightPluginInstance = highlightPlugin({
    renderHighlights: (props) => (
      <div>
        {highlights
          .filter((h) => h.pageIndex === props.pageIndex)
          .map((h) => (
            <div
              key={h.id}
              style={{
                background: "rgba(255, 255, 0, 0.5)",
                position: "absolute",
                left: `${h.position.left}%`,
                top: `${h.position.top}%`,
                width: `${h.position.width}%`,
                height: `${h.position.height}%`,
                mixBlendMode: "multiply",
                pointerEvents: "none",
                zIndex: 1,
                transition: "all 0.2s ease",
                border: "1px solid rgba(255, 200, 0, 0.3)",
                borderRadius: "2px"
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

  // Handle document load - CRITICAL for getting PDF.js document object
  const handleDocumentLoad = (e) => {
    console.log("PDF Document loaded successfully");
    setPdfDocument(e.doc);
  };

  if (!file) return <div>No file uploaded</div>;





  return (
    <div className="w-full flex flex-col">

      
      <ThemeContext.Provider value={themeContext}>
      
      <DocHeader  
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        handleKeyPress={handleKeyPress}
        handleClearSearch={handleClearSearch}
        handleSearch={handleSearch}
        CurrentPageLabel={CurrentPageLabel}
        SwitchThemeButton={SwitchThemeButton}
        zoomPluginInstance={zoomPluginInstance}
        jumpToPreviousMatch={jumpToPreviousMatch}
        jumpToNextMatch={jumpToNextMatch}
        highlights={highlights}
        setHighlights={setHighlights}
      />

      <div className="h-10" />

      {fileUrl && (
        <div 
          className={`shadow-xl mx-4 w-[70%] rpv-core__viewer rpv-core__viewer--${currentTheme} `}
          style={{ 
            border: '1px solid rgba(0, 0, 0, 0.3)',
            height: "calc(100vh - 20px)",
            borderColor: currentTheme === 'dark' ? '#454647' : 'rgba(0, 0, 0, 0.3)',
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
                theme={currentTheme}
                onDocumentLoad={handleDocumentLoad}
              />
            </Worker>
        </div>
      )}

      <FloatingButton 
        onHighlightLocations={handleHighlightLocations} 
      />
      
      </ThemeContext.Provider>
    </div>
  );
};

export default PdfViewerV1; 