import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const { token } = useContext(AuthContext);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }
    if (!token) {
      setMessage('You must be logged in to upload files.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/uploadfile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage(`Uploaded ${response.data.filename} with ${response.data.rows} rows`);
      setFile(null);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors">
      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-700 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800"
      />
      <button
        onClick={handleUpload}
        className="py-2 px-6 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-semibold"
      >
        Upload
      </button>
      {message && <p className="text-center text-gray-800 dark:text-gray-200">{message}</p>}
    </div>
  );
}

export default FileUpload;
