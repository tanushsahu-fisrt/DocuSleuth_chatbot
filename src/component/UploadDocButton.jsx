import { RiUploadCloud2Fill } from "react-icons/ri";

const UploadDocButton = ({
  setFile,
  setIsFileUploaded,
  setFileName,
  fileName,
}) => {
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsFileUploaded(true);
    setFileName(uploadedFile.name);

    const formdata = new FormData();
    formdata.append("file", uploadedFile);

    fetch("http://localhost:8000/api/upload", {
      method: "POST",
      body: formdata,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("File uploaded successfully:", data.collection);
        sessionStorage.setItem("collection", data.collection);
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });
  };

  return (
    <div className="mt-14 w-full flex justify-center">
      <label className="group w-[420px] cursor-pointer">
        <input
          type="file"
          className="hidden"
          accept="application/pdf"
          onChange={handleFileUpload}
        />

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/60 bg-white/30 backdrop-blur-md px-8 py-10 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:border-white">
          
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition group-hover:bg-purple-700">
            <RiUploadCloud2Fill size={28} />
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              Upload your PDF
            </p>
            <p className="mt-1 text-sm text-white/80">
              Click to browse or drag & drop
            </p>
          </div>

          <div className="mt-3 w-full rounded-lg bg-white/90 px-4 py-2 text-center text-sm text-gray-700 shadow">
            {fileName}
          </div>
        </div>
      </label>
    </div>
  );
};

export default UploadDocButton;
