import re, math, cv2, sys
src=open(sys.argv[1],encoding='utf-8').read()
im=cv2.imread('sat/z19.png')
blk=src.split('export const BUILDINGS')[1].split('];')[0]
for m in re.finditer(r"""\{ id: '([^']+)'[^}]*?name: ['"]([^'"]+)['"][^}]*?x: (\d+), y: (\d+), w: (\d+), h: (\d+)(?:, rot: (-?\d+))?""", blk):
    i,n,x,y,w,h,r=m.groups(); x,y,w,h=map(int,(x,y,w,h)); r=math.radians(int(r or 0))
    k='seminar' in blk[m.start():m.start()+200]
    pts=[]
    for dx,dy in [(-w/2,-h/2),(w/2,-h/2),(w/2,h/2),(-w/2,h/2)]:
        pts.append((int(x+dx*math.cos(r)-dy*math.sin(r)),int(y+dx*math.sin(r)+dy*math.cos(r))))
    for a in range(4): cv2.line(im,pts[a],pts[(a+1)%4],(0,0,255) if not k else (255,0,255),2)
    cv2.putText(im,n[:12],(x-25,y+4),0,0.38,(255,255,255),3); cv2.putText(im,n[:12],(x-25,y+4),0,0.38,(0,0,0),1)
cv2.imwrite('sat/overlay_core.jpg',im[1120:1720,300:1140],[cv2.IMWRITE_JPEG_QUALITY,88])
cv2.imwrite('sat/overlay_north.jpg',im[250:1000,450:1000],[cv2.IMWRITE_JPEG_QUALITY,85])
