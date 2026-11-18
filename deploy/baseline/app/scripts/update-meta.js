/**
 * 更新指定模块的 meta 文件
 * 用法: node scripts/update-meta.js battle map item
 * 或者: node scripts/update-meta.js --all (更新所有)
 */

const fs = require('fs');
const path = require('path');

// 协议目录
const REQ_DIR = path.join(__dirname, '../src/shared/proto/packets/req');
const RSP_DIR = path.join(__dirname, '../src/shared/proto/packets/rsp');
const META_DIR = path.join(__dirname, '../src/shared/protocol/meta');

// 模块到 meta 文件的映射
const MODULE_TO_META = {
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

// 可用的模块列表
const AVAILABLE_MODULES = Object.keys(MODULE_TO_META);

// 扫描指定模块的 proto 文件
function scanModuleProtos(moduleName) {
  const results = [];
  
  // 扫描请求目录
  const reqModuleDir = path.join(REQ_DIR, moduleName);
  if (fs.existsSync(reqModuleDir)) {
    const files = fs.readdirSync(reqModuleDir);
    for (const file of files) {
      if (file.endsWith('Proto.ts')) {
        results.push(path.join(reqModuleDir, file));
      }
    }
  }
  
  // 扫描响应目录
  const rspModuleDir = path.join(RSP_DIR, moduleName);
  if (fs.existsSync(rspModuleDir)) {
    const files = fs.readdirSync(rspModuleDir);
    for (const file of files) {
      if (file.endsWith('Proto.ts')) {
        results.push(path.join(rspModuleDir, file));
      }
    }
  }
  
  return results;
}

// 从文件内容中提取 CMD 信息
function extractCmdInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 尝试匹配两种格式：
  // 格式1: [CMD: 2001 ENTER_MAP] 描述
  // 格式2: [CMD: CREATE_ROLE (108)] 描述
  let cmdMatch = content.match(/\[CMD:\s*(\d+)\s+(\w+)\]\s*(.+)/);
  let cmdId, cmdName, desc;
  
  if (cmdMatch) {
    // 格式1
    [, cmdId, cmdName, desc] = cmdMatch;
  } else {
    // 尝试格式2
    cmdMatch = content.match(/\[CMD:\s*(\w+)\s*\((\d+)\)\]\s*(.+)/);
    if (cmdMatch) {
      [, cmdName, cmdId, desc] = cmdMatch;
    } else {
      console.warn(`⚠️  ${path.basename(filePath)}: 未找到 CMD 注释`);
      return null;
    }
  }
  
  // 提取字段定义
  const fields = [];
  
  // 匹配所有字段定义（带或不带注释）
  // 格式1: fieldName: type = value; // comment
  // 格式2: fieldName: type = value;
  const fieldPattern = /^\s+(\w+):\s*(\w+(?:\[\])?)\s*=\s*[^;]+;(?:\s*\/\/\s*(.+))?/gm;
  const fieldMatches = content.matchAll(fieldPattern);
  
  for (const match of fieldMatches) {
    const [, name, type, comment] = match;
    // 跳过继承的字段
    if (name !== 'cmdId' && name !== 'result') {
      // 转换类型名称
      let fieldType = type;
      if (type === 'number') fieldType = 'uint32';
      else if (type === 'string') fieldType = 'string';
      else if (type === 'Buffer') fieldType = 'bytes';
      else if (type.endsWith('[]')) fieldType = 'array';
      
      fields.push({ 
        name, 
        type: fieldType, 
        comment: comment ? comment.trim() : '' 
      });
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
    fields,
    fileName: path.basename(filePath)
  };
}

// 生成单个 meta 文件
function generateMetaFile(metaFileName, protocols) {
  const metaPath = path.join(META_DIR, metaFileName);
  
  // 按 cmdId 排序，然后按请求/响应分组
  protocols.sort((a, b) => {
    if (a.cmdId !== b.cmdId) return a.cmdId - b.cmdId;
    return a.isRequest ? -1 : 1; // 请求在前
  });
  
  // 合并同一个 cmdId 的请求和响应
  const merged = [];
  const cmdMap = new Map();
  
  for (const proto of protocols) {
    const key = proto.cmdId;
    if (!cmdMap.has(key)) {
      cmdMap.set(key, {
        cmdId: proto.cmdId,
        cmdName: proto.cmdName,
        desc: proto.desc,
        module: proto.module,
        request: null,
        response: null
      });
      merged.push(cmdMap.get(key));
    }
    
    const entry = cmdMap.get(key);
    if (proto.isRequest) {
      entry.request = proto.fields.length > 0 ? proto.fields : null;
    } else {
      entry.response = proto.fields.length > 0 ? proto.fields : null;
    }
  }
  
  // 生成内容
  const metaName = metaFileName.replace('.meta.ts', '');
  const lines = [
    `import { CommandID } from '../CommandID';`,
    `import { ICommandMeta } from './CommandMetaRegistry';`,
    ``,
    `/**`,
    ` * ${metaName} 模块协议元数据`,
    ` */`,
    `export const ${metaName}Meta: ICommandMeta[] = [`
  ];
  
  for (const entry of merged) {
    lines.push(`  /**`);
    lines.push(`   * ${entry.desc}`);
    lines.push(`   */`);
    lines.push(`  {`);
    lines.push(`    cmdID: CommandID.${entry.cmdName},`);
    lines.push(`    name: '${entry.cmdName}',`);
    lines.push(`    desc: '${entry.desc}',`);
    
    // 请求字段
    if (entry.request && entry.request.length > 0) {
      lines.push(`    request: [`);
      for (const field of entry.request) {
        lines.push(`      { name: '${field.name}', type: '${field.type}', desc: '${field.comment}' },`);
      }
      lines.push(`    ],`);
    }
    
    // 响应字段
    if (entry.response && entry.response.length > 0) {
      lines.push(`    response: [`);
      for (const field of entry.response) {
        lines.push(`      { name: '${field.name}', type: '${field.type}', desc: '${field.comment}' },`);
      }
      lines.push(`    ]`);
    } else if (entry.request && entry.request.length > 0) {
      // 如果只有request没有response，去掉最后的逗号
      const lastLine = lines[lines.length - 1];
      lines[lines.length - 1] = lastLine.replace(/,$/, '');
    }
    
    lines.push(`  },`);
  }
  
  lines.push(`];`);
  lines.push(``);
  
  const content = lines.join('\n');
  fs.writeFileSync(metaPath, content, 'utf8');
  
  return merged.length;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法:');
    console.log('  node scripts/update-meta.js <module1> <module2> ...');
    console.log('  node scripts/update-meta.js --all');
    console.log('');
    console.log('可用模块:');
    console.log('  ' + AVAILABLE_MODULES.join(', '));
    process.exit(0);
  }
  
  // 确定要更新的模块
  let modulesToUpdate = [];
  if (args.includes('--all')) {
    modulesToUpdate = AVAILABLE_MODULES;
  } else {
    modulesToUpdate = args.filter(arg => AVAILABLE_MODULES.includes(arg));
    const invalid = args.filter(arg => !AVAILABLE_MODULES.includes(arg) && arg !== '--all');
    if (invalid.length > 0) {
      console.error(`❌ 无效的模块: ${invalid.join(', ')}`);
      console.log(`可用模块: ${AVAILABLE_MODULES.join(', ')}`);
      process.exit(1);
    }
  }
  
  if (modulesToUpdate.length === 0) {
    console.error('❌ 没有指定要更新的模块');
    process.exit(1);
  }
  
  console.log(`📦 准备更新 ${modulesToUpdate.length} 个模块的 meta 文件\n`);
  
  // 收集所有协议信息
  const protocolsByMeta = {};
  
  for (const moduleName of modulesToUpdate) {
    console.log(`🔍 扫描模块: ${moduleName}`);
    const protoFiles = scanModuleProtos(moduleName);
    
    if (protoFiles.length === 0) {
      console.log(`   ⚠️  未找到 proto 文件`);
      continue;
    }
    
    console.log(`   找到 ${protoFiles.length} 个 proto 文件`);
    
    for (const file of protoFiles) {
      const info = extractCmdInfo(file);
      if (info) {
        const metaFile = MODULE_TO_META[moduleName];
        if (!protocolsByMeta[metaFile]) {
          protocolsByMeta[metaFile] = [];
        }
        protocolsByMeta[metaFile].push(info);
        const fieldCount = info.fields.length;
        const fieldInfo = fieldCount > 0 ? ` (${fieldCount} fields)` : '';
        console.log(`   ✓ ${info.cmdName} (${info.cmdId})${fieldInfo} [${info.isRequest ? 'REQ' : 'RSP'}]`);
      }
    }
  }
  
  // 生成 meta 文件
  console.log(`\n📝 生成 meta 文件:\n`);
  
  let totalProtocols = 0;
  for (const [metaFile, protocols] of Object.entries(protocolsByMeta)) {
    const count = generateMetaFile(metaFile, protocols);
    totalProtocols += count;
    console.log(`   ✓ ${metaFile}: ${count} 个协议`);
  }
  
  console.log(`\n✅ 完成！共更新 ${totalProtocols} 个协议定义`);
}

main();
