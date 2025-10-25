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

function DatasetDetail({ datasetId }) {
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
  const [showChart, setShowChart] = useState(true);
  
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (token && datasetId) {
      fetchData();
    }
  }, [datasetId, token, currentPage, pageSize, sortColumn, sortOrder, searchTerm, filterColumn, filterValue]);

  useEffect(() => {
    if (token && datasetId && groupByColumn && showChart) {
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
    showChart,
  ]);

  const fetchData = async () => {
    try {
      const skip = (currentPage - 1) * pageSize;
      const params = {
        skip,
        limit: pageSize,
        ...(sortColumn && { sort_by: sortColumn, sort_order: sortOrder }),
        ...(searchTerm && { search: searchTerm }),
        ...(filterColumn && filterValue && { filter_column: filterColumn, filter_value: filterValue })
      };
      
      const res = await axios.get(`http://localhost:8000/datasets/${datasetId}/data`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
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
        ...(filterColumn && filterValue && { filter_column: filterColumn, filter_value: filterValue }),
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
      setChartData(null);
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

  const handleFilter = () => {
    setCurrentPage(1);
    fetchData();
    if (groupByColumn && showChart) fetchChartData();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterColumn("");
    setFilterValue("");
    setSortColumn("");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  if (!token) return <p className="text-center p-4 text-gray-900 dark:text-white">Please login to view dataset details.</p>;
  if (!dataset) return <p className="text-center p-4 text-gray-900 dark:text-white">Loading...</p>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 space-y-6 min-h-screen transition-colors">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{dataset.filename}</h2>

    
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Filters (Apply to Table & Chart)</h3>
        
        <input
          type="text"
          placeholder="Search across all columns..."
          value={searchTerm}
          onChange={handleSearch}
          className="mb-3 p-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        />

        <div className="flex space-x-2 mb-3">
          <select
            value={filterColumn}
            onChange={(e) => setFilterColumn(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select column to filter</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button 
            onClick={handleFilter} 
            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            Apply Filter
          </button>
          <button 
            onClick={handleClearFilters} 
            className="px-4 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded hover:bg-gray-500 dark:hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Filters apply to both table and chart visualizations
        </p>
      </div>

    
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Visualization</h3>
          <button
            onClick={() => setShowChart(!showChart)}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {showChart ? "Hide Chart" : "Show Chart"}
          </button>
        </div>

        {showChart && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <select
                value={groupByColumn}
                onChange={(e) => setGroupByColumn(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Group By</option>
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>

              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Aggregate Column</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              )}

              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>

            <div className="h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded p-4">
              {chartData && groupByColumn ? (
                <>
                  {chartType === "bar" && <Bar data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />}
                  {chartType === "line" && <Line data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />}
                  {chartType === "pie" && <Pie data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />}
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Select a column to group by</p>
              )}
            </div>
          </>
        )}
      </div>

    
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Data Table</h3>

        <div className="overflow-auto max-h-[600px] border border-gray-300 dark:border-gray-600 rounded mb-4">
          <table className="min-w-full table-auto border-collapse">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="border border-gray-300 dark:border-gray-600 cursor-pointer px-4 py-2 select-none hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
                  >
                    {col} {sortColumn === col ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center p-4 text-gray-600 dark:text-gray-400">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-750"}>
                    {columns.map((col) => (
                      <td key={col} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-gray-200">
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
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {data.length} of {totalCount} records
          </div>
          <div className="flex space-x-2 items-center">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-900 dark:text-white">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              Next
            </button>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

export default DatasetDetail;

