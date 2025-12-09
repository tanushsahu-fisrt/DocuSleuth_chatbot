import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import FloatingButton from "./FloatingButton";
import Header from "./Header";
import UploadNewDocButton from "./UploadNewDocButton";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PdfViewerV1 = ({ file, setFile, setIsFileUploaded, setFileName }) => {

  const [numPages, setNumPages] = useState(null);

  return (
    <div>

      <Header />
      
      {file && (
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {
            Array.from(new Array(numPages), (el, index) => (
                <Page 
                  key={index} 
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  pageNumber={index + 1} 
                  className="mb-2"
                />
            ))
          }
        </Document>
      )}

      <UploadNewDocButton  
        setFile={setFile} 
        setIsFileUploaded ={setIsFileUploaded} 
        setFileName={setFileName}
      />

      <FloatingButton />
    </div>
  );
};

export default PdfViewerV1;
