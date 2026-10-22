/**
 * The site's small runtime (what Elementor's and its add-ons' scripts did on the
 * live site), inline at the end of <body>, no dependencies:
 *
 * - header menu: phone menu open/close, submenus, and the switch to the phone
 *   menu whenever the desktop menu would not fit on one line
 * - entrance animations (elementor-invisible -> animated fadeInUp), counters,
 *   lazy section backgrounds (e-lazyloaded), background video
 * - carousels (partner logos, testimonials) and accordions (one open at a time)
 * - scripts inside custom HTML blocks (HoneyCRM, Zoho CRM forms)
 * - the datasheet / whitepaper download form (required fields, then the PDF)
 *
 * - the blog search box (post titles, in the page)
 * - Google Tag Manager and the Google tag, loaded once the page has loaded
 *
 * The pages are plain static HTML (scripts/static-html.mjs removes React's
 * client code after the build), so this is the only script the pages run.
 */
export function runtimeScript(tags: { gtm?: string; ga?: string }) {
  return `(function(){
function start(){try{menu();}catch(e){}try{reveal();}catch(e){}try{bg();}catch(e){}try{carousels();}catch(e){}try{accordions();}catch(e){}try{scripts();}catch(e){}try{forms();}catch(e){}try{search();}catch(e){}try{posts();}catch(e){}}
start();
var GTM=${JSON.stringify(tags.gtm ?? "")},GA=${JSON.stringify(tags.ga ?? "")};
function tags(){
  if(GTM){(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({"gtm.start":new Date().getTime(),event:"gtm.js"});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src="https://www.googletagmanager.com/gtm.js?id="+i;f.parentNode.insertBefore(j,f)})(window,document,"script","dataLayer",GTM)}
  if(GA){window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag("set","linker",{domains:["ttrtechnology.com"]});gtag("js",new Date());gtag("set","developer_id.dZTNiMT",true);gtag("config",GA);var g=document.createElement("script");g.async=true;g.src="https://www.googletagmanager.com/gtag/js?id="+GA;document.head.appendChild(g)}
}
if(document.readyState==="complete")setTimeout(tags,1);else window.addEventListener("load",function(){setTimeout(tags,1)});

function settings(el){try{return JSON.parse(el.getAttribute("data-settings")||"{}")}catch(e){return {}}}
function onView(el,fn,margin){if(!("IntersectionObserver" in window)){fn();return}var io=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){if(es[i].isIntersecting){io.disconnect();fn();break}}},{rootMargin:margin||"0px 0px -8% 0px"});io.observe(el)}

/* ---------- header menu ---------- */
function menu(){
  var navs=document.querySelectorAll(".ekit-wid-con[data-responsive-breakpoint]");
  for(var n=0;n<navs.length;n++)(function(nav){
    var off=nav.querySelectorAll(".elementskit-menu-offcanvas-elements"),ham=nav.querySelector(".elementskit-menu-hamburger");
    function set(open){for(var i=0;i<off.length;i++)off[i].classList.toggle("active",open);if(ham)ham.setAttribute("aria-expanded",open?"true":"false");document.documentElement.classList.toggle("ttr-menu-open",open)}
    var tog=nav.querySelectorAll(".elementskit-menu-toggler");
    for(var i=0;i<tog.length;i++)tog[i].addEventListener("click",function(e){e.preventDefault();set(!off[0].classList.contains("active"))});
    document.addEventListener("keydown",function(e){if(e.key==="Escape")set(false)});
    // Phone menu: the arrow (or a "#" link) opens its submenu or mega menu.
    var links=nav.querySelectorAll(".elementskit-dropdown-has > a");
    for(var j=0;j<links.length;j++)links[j].addEventListener("click",function(e){
      if(!isMobile(nav))return;
      var a=e.currentTarget,isArrow=e.target.classList&&e.target.classList.contains("elementskit-submenu-indicator");
      if(!isArrow&&a.getAttribute("href")!=="#")return;
      e.preventDefault();
      var p=a.parentNode.querySelector(":scope > .elementskit-dropdown, :scope > .elementskit-megamenu-panel");
      if(!p)return;var open=!p.classList.contains("elementskit-dropdown-open");p.classList.toggle("elementskit-dropdown-open",open);a.setAttribute("aria-expanded",open?"true":"false");
    });
    var hashes=nav.querySelectorAll('.elementskit-navbar-nav a[href="#"]');
    for(var k=0;k<hashes.length;k++)hashes[k].addEventListener("click",function(e){e.preventDefault()});
    // Mega menu panels take the width set for them in the menu (desktop only), as ElementsKit did.
    function widths(){var lis=nav.querySelectorAll(".elementskit-megamenu-has[data-vertical-menu]");for(var i=0;i<lis.length;i++){var p=lis[i].querySelector(":scope > .elementskit-megamenu-panel");if(p)p.style.width=isMobile(nav)?"":lis[i].getAttribute("data-vertical-menu")}}
    fit(nav);widths();var t;window.addEventListener("resize",function(){clearTimeout(t);t=setTimeout(function(){fit(nav);widths()},100)});
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){fit(nav)});
  })(navs[n]);
}
function isMobile(nav){return document.documentElement.classList.contains("ttr-nav-collapsed")||window.matchMedia("(max-width:1119px)").matches}
/* The desktop menu must never wrap: if its items do not fit on one line (a wider font, a
   narrow window), switch to the phone menu, as the live site does below 1025px. */
function fit(nav){
  var html=document.documentElement;html.classList.remove("ttr-nav-collapsed");
  if(window.matchMedia("(max-width:1119px)").matches)return;
  var ul=nav.querySelector(".elementskit-navbar-nav");if(!ul)return;
  var items=ul.children,top=null,wrap=false,right=0;
  for(var i=0;i<items.length;i++){var r=items[i].getBoundingClientRect();if(!r.width)continue;right=Math.max(right,r.right);if(top===null)top=r.top;else if(Math.abs(r.top-top)>4){wrap=true;break}}
  // The menu must stay on one line and inside the window; otherwise use the phone menu.
  if(wrap||right>window.innerWidth)html.classList.add("ttr-nav-collapsed");
}

/* ---------- entrance animations, counters ---------- */
function reveal(){
  var els=document.querySelectorAll(".elementor-invisible");
  for(var i=0;i<els.length;i++)(function(el){
    var s=settings(el),name=s._animation||s.animation||"fadeIn",delay=+(s._animation_delay||s.animation_delay||0);
    var mq=window.matchMedia("(max-width:767px)").matches?(s._animation_mobile||s.animation_mobile):window.matchMedia("(max-width:1024px)").matches?(s._animation_tablet||s.animation_tablet):null;
    if(mq)name=mq;
    onView(el,function(){setTimeout(function(){el.classList.remove("elementor-invisible");if(name!=="none")el.classList.add("animated",name)},delay)});
  })(els[i]);
  var cs=document.querySelectorAll(".elementor-counter-number");
  for(var j=0;j<cs.length;j++)(function(c){
    var to=+c.getAttribute("data-to-value")||0,from=+c.getAttribute("data-from-value")||0,dur=+c.getAttribute("data-duration")||2000,d=c.getAttribute("data-delimiter");
    function fmt(v){var s=String(Math.round(v));return d?s.replace(/\\B(?=(\\d{3})+(?!\\d))/g,d):s}
    c.textContent=fmt(from);
    onView(c,function(){var t0=null;function step(t){if(t0===null)t0=t;var p=Math.min(1,(t-t0)/dur);c.textContent=fmt(from+(to-from)*p);if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)},"0px");
  })(cs[j]);
}

/* ---------- backgrounds, video ---------- */
function bg(){
  var secs=document.querySelectorAll(".e-con.e-parent");
  for(var i=0;i<secs.length;i++)(function(s){onView(s,function(){s.classList.add("e-lazyloaded")},"0px 0px 300px 0px")})(secs[i]);
  var vids=document.querySelectorAll("video.elementor-background-video-hosted[data-src]");
  for(var j=0;j<vids.length;j++)(function(v){
    var box=v.parentNode;if(!box||getComputedStyle(box).display==="none")return;
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    onView(box,function(){v.src=v.getAttribute("data-src");v.removeAttribute("data-src");var p=v.play();if(p&&p.catch)p.catch(function(){})},"200px");
  })(vids[j]);
}

/* ---------- carousels ---------- */
function bp(map){var w=window.innerWidth,best=null,k;for(k in map){if(w>=+k&&(best===null||+k>+best))best=k}return best===null?null:map[best]}
function slider(root,wrapper,opts){
  var slides=[].slice.call(wrapper.children);if(!slides.length)return;
  root.classList.add("swiper-initialized","swiper-horizontal");
  var per,gap,index=0,timer=null,paused=false,dots=root.querySelector(".swiper-pagination");
  function layout(){
    var o=opts.layout();per=Math.max(1,Math.min(o.per,slides.length));gap=o.gap||0;
    var w=root.clientWidth,sw=(w-gap*(per-1))/per;
    for(var i=0;i<wrapper.children.length;i++){var s=wrapper.children[i];s.style.width=sw+"px";s.style.marginRight=gap+"px"}
    wrapper.style.transitionDuration="0ms";go(index,true);
    if(dots){dots.classList.add("swiper-pagination-clickable","swiper-pagination-bullets","swiper-pagination-horizontal");var n=Math.max(1,slides.length-(opts.loop?0:per-1));if(dots.children.length!==n){dots.innerHTML="";for(var d=0;d<n;d++){var b=document.createElement("span");b.className="swiper-pagination-bullet";b.setAttribute("role","button");b.setAttribute("tabindex","0");b.setAttribute("aria-label","Go to slide "+(d+1));(function(d){b.addEventListener("click",function(){go(d);restart()})})(d);dots.appendChild(b)}}}
  }
  function go(i,instant){
    var max=opts.loop?slides.length:Math.max(0,slides.length-per);
    if(i>max)i=0;if(i<0)i=max;index=i;
    var w=root.clientWidth,sw=(w-gap*(per-1))/per;
    wrapper.style.transitionDuration=instant?"0ms":(opts.speed||300)+"ms";
    wrapper.style.transform="translate3d("+(-i*(sw+gap))+"px,0,0)";
    if(opts.loop&&i===slides.length){setTimeout(function(){go(0,true)},(opts.speed||300)+20)}
    if(dots)for(var d=0;d<dots.children.length;d++)dots.children[d].classList.toggle("swiper-pagination-bullet-active",d===(i%slides.length))
  }
  if(opts.loop){for(var c=0;c<slides.length;c++){var cl=slides[c].cloneNode(true);cl.setAttribute("aria-hidden","true");cl.classList.add("swiper-slide-duplicate");wrapper.appendChild(cl)}}
  wrapper.style.transitionTimingFunction=opts.linear?"linear":"ease";
  function restart(){if(timer)clearInterval(timer);if(opts.autoplay)timer=setInterval(function(){if(!paused&&!document.hidden)go(index+1)},opts.delay+(opts.linear?opts.speed:0))}
  if(opts.pauseOnHover){root.addEventListener("mouseenter",function(){paused=true});root.addEventListener("mouseleave",function(){paused=false})}
  layout();var t;window.addEventListener("resize",function(){clearTimeout(t);t=setTimeout(layout,150)});
  if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)restart();
}
function carousels(){
  var ic=document.querySelectorAll(".elementor-widget-image-carousel");
  for(var i=0;i<ic.length;i++)(function(w){
    var s=settings(w),root=w.querySelector(".swiper"),wr=w.querySelector(".swiper-wrapper");if(!root||!wr)return;
    var sp=function(v){return v&&v.size!==""&&v.size!==undefined?+v.size:null};
    slider(root,wr,{loop:s.infinite==="yes",autoplay:s.autoplay==="yes",speed:+s.speed||500,delay:s.autoplay_speed===undefined?5000:+s.autoplay_speed,linear:+s.autoplay_speed===0,pauseOnHover:s.pause_on_hover==="yes",
      layout:function(){var m=window.matchMedia("(max-width:767px)").matches,t=window.matchMedia("(max-width:1024px)").matches;
        var per=+(m?(s.slides_to_show_mobile||1):t?(s.slides_to_show_tablet||Math.min(3,+s.slides_to_show||3)):(s.slides_to_show||3));
        var gap=(m?sp(s.image_spacing_custom_mobile):t?sp(s.image_spacing_custom_tablet):null);if(gap===null)gap=sp(s.image_spacing_custom);if(gap===null)gap=20;return {per:per,gap:gap}}});
  })(ic[i]);
  var ts=document.querySelectorAll(".elementskit-testimonial-slider[data-config]");
  for(var j=0;j<ts.length;j++)(function(el){
    var c={};try{c=JSON.parse(el.getAttribute("data-config"))}catch(e){}
    var root=el.querySelector(".swiper"),wr=el.querySelector(".swiper-wrapper");if(!root||!wr)return;
    slider(root,wr,{loop:!!c.loop,autoplay:!!c.autoplay,speed:+c.speed||1000,delay:(c.autoplay&&c.autoplay.delay)||3000,pauseOnHover:!!c.pauseOnHover,
      layout:function(){var b=bp(c.breakpoints||{})||{};return {per:+(b.slidesPerView||c.slidesPerView||1),gap:+(b.spaceBetween!==undefined?b.spaceBetween:c.spaceBetween||0)}}});
  })(ts[j]);
  var mc=document.querySelectorAll(".elementor-widget-media-carousel");
  for(var k=0;k<mc.length;k++)(function(w){
    var s=settings(w),root=w.querySelector(".swiper"),wr=w.querySelector(".swiper-wrapper");if(!root||!wr)return;
    slider(root,wr,{loop:s.loop==="yes",autoplay:s.autoplay==="yes",speed:+s.speed||500,delay:+s.autoplay_speed||5000,pauseOnHover:s.pause_on_hover==="yes",
      layout:function(){var m=window.matchMedia("(max-width:767px)").matches,t=window.matchMedia("(max-width:1024px)").matches;return {per:+(m?(s.slides_per_view_mobile||1):t?(s.slides_per_view_tablet||2):(s.slides_per_view||3)),gap:(s.space_between&&+s.space_between.size)||10}}});
  })(mc[k]);
}

/* ---------- accordions ---------- */
function accordions(){
  var acc=document.querySelectorAll(".e-n-accordion");
  for(var i=0;i<acc.length;i++)(function(a){
    var items=a.querySelectorAll(":scope > details");
    for(var j=0;j<items.length;j++)items[j].addEventListener("toggle",function(e){
      var d=e.currentTarget,sum=d.querySelector("summary");if(sum)sum.setAttribute("aria-expanded",d.open?"true":"false");
      if(d.open)for(var k=0;k<items.length;k++)if(items[k]!==d&&items[k].open)items[k].open=false;
    });
  })(acc[i]);
}

/* ---------- scripts in custom HTML blocks ---------- */
function scripts(){
  var list=[].slice.call(document.querySelectorAll(".elementor-widget-html script"));
  (function next(){var old=list.shift();if(!old)return;var s=document.createElement("script");for(var i=0;i<old.attributes.length;i++)s.setAttribute(old.attributes[i].name,old.attributes[i].value);
    if(old.src){s.onload=s.onerror=next;old.parentNode.replaceChild(s,old)}else{s.text=old.text;old.parentNode.replaceChild(s,old);next()}})();
}

/* ---------- posts widgets: thumbnail fitting (Elementor's fitImages) ---------- */
function posts(){
  var ws=document.querySelectorAll(".elementor-widget-posts");
  for(var i=0;i<ws.length;i++)(function(w){var c=w.querySelector(".elementor-posts-container");if(!c)return;
    function fit(p){var t=p.querySelector(".elementor-post__thumbnail"),im=t&&t.querySelector("img");if(!im||!im.naturalWidth)return;t.classList.toggle("elementor-fit-height",im.naturalHeight/im.naturalWidth<t.offsetHeight/t.offsetWidth)}
    function all(){c.classList.toggle("elementor-has-item-ratio",/\\d/.test(getComputedStyle(w,":after").content||""));var ps=c.querySelectorAll(".elementor-post");for(var j=0;j<ps.length;j++)fit(ps[j])}
    all();var ims=c.querySelectorAll(".elementor-post__thumbnail img");for(var k=0;k<ims.length;k++)(function(im){im.addEventListener("load",function(){fit(im.closest(".elementor-post"))})})(ims[k]);
    window.addEventListener("resize",all);
  })(ws[i]);
}

/* ---------- blog search ---------- */
function search(){
  var boxes=document.querySelectorAll(".elementor-widget-wpr-search");
  for(var i=0;i<boxes.length;i++)(function(w){
    var input=w.querySelector(".wpr-search-form-input"),list=w.querySelector(".wpr-data-fetch"),ul=list&&list.querySelector("ul"),idx=w.querySelector("script[type='application/json']");if(!input||!ul||!idx)return;
    var posts=[];try{posts=JSON.parse(idx.textContent)}catch(e){}
    function esc(s){return s.replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
    function show(){var q=input.value.trim().toLowerCase();if(q.length<2){list.style.display="";ul.innerHTML="";return}
      var hits=posts.filter(function(p){return p.title.toLowerCase().indexOf(q)>=0}).slice(0,6);
      ul.innerHTML=hits.length?hits.map(function(h){return '<li><a class="wpr-ajax-title" href="'+esc(h.path)+'">'+esc(h.title)+"</a></li>"}).join(""):'<li class="wpr-no-results">No Results Found</li>';list.style.display="block"}
    input.addEventListener("input",show);
    w.querySelector("form").addEventListener("submit",function(e){e.preventDefault();show()});
    var close=w.querySelector(".wpr-close-search");if(close)close.addEventListener("click",function(){input.value="";show()});
  })(boxes[i]);
}

/* ---------- download form ---------- */
function forms(){
  var fs=document.querySelectorAll("form.frm-fluent-form[data-pdf]");
  for(var i=0;i<fs.length;i++)(function(f){
    var q=new URLSearchParams(location.search).get("selected_pdf");
    var hidden=f.querySelector('input[name="hidden"]');if(q&&hidden)hidden.value=q;
    f.addEventListener("submit",function(e){
      e.preventDefault();var ok=true,first=null;
      var req=f.querySelectorAll('[aria-required="true"]');
      for(var j=0;j<req.length;j++){var el=req[j],grp=el.closest(".ff-el-group"),bad=!el.value.trim()||(el.type==="email"&&!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(el.value));
        if(grp){grp.classList.toggle("ff-el-is-error",bad);var m=grp.querySelector(".error");if(bad&&!m){m=document.createElement("div");m.className="error text-danger";m.textContent=el.type==="email"&&el.value.trim()?"This field must contain a valid email":"This field is required";(el.closest(".ff-el-input--content")||grp).appendChild(m)}else if(!bad&&m)m.remove()}
        if(bad){ok=false;if(!first)first=el}}
      if(!ok){first.focus();return}
      var pdf=(hidden&&hidden.value)||f.getAttribute("data-pdf");
      if(pdf){try{var u=new URL(pdf,location.href);if(u.host===location.host||/(^|\\.)ttrtechnology\\.com$/.test(u.host))pdf=u.pathname+u.search}catch(x){}window.open(pdf,"_blank","noopener")}
    });
  })(fs[i]);
}
})();`;
}
