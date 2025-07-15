/* ==================================================================
   Publications list with GitHub stars **and** citation counts — uses
   the open Semantic Scholar Graph API. Supports multiple CorpusIds, 
   sums citations, and shows BibTeX for the FIRST id in a modal.      
==================================================================*/

const CACHE_TTL = 24 * 60 * 60 * 1000;  // 1 day
const citationSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M7.17 3.59c-1.25.39-2.44 1.09-3.31 2.12C2.66 7.01 2 8.39 2 10.09c0 1.87 1.52 3.41 3.41 3.41 1.89 0 3.41-1.54 3.41-3.41 0-1.1-.5-2.13-1.3-2.8.32-.76.82-1.43 1.45-1.94a6.68 6.68 0 0 0-1.8-.76zm10 0c-1.25.39-2.44 1.09-3.31 2.12-.9 1.3-1.56 2.68-1.56 4.38 0 1.87 1.52 3.41 3.41 3.41 1.89 0 3.41-1.54 3.41-3.41 0-1.1-.5-2.13-1.3-2.8.32-.76.82-1.43 1.45-1.94a6.68 6.68 0 0 0-1.8-.76z"/></svg>`;

let publications = [];

/* -------------------------------------------------- cache */
function getCache(k){const r=localStorage.getItem(k);if(!r)return null;try{const {ts,val}=JSON.parse(r);if(Date.now()-ts<CACHE_TTL)return val;}catch{}localStorage.removeItem(k);return null;}
function setCache(k,v){try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),val:v}));}catch{}}

/* --------------------------------------- addPublication */
function addPublication(img,title,authors,venue,paperLink,projLink,codeLink,arxivLink,git,tldr,year,published,isHi=false,isVid=false,ssIds=[]){
  authors = authors.split(', ').map(a=>/Anand Bhattad\*?/.test(a)?`<strong>${a}</strong>`:a).join(', ');
  if(typeof ssIds==='string') ssIds=ssIds.split(',').map(s=>s.trim()).filter(Boolean);
  publications.push({img,title,authors,venue,paperLink,projLink,codeLink,arxivLink,git,tldr,year,published,isHi,isVid,ssIds});
}

/* ----------------------------------- GitHub stars */
async function fetchGitHubStars(repo){if(!repo)return 0;const ck=`gh_${repo}`;const c=getCache(ck);if(c!==null)return c;try{const d=await(await fetch(`https://api.github.com/repos/${repo}`)).json();const s=d.stargazers_count||0;setCache(ck,s);return s;}catch{return 0;}}

/* -------------------- Semantic‑Scholar citations */
async function fetchSSCitations(pub){const raw=pub.ssIds??[];const ids=Array.isArray(raw)?raw:String(raw).split(',').map(s=>s.trim()).filter(Boolean);
  if(ids.length){const totals=await Promise.all(ids.map(async id=>{const ck=`ss_${id}`;const c=getCache(ck);if(c!==null)return c;try{const j=await(await fetch(`https://api.semanticscholar.org/graph/v1/paper/CorpusId:${id}?fields=citationCount`)).json();const v=j.citationCount||0;setCache(ck,v);return v;}catch{return 0;}}));return{count:totals.reduce((a,b)=>a+b,0),ids};}
  const k=`ss_${pub.title}`;const c=getCache(k);if(c!==null)return{count:c,ids:[]};try {
    // ask for the first 10 hits and include the title so we can verify
    const url = `https://api.semanticscholar.org/graph/v1/paper/search` +
                `?query=${encodeURIComponent(pub.title)}` +
                `&limit=10&fields=title,citationCount,corpusId`;
    const { data = [] } = await (await fetch(url)).json();
  
    // simple normalisation: lowercase, strip non‑alphanumerics
    const norm  = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const want  = norm(pub.title);
  
    // pick the first hit whose normalised title matches exactly
    const hit = data.find(d => norm(d.title) === want);
  
    if (!hit) return null;           // no reliable match → skip badge
  
    const count = hit.citationCount ?? 0;
    const id    = hit.corpusId;
    setCache(k, count);
  
    return { count, ids: id ? [id] : [] };
  
  } catch {
    return null;
  }}

