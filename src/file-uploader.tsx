// https://dev.to/hexshift/implementing-drag-drop-file-uploads-in-react-without-external-libraries-1d31
import React, { useState } from "react";

function FileUploader() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    // Filter File Types (Optional)
    // const imageFiles = droppedFiles.filter(file => file.type.startsWith("image/"));
    setFiles(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = () => setIsDragging(true);
  const handleDragLeave = () => setIsDragging(false);

  // Upload to Server (Optional)
  const uploadFiles = async () => {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("Upload successful!");
    } else {
      alert("Upload failed.");
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      style={{
        border: "2px dashed #ccc",
        padding: "20px",
        textAlign: "center",
        borderRadius: "10px",
        backgroundColor: isDragging ? "#d414faff" : "#20e42aff",
      }}
    >
      <p>Drag and drop files here</p>
      <ul>
        {files.map((file, index) => (
          <li key={index}>{file.name}</li>
        ))}
      </ul>

      <button onClick={uploadFiles}>Upload Files</button>

    </div>
  );
}

export default FileUploader;