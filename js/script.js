/* KODE — JavaScript principal */
/* El contenido de la página conserva sus interacciones y animaciones originales. */
document.documentElement.classList.add('js');
setTimeout(function(){document.documentElement.classList.add('loaded','loader-off')},6000);

(()=>{'use strict';
try{

/* ═══════════════════════════════════════════════════════════
   IMÁGENES EDITABLES
   Cambia aquí las rutas (o pon enlaces completos) para usar tus imágenes.
   • logo        → tu logo en NEGRO, para fondos claros (menú)
   • logoBlanco  → tu logo en BLANCO, para fondos oscuros (pie y pantalla de carga).
                   Si no existe, se usa "logo" automáticamente invertido a blanco.
   • streed / cdc → imagen de cada proyecto
   ═══════════════════════════════════════════════════════════ */
const IMAGES={
  logo:'images/logo.png',
  logoBlanco:'images/logo.png',
  streed:'./images/streedejemplo.png',
  cdc:'./images/cdc.jpg'
};

const root=document.documentElement;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

/* ───── Imágenes: carga, respaldo y modo edición ───── */
const store={
  get(k){try{return localStorage.getItem('kode_'+k)}catch(e){return null}},
  set(k,v){try{localStorage.setItem('kode_'+k,v);return true}catch(e){return false}},
  del(k){try{localStorage.removeItem('kode_'+k)}catch(e){}}
};
const srcFor=slot=>IMAGES[slot];
function paint(img){const host=img.closest('[data-has]');if(host)host.classList.toggle('has-img',img.classList.contains('ok'))}
function applySlot(img){
  const fb=img.dataset.fallback;let triedFb=false;
  img.classList.remove('ok','inv');
  const initialHost=img.closest('[data-has]');if(initialHost)initialHost.classList.remove('has-img','image-failed');
  img.onload=()=>{img.classList.add('ok');const h=img.closest('[data-has]');if(h)h.classList.remove('image-failed');paint(img)};
  img.onerror=()=>{
    if(fb&&!triedFb){triedFb=true;img.classList.add('inv');img.src=srcFor(fb)}
    else{img.classList.remove('ok');const host=img.closest('[data-has]');if(host)host.classList.add('image-failed');paint(img)}
  };
  img.src=srcFor(img.dataset.slot);
}
const slots=$$('[data-slot]');
const applyAll=()=>slots.forEach(applySlot);
applyAll();

let editing=false;
const editBar=$('#editbar'),editMsg=$('#editmsg');
const setEdit=on=>{editing=on;root.classList.toggle('edit',on);editBar.hidden=!on};
if(/[?&]editar/.test(location.search))setEdit(true);
addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='e'){e.preventDefault();setEdit(!editing)}});
$('#edit-exit').addEventListener('click',()=>setEdit(false));
$('#edit-reset').addEventListener('click',()=>{Object.keys(IMAGES).forEach(store.del);applyAll();editMsg.textContent='Imágenes originales restauradas.'});
const picker=document.createElement('input');picker.type='file';picker.accept='image/*';picker.hidden=true;document.body.append(picker);
let target=null;
document.addEventListener('click',e=>{
  if(!editing)return;const w=e.target.closest('[data-edit]');if(!w)return;
  e.preventDefault();e.stopPropagation();target=w.dataset.edit;picker.value='';picker.click();
},true);
picker.addEventListener('change',()=>{
  const f=picker.files[0];if(!f||!target)return;const slot=target;
  const reader=new FileReader();
  reader.onload=()=>{
    const isLogo=slot.startsWith('logo');
    const done=url=>{
      if(store.set(slot,url)){slots.filter(i=>i.dataset.slot===slot||i.dataset.fallback===slot).forEach(applySlot);editMsg.textContent='Imagen actualizada (solo se ve en este navegador).'}
      else editMsg.textContent='La imagen pesa demasiado. Prueba con una más ligera.';
    };
    if(f.type==='image/svg+xml'||(isLogo&&f.type==='image/png'&&f.size<900000)){done(reader.result);return}
    const im=new Image();
    im.onload=()=>{
      const max=isLogo?800:1800,sc=Math.min(1,max/Math.max(im.width,im.height));
      const c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      done(c.toDataURL(isLogo?'image/png':'image/jpeg',.86));
    };
    im.src=reader.result;
  };
  reader.readAsDataURL(f);
});

