import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) fetchDatasets();
  }, [token]);

  const fetchDatasets = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:8000/datasets/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDatasets(res.data);
    } catch (err) {
      setMessage("Failed to fetch datasets.");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(""); 
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }
    if (!token) {
      setMessage("You must be logged in to upload files.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await axios.post("http://localhost:8000/uploadfile/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
       
        },
      });
      setMessage(`File uploaded successfully: ${response.data.filename} (${response.data.rows} rows)`);
      setFile(null);
     
      document.querySelector('input[type="file"]').value = '';
      fetchDatasets();
    } catch (err) {
      console.error("Upload error:", err);
      console.error("Error response:", err.response?.data);
      setMessage(err.response?.data?.detail || "File upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dataset?")) return;
    if (!token) {
      setMessage("You must be logged in to delete datasets.");
      return;
    }
    try {
      await axios.delete(`http://localhost:8000/datasets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDatasets(datasets.filter((d) => d.id !== id));
      setMessage("Dataset deleted successfully.");
    } catch (err) {
      setMessage("Failed to delete dataset.");
    }
  };

  const handleRename = async (id) => {
    const newName = prompt("Enter new filename:");
    if (!newName) return;
    if (!token) {
      setMessage("You must be logged in to rename datasets.");
      return;
    }
    try {
      await axios.put(
        `http://localhost:8000/datasets/${id}/rename`,
        { new_filename: newName },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDatasets(
        datasets.map((d) => (d.id === id ? { ...d, filename: newName } : d))
      );
      setMessage("Dataset renamed successfully.");
    } catch (err) {
      setMessage("Failed to rename dataset.");
    }
  };

  const handleVisualize = (id) => {
    navigate(`/datasets/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Dashboard</h1>

      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={handleFileChange}
          className="mb-2 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded w-full"
        />
        <button
          onClick={handleUpload}
          disabled={loading || !token}
          className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
        {message && <p className="mt-2 text-gray-700 dark:text-gray-300">{message}</p>}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Datasets</h2>
        {datasets.length === 0 && <p className="text-gray-600 dark:text-gray-400">No datasets uploaded yet.</p>}
        <ul className="space-y-2">
          {datasets.map((dataset) => (
            <li
              key={dataset.id}
              className="border border-gray-300 dark:border-gray-600 p-3 rounded bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center cursor-pointer transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{dataset.filename}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rows: {dataset.data?.length || "N/A"}, Columns:{" "}
                  {dataset.columns?.length || "N/A"}
                </p>
              </div>
              <div className="space-x-3">
                <button
                  onClick={() => handleRename(dataset.id)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  title="Rename dataset"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(dataset.id)}
                  className="text-red-600 dark:text-red-400 hover:underline"
                  title="Delete dataset"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleVisualize(dataset.id)}
                  className="text-green-600 dark:text-green-400 hover:underline"
                  title="Visualize dataset"
                >
                  Visualize
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