/* --------------------------------------- render */
async function renderPublications(filter='highlights'){
  const $list=$('#publications-list').empty();
  const subset=publications.filter(p=>filter==='highlights'?p.isHi:filter==='published'?p.published==='published':true);
  const byYear=subset.reduce((m,p)=>{const y=p.year==='In Submission'?'In Submission':p.year;(m[y]=m[y]||[]).push(p);return m;},{});
  Object.keys(byYear).sort((a,b)=>a==='In Submission'?-1:b==='In Submission'?1:b-a).forEach(y=>{ $list.append(`<h3 class="publication-year">${y}</h3>`);byYear[y].forEach(p=>$list.append(genPubHTML(p)));});
  await Promise.allSettled(subset.map(async p=>{const stars=await fetchGitHubStars(p.git);const cites=await fetchSSCitations(p);updateMeta(p,stars,cites);}));
  $('.publication-filter').removeClass('active');$(`.publication-filter[data-filter="${filter}"]`).addClass('active');
}

/* ------------------- update meta line */
function updateMeta(p, stars, cites) {
  const $el = $(`#meta-${cssSafe(p.title)}`);
  if (!$el.length) return;

  const parts = [];

  // citation badge (only if we have a positive count)
  if (cites && cites.count > 0) {
    const first = cites.ids[0] || ""; // may be empty if came from title search
    parts.push(
      `<a href="#" onclick="showBibtex(event,this)" class="cite-link" data-corpusid="${first}" data-title="${p.title}" title="Show BibTeX">` +
        `${citationSVG} <span class="cite-number">${cites.count}</span>` +
      `</a>`
    );
  }

  // github stars
  if (p.git && stars > 0) {
    parts.push(
      `<a href="https://github.com/${p.git}" target="_blank" class="star-count" title="GitHub Stars">` +
        `<i class="fas fa-star"></i> ${stars}` +
      `</a>`
    );
  }

  $el.html(parts.join(" "));
}

/* --------------- HTML skeleton for one card */
function genPubHTML(p){const id=cssSafe(p.title);const link=p.projLink||p.arxivLink||p.paperLink;const img=p.isVid?`<video src="${p.img}" controls autoplay loop muted></video>`:`<img src="${p.img}" alt="${p.title}">`;
  return `<div class="publication-item"><div class="pub-image">${img}</div><div class="pub-details"><div class="pub-title"><a href="${link}" target="_blank">${p.title}</a></div><div class="pub-authors">${p.authors}</div><div class="pub-venue">${p.venue}</div><div class="pub-links">${p.paperLink?`<a href="${p.paperLink}" target="_blank"><i class="fas fa-file-pdf"></i> Paper</a>`:''}${p.projLink?` <a href="${p.projLink}" target="_blank"><i class="fas fa-globe"></i> Project</a>`:''}${p.codeLink?` <a href="${p.codeLink}" target="_blank"><i class="fas fa-code"></i> Code</a>`:''}${p.arxivLink?` <a href="${p.arxivLink}" target="_blank"><i class="fas fa-archive"></i> arXiv</a>`:''}</div><div class="pub-tldr"><strong>TL;DR:</strong> ${p.tldr}</div><div class="pub-stars" id="meta-${id}"></div></div></div>`;}

/* ------------------------- helpers */
function cssSafe(s){return s.replace(/[^a-z0-9]/gi,'_');}
function filterPublications(f){renderPublications(f);}  
function toggleTheme(){document.body.classList.toggle('dark-theme');document.querySelector('.theme-toggle i').className=document.body.classList.contains('dark-theme')?'fas fa-sun':'fas fa-moon';}