/* ───── Scroll suave con inercia (Lenis, si carga; si no, scroll normal) ───── */
let lenis=null;
if(!reduced){
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
  s.async=true;
  s.onload=()=>{if(window.Lenis){lenis=new Lenis({lerp:.1});root.classList.add('lenis')}};
  document.head.append(s);
}

/* ───── Menú móvil y anclas ───── */
const menuBtn=$('.menu-btn'),links=$('#navlinks');let menuOpen=false;
const setMenu=o=>{menuOpen=o;menuBtn.setAttribute('aria-expanded',String(o));menuBtn.firstElementChild.textContent=o?'Cerrar':'Menú';links.classList.toggle('open',o)};
menuBtn.addEventListener('click',()=>setMenu(!menuOpen));
addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href');if(id.length<2)return;
  const el=$(id);if(!el)return;
  e.preventDefault();setMenu(false);
  if(lenis)lenis.scrollTo(el,{offset:-70,duration:1.6});
  else el.scrollIntoView({behavior:reduced?'auto':'smooth'});
}));

/* ───── Pantalla de carga ───── */
const loader=$('.loader');
const startSite=()=>root.classList.add('loaded');
if(reduced||!loader){if(loader)loader.hidden=true;startSite()}
else{
  const t0=performance.now(),dur=1150;
  const tick=now=>{
    const p=clamp((now-t0)/dur),e=1-Math.pow(1-p,3);
    loader.style.setProperty('--lp',(e*100).toFixed(1));
    if(p<1)requestAnimationFrame(tick);
    else{loader.classList.add('done');startSite();setTimeout(()=>{loader.hidden=true},1200)}
  };
  requestAnimationFrame(tick);
}

/* ───── Texto: palabras para reveal con máscara y para relleno con scroll ───── */
function wrapWords(el,cls,inner){
  let i=0;
  const walk=node=>[...node.childNodes].forEach(n=>{
    if(n.nodeType===3){
      const frag=document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(tok=>{
        if(!tok)return;
        if(/^\s+$/.test(tok)){frag.append(' ');return}
        const w=document.createElement('span');w.className=cls;w.setAttribute('aria-hidden','true');
        if(inner){const x=document.createElement('span');x.className=inner;x.style.setProperty('--i',i++);x.textContent=tok;w.append(x)}
        else w.textContent=tok;
        frag.append(w);
      });
      n.replaceWith(frag);
    }else if(n.nodeType===1&&n.tagName!=='BR')walk(n);
  });
  el.setAttribute('aria-label',el.textContent.replace(/\s+/g,' ').trim());
  walk(el);
}
$$('[data-split]').forEach(el=>wrapWords(el,'w','wi'));
const scrubEl=$('[data-scrub]');if(scrubEl)wrapWords(scrubEl,'sw');
const scrubWords=scrubEl?$$('.sw',scrubEl):[];

/* ───── Reveal al entrar en pantalla ───── */
if('IntersectionObserver'in window&&!reduced){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15,rootMargin:'0px 0px -6% 0px'});
  $$('[data-r],[data-split]').forEach(el=>io.observe(el));
}else $$('[data-r],[data-split]').forEach(el=>el.classList.add('in'));

