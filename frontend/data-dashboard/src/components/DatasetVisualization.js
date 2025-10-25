import React, { useState, useEffect, useContext } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";

function DatasetVisualization({ datasetId }) {
  const [dataset, setDataset] = useState(null);
  const [colX, setColX] = useState("");
  const [colY, setColY] = useState("");
  const [chartType, setChartType] = useState("bar"); 
  const [chartData, setChartData] = useState(null);
  const { token } = useContext(AuthContext); 

  useEffect(() => {
    if (token) {
      fetchDataset();
    } else {
      setDataset(null);
    }
  }, [datasetId, token]);

  useEffect(() => {
    if (dataset && colX && colY) {
      prepareChart();
    }
  }, [colX, colY, dataset, chartType]);

  const fetchDataset = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/datasets/${datasetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDataset(res.data);
      setColX("");
      setColY("");
      setChartData(null);
    } catch (err) {
      setDataset(null);
    }
  };

  const prepareChart = () => {
    const labels = dataset.data.map((row) => row[colX]);
    const valuesRaw = dataset.data.map((row) => Number(row[colY]));
    const values = valuesRaw.map((v) => (isNaN(v) ? 0 : v));
    setChartData({
      labels,
      datasets: [
        {
          label: colY,
          data: values,
          backgroundColor:
            chartType === "pie"
              ? labels.map(() => "rgba(54, 162, 235, 0.6)")
              : "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          fill: chartType !== "pie",
        },
      ],
    });
  };

  if (!token) return <p>Please login to view dataset visualization.</p>;
  if (!dataset) return <p>Loading dataset...</p>;

  return (
    <div className="p-6 bg-white rounded shadow max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{dataset.filename} - Visualization</h2>

      <div className="mb-4 flex space-x-4 items-center">
        <select
          value={colX}
          onChange={(e) => setColX(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Select X-axis column</option>
          {dataset.columns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>

        <select
          value={colY}
          onChange={(e) => setColY(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Select Y-axis column</option>
          {dataset.columns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>

        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="bar">Bar</option>
          <option value="line">Line</option>
          <option value="pie">Pie</option>
        </select>
      </div>

      <div>
        {chartData && chartType === "bar" && <Bar data={chartData} />}
        {chartData && chartType === "line" && <Line data={chartData} />}
        {chartData && chartType === "pie" && <Pie data={chartData} />}
      </div>
    </div>
  );
}

export default DatasetVisualization;
