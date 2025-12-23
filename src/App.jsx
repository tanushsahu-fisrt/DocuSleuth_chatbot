import { useState } from "react";
import Header from "./component/Header";
import PdfViewerV1 from "./component/PdfViewerV1";
import UploadDocButton from "./component/UploadDocButton";
import IntroPage from "./component/IntroPage";

const App = () => {
  const [fileName, setFileName] = useState("No file chosen");
  const [file, setFile] = useState(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  return (
    
    <div className="min-h-screen bg-gradient-to-r from-purple-300 to-blue-400 flex flex-col items-center pt-9">
      {showIntro ? (
        <IntroPage onStart={() => setShowIntro(false)} />
      ) : isFileUploaded ? (
        <PdfViewerV1
          file={file}
          setFile={setFile}
          setIsFileUploaded={setIsFileUploaded}
          setFileName={setFileName}
        />
      ) : (
        <>
          <Header />
          <UploadDocButton
            setIsFileUploaded={setIsFileUploaded}
            setFileName={setFileName}
            setFile={setFile}
            fileName={fileName}
          />
        </>
      )}
    </div>
  );
};

export default App;
