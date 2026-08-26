'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Archive,
  RefreshCw
} from 'lucide-react';

export const UploadModal = ({ isOpen, onClose, clientId, onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files) => {
    setError(null);
    setUploadResult(null);
    setUploading(true);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    const apiBase = `/api`;
    const url = clientId ? `${apiBase}/upload?client_id=${clientId}` : `${apiBase}/upload`;

    try {
      const res = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadResult(res.data.result);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Error al procesar los archivos");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Carga y Clasificación de Comprobantes XML
            </h3>
            <p className="text-[11px] text-slate-500">tribuTACOS • shellaquiles.org</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-8 text-center transition-colors flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
              dragActive
                ? 'border-slate-800 bg-slate-50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xml,.zip"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-2 py-3">
                <RefreshCw className="w-6 h-6 text-slate-700 animate-spin" />
                <div className="text-xs font-semibold text-slate-800">Procesando e indexando comprobantes...</div>
                <div className="text-[11px] text-slate-500">Validando sellos digitales y RFCs</div>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Arrastra aquí tus archivos XML o paquetes ZIP
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    O haz clic para seleccionar desde tu equipo
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <FileText className="w-3 h-3" /> XML 3.3 / 4.0
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <Archive className="w-3 h-3" /> Paquete ZIP
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Feedback Resultados */}
          {uploadResult && (
            <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Ingesta Completada
              </div>
              <div className="text-slate-700">
                Se detectaron <strong>{uploadResult.files_total}</strong> comprobantes.
                Ingestados correctamente: <strong>{uploadResult.files_ok}</strong>
                {uploadResult.files_error > 0 && ` (${uploadResult.files_error} omitidos o no válidos)`}.
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-950 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-900 mb-1">
                <AlertCircle className="w-4 h-4 text-red-700" />
                Error en la carga
              </div>
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            {uploadResult ? 'Cerrar y Actualizar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};