/* ───── Sitio de ejemplo del hero ───── */
const site=$('#demo-site'),skinBtns=$$('.skins button'),skins=skinBtns.map(b=>b.dataset.skin);
let idx=0,touched=false,timer=null,stageVisible=true;
const setSkin=name=>{
  idx=skins.indexOf(name);site.dataset.skin=name;
  skinBtns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.skin===name)));
  site.classList.remove('swap');void site.offsetWidth;site.classList.add('swap');
};
const stopAuto=()=>{touched=true;clearInterval(timer)};
skinBtns.forEach(b=>b.addEventListener('click',()=>{stopAuto();setSkin(b.dataset.skin)}));
site.addEventListener('pointerdown',stopAuto);
const stageEl=$('#stage');
if('IntersectionObserver'in window)new IntersectionObserver(([e])=>{stageVisible=e.isIntersecting},{threshold:.3}).observe(stageEl);
if(!reduced)setTimeout(()=>{if(touched)return;timer=setInterval(()=>{if(!stageVisible||document.hidden)return;setSkin(skins[(idx+1)%skins.length])},4200)},3800);
let cart=0;const cartEl=$('#cart-count'),cartPill=$('#cart');
$$('[data-add]').forEach(b=>b.addEventListener('click',()=>{stopAuto();cart++;cartEl.textContent=cart;cartPill.classList.remove('bump');void cartPill.offsetWidth;cartPill.classList.add('bump')}));
/* Inclinación 3D suave del navegador del hero */
if(fine&&!reduced){
  const br=$('.stage .browser');
  stageEl.addEventListener('pointermove',e=>{const r=stageEl.getBoundingClientRect();br.style.setProperty('--ry',((e.clientX-r.left)/r.width-.5)*7+'deg');br.style.setProperty('--rx',(-((e.clientY-r.top)/r.height-.5))*6+'deg')});
  stageEl.addEventListener('pointerleave',()=>{br.style.setProperty('--ry','0deg');br.style.setProperty('--rx','0deg')});
}

