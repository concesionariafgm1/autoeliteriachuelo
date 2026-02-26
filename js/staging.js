(function(){
  try{
    var SITE = window.SITE;
    if (!SITE || !SITE.env) return;
    if (String(SITE.env.mode||'').toLowerCase() !== 'staging') return;
    var tag = document.querySelector('meta[name="robots"]');
    if (!tag) { tag=document.createElement('meta'); tag.setAttribute('name','robots'); document.head.appendChild(tag); }
    tag.setAttribute('content','noindex,nofollow');
  } catch(e){}
})();