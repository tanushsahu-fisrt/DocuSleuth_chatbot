import {RiUploadCloud2Fill} from "react-icons/ri"
const UploadNewDocButton = ({ setFile, setIsFileUploaded, setFileName }) => {

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];

    setFile(uploadedFile);
    setIsFileUploaded(true);
    setFileName(uploadedFile.name);

    const formdata = new FormData();
    formdata.append("file", uploadedFile);

    fetch("http://localhost:8000/api/upload", {
      method: "POST",
      body: formdata
    })
      .then(res => res.json())
      .then(data => {
        console.log("New PDF uploaded:", data.collection);
        sessionStorage.setItem("collection", data.collection);
      })
      .catch(err => console.error("Upload error:", err));
  };

  return (
    <label className=" flex gap-3 items-center fixed bottom-6 left-6 bg-purple-600 text-white p-4 rounded-full shadow-lg cursor-pointer">
      <input 
        type="file" 
        className="hidden" 
        onChange={handleFileUpload} 
        />
            <RiUploadCloud2Fill  size={20}/> 
        <p>
            Upload
        </p>            
    </label>
  );
};

export default UploadNewDocButton;
