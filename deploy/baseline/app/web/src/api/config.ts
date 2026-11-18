import request from '@/utils/request'

// 辅助函数：提取响应数据
const extractData = async (promise: Promise<any>) => {
  const response = await promise
  return response.data
}

export const configApi = {
  // 获取配置元数据
  getMetadata() {
    return extractData(request.get('/api/config/metadata'))
  },

  // 获取精灵名字映射
  getPetNames() {
    return extractData(request.get('/api/config/pet-names'))
  },

  // 获取物品名字映射
  getItemNames() {
    return extractData(request.get('/api/config/item-names'))
  },

  // 获取任务名字映射
  getTaskNames() {
    return extractData(request.get('/api/config/task-names'))
  },

  // 获取技能名字映射
  getSkillNames() {
    return extractData(request.get('/api/config/skill-names'))
  },

  // 获取配置数据
  getConfig(type: string) {
    return extractData(request.get(`/api/config/${type}`))
  },

  // 保存配置
  saveConfig(type: string, data: any) {
    return extractData(request.post(`/api/config/${type}`, { data }))
  },

  // 重载配置
  reloadConfig(type: string) {
    return extractData(request.post(`/api/config/${type}/reload`))
  },

  // 获取下拉选项
  getOptions(type: string) {
    return extractData(request.get(`/api/config/options/${type}`))
  },

  // 搜索精灵选项（分页）
  searchPets(query: string = '', page: number = 1, pageSize: number = 50) {
    return extractData(request.get('/api/config/search/pets', {
      params: { query, page, pageSize }
    }))
  },

  // 搜索物品选项（分页）
  searchItems(query: string = '', page: number = 1, pageSize: number = 50) {
    return extractData(request.get('/api/config/search/items', {
      params: { query, page, pageSize }
    }))
  },

  // 搜索技能选项（分页）
  searchSkills(query: string = '', page: number = 1, pageSize: number = 50) {
    return extractData(request.get('/api/config/search/skills', {
      params: { query, page, pageSize }
    }))
  },

  // 搜索指定精灵的技能选项（分页）
  searchPetSkills(petId: number, query: string = '', page: number = 1, pageSize: number = 50) {
    return extractData(request.get(`/api/config/search/pet-skills/${petId}`, {
      params: { query, page, pageSize }
    }))
  },

  // 搜索特性选项（分页）
  searchAbilities(query: string = '', page: number = 1, pageSize: number = 50) {
    return extractData(request.get('/api/config/search/abilities', {
      params: { query, page, pageSize }
    }))
  },

  // 获取性格列表
  getNatures() {
    return extractData(request.get('/api/config/natures'))
  },

  // 健康检查
  checkHealth() {
    return extractData(request.get('/health'))
  }
}
