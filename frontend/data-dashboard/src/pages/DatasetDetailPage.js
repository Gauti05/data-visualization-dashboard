import React from 'react';
import { useParams } from 'react-router-dom';
import DatasetDetail from '../components/DatasetDetail';

function DatasetDetailPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <DatasetDetail datasetId={id} />
    </div>
  );
}

export default DatasetDetailPage;


