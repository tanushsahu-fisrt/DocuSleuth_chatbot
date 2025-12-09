import { RiUploadCloud2Fill } from "react-icons/ri";

const UploadDocButton = ({
    setFile,
    setIsFileUploaded,
    setFileName,
    fileName
}) => {

    const handleFileUpload = (e) => {
        const uploadedFile = e.target.files[0];
        setFile(uploadedFile);

        setIsFileUploaded(true);
        setFileName(uploadedFile.name || "");

        const formdata = new FormData();

        formdata.append("file" , uploadedFile)
        
        fetch("http://localhost:8000/api/upload",{
            method: "POST",
            body : formdata
        })
        .then(response => response.json())
        .then(data => {
            console.log("File uploaded successfully:", data.collection);
            sessionStorage.setItem("collection",data.collection)
        })
        .catch(error => {
            console.error("Error uploading file:", error);
        });
    }

    return (
        <>
            <label className="mt-10 bg-white shadow-lg rounded-xl px-6 py-4 flex items-center cursor-pointer transition hover:scale-105">
                <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <span className="bg-purple-500 flex  items-center gap-3 text-white px-4 py-2 rounded-lg mr-4">
                    <RiUploadCloud2Fill  size={20}/> 
                    <p>
                        Choose File
                    </p>
                </span>
                <span className="text-gray-700">{fileName}</span>
            </label>
        </>
    )
}


export default UploadDocButton;