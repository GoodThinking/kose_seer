/**
 * 家具信息接口
 */
export interface IFitmentInfo {
    id: number;
    x: number;
    y: number;
    dir: number;
    status: number;
}
/**
 * 玩家家具数据接口
 */
export interface IPlayerFitmentInfo {
    userId: number;
    fitments: IFitmentInfo[];
}
//# sourceMappingURL=FitmentModel.d.ts.map