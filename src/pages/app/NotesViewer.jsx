import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./app.css";

const NotesViewer = () => {
  const { university, semester, subject } = useParams();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL}/api/notes/${university}/${semester}/${subject}`
    )
      .then((res) => res.json())
      .then((data) => setFiles(data.files))
      .catch((err) => console.log(err));
  }, [university, semester, subject]);

  return (
    <div className="page-wrapper">
      <main className="page-container">
        <div className="hero-card">
          <h1 className="hero-title">{subject.toUpperCase()} Notes</h1>
        </div>

        <div className="notes-grid">
          {files.map((file) => (
            <div key={file} className="notes-card">
              <h3 style={{ margin: "0 0 0", fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>
                {file}
              </h3>
              <a
                href={`${import.meta.env.VITE_API_URL}/notes/${university}/${semester}/${subject}/${file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="notes-btn mu"
              >
                Open →
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default NotesViewer;
