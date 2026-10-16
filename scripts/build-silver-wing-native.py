#!/usr/bin/env python3
"""Build Silver Wing as native vector clothing, using the client's timeline ABI."""
import argparse
import hashlib
import json
import math
import struct
import zlib
from pathlib import Path


class Bits:
    def __init__(self):
        self.values = []

    def put(self, value, count):
        self.values.extend((value >> shift) & 1 for shift in range(count - 1, -1, -1))

    def finish(self):
        self.values.extend([0] * (-len(self.values) % 8))
        return bytes(sum(self.values[offset + bit] << (7 - bit) for bit in range(8))
                     for offset in range(0, len(self.values), 8))


def width(values):
    return max(1, max(abs(int(value)).bit_length() + 1 for value in values))


def rect(values):
    bits = Bits()
    size = width(values)
    bits.put(size, 5)
    for value in values:
        bits.put(value, size)
    return bits.finish()


def matrix(scale=1, mirror=1, x=0, y=0, angle=0):
    bits = Bits()
    a = math.radians(angle)
    values = [round(math.cos(a) * scale * mirror * 65536), round(math.cos(a) * scale * 65536)]
    bits.put(1, 1)
    bits.put(width(values), 5)
    for value in values:
        bits.put(value, width(values))
    bits.put(bool(angle), 1)
    if angle:
        values = [round(math.sin(a) * scale * mirror * 65536), round(-math.sin(a) * scale * 65536)]
        bits.put(width(values), 5)
        for value in values:
            bits.put(value, width(values))
    values = [round(x * 20), round(y * 20)]
    bits.put(width(values), 5)
    for value in values:
        bits.put(value, width(values))
    return bits.finish()


def tag(kind, data=b''):
    return (struct.pack('<H', (kind << 6) | len(data)) if len(data) < 63
            else struct.pack('<HI', (kind << 6) | 63, len(data))) + data


def records(path):
    source = path.read_bytes()
    body = zlib.decompress(source[8:]) if source[:3] == b'CWS' else source[8:]
    if len(body) + 8 != struct.unpack_from('<I', source, 4)[0]:
        raise ValueError('Invalid SWF length')
    offset = (5 + 4 * (body[0] >> 3) + 7) // 8 + 4
    result = []
    while offset < len(body):
        header = struct.unpack_from('<H', body, offset)[0]
        offset += 2
        size = header & 63
        if size == 63:
            size = struct.unpack_from('<I', body, offset)[0]
            offset += 4
        result.append((header >> 6, body[offset:offset + size]))
        offset += size
    return result


def place(character, depth, transform=None, move=False, name=None):
    flags = 4 | (1 if move else 2) | (32 if name else 0)
    data = struct.pack('<BH', flags, depth)
    if not move:
        data += struct.pack('<H', character)
    return tag(26, data + (transform or matrix()) + (name.encode() + b'\0' if name else b''))


def sprite(character, frames, commands):
    return tag(39, struct.pack('<HH', character, frames) + b''.join(commands) + tag(0))


def save(path, definitions, root=b''):
    body = rect([0, 11000, 0, 8000]) + struct.pack('<HH', 24 * 256, 1)
    body += tag(69, struct.pack('<I', 8)) + definitions + root + tag(1) + tag(0)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b'CWS\x09' + struct.pack('<I', len(body) + 8) + zlib.compress(body, 9))


INK = '#243b50'
SILVER = '#dce9ef'
SHADE = '#879eaf'
WHITE = '#f8ffff'
BLUE = '#59d7ec'
DEEP = '#299ab8'
DARK = '#193448'
RED = '#f36a60'


def polygon(points, color, stroke=INK, line=.7):
    return {'points': points, 'fill': color, 'stroke': stroke, 'line': line}


def ellipse(x, y, rx, ry, color, stroke=INK, line=.7):
    # Polygonal sampling becomes native SWF edges, never raster scaling.
    return polygon([(x + rx * math.cos(i * math.tau / 32), y + ry * math.sin(i * math.tau / 32))
                    for i in range(32)], color, stroke, line)


