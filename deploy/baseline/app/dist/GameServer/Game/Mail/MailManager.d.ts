import { BaseManager } from '../Base/BaseManager';
import { PlayerInstance } from '../Player/PlayerInstance';
import { MailData } from '../../../DataBase/models/MailData';
export declare class MailManager extends BaseManager {
    MailData: MailData;
    constructor(player: PlayerInstance);
    Initialize(): Promise<void>;
    HandleGetMailList(): Promise<void>;
    HandleGetUnreadCount(): Promise<void>;
    HandleReadMail(mailId: number): Promise<void>;
    HandleMarkAsRead(mailId: number): Promise<void>;
    HandleDeleteMail(mailId: number): Promise<void>;
    HandleDeleteAllRead(): Promise<void>;
}
//# sourceMappingURL=MailManager.d.ts.map