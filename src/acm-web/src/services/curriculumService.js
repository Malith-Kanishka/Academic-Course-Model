import apiClient from './apiClient';

export const curriculumService = {
  async getModules({ student = false } = {}) {
    const response = await apiClient.get(student ? '/student/my-modules' : '/Syllabus/modules');
    return response.data;
  },

  async assignStudent(moduleId, studentEmail) {
    const response = await apiClient.post('/enrollments/assign', {
      moduleId,
      studentEmail,
    });
    return response.data;
  },

  async createModule(moduleData) {
    const response = await apiClient.post('/Syllabus/modules', moduleData);
    return response.data;
  },

  async createTopic(topicData) {
    const response = await apiClient.post('/Syllabus/topics', topicData);
    return response.data;
  },

  async searchTopics(query, moduleId = null) {
    const params = { query };
    if (moduleId) params.moduleId = moduleId;
    const response = await apiClient.get('/Syllabus/topics/search', { params });
    return response.data;
  },

  async uploadMaterial(formData, onUploadProgress) {
    const response = await apiClient.post('/Syllabus/materials/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  }
};