import { useState, useCallback } from 'react';
import { curriculumService } from '../../../services/curriculumService';

export default function useCurriculum() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await curriculumService.getModules();
      setModules(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTopic = async (payload) => {
    return await curriculumService.createTopic(payload);
  };

  const uploadMaterial = async (formData) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    try {
      const result = await curriculumService.uploadMaterial(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      return result;
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed.');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    modules,
    loading,
    error,
    fetchModules,
    createTopic,
    uploadMaterial,
    isUploading,
    uploadProgress,
    uploadError,
  };
}