/* --------------------- BibTeX modal handler (runs once) */
(function initBibtexModal(){
  const start = () => {
    const modal   = document.getElementById('bibtex-modal');
    const pre     = document.getElementById('bibtex-text');
    const closeBt = document.getElementById('bibtex-close');
    const copyBt  = document.getElementById('bibtex-copy');
    if (!modal || !pre || !closeBt || !copyBt) {
      console.warn('BibTeX modal elements missing — did you add the HTML snippet?');
      return;
    }

    async function fetchBibtex(cid) {
      try {
        const url = `https://api.semanticscholar.org/graph/v1/paper/CorpusId:${cid}?fields=citationStyles`;
        const { citationStyles = {} } = await (await fetch(url)).json();
        return citationStyles.bibtex || await (await fetch(`https://www.semanticscholar.org/CorpusId:${cid}.bib`)).text();
      } catch { return null; }
    }

    // Inline click handler now attached to each badge via updateMeta
function getBibCache(k){ return getCache(`bib_${k}`); }
function setBibCache(k,v){ setCache(`bib_${k}`, v); }
    
  window.showBibtex = async (evt, el) => {
    evt.preventDefault();

    pre.textContent = 'Loading BibTeX …';
    modal.hidden = false;

    let bib = 'BibTeX unavailable';
    let cid = el.dataset.corpusid;

    async function fetchBib(cid) {
      try {
        const url = `https://api.semanticscholar.org/graph/v1/paper/CorpusId:${cid}?fields=citationStyles`;
        const { citationStyles = {} } = await (await fetch(url)).json();
        return citationStyles.bibtex || await (await fetch(`https://www.semanticscholar.org/CorpusId:${cid}.bib`)).text();
      } catch { return null; }
    }

    if (cid) {
      bib = await fetchBib(cid) || bib;
    } else {
      const title = el.dataset.title;
      if (title) {
        try {
          const search = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(title)}&limit=1&fields=corpusId`;
          const { data = [] } = await (await fetch(search)).json();
          cid = data[0]?.corpusId;
          if (cid) bib = await fetchBib(cid) || bib;
        } catch {}
      }
    }

    pre.textContent = bib;
    copyBt.textContent = 'Copy to clipboard';
  };

  closeBt.onclick = () => { modal.hidden = true; };

    copyBt.onclick = () => {
    const text = pre.textContent;
    if (!text) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        copyBt.textContent = 'Copied!';
        setTimeout(() => (copyBt.textContent = 'Copy to clipboard'), 1500);
      });
    } else {
      const range = document.createRange();
      range.selectNodeContents(pre);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
    }
  };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

/* ---------- inline BibTeX expander ---------------- */
(function () {

    async function bibById(id){
      try{
        const api=`https://api.semanticscholar.org/graph/v1/paper/CorpusId:${id}?fields=citationStyles`;
        const { citationStyles = {} } = await (await fetch(api)).json();
        return citationStyles.bibtex ||
               await (await fetch(`https://www.semanticscholar.org/CorpusId:${id}.bib`)).text();
      }catch{ return null; }
    }
  
    async function bibByTitle(title){
      try{
        const s=`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(title)}&limit=1&fields=corpusId`;
        const { data = [] } = await (await fetch(s)).json();
        const cid = data[0]?.corpusId;
        return cid ? bibById(cid) : null;
      }catch{ return null; }
    }
  
    /* called by the onclick set in updateMeta */
    window.showBibtex = async (e, link) => {
      e.preventDefault();
      const card = link.closest('.publication-item');
      if (!card) return;
  
      // toggle if we already inserted one
      let pre = card.querySelector('.bibtex-inline');
      if (pre){ pre.hidden = !pre.hidden; return; }
  
      pre = document.createElement('pre');
      pre.className = 'bibtex-inline';
      pre.textContent = 'Fetching BibTeX …';
      card.querySelector('.pub-details').appendChild(pre);
  
      const id  = link.dataset.corpusid;
      const bib = id ? await bibById(id) : await bibByTitle(link.dataset.title);
      pre.textContent = bib || 'BibTeX unavailable';
    };
  
  })();
  

// Adding Publications

// addPublication(
//     "path to teaser image",
//     "paper title",
//     "authors",
//     "venue",
//     "arXiv link",
//     "project page",
//     "code link",
//     "arXiv link",
//     "short project name",
//     "TLDR",
//     year,
//     "published or pre-print",
//     true for highlight,
//     true if teaser is video
// );

// Adding Publications
addPublication(
    "./images/visual_jenga.gif", 
    "Visual Jenga: Discovering Object Dependencies via Counterfactual Inpainting",
    "Anand Bhattad, Konpat Preechakul, Alexei A. Efros",
    "arXiv 2025",
    "https://visualjenga.github.io/static/Visual_Jenga.pdf",
    "https://visualjenga.github.io/",
    "", // code link
    "https://arxiv.org/abs/2503.21770",
    "", // github-repo-name
    "Visual Jenga is a new scene understanding task where the goal is to remove objects one by one from a single image while keeping the rest of the scene stable. We introduce a simple baseline that uses a large inpainting model to decide the removal order.",
    "2025",
    "pre-print",
    true,
    false,
    ["277349597"]);

addPublication(
    "./images/spotlight.gif",
    "SpotLight: Shadow-Guided Object Relighting via Diffusion",
    "Frédéric Fortier-Chouinard, Zitian Zhang, Louis-Etienne Messier, Mathieu Garon, Anand Bhattad, Jean-François Lalonde",
    "arXiv 2025",
    "https://arxiv.org/abs/2411.18665",
    "https://lvsn.github.io/spotlight/",
    "https://github.com/lvsn/SpotLight", // code link
    "https://arxiv.org/abs/2411.18665",
    "lvsn/SpotLight", // github-repo-name
    "SpotLight enables object relighting by using shadow guidance to control lighting conditions without requiring additional training. Builds upon ZeroComp (WACV 2025).",
    "2025",
    "pre-print",
    false,
    false
);

addPublication(
    "./images/luminet.gif",
    "LumiNet: Latent Intrinsics Meets Diffusion Models for Indoor Scene Relighting",
    "Xiaoyan Xing, Konrad Groh, Sezer Karaoglu, Theo Gevers, Anand Bhattad",
    "CVPR 2025",
    "https://arxiv.org/abs/2412.00177",
    "https://luminet-relight.github.io/",
    "https://github.com/xyxingx/LumiNet",
    "https://arxiv.org/abs/2412.00177",
    "xyxingx/LumiNet",
    "LumiNet leverages latent intrinsic decomposition (NeurIPS 2024) and integrates it with pretrained diffusion models to achieve photorealistic indoor scene relighting. Additionally, we introduce a variational StyLitGAN (CVPR 2024) for generating high-quality training data.",
    2025,
    "published",
    true,
    false,
);

addPublication(
    "./images/ScribbleLight.mp4",
    "ScribbleLight: Single Image Indoor Relighting with Scribbles",
    "Jun Myeong Choi, Annie Wang, Pieter Peers, Anand Bhattad, Roni Sengupta",
    "CVPR 2025",
    "https://arxiv.org/abs/2411.17696",
    "https://chedgekorea.github.io/ScribbleLight/",
    "https://github.com/chedgekorea/scriblit/", // code link
    "https://arxiv.org/abs/2411.17696",
    "chedgekorea/scriblit", // github-repo-name
    "Draw scribbles to specify which areas should be lit and which should not, and ScribbleLight will relight the image accordingly.",
    "2025",
    "published",
    false,
    true,
);


addPublication(
    "./images/urbanir_night_sim.mp4",
    "UrbanIR: Large-Scale Urban Scene Inverse Rendering from a Single Video",
    "Zhi-Hao Lin, Bohan Liu, Yi-Ting Chen, David Forsyth, Jia-Bin Huang, Anand Bhattad, Shenlong Wang",
    "3DV 2025",
    "https://arxiv.org/abs/2306.09349",
    "https://urbaninverserendering.github.io/",
    "https://github.com/zhihao-lin/urbanir/",
    "https://arxiv.org/abs/2306.09349",
    "zhihao-lin/urbanir",
    "UrbanIR creates realistic 3D renderings of urban scenes from single videos, allowing for novel lighting conditions and controllable editing.",
    2025,
    "published",
    "",
    true,
);

addPublication(
    "images/zerocomp.png",
    "ZeroComp: Zero-shot Object Compositing from Image Intrinsics via Diffusion",
    "Zitian Zhang, Frédéric Fortier-Chouinard, Mathieu Garon, Anand Bhattad, Jean-François Lalonde",
    "WACV 2025 (Oral)",
    "https://arxiv.org/abs/2410.08168",
    "https://lvsn.github.io/ZeroComp/",
    "https://github.com/lvsn/ZeroComp", // code link
    "https://arxiv.org/abs/2410.08168",
    "lvsn/ZeroComp",
    "Zero-shot 3D object compositing without paired training data. Easily extendable to 2D compositing and material editing.",
    2025,
    "published",
    "",
    "",
);

addPublication(
    "images/latent_intrinsics.png",
    "Latent Intrinsics Emerge from Training to Relight",
    "Xiao Zhang, William Gao, Seemandhar Jain, Michael Maire, David.A.Forsyth, Anand Bhattad",
    "NeurIPS 2024 (Spotlight)",
    "./files/2024_NeurIPS_latent_intrinsics.pdf",
    "https://sites.google.com/uchicago.edu/latent-intrinsic/home",
    "https://github.com/xiao7199/Latent_Intrinsics",
    "https://arxiv.org/abs/2405.21074",
    "xiao7199/Latent_Intrinsics",
    "Free albedo extraction from latent features in a relighting-trained model, without seeing albedo like images",
    2024,
    "published",
    true,
    "",
);

addPublication(
    "./images/odin_demo.mp4",
    "From an Image to a Scene: Learning to Imagine the World from a Million 360 Videos",
    "Matthew Wallingford, Anand Bhattad, Aditya Kusupati, Vivek Ramanujan, Matt Deitke, Sham Kakade, Aniruddha Kembhavi, Roozbeh Mottaghi, Wei-Chiu Ma, Ali Farhadi",
    "NeurIPS 2024",
    "./files/learning_from_video_neurips.pdf",
    "https://mattwallingford.github.io/ODIN/",
    "https://github.com/MattWallingford/360-1M",
    "https://arxiv.org/abs/2412.07770",
    "MattWallingford/360-1M",
    "A new 360° video dataset used to train a diffusion-based model, ODIN, for freely generating novel views of real-world scenes. Data is available on the project page.",
    2024,
    "published",
    true,
    true,
);

addPublication(
    "./images/videoshop.gif",
    "VideoShop: Localized Semantic Video Editing with Noise-Extrapolated Diffusion Inversion",
    "Xiang Fan, Anand Bhattad*, Ranjay Krishna*",
    "ECCV 2024",
    "./files/Videoshop_ECCV2024.pdf",
    "https://videoshop-editing.github.io/",
    "https://github.com/sfanxiang/videoshop",
    "https://arxiv.org/abs/2403.14617",
    "sfanxiang/videoshop",
    "Training-free video editing by modifying the first frame, propagating edits consistently across the video.",
    2024,
    "published",
    "",
    "",);


addPublication(
    "./images/proj_geom_teaser.mp4",
    "Shadows Don't Lie and Lines Can't Bend! Generative Models don't know Projective Geometry...for now",
    "Ayush Sarkar*, Hanlin Mai*, Amitabh Mahapatra*, Svetlana Lazebnik, David Forsyth, Anand Bhattad",
    "CVPR 2024",
    "https://projective-geometry.github.io/static/files/2024_CVPR_Evaluating_Projective_Geometry.pdf",
    "https://projective-geometry.github.io/",
    "https://github.com/hanlinm2/projective-geometry/",
    "https://arxiv.org/abs/2311.17138",
    "hanlinm2/projective-geometry",
    "Generated images can be easily distinguished from real by looking at derived projective geometry cues --- perspectives (lines) and shadows.",
    2024,
    "published",
    true,
    true,
);





addPublication(
    "./stylitgan/bed1.mp4",
    "StyLitGAN: Image-based Relighting via Latent Control",
    "Anand Bhattad, James Soole, David A. Forsyth",
    "CVPR 2024",
    "https://arxiv.org/abs/2205.10351",
    "https://anandbhattad.github.io/stylitgan/",
    "https://github.com/anandbhattad/stylitgan",
    "https://arxiv.org/abs/2205.10351",
    "anandbhattad/stylitgan",
    "By imposing known physical facts about images, we can prompt StyleGAN to generate relighted or resurfaced images without using labeled data.",
    2024,
    "published",
    true,
    true,
    ["268255604","258427166","248965398"]
);

addPublication(
    "./images/I-lora.gif",
    "Generative Models: What do they know? Do they know things? Let's find out!",
    "Xiaodan Du, Nicholas Kolkin, Greg Shakhnarovich, Anand Bhattad",
    "CVPR-W 2024",
    "https://intrinsic-lora.github.io/static/files/paperv3.pdf",
    "https://intrinsic-lora.github.io/",
    "https://github.com/duxiaodan/intrinsic-lora",
    "https://arxiv.org/abs/2311.17137",
    "duxiaodan/intrinsic-lora",
    "Intrinsic LoRA: A method to extract intrinsic images from ANY generative model, be it Autoregressive, GAN, or Diffusion.",
    "2024",
    "published",
    true,
    "",
);

addPublication(
    "./images/stylegan_knows.gif",
    "StyleGAN knows Normal, Depth, Albedo and more",
    "Anand Bhattad, Daniel McKee, Derek Hoiem, David Forsyth",
    "NeurIPS 2023",
    "https://proceedings.neurips.cc/paper_files/paper/2023/file/e7407ab5e89c405d28ff6807ffec594a-Paper-Conference.pdf",
    "",
    "",
    "https://arxiv.org/abs/2306.00987",
    "",
    "StyleGAN has easy accessible internal encoding of intrinsic images as originally defined by Barrow and Tenenbaum in their influential paper of 1978.",
    2023,
    "published",
    true,
    "",
);

addPublication(
    "./images/object_edit.gif",
    "OBJect 3DIT: Language-guided 3D-aware Image Editing",
    "Oscar Michel, Anand Bhattad, Eli VanderBilt, Ranjay Krishna, Ani Kembhavi, Tanmay Gupta",
    "NeurIPS 2023",
    "https://arxiv.org/abs/2307.11073",
    "https://prior.allenai.org/projects/object-edit",
    "https://github.com/allenai/object-edit",
    "https://arxiv.org/abs/2307.11073",
    "allenai/object-edit",
    "A synthetic dataset and a model that learns to rotate, translate, insert, and remove objects identified by language in a scene. It can transfer to real-world images.",
    2023,
    "published",
    "",
    "",
);

addPublication(
    "./images/equivariant_20fps.mp4",
    "Improving Equivariance in State-of-the-Art Supervised Depth and Normal Predictors",
    "Yuani Zhong, Anand Bhattad, Yuxiong Wang, David A. Forsyth",
    "ICCV 2023",
    "https://openaccess.thecvf.com/content/ICCV2023/html/Zhong_Improving_Equivariance_in_State-of-the-Art_Supervised_Depth_and_Normal_Predictors_ICCV_2023_paper.html",
    "https://arxiv.org/abs/2309.16646",
    "https://github.com/mikuhatsune/equivariance",
    "https://arxiv.org/abs/2309.16646",
    "mikuhatsune/equivariance",
    "SOTA normal and depth predictors are not equivariant to image cropping. We propose equivariant regularization loss to improve equivariance in these models.",
    2023,
    "published",
    "",
    true
);

addPublication(
    "./makeitso/static/images/makeitso_out_of_domain.png",
    "Make It So: Steering StyleGAN for Any Image Inversion and Editing",
    "Anand Bhattad, Viraj Shah, Derek Hoiem, D.A. Forsyth",
    "arXiv 2023",
    "https://arxiv.org/abs/2304.14403",
    "https://anandbhattad.github.io/makeitso/",
    "",
    "https://arxiv.org/abs/2304.14403",
    "",
    "A near-perfect GAN inversion method for any image that also preserves edits.",
    2023,
    ""
);

addPublication(
    "./images/reshaded.png",
    "Cut-and-Paste Object Insertion by Enabling Deep Image Prior for Reshading",
    "Anand Bhattad, David A. Forsyth",
    "3DV 2022 (Spotlight)",
    "https://anandbhattad.github.io/projects/dipr.pdf",
    "https://anandbhattad.github.io/projects/reshading/index.html",
    "https://github.com/anandbhattad/reshading",
    "https://arxiv.org/abs/2010.05907",
    "anandbhattad/reshading",
    "Convincing cut-and-paste reshading with consistent image decomposition inferences.",
    2022,
    "published",
    "",
    "",
    ["252212202","222291281"]
);

addPublication(
    "./images/nerf_fail_ours.png",
    "DIVeR: Real-time and Accurate Neural Radiance Fields with Deterministic Integration for Volume Rendering",
    "Liwen Wu, Jae Yong Lee, Anand Bhattad, Yuxiong Wang, David A. Forsyth",
    "CVPR 2022 (Oral; Best Paper Finalist)",
    "https://arxiv.org/abs/2111.10427",
    "https://lwwu2.github.io/diver/",
    "https://github.com/lwwu2/diver",
    "https://arxiv.org/abs/2111.10427",
    "lwwu2/diver",
    "Improving Real-Time NeRF with Deterministic Integration.",
    2022,
    "published",
    true
);

addPublication(
    "./images/car3D.gif",
    "View Generalization for Single Image Textured 3D Models",
    "Anand Bhattad, Aysegul Dundar, Guilin Liu, Andrew Tao, Bryan Catanzaro",
    "CVPR 2021",
    "https://arxiv.org/abs/2106.06533",
    "https://nv-adlr.github.io/view-generalization/",
    "",
    "https://arxiv.org/abs/2106.06533",
    "",
    "Consistent textured 3D inferences from a single 2D image.",
    2021,
    "published"
);

addPublication(
    "./images/adv_golfcart.png",
    "Unrestricted Adversarial Examples via Semantic Manipulation",
    "Anand Bhattad*, Min Jin Chong*, Kaizhao Liang, Bo Li, David A. Forsyth",
    "ICLR 2020 and CVPR-W 2019",
    "https://arxiv.org/abs/1904.06347",
    "",
    "https://github.com/AI-secure/Big-but-Invisible-Adversarial-Attack/",
    "https://arxiv.org/abs/1904.06347",
    "AI-secure/Big-but-Invisible-Adversarial-Attack",
    "Generating realistic adversarial examples by image re-colorization and texture transfer.",
    2020,
    "published",
    true,
    "",
    [ "213304602","119186256"] // Semantic Scholar Corpus IDs
);

addPublication(
    "./images/EvalStyleTransfer.png",
    "Improving Style Transfer with Calibrated Metrics",
    "Mao Chuang Yeh*, Shuai Tang*, Anand Bhattad, Chuhang Zou, David A. Forsyth",
    "WACV 2020",
    "https://arxiv.org/abs/1910.09447",
    "",
    "",
    "https://arxiv.org/abs/1910.09447",
    "",
    "A novel quantitative evaluation procedure for style transfer methods.",
    2020,
    "published",
    "",
    "",
    ["204800851", "4560478"]

);

addPublication(
    "./images/anomaly.png",
    "Detecting Anomalous Faces with 'No Peeking' Autoencoders",
    "Anand Bhattad, Jason Rock, David A. Forsyth",
    "CVPR-W 2018",
    "https://arxiv.org/abs/1802.05798",
    "",
    "",
    "https://arxiv.org/abs/1802.05798",
    "",
    "A simple unsupervised method for detecting anomalous faces by carefully constructing features from 'No Peeking' or inpainting autoencoders.",
    2018,
    "published"
);