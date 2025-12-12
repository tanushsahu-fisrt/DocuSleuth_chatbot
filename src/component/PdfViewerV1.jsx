import { useEffect, useRef, useState } from "react";
import { Viewer, Worker, SelectionMode } from "@react-pdf-viewer/core";
import { highlightPlugin } from "@react-pdf-viewer/highlight";
import { themePlugin } from '@react-pdf-viewer/theme';
import { DarkIcon, LightIcon } from '@react-pdf-viewer/theme';
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";

import FloatingButton from "./FloatingButton";
import Header from "./Header";
import UploadNewDocButton from "./UploadNewDocButton";

const PdfViewerV1 = ({ file, setFile, setIsFileUploaded, setFileName }) => {
  const [highlights, setHighlights] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);

  // Convert file to URL
  useState(() => {
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

  if (!file) return <div>No file uploaded</div>;

  const themePluginInstance = themePlugin();

  return (
    <div className="w-full flex flex-col items-center">

      <Header />

      {fileUrl && (
        <div 
          className=" shadow-xl mx-4 w-[80%]" 
          style={{ 
            border: '1px solid rgba(0, 0, 0, 0.3)',
            height: "calc(100vh - 140px)",
          }}
            >
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer 
                fileUrl={fileUrl} 
                plugins={[highlightPluginInstance , themePluginInstance]} 
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