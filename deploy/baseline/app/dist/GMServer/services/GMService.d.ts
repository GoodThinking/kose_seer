export declare class GMService {
    private playerService;
    private serverService;
    constructor();
    getPlayers(page: number, limit: number, search?: string, onlineOnly?: boolean): Promise<any>;
    getPlayerDetail(uid: number): Promise<any>;
    updatePlayer(uid: number, field: string, value: any): Promise<void>;
    banPlayer(uid: number, banType: number, reason?: string): Promise<void>;
    kickPlayer(uid: number, reason?: string): Promise<void>;
    giveItem(uid: number, itemId: number, count: number, expireTime?: number): Promise<void>;
    givePet(uid: number, petId: number, level: number, shiny: boolean): Promise<void>;
    modifyCoins(uid: number, amount: number): Promise<void>;
    getServerStatus(): Promise<any>;
    sendAnnouncement(message: string, type: string): Promise<void>;
    getLogs(page: number, limit: number, type?: string, uid?: number): Promise<any>;
}
//# sourceMappingURL=GMService.d.ts.map