def artwork(slot, view):
    """Five separately composed views; only right/left symmetry shares geometry."""
    side = view == 'side'
    rear = view in ('rear', 'back')
    quarter = view in ('quarter', 'rear')
    shift = -4 if quarter else -9 if side else 0
    pieces = []
    if slot == 'head':
        # Helmet fits the original spherical Seer, not humanoid concept-art anatomy.
        pieces += [ellipse(0, -4, 18, 17.8, SILVER)]
        pieces += [polygon([(0,-19.6),(10,-16),(15.5,-8),(15,4),(9,11),(3,13),(8,4),(9,-8)], SHADE, None)]
        pieces += [polygon([(-14,-12),(-17,-24),(-9,-18),(-6,-13)], SILVER),
                   polygon([(8,-16),(16,-24),(15,-10),(11,-5)], SILVER)]
        pieces += [polygon([(-3+shift,-17),(shift,-27),(4+shift,-18),(shift,-13)], SILVER),
                   polygon([(shift,-20.5),(shift+2.4,-17),(shift,-13.7),(shift-2.4,-17)], RED, INK,.5)]
        if not rear:
            vx = shift if not side else -6.5
            rx = 10 if not side else 7.6
            pieces += [ellipse(vx, 1, rx+1.5, 10, SHADE), ellipse(vx,1,rx,8.8,DARK)]
            # Face uses simple native eyes; perspective hides the far eye in profile.
            eyes = [(vx-3.4,1.2,2.3,4.6),(vx+3.4,1.2,2.3,4.6)] if not side else [(vx-2,1.2,2.6,4.5)]
            for x,y,eye_rx,eye_ry in eyes:
                pieces.append(ellipse(x,y,eye_rx,eye_ry,BLUE,None))
            pieces.append(polygon([(vx-rx+1,-4),(vx-1,-6),(vx+2,-5),(vx-rx+2,-2)],WHITE,None))
        else:
            pieces += [polygon([(-8,-11),(7,-11),(10,2),(5,9),(-6,9),(-10,2)],SHADE),
                       polygon([(-4,-9),(2,-9),(3,6),(-4,6)],BLUE),
                       polygon([(-7,11),(7,11),(6,13),(-6,13)],DARK,None)]
        earx = 12 if not side else 7
        pieces += [ellipse(earx,0,3,5,SHADE),ellipse(earx,0,1.4,2.7,BLUE,INK,.45)]
        pieces.append(polygon([(-11,-13),(-5,-17),(0,-17),(-8,-12)],WHITE,None))
    elif slot == 'waist':
        pieces += [polygon([(-15,4),(-9,2),(9,2),(15,5),(14,13),(8,18),(-8,18),(-14,13)],SILVER),
                   polygon([(-14,10),(-6,14),(7,14),(14,10),(12,15),(7,19),(-7,19),(-13,15)],SHADE),
                   polygon([(-11,7),(-5,9),(5,9),(11,7),(8,12),(-8,12)],DARK)]
        cx = shift * .55
        pieces += [polygon([(cx,6),(cx+3.5,10),(cx,14),(cx-3.5,10)],BLUE),
                   polygon([(-7,16),(7,16),(7,18),(-7,18)],DARK,None)]
    elif slot == 'foot':
        # Independent boots pivot about the native leg sockets.
        positions = [(-6.5,20),(6.5,20)] if not side else [(3.5,20),(-4.5,21)]
        if quarter: positions=[(4.5,19),(-6,21)]
        for index,(x,y) in enumerate(positions):
            boot=[polygon([(x-1.5,y-7),(x+1.5,y-7),(x+2,y-1),(x-2,y-1)],DARK),
                  polygon([(x-3,y-3),(x+3,y-3),(x+3,y+1),(x+5,y+5),(x+4,y+9),(x-4,y+9),(x-5,y+5),(x-3,y+1)],SILVER),
                  polygon([(x-4,y+6),(x+4,y+6),(x+4,y+9),(x-4,y+9)],SHADE),
                  polygon([(x-2,y),(x+2,y),(x+2,y+4),(x-2,y+4)],BLUE),
                  polygon([(x-3,y+9),(x+4,y+9),(x+4,y+10),(x-3,y+10)],DARK,None)]
            pieces.append({'group':boot,'pivot':[x,y-2],'phase':index})
    elif slot == 'hand':
        positions=[(15,8),(-15,8)] if not side else [(10,5),(-13,9)]
        for index,(x,y) in enumerate(positions):
            arm=[ellipse(x,y-2,3.8,5.3,SHADE),
                 polygon([(x-4,y-2),(x+3,y-2),(x+5,y+6),(x+3,y+11),(x-4,y+11),(x-5,y+5)],SILVER),
                 polygon([(x-4,y+7),(x+4,y+7),(x+3,y+12),(x-3,y+12)],DARK),
                 polygon([(x-2,y),(x+1,y),(x+2,y+5),(x-2,y+5)],BLUE)]
            if index==1:
                arm += [ellipse(x,y+9,3,2,DEEP),ellipse(x,y+9,1.6,.9,RED,None)]
            pieces.append({'group':arm,'pivot':[x,y-4],'phase':index})
    elif slot == 'top':
        # The native top slot renders last. Keep wings outside the body silhouette.
        spans=[(-1,1),(1,1)] if not side else [(1,.55),(-1,.75)]
        if quarter: spans=[(1,.65),(-1,1)]
        for sign,size in spans:
            def p(coords):
                return [(sign*(16+(x-16)*size),y) for x,y in coords]
            pieces += [polygon(p([(16,3),(23,-14),(31,-22),(27,-3),(21,12),(17,14)]),SILVER),
                       polygon(p([(18,3),(24,-12),(28,-16),(24,-2),(19,10)]),BLUE),
                       polygon(p([(17,10),(26,6),(23,21),(18,16)]),SHADE),
                       polygon(p([(19,11),(24,8),(22,17)]),BLUE,None)]
    return pieces


