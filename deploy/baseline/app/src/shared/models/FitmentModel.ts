/**
 * 家具信息接口
 */
export interface IFitmentInfo {
  id: number;      // 家具ID
  x: number;       // X坐标
  y: number;       // Y坐标
  dir: number;     // 方向 (0-3)
  status: number;  // 状态 (0=未使用, 1=使用中)
}

/**
 * 玩家家具数据接口
 */
export interface IPlayerFitmentInfo {
  userId: number;           // 用户ID
  fitments: IFitmentInfo[]; // 家具列表
}
