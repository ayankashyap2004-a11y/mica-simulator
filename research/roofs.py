import cv2, numpy as np, json
im=cv2.imread('sat/z19.png'); hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)
H,S,V=hsv[...,0],hsv[...,1].astype(int),hsv[...,2].astype(int)
b,g,r=[im[...,i].astype(int) for i in range(3)]
white=(V>150)&(S<55)
grey=(V>85)&(V<=150)&(S<45)&(abs(r-g)<18)&(abs(g-b)<22)
greenroof=(H>40)&(H<80)&(S>60)&(V>90)&(V<170)&((g-r)>25)
res=[]
vis=im.copy()
for name,mask,minA in [('white',white,250),('grey',grey,600),('green',greenroof,300)]:
    m=mask.astype(np.uint8)*255
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((3,3),np.uint8)); m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    cs,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    for c in cs:
        a=cv2.contourArea(c)
        if a<minA: continue
        (cx,cy),(w,h),ang=cv2.minAreaRect(c)
        if not (150<cx<1250 and 250<cy<2200): continue
        res.append(dict(k=name,cx=round(cx),cy=round(cy),w=round(w),h=round(h),ang=round(ang,1),area=round(a),m2=round(a*0.0756)))
        col={'white':(0,0,255),'grey':(255,0,255),'green':(0,255,255)}[name]
        cv2.drawContours(vis,[c],-1,col,2)
        cv2.putText(vis,f"{len(res)-1}",(int(cx)-8,int(cy)+5),cv2.FONT_HERSHEY_SIMPLEX,0.6,(255,255,0),2)
json.dump(res,open('roofs.json','w'))
for i,x in enumerate(res): print(i,x)
cv2.imwrite('sat/roofs_core.jpg',vis[950:1750,250:1150],[cv2.IMWRITE_JPEG_QUALITY,88])
cv2.imwrite('sat/roofs_north.jpg',vis[250:1000,300:1100],[cv2.IMWRITE_JPEG_QUALITY,85])
