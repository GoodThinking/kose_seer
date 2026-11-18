"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 迁移脚本导出
 */
__exportStar(require("./001_create_accounts"), exports);
__exportStar(require("./002_create_sessions"), exports);
__exportStar(require("./003_create_players"), exports);
__exportStar(require("./004_create_pets"), exports);
__exportStar(require("./005_create_email_codes"), exports);
__exportStar(require("./006_create_items"), exports);
__exportStar(require("./007_add_nono_fields"), exports);
__exportStar(require("./009_create_gm_whitelist"), exports);
__exportStar(require("./010_create_gm_sessions"), exports);
__exportStar(require("./013_add_allocatable_exp"), exports);
__exportStar(require("./014_add_mess_win_and_cur_title"), exports);
__exportStar(require("./016_add_gold_field"), exports);
__exportStar(require("./018_create_challenge_progress_table"), exports);
__exportStar(require("./019_add_challenge_fields_to_players"), exports);
//# sourceMappingURL=index.js.map