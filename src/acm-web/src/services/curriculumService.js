import apiClient from './apiClient';

export const curriculumService = {
  async getModules() {
    const response = await apiClient.get('/Syllabus/modules');
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

  async uploadMaterial(formData) {
    const response = await apiClient.post('/Syllabus/materials/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};