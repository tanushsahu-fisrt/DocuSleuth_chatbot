import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PdfViewer = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const handleChange = async (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    onFileUpload(uploadedFile); // notify parent

    const formdata = new FormData();

    formdata.append("file" , uploadedFile)

    fetch("http://localhost:8000/api/upload",{
      method: "POST",
      body : formdata
    })
    .then(response => response.json())
    .then(data => {
      console.log("File uploaded successfully:", data);
    })
    .catch(error => {
      console.error("Error uploading file:", error);
    });
    
  };

  return (
    <div>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        className="mb-3"
      />

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
                />
            ))
          }
        </Document>
      )}
    </div>
  );
};

export default PdfViewer;
