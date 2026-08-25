import React, { useState, useRef } from 'react';
import axios from 'axios';

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

    const apiBase = `http://${window.location.hostname}:8010/api`;
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
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🌮</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Desmenuzar Nuevos CFDIs</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Sube archivos .XML sueltos o un .ZIP completo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
              width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem' }}>
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? '#3b82f6' : '#cbd5e1'}`,
              borderRadius: '16px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              backgroundColor: dragActive ? '#eff6ff' : '#f8fafc',
              cursor: uploading ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xml,.zip"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
            />

            {uploading ? (
              <>
                <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
                <div style={{ fontWeight: 700, color: '#1e293b' }}>Procesando y clasificando CFDIs...</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Indexando comprobantes en la base de datos</div>
              </>
            ) : (
              <>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: '#e0f2fe', color: '#0284c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem'
                }}>
                  📂
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                    Arrastra aquí tus archivos XML o ZIP
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    O haz clic para explorar en tu computadora
                  </div>
                </div>
                <div style={{
                  display: 'inline-flex', gap: '6px', fontSize: '0.72rem',
                  background: '#e2e8f0', color: '#475569', padding: '4px 10px',
                  borderRadius: '12px', fontWeight: 600
                }}>
                  <span>⚡ Auto-clasificación por RFC</span>
                  <span>•</span>
                  <span>Deduplicación automática</span>
                </div>
              </>
            )}
          </div>

          {/* Results feedback */}
          {uploadResult && (
            <div style={{
              marginTop: '1.25rem', padding: '1rem 1.25rem', borderRadius: '12px',
              background: '#f0fdf4', border: '1px solid #86efac', color: '#166534'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>
                ✅ Ingesta Completada
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                Se detectaron <strong>{uploadResult.files_total}</strong> comprobantes. 
                Ingestados correctamente: <strong>{uploadResult.files_ok}</strong>
                {uploadResult.files_error > 0 && ` (${uploadResult.files_error} omitidos o corruptos)`}.
              </div>
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '1.25rem', padding: '1rem 1.25rem', borderRadius: '12px',
              background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
              fontSize: '0.85rem'
            }}>
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem', background: '#f8fafc',
          borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1',
              background: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {uploadResult ? 'Cerrar y Actualizar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};
