"use strict";
/**
 * 命令输出格式化工具
 * 提供统一的高级显示格式
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandOutput = void 0;
class CommandOutput {
    /**
     * 显示成功消息
     */
    static async success(arg, message, details) {
        await arg.sendMsg(`\x1b[32m✓ ${message}\x1b[0m`);
        if (details) {
            await arg.sendMsg(`  \x1b[2m${details}\x1b[0m`);
        }
    }
    /**
     * 显示错误消息
     */
    static async error(arg, message, details) {
        await arg.sendMsg(`\x1b[31m✗ ${message}\x1b[0m`);
        if (details) {
            await arg.sendMsg(`  \x1b[2m${details}\x1b[0m`);
        }
    }
    /**
     * 显示警告消息
     */
    static async warning(arg, message) {
        await arg.sendMsg(`\x1b[33m⚠ ${message}\x1b[0m`);
    }
    /**
     * 显示信息消息
     */
    static async info(arg, message) {
        await arg.sendMsg(`\x1b[36mℹ ${message}\x1b[0m`);
    }
    /**
     * 显示信息框
     */
    static async infoBox(arg, title, items) {
        await arg.sendMsg('');
        await arg.sendMsg(`\x1b[1m\x1b[36m┌─ ${title} ${'─'.repeat(Math.max(0, 56 - title.length))}┐\x1b[0m`);
        for (const [key, value] of Object.entries(items)) {
            const line = `  ${key}: ${value}`;
            const padding = ' '.repeat(Math.max(0, 58 - this.stripAnsi(line).length));
            await arg.sendMsg(`\x1b[36m│\x1b[0m ${key}: \x1b[33m${value}\x1b[0m${padding}\x1b[36m│\x1b[0m`);
        }
        await arg.sendMsg(`\x1b[1m\x1b[36m└${'─'.repeat(60)}┘\x1b[0m`);
        await arg.sendMsg('');
    }
    /**
     * 显示表格
     */
    static async table(arg, headers, rows, title) {
        if (rows.length === 0) {
            await this.warning(arg, '没有数据');
            return;
        }
        // 计算列宽
        const colWidths = headers.map((h, i) => {
            const maxDataWidth = Math.max(...rows.map(r => String(r[i] || '').length));
            return Math.max(h.length, maxDataWidth);
        });
        await arg.sendMsg('');
        // 标题
        if (title) {
            const totalWidth = colWidths.reduce((a, b) => a + b, 0) + (colWidths.length - 1) * 3 + 4;
            await arg.sendMsg(`\x1b[1m\x1b[36m┌─ ${title} ${'─'.repeat(Math.max(0, totalWidth - title.length - 4))}┐\x1b[0m`);
        }
        else {
            const totalWidth = colWidths.reduce((a, b) => a + b, 0) + (colWidths.length - 1) * 3 + 4;
            await arg.sendMsg(`\x1b[1m\x1b[36m┌${'─'.repeat(totalWidth - 2)}┐\x1b[0m`);
        }
        // 表头
        const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join(' │ ');
        await arg.sendMsg(`\x1b[36m│\x1b[0m \x1b[1m${headerLine}\x1b[0m \x1b[36m│\x1b[0m`);
        // 分隔线
        const separatorLine = colWidths.map(w => '─'.repeat(w)).join('─┼─');
        await arg.sendMsg(`\x1b[36m├─${separatorLine}─┤\x1b[0m`);
        // 数据行
        for (const row of rows) {
            const rowLine = row.map((cell, i) => String(cell).padEnd(colWidths[i])).join(' │ ');
            await arg.sendMsg(`\x1b[36m│\x1b[0m ${rowLine} \x1b[36m│\x1b[0m`);
        }
        // 底部
        const totalWidth = colWidths.reduce((a, b) => a + b, 0) + (colWidths.length - 1) * 3 + 4;
        await arg.sendMsg(`\x1b[1m\x1b[36m└${'─'.repeat(totalWidth - 2)}┘\x1b[0m`);
        await arg.sendMsg('');
    }
    /**
     * 显示列表
     */
    static async list(arg, items, title) {
        await arg.sendMsg('');
        if (title) {
            await arg.sendMsg(`\x1b[1m\x1b[36m▶ ${title}\x1b[0m`);
            await arg.sendMsg(`\x1b[2m${'─'.repeat(60)}\x1b[0m`);
        }
        for (const item of items) {
            const color = item.highlight ? '\x1b[33m' : '\x1b[0m';
            await arg.sendMsg(`  ${item.label}: ${color}${item.value}\x1b[0m`);
        }
        await arg.sendMsg('');
    }
    /**
     * 显示分组列表
     */
    static async groupedList(arg, groups) {
        await arg.sendMsg('');
        for (const [groupName, items] of Object.entries(groups)) {
            if (items.length === 0)
                continue;
            await arg.sendMsg(`  \x1b[1m\x1b[33m▶ ${groupName}\x1b[0m`);
            await arg.sendMsg(`  \x1b[2m${'─'.repeat(58)}\x1b[0m`);
            for (const item of items) {
                await arg.sendMsg(`    ${item.label}: \x1b[36m${item.value}\x1b[0m`);
            }
            await arg.sendMsg('');
        }
    }
    /**
     * 显示进度信息
     */
    static async progress(arg, message) {
        await arg.sendMsg(`\x1b[33m⏳ ${message}\x1b[0m`);
    }
    /**
     * 显示用法提示
     */
    static async usage(arg, usage, examples) {
        await arg.sendMsg(`\x1b[33m用法: ${usage}\x1b[0m`);
        if (examples && examples.length > 0) {
            await arg.sendMsg('\n\x1b[2m示例:\x1b[0m');
            for (const example of examples) {
                await arg.sendMsg(`  \x1b[2m${example}\x1b[0m`);
            }
        }
    }
    /**
     * 显示可用子命令
     */
    static async availableSubcommands(arg, subcommands) {
        await arg.sendMsg(`\x1b[33m可用的子命令: ${subcommands.join(', ')}\x1b[0m`);
    }
    /**
     * 去除 ANSI 转义码（用于计算实际长度）
     */
    static stripAnsi(str) {
        return str.replace(/\x1b\[[0-9;]*m/g, '');
    }
}
exports.CommandOutput = CommandOutput;
//# sourceMappingURL=CommandOutput.js.map