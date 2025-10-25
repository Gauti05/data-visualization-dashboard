import React from "react";
import { useParams } from "react-router-dom";
import DatasetVisualization from "../components/DatasetVisualization";

function DatasetVisualizationPage() {
  const { id } = useParams();
  return <DatasetVisualization datasetId={id} />;
}

export default DatasetVisualizationPage;
