import request from '@/utils/request'

// 辅助函数：提取响应数据
const extractData = async (promise: Promise<any>) => {
  const response = await promise
  return response.data
}

export const gmApi = {
  // ==================== 认证相关 ====================
  
  // 登录
  login(email: string, password: string) {
    return extractData(request.post('/api/auth/login', { email, password }))
  },

  // 登出
  logout() {
    return extractData(request.post('/api/auth/logout'))
  },

  // 获取当前用户信息
  getCurrentUser() {
    return extractData(request.get('/api/auth/current'))
  },

  // 获取白名单列表
  getWhitelist() {
    return extractData(request.get('/api/auth/whitelist'))
  },

  // 添加白名单
  addToWhitelist(userId: number, email: string, permissions: string[], note?: string) {
    return extractData(request.post('/api/auth/whitelist', { userId, email, permissions, note }))
  },

  // 移除白名单
  removeFromWhitelist(userId: number) {
    return extractData(request.delete('/api/auth/whitelist', { data: { userId } }))
  },

  // ==================== 玩家管理 ====================
  
  // 获取玩家列表
  getPlayers(params: { page: number; limit: number; search?: string; onlineOnly?: boolean }) {
    return extractData(request.get('/api/players', { params }))
  },

  // 获取玩家详情
  getPlayerDetail(uid: number) {
    return extractData(request.get(`/api/players/${uid}`))
  },

  // 修改玩家数据
  updatePlayer(uid: number, field: string, value: any) {
    return extractData(request.patch(`/api/players/${uid}`, { field, value }))
  },

  // 修改账号信息（邮箱、密码）
  updateAccount(uid: number, email?: string, password?: string) {
    return extractData(request.patch(`/api/players/${uid}/account`, { email, password }))
  },

  // 封禁/解封玩家
  banPlayer(uid: number, banType: number, reason?: string) {
    return extractData(request.post(`/api/players/${uid}/ban`, { banType, reason }))
  },

  // 踢出玩家
  kickPlayer(uid: number, reason?: string) {
    return extractData(request.post(`/api/players/${uid}/kick`, { reason }))
  },

  // 发送物品
  giveItem(uid: number, itemId: number, count: number, expireTime?: number) {
    return extractData(request.post(`/api/items/${uid}`, { itemId, count, expireTime }))
  },

  // 发送精灵
  givePet(uid: number, petId: number, level: number, shiny: boolean, customStats?: {
    dvHp?: number;
    dvAtk?: number;
    dvDef?: number;
    dvSpAtk?: number;
    dvSpDef?: number;
    dvSpeed?: number;
    evHp?: number;
    evAtk?: number;
    evDef?: number;
    evSpAtk?: number;
    evSpDef?: number;
    evSpeed?: number;
    nature?: number;
    skills?: number[];
    effectList?: Array<{
      itemId: number;
      status: number;
      leftCount: number;
      effectID: number;
      args: string;
    }>;
  }) {
    return extractData(request.post(`/api/pets/${uid}`, { petId, level, shiny, customStats }))
  },

  // 更新精灵数据
  updatePet(data: {
    uid: number;
    catchTime: number;
    level?: number;
    nature?: number;
    exp?: number;
    evHp?: number;
    evAtk?: number;
    evDef?: number;
    evSpAtk?: number;
    evSpDef?: number;
    evSpeed?: number;
    dvHp?: number;
    dvAtk?: number;
    dvDef?: number;
    dvSpAtk?: number;
    dvSpDef?: number;
    dvSpeed?: number;
    skills?: number[];
    effectList?: Array<{
      itemId: number;
      status: number;
      leftCount: number;
      effectID: number;
      args: string;
    }>;
  }) {
    return extractData(request.patch(`/api/pets/${data.uid}`, data))
  },

  // 修改金币
  modifyCoins(uid: number, amount: number) {
    return extractData(request.patch(`/api/currency/${uid}/coins`, { amount }))
  },

  // ==================== 服务器管理 ====================

  // 获取服务器状态
  getServerStatus() {
    return extractData(request.get('/api/server/status'))
  },

  // 全服公告
  sendAnnouncement(message: string, type: string) {
    return extractData(request.post('/api/server/announcement', { message, type }))
  },

  // 获取在线玩家
  getOnlinePlayers() {
    return extractData(request.get('/api/server/online'))
  },

  // ==================== 日志查询 ====================

  // 获取操作日志
  getLogs(params: { page: number; limit: number; type?: string; uid?: number }) {
    return extractData(request.get('/api/logs', { params }))
  }
}
