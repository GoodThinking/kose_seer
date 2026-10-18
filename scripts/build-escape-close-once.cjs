'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {values} = parseArgs({options: Object.fromEntries(['baseline','out','java','ffdec'].map(name => [name,{type:'string'}]))});
for (const name of ['baseline','out','java','ffdec']) assert.ok(values[name], 'Missing --' + name);
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const relative = 'client/assets/resource/module/PetFightDLL.swf';
const key = 'com/robot/petFightModule/PetFightEntry';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function parse(raw) {
  const signature = raw.subarray(0,3).toString();
  assert.ok(['FWS','CWS'].includes(signature), 'Unsupported SWF');
  const body = signature === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0,offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) {size = body.readUInt32LE(offset); offset += 4;}
    const payload = body.subarray(offset,offset+size); offset += size;
    tags.push({code, name: code === 82 ? payload.subarray(4,payload.indexOf(0,4)).toString() : null, raw: body.subarray(start,offset)});
    if (!code) break;
  }
  assert.equal(offset,body.length,'Invalid SWF tags');
  return {raw,header,tags,signature};
}
function encode(source, tags) {
  const body = Buffer.concat([source.header,...tags.map(tag=>tag.raw)]), header = Buffer.from(source.raw.subarray(0,8));
  header.writeUInt32LE(body.length+8,4);
  return Buffer.concat([header,source.signature === 'CWS' ? zlib.deflateSync(body,{level:9}) : body]);
}
const original = parse(fs.readFileSync(path.join(baseline,relative)));
assert.equal(sha(original.raw),'8f9827b56a5071b42bebcd455a3c0b7e84e1c0aadd7789c5302588e668ad9893','Unexpected battle module baseline');
const overlayRelative = 'client/overlay/resource/module/PetFightDLL.swf';
const overlay = parse(fs.readFileSync(path.join(baseline,overlayRelative)));
assert.equal(sha(overlay.raw),'cbe79af4296e179180ec0e1b5825d17f5e221d59a802b5373f4cc28112ee393a','Unexpected battle overlay baseline');
const entryTag = source => source.tags.filter(tag=>tag.name===key);
assert.equal(entryTag(overlay).length,1,'Expected one overlay battle entry');
assert.ok(entryTag(overlay)[0].raw.equals(entryTag(original)[0].raw),'Battle entries differ; reconcile their behavior first');
const core = parse(fs.readFileSync(path.join(baseline,'client/assets/dll/NieoCore.swf')));
const compiler = path.join(out,'compiler'), imports = path.join(compiler,'import/scripts/com/robot/petFightModule');
fs.mkdirSync(imports,{recursive:true});
fs.copyFileSync(path.join(__dirname,'../compat/client-patches/escape-close-once/PetFightEntry.as'),path.join(imports,'PetFightEntry.as'));
// Core ABC declarations are compiler inputs only; never ship them in the battle module.
const input = path.join(compiler,'input.swf'), compiled = path.join(compiler,'compiled.swf');
const end = original.tags.findIndex(tag=>tag.code===0);
fs.writeFileSync(input,encode(original,[...original.tags.slice(0,end),...core.tags.filter(tag=>tag.code===82),...original.tags.slice(end)]));
execFileSync(values.java,['-Djava.awt.headless=true','-jar',values.ffdec,'-onerror','abort','-importScript',input,compiled,path.join(compiler,'import')],{stdio:'inherit',timeout:120000});
const replacements = parse(fs.readFileSync(compiled)).tags.filter(tag=>tag.code===82 && tag.name===key);
assert.equal(replacements.length,1,'Expected one replacement class');
assert.equal(original.tags.filter(tag=>tag.name===key).length,1,'Expected one original class');
const files = [];
for (const [source,relativePath] of [[original,relative],[overlay,overlayRelative]]) {
  const result = encode(source,source.tags.map(tag=>tag.name===key?replacements[0]:tag));
  const target = path.join(out,relativePath);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,result);
  files.push({path:relativePath,before:sha(source.raw),after:sha(result)});
}
const manifest = {files,changedNativeClasses:[key],serverFilesChanged:false,noDatabaseMigration:true};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest));
