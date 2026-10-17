import React, { useState } from 'react';
import { uploadFile, convertFile } from './api';
import './App.css';

function App() {
  const [step, setStep] = useState<'upload' | 'convert' | 'result'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;
    setLoading(true);
    try {
      const info = await uploadFile(uploadedFile);
      setFileInfo(info);
      setStep('convert');
      // Suggest a target format based on the uploaded file
      const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        setTargetFormat('docx'); // Example: convert PDF to Word by default
      } else if (ext === 'docx') {
        setTargetFormat('pdf');
      } else if (ext === 'xlsx') {
        setTargetFormat('pdf');
      } else if (ext === 'txt') {
        setTargetFormat('pdf');
      } else {
        setTargetFormat(''); // Let user choose
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!uploadedFile || !targetFormat) return;
    setLoading(true);
    try {
      const response = await convertFile(uploadedFile, targetFormat);
      // Get the filename from Content-Disposition header or generate one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `converted.${targetFormat}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }
      // Create a blob URL for download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setConversionResult({ url, filename, targetFormat });
      setStep('result');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setStep('upload');
    setUploadedFile(null);
    setFileInfo(null);
    setTargetFormat('');
    setConversionResult(null);
    setError(null);
    // Revoke the object URL if it exists
    if (conversionResult?.url) {
      window.URL.revokeObjectURL(conversionResult.url);
    }
  };

  const renderUploadStep = () => {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">SmartConvert AI</h1>
        <p className="text-gray-600 mb-6 text-center">
          Intelligent file conversion with preserved formatting and layout
        </p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
          <input
            type="file"
            id="file-input"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="file-input"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            {uploadedFile ? `Selected: ${uploadedFile.name}` : 'Click to upload a file'}
          </label>
          <p className="mt-2 text-sm text-gray-500">
            Supported formats: PDF, DOCX, XLSX, TXT, PNG, JPG, JPEG
          </p>
        </div>
        {fileInfo && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="font-medium">File uploaded:</p>
            <p className="ml-4">
              <strong>{fileInfo.filename}</strong> ({Math.round(fileInfo.size / 1024)} KB)
            </p>
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={loading || !uploadedFile}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      </div>
    );
  };

  const renderConvertStep = () => {
    // Determine available target formats based on uploaded file type
    const ext = uploadedFile?.name.split('.').pop()?.toLowerCase() ?? '';
    let options: { label: string; value: string }[] = [];
    if (ext === 'pdf') {
      options = [
        { label: 'Microsoft Word (DOCX)', value: 'docx' },
        { label: 'Microsoft Excel (XLSX)', value: 'xlsx' },
        { label: 'Plain Text (TXT)', value: 'txt' },
        { label: 'CSV (CSV)', value: 'csv' },
      ];
    } else if (ext === 'docx') {
      options = [
        { label: 'PDF (PDF)', value: 'pdf' },
        { label: 'Microsoft Excel (XLSX)', value: 'xlsx' },
      ];
    } else if (ext === 'xlsx') {
      options = [
        { label: 'PDF (PDF)', value: 'pdf' },
        { label: 'Microsoft Word (DOCX)', value: 'docx' },
        { label: 'CSV (CSV)', value: 'csv' },
      ];
    } else if (ext === 'txt') {
      options = [
        { label: 'PDF (PDF)', value: 'pdf' },
      ];
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
      options = [
        { label: 'PDF (PDF)', value: 'pdf' },
      ];
    }

    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">SmartConvert AI</h1>
        <p className="text-gray-600 mb-6 text-center">
          Select conversion format
        </p>
        <div className="mb-6">
          <p className="font-medium mb-2">Convert to:</p>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          >
            <option value="">Select a format</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <button
            onClick={handleConvert}
            disabled={loading || !targetFormat}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Converting...' : 'Convert File'}
          </button>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => setStep('upload')}
            className="bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded border border-gray-300"
          >
            Back to Upload
          </button>
        </div>
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      </div>
    );
  };

  const renderResultStep = () => {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">SmartConvert AI</h1>
        <p className="text-gray-600 mb-6 text-center">
          Conversion successful!
        </p>
        <div className="mb-6">
          <p className="font-medium mb-2">Converted file:</p>
          <p className="ml-4">
            <strong>{conversionResult?.filename}</strong> ({conversionResult?.targetFormat.toUpperCase()})
          </p>
        </div>
        <div className="mb-6">
          <a
            href={conversionResult?.url}
            download={conversionResult?.filename}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Download Converted File
          </a>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={handleRestart}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded border border-gray-300"
          >
            Convert Another File
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {step === 'upload' && renderUploadStep()}
      {step === 'convert' && renderConvertStep()}
      {step === 'result' && renderResultStep()}
    </div>
  );
}

export default App;