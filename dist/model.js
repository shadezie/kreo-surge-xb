const controlMeta={home:['HOME','front','Power on, pairing, and system combinations.'],back:['BACK','front','Back button; used with HOME for calibration.'],start:['START','front','Start button; used to save calibration or reset with HOME.'],turbo:['TURBO','front','Configure rapid fire for a target button.'],fn:['FN','front','Multifunction button, used in pairing and customization combinations.'],light:['LIGHT','front','Cycle RGB effects and adjust brightness with the D-pad.'],vibration:['VIBRATION','front','Cycle rumble intensity.'],l3:['LEFT STICK / L3','front','Move to steer; push down to press L3.'],r3:['RIGHT STICK / R3','front','Move to aim; push down to press R3.'],dpad:['D-PAD','front','Directional input and adjustment combinations.'],a:['A','front','A face button.'],b:['B','front','B face button.'],x:['X','front','X face button.'],y:['Y','front','Y face button.'],lb:['LB','top','Left shoulder button.'],rb:['RB','top','Right shoulder button.'],lt:['LT','top','Left analog trigger.'],rt:['RT','top','Right analog trigger.'],usb:['USB-C','top','Charging, wired play, and firmware connection.'],mode:['MODE SWITCH','top','Three positions: PC, PHONE, and NS.'],m1:['M1','back','Left rear programmable macro button.'],m2:['M2','back','Right rear programmable macro button.'],storage:['RECEIVER STORAGE','back','Rear storage compartment for the USB receiver.'],rgb:['RGB BAR','front','Lighting effect and mode / battery feedback.'],leds:['CHANNEL LEDs','front','Four indicators for connection, player, battery, and settings.']};
controlMeta.reset=['RESET','back','Recessed reset pinhole, beside M2 in the supplied rear photo.'];
let modelApi={setView(){},highlight(){}};
try{
const T=THREE, container=document.getElementById('viewer'), scene=new T.Scene(), camera=new T.PerspectiveCamera(32,1,.1,80);
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;renderer.setClearColor(0,0);container.prepend(renderer.domElement);
const root=new T.Group();root.position.y=.28;scene.add(root);
const parts={},anchors={},originals=new Map(),TAU=Math.PI*2,vec=(x,y,z)=>new T.Vector3(x,y,z);
const mat=(color,roughness=.58,metalness=.02)=>new T.MeshStandardMaterial({color,roughness,metalness});
const graphite=mat('#424245',.53),lower=mat('#37373a',.62),rubber=mat('#333335',.84),keyMat=mat('#3a383b',.43),trim=mat('#222225',.62),shadow=mat('#0b0b0d',.9),violet=mat('#963fc3',.25,.39),ink=mat('#656168',.55),silver=mat('#68656b',.4,.55);
function canvas(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);return c}
function texture(c){const t=new T.CanvasTexture(c);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}
const env=texture(canvas(1024,512,(c,w,h)=>{c.fillStyle='#191820';c.fillRect(0,0,w,h);for(const [x,y,rx,ry,col] of [[.32,.26,.21,.14,'#fbfbfb'],[.74,.28,.09,.3,'#d4d6df'],[.04,.54,.10,.17,'#79727e'],[.55,.7,.2,.07,'#5a5461']]){c.save();c.translate(x*w,y*h);c.scale(rx*w,ry*h);let g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,col);g.addColorStop(.7,col);g.addColorStop(1,'#191820');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore()}}));
env.mapping=T.EquirectangularReflectionMapping;env.colorSpace=T.SRGBColorSpace;const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(env).texture;pmrem.dispose();env.dispose();
scene.add(new T.HemisphereLight(0xf4edff,0xa8a4a8,1.38));
for(const [x,y,z,c,i] of [[-3,5,4,0xfff8ee,2.05],[4,2,-3,0xd0c5e1,2.6],[4,-1,4,0xf4f4ff,1.02],[-3,-2,-3,0xe3ddf4,.95]]){const l=new T.DirectionalLight(c,i);l.position.set(x,y,z);scene.add(l)}
function mesh(geo,material,parent=root,id){const m=new T.Mesh(geo,material);parent.add(m);const k=id||parent.userData.id;if(k){m.userData.id=k;(parts[k]??=[]).push(m)}return m}
function node(x,y,z,id){const g=new T.Group();g.position.set(x,y,z);g.userData.id=id;root.add(g);return g}
function lathe(g,profile,m,segments=64){const geo=new T.LatheGeometry(profile.map(([r,z])=>new T.Vector2(Math.max(.00001,r),z)),segments);geo.rotateX(Math.PI/2);return mesh(geo,m,g)}
function emboss(g,points,material,r=.009){const path=new T.CatmullRomCurve3(points.map(p=>vec(...p)),false,'centripetal');return mesh(new T.TubeGeometry(path,Math.max(16,points.length*5),r,8,false),material,g)}
function outlined(g,points,depth,material,z=0,bevel=.014,corner=.15){const sh=new T.Shape(),pts=points.map(([x,y])=>new T.Vector2(x,y));for(let i=0;i<pts.length;i++){const p=pts[i],prev=pts[(i+pts.length-1)%pts.length],next=pts[(i+1)%pts.length],a=p.clone().lerp(prev,corner),b=p.clone().lerp(next,corner);if(i===0)sh.moveTo(a.x,a.y);else sh.lineTo(a.x,a.y);sh.quadraticCurveTo(p.x,p.y,b.x,b.y)}sh.closePath();const geo=new T.ExtrudeGeometry(sh,{depth,bevelSize:bevel,bevelThickness:bevel,bevelSegments:4,curveSegments:8});const m=mesh(geo,material,g);m.position.z=z;return m}
const rect=(w,h)=>[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]];
function label(g,word,x,y,z,w,h,color='#b4aeba',style='500',paint){const t=texture(canvas(512,Math.max(48,Math.round(512*h/w)),(c,W,H)=>{c.fillStyle=color;c.strokeStyle=color;c.lineCap='round';c.lineJoin='round';if(paint)return paint(c,W,H);c.font=style+' '+Math.round(H*.83)+'px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(word,W/2,H*.54,W*.98)}));t.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));m.position.set(x,y,z);m.userData.id=g.userData.id;g.add(m);return m}
// Sections sampled from the straight-on product photograph; two smooth skins share the parting line.
const sections=[[0,1.24,-1.037],[.56,1.24,-1.037],[.79,1.265,-1.05],[1,1.27,-1.115],[1.25,1.255,-1.33],[1.48,1.19,-1.60],[1.72,1.02,-1.89],[1.94,.60,-2.095],[2.065,.27,-2.12],[2.22,-.19,-2.06],[2.36,-.67,-1.955],[2.45,-1.09,-1.80],[2.485,-1.36,-1.68],[2.49,-1.53,-1.53]];
function limits(x){x=Math.min(Math.abs(x),2.49);let i=0;while(i<sections.length-2&&x>sections[i+1][0])i++;let a=sections[i],b=sections[i+1],d=b[0]-a[0],t=(x-a[0])/d;return [1,2].map(k=>{const slope=j=>{if(!j)return 0;if(j===sections.length-1)return (sections[j][k]-sections[j-1][k])/(sections[j][0]-sections[j-1][0]);let l=(sections[j][k]-sections[j-1][k])/(sections[j][0]-sections[j-1][0]),r=(sections[j+1][k]-sections[j][k])/(sections[j+1][0]-sections[j][0]);return l*r>0?2*l*r/(l+r):0};return (1+2*t)*(1-t)**2*a[k]+t*(1-t)**2*d*slope(i)+t*t*(3-2*t)*b[k]+t*t*(t-1)*d*slope(i+1)})}
function surface(x,y,back){const [hi,lo]=limits(x),v=Math.max(-1,Math.min(1,(2*y-hi-lo)/Math.max(.00001,hi-lo))),grip=T.MathUtils.smoothstep(Math.abs(x),.84,2.13),end=Math.sqrt(1-Math.pow(T.MathUtils.clamp((Math.abs(x)-1.97)/.52,0,1),2)),round=Math.pow(Math.max(0,1-v*v),back?.43:.235)*end;const bend=.082*y-.095*grip+.026;let socket=0;if(!back){for(const [cx,cy,r] of [[-1.255,.455,.40],[.65,-.255,.40],[-.645,-.35,.42]]){const dist=Math.hypot(x-cx,y-cy);socket-=.077*(1-T.MathUtils.smoothstep(dist,r*.77,r*1.30))}}return bend+socket+(back?-(.44+.35*grip):(.445+.07*grip))*round}
function skin(back){const pos=[],uv=[],idx=[],nx=180,nt=76;for(let i=0;i<=nx;i++){const x=2.49*-Math.cos(Math.PI*i/nx),[hi,lo]=limits(x);for(let j=0;j<=nt;j++){const a=Math.PI*j/nt,y=(hi+lo+(hi-lo)*Math.cos(a))/2;pos.push(x,y,surface(x,y,back));uv.push(x*.95,(a*.76+y*.09))}}for(let i=0;i<nx;i++)for(let j=0;j<nt;j++){const a=i*(nt+1)+j,b=a+nt+1;if(back)idx.push(a,b,b+1,a,b+1,a+1);else idx.push(a,b+1,b,a,a+1,b+1)}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(geo,back?lower:graphite)}
// The grip grain belongs on the rear wings only. Filter the diamond lattice as it recedes.
lower.onBeforeCompile=s=>{s.vertexShader='varying vec3 vShell;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvShell=position;');s.fragmentShader='varying vec3 vShell;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float gx=abs(vShell.x); float cut=min(gx-1.035, .38+.08*(gx-1.1)-vShell.y);float pad=smoothstep(-.007,.008,cut);
vec2 q=vec2(vShell.x+.35*vShell.z,vShell.y-.55*vShell.z)*32.;vec2 lattice=vec2(q.x*.82+q.y,q.x*.82-q.y);vec2 wave=cos(6.28318*lattice);float grain=(wave.x+wave.y)*.5;float lod=1.-smoothstep(.25,1.08,max(fwidth(lattice.x),fwidth(lattice.y)));
diffuseColor.rgb*=mix(1.,.85+grain*.46*lod,pad);diffuseColor.rgb*=1.-.48*(1.-smoothstep(.004,.017,abs(cut))); `)};skin(false);skin(true);
function mount(x,y,id,back=false){const z=surface(x,y,back),e=.001,dx=(surface(x+e,y,back)-surface(x-e,y,back))/(2*e),dy=(surface(x,y+e,back)-surface(x,y-e,back))/(2*e),normal=vec(-dx,-dy,1).normalize().multiplyScalar(back?-1:1),right=vec(back?-1:1,0,(back?-1:1)*dx).normalize(),up=new T.Vector3().crossVectors(normal,right);const g=node(x,y,z,id);g.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,normal));return g}
function anchor(g,x,y,z){anchors[g.userData.id]=vec(x,y,z).applyQuaternion(g.quaternion).add(g.position)}
function radial(g,r,h,m){return lathe(g,[[.0001,-.02],[r*.93,-.02],[r,0],[r*.995,h*.50],[r*.96,h*.82],[r*.87,h],[r*.62,h+.008],[.0001,h+.009]],m)}
function thumb(x,y,id){const g=mount(x,y,id);
lathe(g,[[.0001,-.06],[.392,-.06],[.383,-.008],[.359,.025],[.336,.035],[.31,.022],[.24,-.008],[.0001,0]],trim);
lathe(g,[[.0001,0],[.352,0],[.351,.031],[.338,.05],[.305,.047],[.24,.063],[.201,.103],[.15,.136],[.135,.19],[.14,.265],[.0001,.27]],violet);
const profile=[[.0001,.208],[.164,.215],[.232,.233],[.265,.252],[.276,.283],[.275,.312],[.262,.335],[.236,.348],[.21,.345],[.185,.337],[.12,.325],[.0001,.32]];lathe(g,profile,rubber);
// A recessed thumb bed and a fine chevron band distinguish the pad from its purple shaft.
const treadPos=[],treadIx=[],rings=[[.192,.339],[.202,.347],[.214,.35],[.23,.352],[.246,.351],[.257,.342],[.267,.33]],segments=320;
for(let j=0;j<rings.length;j++)for(let i=0;i<=segments;i++){const [r,z]=rings[j],a=TAU*i/segments,notch=j>1&&j<6?.0045*(.5+.5*Math.cos(80*a+(j%2)*Math.PI)):0;treadPos.push(r*Math.cos(a),r*Math.sin(a),z+notch);if(i&&j){const k=j*(segments+1)+i,b=k-segments-1;treadIx.push(b-1,k-1,k,b-1,k,b)}}const tread=new T.BufferGeometry();tread.setAttribute('position',new T.Float32BufferAttribute(treadPos,3));tread.setIndex(treadIx);tread.computeVertexNormals();mesh(tread,mat('#303033',.72),g);
// Three staggered rows of molded knurling, batched into one draw.
const pos=[],inds=[];for(let j=0;j<3;j++)for(let k=0;k<82;k++){const a=TAU*(k+(j%2)*.5)/82,z=.264+j*.023,r=j===2?.270:.274,base=pos.length/3;for(const [da,dz,dr] of [[-.034,0,0],[0,-.015,0],[.034,0,0],[0,.015,0],[0,0,.009]])pos.push((r+dr)*Math.cos(a+da),(r+dr)*Math.sin(a+da),z+dz);for(let l=0;l<4;l++)inds.push(base+l,base+(l+1)%4,base+4)}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(inds);geo.computeVertexNormals();mesh(geo,rubber,g);anchor(g,0,0,.325)}
thumb(-1.255,.455,'l3');thumb(.65,-.255,'r3');
for(const [id,x,y] of [['a',1.265,.125],['b',1.59,.445],['x',.935,.45],['y',1.265,.76]]){const g=mount(x,y,id);radial(g,.182,.013,trim);radial(g,.164,.073,keyMat);label(g,id.toUpperCase(),0,0,.084,.21,.223,'#be72d7','600');anchor(g,0,0,.087)}
const d=mount(-.645,-.35,'dpad');radial(d,.45,.006,trim);
const D=.413,B=.137;outlined(d,[[-B,D],[B,D],[B,B],[D,B],[D,-B],[B,-B],[B,-D],[-B,-D],[-B,-B],[-D,-B],[-D,B],[-B,B]],.06,keyMat,.017,.016,.095);
for(let i=0;i<4;i++){const a=i*Math.PI/2,m=outlined(d,[[-.043,-.031],[.043,-.031],[0,.04]],.001,trim,.097,.001);m.position.x=-Math.sin(a)*.302;m.position.y=Math.cos(a)*.302;m.rotation.z=a}anchor(d,0,0,.10);
function symbol(g,name,z,w,h){label(g,'',0,0,z,w,h,'#88848a','500',(c,W,H)=>{c.scale(W/100,H/100);c.lineWidth=6;c.beginPath();if(name==='home'){c.moveTo(27,14);c.lineTo(27,60);c.bezierCurveTo(32,46,66,44,75,14);c.moveTo(30,71);c.bezierCurveTo(39,53,65,53,74,73);c.stroke();c.beginPath();c.arc(53,78,6,0,TAU);c.fill()}else if(name==='start'){for(const y of [28,49,70]){c.moveTo(17,y);c.lineTo(83,y)}c.stroke()}else if(name==='back'){c.moveTo(38,24);c.lineTo(18,43);c.lineTo(39,60);c.moveTo(23,43);c.lineTo(62,43);c.bezierCurveTo(96,43,91,82,54,77);c.stroke()}else{c.arc(42,53,20,0,TAU);c.moveTo(58,39);c.lineTo(78,33);c.lineTo(82,42);c.lineTo(63,49);c.stroke();c.beginPath();c.arc(42,53,8,0,TAU);c.stroke()}})}
for(const [id,x,y,r] of [['home',0,.686,.161],['back',-.458,.49,.097],['start',.461,.49,.097]]){const g=mount(x,y,id);radial(g,r*1.065,.01,trim);radial(g,r,.045,keyMat);symbol(g,id,.057,r*1.32,r*1.32);anchor(g,0,0,.06)}
const turbo=mount(0,.183,'turbo');outlined(turbo,rect(.36,.131),.045,keyMat,.001,.012,.43);symbol(turbo,'turbo',.061,.14,.108);anchor(turbo,0,0,.06);
for(const [id,x,word] of [['light',-.30,'☼'],['fn',0,'Fn'],['vibration',.30,'']]){const g=mount(x,-.895,id);const skew=x*.14;outlined(g,[[-.142,-.092],[.142,-.092],[.126-skew,.092],[-.126-skew,.092]],.029,keyMat,.006,.006,.07);if(id==='vibration')label(g,'',0,0,.043,.14,.10,'#817d83','500',(c,W,H)=>{c.scale(W/100,H/100);c.lineWidth=5;c.beginPath();c.moveTo(29,30);c.bezierCurveTo(16,23,12,81,24,75);c.lineTo(39,62);c.lineTo(61,62);c.bezierCurveTo(85,92,88,72,78,33);c.lineTo(29,30);c.moveTo(35,38);c.lineTo(35,53);c.moveTo(29,45);c.lineTo(42,45);c.stroke();c.fillRect(59,40,6,6)});else label(g,word,0,0,.043,.14,.115,'#827d83');anchor(g,0,0,.048)}
const rgb=node(0,0,0,'rgb');
// Shape the bezel and both diffuser lenses against the same curved housing.
function panelMesh(rows, material, parent) {
  const positions = [], indices = [], width = rows[0].length;
  rows.forEach((row, j) => row.forEach(([x,y,lift], i) => {
    positions.push(x,y,surface(x,y,false)+lift);
    if (i && j) {
      const d=j*width+i, a=d-width-1;
      indices.push(a,a+1,d, a,d,d-1);
    }
  }));
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(geometry,material,parent);
}
const panelRows = [];
for(let j=0;j<=48;j++){
  const t=j/48, y=.911+.315*t;
  const edge=Math.min(t,1-t)*.315, radius=.024;
  const corner=edge<radius ? radius-Math.sqrt(radius*radius-(radius-edge)**2) : 0;
  const halfWidth=.483+.17*t-corner, row=[];
  for(let i=0;i<=64;i++){
    const x=(i/32-1)*halfWidth;
    const bevel=T.MathUtils.smoothstep(Math.min(edge,halfWidth-Math.abs(x)),0,.012);
    row.push([x,y,.005+.009*bevel]);
  }
  panelRows.push(row);
}
panelMesh(panelRows,mat('#252429',.56),root);

function lightRail(span,base,top,radius,color){
  const path=new T.Path(), bend=span-.105;
  path.moveTo(-span,top);
  path.lineTo(-bend-.019,base+.031);
  path.quadraticCurveTo(-bend,base,-bend+.029,base);
  path.lineTo(bend-.029,base);
  path.quadraticCurveTo(bend,base,bend+.019,base+.031);
  path.lineTo(span,top);
  const rows=[];
  // Extend each end with a semicircular cap. Keep the long runs exactly straight.
  for(let i=-8;i<=168;i++){
    const t=T.MathUtils.clamp(i/160,0,1), point=path.getPointAt(t), tangent=path.getTangentAt(t);
    const cap=(i<0?i:i>160?i-160:0)*Math.PI/16;
    point.addScaledVector(tangent,radius*Math.sin(cap));
    const row=[];
    for(let j=0;j<=8;j++){
      const theta=(j/8-.5)*Math.PI, offset=radius*Math.sin(theta)*Math.cos(cap);
      row.push([point.x-tangent.y*offset,point.y+tangent.x*offset,.016+.005*Math.cos(theta)*Math.cos(cap)]);
    }
    rows.push(row.reverse());
  }
  const material=mat(color,.48,.02);
  material.envMapIntensity=.3;
  material.emissive.set(color);
  material.emissiveIntensity=.24;
  const lens=panelMesh(rows,material,rgb);
  lens.userData.baseColor=color;
}
lightRail(.558,.951,1.153,.0155,'#23c8ee');
lightRail(.472,1.017,1.169,.0095,'#aa53c9');
anchors.rgb=vec(.21,.951,surface(.21,.951,false)+.022);
parts.leds=[];
// Swept shoulder keys: the outer ends follow the descending shoulder instead of ending in spheres.
function cradle(side){const positions=[],indices=[],nx=40,nr=48;for(let i=0;i<=nx;i++){const v=i/nx,t=.5-.5*Math.cos(v*Math.PI),x=.94+1.022*t,round=Math.pow(Math.sin(v*Math.PI),.71),crest=.89-.38*t*t;for(let j=0;j<=nr;j++){const a=TAU*j/nr,cy=Math.sin(a),cz=Math.cos(a);positions.push(side*x,crest+.31*cy*round,-.25+(.38*cz-.055)*round)}}for(let i=0;i<nx;i++)for(let j=0;j<nr;j++){const a=i*(nr+1)+j,b=a+nr+1;indices.push(...(side>0?[a,b,b+1,a,b+1,a+1]:[a,b+1,b,a,a+1,b+1]))}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,lower.clone())}
cradle(-1);cradle(1);
function shoulder(side,trigger){
 const id=(side<0?'l':'r')+(trigger?'t':'b'),g=node(0,0,0,id);
 // A rounded injection-molded key with a rolled outer corner and a skirt.
 const footprint=trigger?[[1.075,-.275],[1.11,-.53],[1.23,-.656],[1.50,-.705],[1.69,-.625],[1.77,-.47],[1.77,-.19],[1.45,-.22],[1.17,-.205]]:[[.684,.175],[.705,-.14],[.80,-.19],[1.21,-.159],[1.54,-.168],[1.76,-.25],[1.81,-.117],[1.78,.09],[1.62,.188],[1.16,.22]];
 const bevel=trigger?.048:.033,depth=trigger?.35:.19;
 const m=outlined(g,footprint.map(([x,z])=>[x,-z]),depth,trigger?keyMat:graphite,0,bevel,.30);
 const src=m.geometry.attributes.position,newPos=[],indices=[],unique=new Map();
 function at(v){const key=[v.x,v.y,v.z].map(n=>Math.round(n*1e5)).join(':');if(unique.has(key))return unique.get(key);
 const x=v.x,z=-v.y,t=(x-.66)/1.15,outer=Math.max(0,(x-1.22)/.61),zEdge=trigger?Math.abs(z+.433):Math.abs(z-.015);
 const crown=1.269+.090*Math.sin(Math.PI*t)-.345*outer**2-(trigger?.035:0)-(trigger?.99:1.4)*zEdge**2;
 const n=newPos.length/3;newPos.push(side*x,crown+v.z-depth,z);unique.set(key,n);return n}
 function tess(a,b,c){const ab=a.distanceToSquared(b),bc=b.distanceToSquared(c),ca=c.distanceToSquared(a),d=Math.max(ab,bc,ca);if(d<.007){if(side<0)indices.push(at(a),at(c),at(b));else indices.push(at(a),at(b),at(c));return}
 if(d===ab){const h=a.clone().lerp(b,.5);tess(a,h,c);tess(h,b,c)}else if(d===bc){const h=b.clone().lerp(c,.5);tess(b,h,a);tess(h,c,a)}else{const h=c.clone().lerp(a,.5);tess(c,h,b);tess(h,a,b)}}
 for(let i=0;i<src.count;i+=3)tess(new T.Vector3().fromBufferAttribute(src,i),new T.Vector3().fromBufferAttribute(src,i+1),new T.Vector3().fromBufferAttribute(src,i+2));
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(newPos,3));geo.setIndex(indices);geo.computeVertexNormals();m.geometry.dispose();m.geometry=geo;
 const x=side*(trigger?1.36:1.10);anchors[id]=vec(x,trigger?1.294:1.343,trigger?-.435:.04);
}
for(const side of [-1,1]){shoulder(side,false);shoulder(side,true)}
// Top I/O bridge. Its dark face is bounded by the two bumper keys.
const io=node(0,1.242,-.065);io.rotation.x=-Math.PI/2;outlined(io,rect(1.30,.41),.016,trim,-.016,.018,.115);
function topControl(x,id){const g=node(x,1.268,-.075,id);g.rotation.x=-Math.PI/2;return g}
const usb=topControl(0,'usb');
function portRing(g,w,h,edge){const pts=(w,h)=>{const p=[];for(const side of [1,-1])for(let i=0;i<=20;i++){const a=(side===1?-.5:.5)*Math.PI+i*Math.PI/20;p.push(new T.Vector2(side*(w-h)/2+Math.cos(a)*h/2,Math.sin(a)*h/2))}return p};const sh=new T.Shape(pts(w,h));sh.holes.push(new T.Path(pts(w-2*edge,h-2*edge).reverse()));mesh(new T.ExtrudeGeometry(sh,{depth:.008,bevelEnabled:false}),silver,g)}
outlined(usb,rect(.28,.078),.002,shadow,.001,.001,.45);portRing(usb,.295,.098,.012);outlined(usb,rect(.18,.016),.002,ink,.006,.001,.27);anchor(usb,0,0,.012);
const mode=topControl(.335,'mode');const slot=outlined(mode,rect(.193,.077),.003,shadow,.002,.002,.29);parts.mode=parts.mode.filter(m=>m!==slot);outlined(mode,rect(.071,.054),.015,keyMat,.005,.003,.1);for(let k=-1;k<=1;k++)outlined(mode,rect(.004,.039),.002,ink,.021,.0005).position.x=k*.017;anchor(mode,0,0,.024);
for(const [id,x] of [['m1',1.115],['m2',-1.115]]){const g=mount(x,-.435,id,true);g.rotateZ(x>0?.13:-.13);outlined(g,rect(.405,.506),.025,trim,0,.022,.30);outlined(g,rect(.322,.424),.046,keyMat,.027,.015,.24);for(let j=-6;j<=6;j++){const m=outlined(g,rect(.243,.006),.002,trim,.089,.001,.08);m.position.y=j*.024;m.rotation.z=.21}label(g,id.toUpperCase(),0,0,.093,.20,.117,'#a09aa1');anchor(g,0,0,.094)}
const st=mount(0,-.49,'storage',true);outlined(st,rect(.70,.65),.012,shadow,0,.008,.075);outlined(st,rect(.673,.623),.017,graphite,.012,.005,.07);outlined(st,rect(.57,.019),.011,trim,.033,.004,.2).position.y=.242;label(st,'USB Receiver',0,-.030,.039,.36,.075,'#989499');label(st,'▣',0,.053,.039,.10,.103,'#8c898f');anchor(st,0,0,.042);
const spec=mount(0,.29,null,true);outlined(spec,rect(1.23,.46),.009,mat('#37373b',.55),.0,.005,.16);
label(spec,'',0,0,.016,1.14,.40,'#bdbbc0','500',(c,W,H)=>{c.scale(W/600,H/195);c.font='bold 37px Arial';c.fillText('kreo.',9,40);c.fillRect(10,52,578,2);c.font='bold 23px Arial';c.fillText('Model: Surge XB',10,91);c.font='19px Arial';c.fillText('5V < 500 mA',214,90);c.font='15px Arial';c.fillText('GCSRGXBTMBK',10,119);c.fillText('MADE IN PRC',470,143);c.font='italic 14px Arial';c.fillText('Caution: Please use PC/Laptop USB port for charging',10,177)});
const pinhole=mount(-.84,-.719,'reset',true);radial(pinhole,.021,.003,shadow);label(pinhole,'RESET',0,-.063,.012,.155,.055,'#79757c');anchor(pinhole,0,0,.015);
// Molded fastener recesses visible in the rear photograph.
for(const [x,y,r] of [[-.78,.84,.068],[.78,.84,.068],[-1.84,.20,.065],[1.84,.20,.065],[-2.02,-1.66,.064],[2.02,-1.66,.064]]){const g=mount(x,y,null,true);lathe(g,[[.0001,0],[r*1.15,-.008],[r,.014],[r*.83,.013],[r*.67,.002],[.0001,.002]],trim,32)}
let target={x:.07,y:-.19},highlighted=[],stepConfig={},zoom=8.5,drag=false,px=0,py=0,moved=0;root.rotation.set(target.x,target.y,0);
let dirty=true;function setView(view){dirty=true;target=view==='back'?{x:-.035,y:Math.PI-.065}:view==='top'?{x:1.02,y:-.12}:{x:.07,y:-.19};target.y+=Math.round((root.rotation.y-target.y)/(Math.PI*2))*Math.PI*2;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));}
function highlight(ids,config={}){dirty=true;for(const [mesh,m]of originals){mesh.material.dispose();mesh.material=m;}originals.clear();highlighted=ids;stepConfig=config;for(const id of ids)for(const mesh of parts[id]||[]){originals.set(mesh,mesh.material);mesh.material=mesh.material.clone();if(id!=='rgb'&&id!=='leds'){mesh.material.emissive.set('#9960d6');mesh.material.emissiveIntensity=.28;}}document.getElementById('labels').innerHTML='<svg aria-hidden="true"></svg>'+ids.filter(id=>anchors[id]).map(id=>`<span class="pin" data-key="${id}">${controlMeta[id][0]}</span>`).join('');}
modelApi={setView,highlight};const resize=()=>{dirty=true;const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;zoom=Math.max(8.6,3.13/(camera.aspect*Math.tan(16*Math.PI/180)));camera.position.z=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld()};new ResizeObserver(resize).observe(container);resize();
container.addEventListener('pointerdown',e=>{drag=true;moved=0;px=e.clientX;py=e.clientY;container.setPointerCapture(e.pointerId)});container.addEventListener('pointercancel',()=>{drag=false});container.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-px,dy=e.clientY-py;moved+=Math.abs(dx)+Math.abs(dy);target.y+=dx*.009;target.x=Math.max(-1.6,Math.min(1.6,target.x+dy*.009));px=e.clientX;py=e.clientY});container.addEventListener('pointerup',e=>{drag=false;if(moved>5)return;const rect=container.getBoundingClientRect(),p=new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new T.Raycaster();ray.setFromCamera(p,camera);const hit=ray.intersectObjects(root.children,true).find(h=>!h.object.material.transparent);if(hit?.object.userData.id)window.dispatchEvent(new CustomEvent('control-selected',{detail:hit.object.userData.id}))});container.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(7.6,Math.min(15,zoom+e.deltaY*.007))},{passive:false});
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;let lastFrame=-100;function frame(time){requestAnimationFrame(frame);if(document.hidden||time-lastFrame<30)return;const moving=Math.abs(target.x-root.rotation.x)+Math.abs(target.y-root.rotation.y)+Math.abs(camera.position.z-zoom)>.00025;if(!dirty&&!moving&&(!stepConfig.flash||reduce))return;dirty=false;lastFrame=time;root.rotation.x+=(target.x-root.rotation.x)*(reduce?1:.18);root.rotation.y+=(target.y-root.rotation.y)*(reduce?1:.18);camera.position.z+=(zoom-camera.position.z)*.12;const pulse=stepConfig.flash&&!reduce?.65+.35*Math.sin(time*.005):1;for(const id of highlighted)for(const mesh of parts[id]||[])if(mesh.material.emissive&&id!=='leds')mesh.material.emissiveIntensity=(id==='rgb'?.40:.45)*pulse;
for(const mesh of parts.rgb){const c=stepConfig.rgbOff?'#232428':stepConfig.color||mesh.userData.baseColor;mesh.material.color.set(c);mesh.material.emissive.set(stepConfig.rgbOff?'#000000':c);}
for(const mesh of parts.leds){const active=(stepConfig.leds||[]).includes(mesh.userData.led);mesh.material.color.set(active?'#d3fa98':'#4a5540');mesh.material.emissiveIntensity=active?(stepConfig.flash?pulse:1):.05;}
root.updateMatrixWorld();const placed=[];const svg=document.querySelector('#labels svg');let lines='';for(const pin of document.querySelectorAll('.pin')){const id=pin.dataset.key;const a=anchors[id].clone().applyMatrix4(root.matrixWorld);const side=controlMeta[id][1];const normal=new T.Vector3(0,side==='top'?1:0,side==='back'?-1:side==='front'?1:0).transformDirection(root.matrixWorld);const visible=normal.z>.15;a.project(camera);const ax=(a.x*.5+.5)*container.clientWidth,ay=(-a.y*.5+.5)*container.clientHeight;pin.style.display=visible?'block':'none';if(!visible)continue;let x=Math.max(57,Math.min(container.clientWidth-57,ax+(id==='usb'||id==='mode'?36:0))),y=Math.max(18,ay-43);while(placed.some(p=>Math.abs(p.x-x)<100&&Math.abs(p.y-y)<29))y-=30;if(y<18)y=Math.min(container.clientHeight-45,ay+45+placed.length*28);placed.push({x,y});pin.style.left=x+'px';pin.style.top=y+'px';lines+=`<line x1="${ax}" y1="${ay}" x2="${x}" y2="${y}" stroke="#cbb0f7" stroke-width="1.5" opacity=".9"/><circle cx="${ax}" cy="${ay}" r="4" fill="#e6d4ff" stroke="#9271ca" stroke-width="2"/>`;}if(svg)svg.innerHTML=lines;renderer.render(scene,camera)}requestAnimationFrame(frame);
}catch(e){console.error(e);document.getElementById('fallback').hidden=false;}