/* ───── Cursor y botones magnéticos ───── */
const cur=$('.cursor'),curLab=$('span',cur);let tx=-100,ty=-100,cx=-100,cy=-100;
if(fine&&!reduced){
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;cur.classList.add('on')},{passive:true});
  document.addEventListener('pointerover',e=>{
    const d=e.target.closest('[data-cursor]');
    if(d&&!editing){curLab.textContent=d.dataset.cursor;cur.classList.add('big');cur.classList.remove('link')}
    else{cur.classList.remove('big');cur.classList.toggle('link',!!e.target.closest('a,button,label,input,textarea'))}
  });
  document.addEventListener('pointerleave',()=>cur.classList.remove('on'));
  $$('.btn,.round,.direct a,.footer-social a').forEach(el=>{
    el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-(r.left+r.width/2))*.28}px,${(e.clientY-(r.top+r.height/2))*.35}px)`});
    el.addEventListener('pointerleave',()=>{el.style.transform=''});
  });
}

/* ───── Bucle de scroll: todos los efectos ligados al desplazamiento ───── */
const bar=$('.progress'),hero=$('.hero'),topbar=$('.topbar');
const par=$$('[data-speed]');
const cards=$$('.project');
const stepsEl=$('#steps'),stepItems=$$('.step'),mq=$('#mq');
const railLinks=$$('.rail a'),secs=railLinks.map(a=>$('#'+a.dataset.sec));
const stackOn=()=>matchMedia('(min-width:1001px) and (min-height:720px)').matches&&!reduced;
let y=0,last=0,vel=0,dir=1,mx=0,activeSec=-1,stackWas=false,mqHalf=0;
const measureMq=()=>{if(mq)mqHalf=mq.scrollWidth/2};
measureMq();addEventListener('resize',measureMq);addEventListener('load',measureMq);

function frame(t){
  if(lenis)lenis.raf(t);
  y=window.scrollY;const dy=y-last;last=y;vel=lerp(vel,dy,.15);
  const vh=innerHeight,max=root.scrollHeight-vh;

  bar.style.transform=`scaleX(${max>0?(y/max).toFixed(4):0})`;
  topbar.classList.toggle('scrolled',y>12);
  if(y>260&&dy>2&&!menuOpen)topbar.classList.add('hide');else if(dy<-2||y<120||menuOpen)topbar.classList.remove('hide');

  if(y<vh*1.4&&!reduced)hero.style.setProperty('--hp',clamp(y/(vh*.9)).toFixed(4));

  if(!reduced){
    par.forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.bottom<-250||r.top>vh+250)return;
      el.style.setProperty('--py',((r.top+r.height/2-vh/2)*-(parseFloat(el.dataset.speed))).toFixed(1)+'px');
    });
  }

  if(scrubWords.length&&!reduced){
    const r=scrubEl.getBoundingClientRect();
    if(r.bottom>-100&&r.top<vh){
      const p=clamp((vh*.82-r.top)/(r.height+vh*.32)),n=scrubWords.length;
      scrubWords.forEach((w,i)=>{w.style.opacity=(.14+.86*clamp(p*(n+2)-i)).toFixed(3)});
    }
  }

  if(mq&&!reduced&&mqHalf){
    dir=lerp(dir,dy<-.5?-1:1,.08);
    mx-=(.9+Math.abs(vel)*.7)*dir;
    if(mx<=-mqHalf)mx+=mqHalf;if(mx>0)mx-=mqHalf;
    mq.style.transform=`translate3d(${mx.toFixed(1)}px,0,0) skewX(${clamp(-vel*.22,-9,9).toFixed(2)}deg)`;
    mq.style.setProperty('--rot',(y*.18).toFixed(1)+'deg');
  }

  const stack=stackOn();
  if(stack){
    cards.forEach((c,i)=>{
      const nx=cards[i+1];if(!nx)return;
      const d=nx.getBoundingClientRect().top-96,p=clamp(1-d/c.offsetHeight);
      c.style.setProperty('--s',(1-p*.06).toFixed(4));c.style.setProperty('--dim',(p*.6).toFixed(3));
    });
    stackWas=true;
  }else if(stackWas){cards.forEach(c=>{c.style.removeProperty('--s');c.style.removeProperty('--dim')});stackWas=false}

  if(stepsEl){
    const r=stepsEl.getBoundingClientRect();
    if(r.bottom>-50&&r.top<vh+50){
      const p=reduced?1:clamp((vh*.8-r.top)/(r.height*.8+vh*.1)),n=stepItems.length;
      stepsEl.style.setProperty('--sp',p.toFixed(4));
      stepItems.forEach((s,i)=>s.classList.toggle('on',p*(n+.4)>i+.15));
    }
  }

  let a=0;secs.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<=vh*.4)a=i});
  if(a!==activeSec){activeSec=a;railLinks.forEach((l,i)=>l.classList.toggle('active',i===a))}

  if(fine&&!reduced){
    cx=lerp(cx,tx,.2);cy=lerp(cy,ty,.2);
    cur.style.transform=`translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) translate(-50%,-50%)`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ───── Año y formulario ───── */
$('#year').textContent=new Date().getFullYear();
$('#brief-form').addEventListener('submit',e=>{
  e.preventDefault();
  const d=new FormData(e.currentTarget);
  const message=`Hola KODE, quiero solicitar una cotización.\n\nNombre: ${d.get('nombre')}\nProyecto: ${d.get('tipo')}\nDetalles: ${d.get('idea')}`;
  const fb=$('#form-feedback');fb.replaceChildren();
  const q=document.createElement('div');q.textContent='Tu mensaje está listo. ¿Cómo quieres continuar?';
  const actions=document.createElement('div');actions.className='follow';
  const wa=document.createElement('a');wa.href='https://wa.me/?text='+encodeURIComponent(message);wa.target='_blank';wa.rel='noopener noreferrer';wa.textContent='Continuar por WhatsApp';
  const em=document.createElement('a');em.href='mailto:?subject='+encodeURIComponent('Solicitud de cotización | KODE')+'&body='+encodeURIComponent(message);em.textContent='Continuar por correo';
  const cp=document.createElement('button');cp.type='button';cp.textContent='Copiar mensaje';
  cp.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(message);cp.textContent='Mensaje copiado ✓'}catch(err){cp.textContent='No se pudo copiar. Usa WhatsApp o correo.'}});
  actions.append(wa,em,cp);fb.append(q,actions);fb.classList.add('show');
});

}catch(err){
  console.error(err);
  document.documentElement.classList.add('loaded','loader-off');
}
})();