def shape(character, piece, pivot=(0,0)):
    points=[(round((x-pivot[0])*20),round((y-pivot[1])*20)) for x,y in piece['points']]
    def rgba(color):
        return bytes.fromhex(color.lstrip('#')) + b'\xff'
    stroked=bool(piece['stroke'])
    bits=Bits(); bits.put(1,4); bits.put(int(stroked),4)
    bits.put(0,1); bits.put(5 | (8 if stroked else 0),5)
    bits.put(width(points[0]),5)
    for v in points[0]: bits.put(v,width(points[0]))
    bits.put(1,1)
    if stroked: bits.put(1,1)
    for (x,y),(xx,yy) in zip(points,points[1:]+points[:1]):
        dx,dy=xx-x,yy-y
        size=max(2,width([dx,dy]))
        bits.put(1,1); bits.put(1,1); bits.put(size-2,4)
        bits.put(1,1); bits.put(dx,size); bits.put(dy,size)
    bits.put(0,6)
    margin=math.ceil(piece['line']*10)
    bounds=[min(p[0] for p in points)-margin,max(p[0] for p in points)+margin,
            min(p[1] for p in points)-margin,max(p[1] for p in points)+margin]
    styles=b'\x01\x00'+rgba(piece['fill'])+bytes([int(stroked)])
    if stroked: styles+=struct.pack('<H',round(piece['line']*20))+rgba(piece['stroke'])
    return tag(32,struct.pack('<H',character)+rect(bounds)+styles+bits.finish())


MOUNTS={'head':(0,-14.7),'waist':(-14.45,.05),'hand':(0,0),'top':(-14.45,-16.95),'foot':(0,5.3)}
DIRECTIONS=[(0,'down',3,1),(7,'leftdown',6,1),(15,'left',8,1),(23,'leftup',11,1),
            (31,'up',14,1),(39,'rightup',11,-1),(47,'right',8,-1),(55,'rightdown',6,-1)]


def build(slot, template, scale=1, icon=False):
    definitions=b''.join(tag(k,d) for k,d in template if k==82)
    next_id=100
    # Native 13-frame ABI: frame 1 idle, 2..13 a twelve-frame gait.
    for sprite_id,view in [(3,'front'),(6,'quarter'),(8,'side'),(11,'rear'),(14,'back')]:
        draws=[]
        for piece in artwork(slot,view):
            group=piece.get('group',[piece]); pivot=piece.get('pivot',(0,0))
            children=[]
            for polygon_piece in group:
                definitions+=shape(next_id,polygon_piece,pivot)
                children.append(place(next_id,len(children)+1)); next_id+=1
            definitions+=sprite(next_id,1,children+[tag(1)])
            draws.append((next_id,pivot,piece.get('phase',0)))
            next_id+=1
        commands=[]
        for frame in range(13):
            phase=(frame-1)*math.tau/12 if frame else 0
            for depth,(character,pivot,offset) in enumerate(draws,1):
                angle=0; dy=0
                if frame:
                    if slot in ('hand','foot'):
                        angle=math.sin(phase+offset*math.pi)*(12 if slot=='hand' else 9)
                        dy=-max(0,math.sin(phase+offset*math.pi))*.8
                    else:
                        dy=(0,.2,.65,1.3,.65,.2)[(frame-1)%6]
                commands.append(place(character,depth,matrix(x=pivot[0],y=pivot[1]+dy,angle=angle),move=frame>0))
            commands.append(tag(1))
        definitions+=sprite(sprite_id,13,commands)
    definitions+=sprite(90,1,[tag(1)])
    commands=[]
    mount=MOUNTS[slot]
    for frame in range(63):
        for start,name,character,mirror in DIRECTIONS:
            if frame!=start: continue
            if frame:
                commands.append(tag(28,struct.pack('<H',1)))
                if slot=='hand': commands.append(tag(28,struct.pack('<H',2)))
            commands.append(tag(43,name.encode()+b'\0'))
            commands.append(place(character,1,matrix(scale,mirror,-mount[0]*scale,-mount[1]*scale)))
            if slot=='hand':
                commands.append(place(90,2,matrix(x=-15*mirror*scale,y=17*scale),name='muzzle'))
        commands.append(tag(1))
    definitions+=sprite(15,63,commands)
    definitions+=b''.join(tag(k,d) for k,d in template if k==76)
    if icon:
        # Icons use the same vector art and keep the native exported item symbol.
        bounds={'head':(-18,-28,36,42),'waist':(-16,1,32,19),'hand':(-21,-3,42,25),
                'top':(-32,-23,64,45),'foot':(-12,12,24,20)}[slot]
        x,y,w,h=bounds; factor=min(42/w,42/h)
        # The item root is placed on a 48px icon stage with a single static child.
        definitions=b''.join(tag(k,d) for k,d in records_from_bytes(definitions)
                             if not(k==39 and struct.unpack_from('<H',d)[0]==15))
        definitions+=sprite(15,1,[place(3,1,matrix(factor,1,24-(x+w/2)*factor,24-(y+h/2)*factor)),tag(1)])
    return definitions


