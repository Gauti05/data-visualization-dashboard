import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Bar, Line, Pie } from "react-chartjs-2";
import { AuthContext } from "../contexts/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function DatasetViewer({ datasetId }) {
  const [dataset, setDataset] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);


  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [filterValue, setFilterValue] = useState("");

 
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState("bar");
  const [groupByColumn, setGroupByColumn] = useState("");
  const [aggregateColumn, setAggregateColumn] = useState("");
  const [operation, setOperation] = useState("count");

  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (token && datasetId) {
      fetchTableData();
    }
  }, [
    datasetId,
    token,
    currentPage,
    pageSize,
    sortColumn,
    sortOrder,
    searchTerm,
    filterColumn,
    filterValue,
  ]);

  
  useEffect(() => {
    if (token && datasetId && groupByColumn) {
      fetchChartData();
    }
  }, [
    datasetId,
    token,
    groupByColumn,
    aggregateColumn,
    operation,
    searchTerm,
    filterColumn,
    filterValue,
  ]);

  const fetchTableData = async () => {
    try {
      const skip = (currentPage - 1) * pageSize;
      const params = {
        skip,
        limit: pageSize,
        ...(sortColumn && { sort_by: sortColumn, sort_order: sortOrder }),
        ...(searchTerm && { search: searchTerm }),
        ...(filterColumn &&
          filterValue && {
            filter_column: filterColumn,
            filter_value: filterValue,
          }),
      };

      const res = await axios.get(
        `http://localhost:8000/datasets/${datasetId}/data`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      setDataset({ filename: res.data.filename });
      setColumns(res.data.columns);
      setData(res.data.data);
      setTotalCount(res.data.total_count);
      setTotalPages(res.data.total_pages);

   
      if (!groupByColumn && res.data.columns.length > 0) {
        setGroupByColumn(res.data.columns[0]);
      }
    } catch (err) {
      console.error("Failed to fetch dataset:", err);
    }
  };

  const fetchChartData = async () => {
    try {
      const params = {
        group_by: groupByColumn,
        operation,
        ...(operation !== "count" && aggregateColumn && { aggregate_column: aggregateColumn }),
        ...(searchTerm && { search: searchTerm }),
        ...(filterColumn &&
          filterValue && {
            filter_column: filterColumn,
            filter_value: filterValue,
          }),
      };

      const res = await axios.get(
        `http://localhost:8000/datasets/${datasetId}/aggregate`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      const labels = res.data.data.map((item) => item.label);
      const values = res.data.data.map((item) => item.value);

      setChartData({
        labels,
        datasets: [
          {
            label: `${operation} of ${operation === "count" ? groupByColumn : aggregateColumn}`,
            data: values,
            backgroundColor:
              chartType === "pie"
                ? labels.map(
                    (_, i) =>
                      `rgba(${54 + i * 30}, ${162 - i * 10}, ${235 - i * 20}, 0.6)`
                  )
                : "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      });
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
    }
  };

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchTableData();
    if (groupByColumn) fetchChartData();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterColumn("");
    setFilterValue("");
    setSortColumn("");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  if (!token) return <p>Please login to view dataset details.</p>;
  if (!dataset) return <p className="text-center p-4">Loading...</p>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50">
      <h2 className="text-3xl font-bold mb-6">{dataset.filename}</h2>

     
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Filters (Apply to Table & Chart)</h3>
        
      
        <input
          type="text"
          placeholder="Search across all columns..."
          value={searchTerm}
          onChange={handleSearch}
          className="mb-3 p-2 border rounded w-full"
        />

     
        <div className="flex space-x-2 mb-3">
          <select
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select column to filter</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="p-2 border rounded flex-1"
          />
          <button
            onClick={handleFilterApply}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Apply
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Clear
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Filters apply to both table and chart visualizations
        </p>
      </div>

  
      <div className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Data Visualization</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <select
            value={groupByColumn}
            onChange={(e) => setGroupByColumn(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Group By</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>

          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="count">Count</option>
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="min">Min</option>
            <option value="max">Max</option>
          </select>

          {operation !== "count" && (
            <select
              value={aggregateColumn}
              onChange={(e) => setAggregateColumn(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Aggregate Column</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          )}

          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>

        <div className="h-96">
          {chartData && groupByColumn && (
            <>
              {chartType === "bar" && <Bar data={chartData} options={{ maintainAspectRatio: false }} />}
              {chartType === "line" && <Line data={chartData} options={{ maintainAspectRatio: false }} />}
              {chartType === "pie" && <Pie data={chartData} options={{ maintainAspectRatio: false }} />}
            </>
          )}
          {!groupByColumn && (
            <p className="text-gray-500 text-center">Select a column to group by</p>
          )}
        </div>
      </div>

    
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Data Table</h3>

        <div className="overflow-auto max-h-[600px] border rounded mb-4">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="border border-gray-300 cursor-pointer px-4 py-2 select-none hover:bg-gray-200"
                  >
                    {col}{" "}
                    {sortColumn === col ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center p-4">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {columns.map((col) => (
                      <td key={col} className="border border-gray-300 px-4 py-2">
                        {row[col] != null ? row[col].toString() : ""}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {data.length} of {totalCount} records
          </div>
          <div className="flex space-x-2 items-center">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1 border rounded text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatasetViewer;
