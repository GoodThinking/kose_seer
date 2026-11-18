/**
 * 自动生成 meta 文件的脚本
 * 扫描所有 proto 文件，提取 CMD 信息并生成 meta 定义
 */

const fs = require('fs');
const path = require('path');

// 协议目录
const REQ_DIR = path.join(__dirname, '../src/shared/proto/packets/req');
const RSP_DIR = path.join(__dirname, '../src/shared/proto/packets/rsp');
const META_DIR = path.join(__dirname, '../src/shared/protocol/meta');

// 模块映射
const MODULE_MAP = {
  battle: 'battle.meta.ts',
  friend: 'social.meta.ts',
  item: 'item.meta.ts',
  login: 'login.meta.ts',
  map: 'map.meta.ts',
  nono: 'nono.meta.ts',
  pet: 'pet.meta.ts',
  server: 'server.meta.ts',
  task: 'system.meta.ts',
  user: 'system.meta.ts',
  mail: 'system.meta.ts',
  exchange: 'system.meta.ts',
  soulbead: 'system.meta.ts',
  vip: 'system.meta.ts',
  system: 'system.meta.ts'
};

// 扫描目录获取所有 proto 文件
function scanProtoFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...scanProtoFiles(fullPath));
    } else if (item.endsWith('Proto.ts')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// 从文件内容中提取 CMD 信息
function extractCmdInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 提取 CMD 注释：[CMD: 2001 ENTER_MAP] 描述
  const cmdMatch = content.match(/\[CMD:\s*(\d+)\s+(\w+)\]\s*(.+)/);
  if (!cmdMatch) return null;
  
  const [, cmdId, cmdName, desc] = cmdMatch;
  
  // 提取请求字段
  const requestFields = [];
  const requestMatches = content.matchAll(/(\w+):\s*(\w+(?:\[\])?)\s*=.+?\/\/\s*(.+)/g);
  for (const match of requestMatches) {
    const [, name, type, comment] = match;
    // 跳过继承的字段
    if (name !== 'cmdId' && name !== 'result') {
      requestFields.push({ name, type, comment });
    }
  }
  
  // 判断是请求还是响应
  const isRequest = filePath.includes('/req/');
  const module = path.basename(path.dirname(filePath));
  
  return {
    cmdId: parseInt(cmdId),
    cmdName,
    desc: desc.trim(),
    module,
    isRequest,
    fields: requestFields,
    filePath
  };
}

// 生成 meta 内容
function generateMeta(protocols) {
  const grouped = {};
  
  // 按模块分组
  for (const proto of protocols) {
    const metaFile = MODULE_MAP[proto.module] || 'system.meta.ts';
    if (!grouped[metaFile]) {
      grouped[metaFile] = [];
    }
    grouped[metaFile].push(proto);
  }
  
  // 为每个 meta 文件生成内容
  for (const [metaFile, protos] of Object.entries(grouped)) {
    const metaPath = path.join(META_DIR, metaFile);
    
    // 按 cmdId 排序
    protos.sort((a, b) => a.cmdId - b.cmdId);
    
    // 生成内容
    const lines = [
      `import { CommandID } from '../CommandID';`,
      `import { ICommandMeta } from './CommandMetaRegistry';`,
      ``,
      `/**`,
      ` * ${metaFile.replace('.meta.ts', '')} 模块协议元数据`,
      ` * 自动生成，请勿手动修改`,
      ` */`,
      `export const ${metaFile.replace('.meta.ts', '')}Meta: ICommandMeta[] = [`
    ];
    
    for (const proto of protos) {
      lines.push(`  /**`);
      lines.push(`   * ${proto.desc}`);
      lines.push(`   */`);
      lines.push(`  {`);
      lines.push(`    cmdID: CommandID.${proto.cmdName},`);
      lines.push(`    name: '${proto.cmdName}',`);
      lines.push(`    category: '${proto.module}',`);
      lines.push(`    desc: '${proto.desc}',`);
      
      if (proto.fields.length > 0) {
        lines.push(`    ${proto.isRequest ? 'request' : 'response'}: [`);
        for (const field of proto.fields) {
          lines.push(`      { name: '${field.name}', type: '${field.type}', desc: '${field.comment}' },`);
        }
        lines.push(`    ]`);
      }
      
      lines.push(`  },`);
    }
    
    lines.push(`];`);
    lines.push(``);
    
    const content = lines.join('\n');
    
    console.log(`生成 ${metaFile}: ${protos.length} 个协议`);
    fs.writeFileSync(metaPath, content, 'utf8');
  }
}

// 主函数
function main() {
  console.log('扫描 proto 文件...');
  
  const reqFiles = scanProtoFiles(REQ_DIR);
  const rspFiles = scanProtoFiles(RSP_DIR);
  
  console.log(`找到 ${reqFiles.length} 个请求 proto`);
  console.log(`找到 ${rspFiles.length} 个响应 proto`);
  
  const protocols = [];
  
  for (const file of [...reqFiles, ...rspFiles]) {
    const info = extractCmdInfo(file);
    if (info) {
      protocols.push(info);
    }
  }
  
  console.log(`提取到 ${protocols.length} 个协议信息`);
  console.log('生成 meta 文件...');
  
  generateMeta(protocols);
  
  console.log('完成！');
}

main();