def records_from_bytes(data):
    offset=0
    while offset<len(data):
        header=struct.unpack_from('<H',data,offset)[0]; offset+=2; size=header&63
        if size==63: size=struct.unpack_from('<I',data,offset)[0]; offset+=4
        yield header>>6,data[offset:offset+size]; offset+=size


def render_catalog(out, java, ffdec):
    """Render catalog PNGs from the same vectors; never advertise the old concept art."""
    import subprocess
    import tempfile
    from PIL import Image

    slots = ['head', 'waist', 'hand', 'top', 'foot']
    images = {str(199901 + index): [slot] for index, slot in enumerate(slots)}
    images['hero'] = ['foot', 'waist', 'hand', 'head', 'top']
    destination = out / 'resource/module/clothBook/silver-wing'
    destination.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='silver-wing-render-') as temporary:
        work = Path(temporary)
        for name, parts in images.items():
            definitions = b''
            commands = []
            character = 100
            for slot in parts:
                for piece in artwork(slot, 'front'):
                    for element in piece.get('group', [piece]):
                        definitions += shape(character, element)
                        commands.append(place(character, len(commands) + 1))
                        character += 1
            definitions += sprite(10000, 1, commands + [tag(1)])
            movie = work / f'{name}.swf'
            save(movie, definitions, place(10000, 1, matrix(4, 1, 160, 140)))
            rendered = work / name
            subprocess.run([str(java), '-Djava.awt.headless=true', '-jar', str(ffdec),
                            '-export', 'frame', str(rendered), str(movie)],
                           check=True, capture_output=True, text=True)
            frames = list(rendered.rglob('*.png'))
            if len(frames) != 1:
                raise ValueError(f'Expected one catalog frame for {name}, got {frames}')
            with Image.open(frames[0]) as image:
                art = image.convert('RGBA')
            art = art.crop(art.getbbox())
            if name == 'hero':
                # The factory allocates 273 x 326. Pad instead of distorting the wings.
                height = max(art.height, math.ceil(art.width * 326 / 273))
                canvas = Image.new('RGBA', (art.width, height))
                canvas.alpha_composite(art, (0, (height - art.height) // 2))
            else:
                art.thumbnail((44, 44), Image.Resampling.LANCZOS)
                canvas = Image.new('RGBA', (48, 48))
                canvas.alpha_composite(art, ((48 - art.width) // 2, (48 - art.height) // 2))
            canvas.save(destination / f'{name}.png')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--java',type=Path,required=True)
    parser.add_argument('--ffdec',type=Path,required=True)
    args=parser.parse_args()
    source=Path(__file__).resolve().parents[1]/'compat/client-patches/silver-wing-native/timeline.swf'
    template=records(source)
    files={}
    for index,slot in enumerate(['head','waist','hand','top','foot'],199901):
        for variant,scale in [('swf',1),('prev',3),('icon',1)]:
            dest=args.out/'resource/item/cloth'/variant/f'{index}.swf'
            save(dest,build(slot,template,scale,variant=='icon'))
            files[str(dest.relative_to(args.out))]=hashlib.sha256(dest.read_bytes()).hexdigest()
    render_catalog(args.out, args.java, args.ffdec)
    for image in (args.out/'resource/module/clothBook/silver-wing').glob('*.png'):
        files[str(image.relative_to(args.out))]=hashlib.sha256(image.read_bytes()).hexdigest()
    (args.out/'silver-wing-native-build.json').write_text(json.dumps({'format':'native-vector','files':files},indent=2)+'\n')
    print(json.dumps({'files':len(files),'output':str(args.out)}))


if __name__=='__main__':
    main()
