
const SERP_API_KEY = "761b7ce58d1c58f522bfda8050765fd4a9f2c5c92f25cf4fdf54dc98053fd4b0";   // ← set once
const CACHE_TTL    = 72 * 60 * 60 * 1000;          // 24 h in ms // once in 3 days

let publications = [];

/* ---------- simple cache helpers ---------------------------- */
function getCache(k){
    const raw = localStorage.getItem(k);
    if(!raw) return null;
    try{ const {ts,val}=JSON.parse(raw); if(Date.now()-ts<CACHE_TTL) return val; }catch{}
    localStorage.removeItem(k); return null;
  }
  function setCache(k,v){ try{localStorage.setItem(k,JSON.stringify({ts:Date.now(),val:v}));}catch{} }
  
  /* ---------- addPublication (clusterIds may be array or CSV) - */
  function addPublication(
    imagePath,title,authors,venue,paperLink,projectLink,codeLink,
    arxivLink,githubRepo,tldr,year,published,
    isHighlight=false,isVideo=false,
    gsClusterIds=[],              // ← array OR comma‑string
    gsSearch=null                 // fallback search query
  ){
    authors = authors.split(', ').map(a=>
      a==='Anand Bhattad'||a==='Anand Bhattad*'?`<strong>${a}</strong>`:a).join(', ');
    if(typeof gsClusterIds==='string') gsClusterIds = gsClusterIds.split(',').map(s=>s.trim()).filter(Boolean);
    publications.push({imagePath,title,authors,venue,paperLink,projectLink,codeLink,
      arxivLink,githubRepo,tldr,year,published,isHighlight,isVideo,gsClusterIds,gsSearch});
  }
  

/* ----------------------- GitHub -------------------------- */
async function fetchGitHubStars(repo){
  if(!repo) return 0;
  try{
    const r = await fetch(`https://api.github.com/repos/${repo}`);
    const d = await r.json();
    return d.stargazers_count || 0;
  }catch(e){console.error('GitHub API',e);return 0;}
}

/* ---------- Google‑Scholar via SerpAPI (sum multiple IDs) --- */
async function fetchGSCitations(pub){
    if(!SERP_API_KEY) return null;
    if(pub.gsClusterIds.length){
      // parallel fetch each ID, cache individually, then sum
      const counts = await Promise.all(pub.gsClusterIds.map(async id=>{
        const ck=`gs_${id}`; const c=getCache(ck); if(c!==null) return c;
        const url=`https://serpapi.com/search?engine=google_scholar&cluster_id=${id}&api_key=${SERP_API_KEY}`;
        try{const r=await fetch(url);const j=await r.json();const v=j.cited_by?.value??null; if(v!==null) setCache(ck,v); return v??0;}catch{return 0;}
      }));
      const total = counts.reduce((a,b)=>a+b,0);
      return total>0?total:null;
    }
    // fallback title search once
    const key=`gs_${pub.title}`; const cached=getCache(key); if(cached!==null) return cached;
    const url=`https://serpapi.com/search?engine=google_scholar&q=${encodeURIComponent(pub.gsSearch||pub.title)}&api_key=${SERP_API_KEY}`;
    try{const r=await fetch(url);const j=await r.json();const first=j.organic_results?.[0];const total=first?.inline_links?.cited_by?.total??null; if(total!==null) setCache(key,total);return total;}catch{return null;}
  }
  
  
  /* -----------------------------------------------------------------
     Render (parallel fetch + placeholder update)                      */
  async function renderPublications(filter='highlights'){
    const $list = $('#publications-list').empty();
  
    const subset = publications.filter(p=>{
      if(filter==='highlights') return p.isHighlight;
      if(filter==='published')  return p.published==='published';
      return true;});
  
    const byYear = subset.reduce((m,p)=>{
      const y = p.year==='In Submission' ? 'In Submission': p.year;
      (m[y] ||= []).push(p);return m;},{});
    const years = Object.keys(byYear).sort((a,b)=>{
      if(a==='In Submission')return -1;if(b==='In Submission')return 1;return b-a;});
  
    // 1. build cards with placeholders (—)
    for(const y of years){
      $list.append(`<h3 class="publication-year">${y}</h3>`);
      byYear[y].forEach(p=>{
        $list.append(genPubHTML(p,'—','—')); // placeholder
      });
    }
  
    // 2. fetch all meta in parallel
    const tasks = subset.map(async p=>{
      const [stars,cites] = await Promise.all([
        fetchGitHubStars(p.githubRepo),
        fetchGSCitations(p)
      ]);
      updateMetaLine(p,stars,cites);
    });
    await Promise.allSettled(tasks);
  
    $('.publication-filter').removeClass('active');
    $(`.publication-filter[data-filter="${filter}"]`).addClass('active');
  }
  
  /* -------- update a single card’s stars/cites after fetch ------ */
  function updateMetaLine(pub,stars,cites){
    const id = cssSafe(pub.title);
    const $el = $(`#meta-${id}`);
    if(!$el.length) return;
    const parts = [];
    if(pub.githubRepo && stars>0)
      parts.push(`<span class="star-count"><i class="fas fa-star"></i> ${stars}</span>`);
  
    if(cites!==null && cites>0){
      const link = pub.gsClusterId?
        `https://scholar.googleusercontent.com/scholar.bib?q=info:${pub.gsClusterId}:scholar.google.com`:
        `https://scholar.google.com/scholar?q=${encodeURIComponent(pub.gsSearch||pub.title)}`;
      parts.push(`<a href="${link}" target="_blank" class="cite-link" title="Google Scholar BibTeX">&quot; ${cites}</a>`);
    }
    $el.html(parts.join(''));
  }
  
  /* ---------------- HTML template (placeholders) ------------- */
  function genPubHTML(pub,stars,cites){
    const href = pub.projectLink||pub.arxivLink||pub.paperLink;
    const img  = pub.isVideo?
      `<video src="${pub.imagePath}" controls autoplay loop muted></video>`:
      `<img src="${pub.imagePath}" alt="${pub.title}">`;
    const id   = cssSafe(pub.title);
  
    return `<div class="publication-item">
      <div class="pub-image">${img}</div>
      <div class="pub-details">
        <div class="pub-title"><a href="${href}" target="_blank">${pub.title}</a></div>
        <div class="pub-authors">${pub.authors}</div>
        <div class="pub-venue">${pub.venue}</div>
        <div class="pub-links">
          ${pub.paperLink  ? `<a href="${pub.paperLink}"  target="_blank"><i class="fas fa-file-pdf"></i> Paper</a>`  : ''}
          ${pub.projectLink? `<a href="${pub.projectLink}" target="_blank"><i class="fas fa-globe"></i> Project</a>`: ''}
          ${pub.codeLink   ? `<a href="${pub.codeLink}"   target="_blank"><i class="fas fa-code"></i> Code</a>`   : ''}
          ${pub.arxivLink  ? `<a href="${pub.arxivLink}"  target="_blank"><i class="fas fa-archive"></i> arXiv</a>`  : ''}
        </div>
        <div class="pub-tldr"><strong>TL;DR:</strong> ${pub.tldr}</div>
        <div class="pub-stars" id="meta-${id}">
          ${pub.githubRepo? `<span class="star-count"><i class="fas fa-star"></i> ${stars}</span>` : ''}
          ${cites!=='—'? `<a class="cite-link">&quot; ${cites}</a>` : ''}
        </div>
      </div>
    </div>`;
  }
  
  function cssSafe(str){return str.replace(/[^a-z0-9]/gi,'_');}
  
  /* ----------- helpers -------------------------------------- */
  function filterPublications(f){ renderPublications(f); }
  function toggleTheme(){
    document.body.classList.toggle('dark-theme');
    const ic=document.querySelector('.theme-toggle i');
    ic.className=document.body.classList.contains('dark-theme')?'fas fa-sun':'fas fa-moon';
  }
  

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
    "In Submission",
    "pre-print",
    true,
    false,
    "5880491882271109753" // gsClusterId
);

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
    "In Submission",
    "pre-print",
    false,
    false,
    "6593607985494569546" // gsClusterId
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
    "15331000940612795058" // gsClusterId
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
    "6123926049869266591"// gsClusterId
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
    "10807180582613066648" // gsClusterId
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
    "2267893941274651305" // gsClusterId
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
    "3025748679517000102" // gsClusterId
);

addPublication(
    "./images/odin_demo.mp4",
    "From an Image to a Scene: Learning to Imagine the World from a Million 360° Videos",
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
    "3551500819320531335" // gsClusterId
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
    "",
    "4446678399309230968" // gsClusterId
);


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
    "2349223455520013505" // gsClusterId
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
    "342563626160142575,5309076001772414991,1073595206104370782,9581283269707904921" // gsClusterId
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
    "6192891741559610524,5561207490965026900,18082404577502186826"
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
    "14406650649925599173"
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
    "6023857969790326197"
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
    "published"
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
    true
);

addPublication(
    "./images/EvalStyleTransfer.png",
    "Improved Style Transfer with Calibrated Metrics",
    "Mao Chuang Yeh*, Shuai Tang*, Anand Bhattad, Chuhang Zou, David A. Forsyth",
    "WACV 2020",
    "https://arxiv.org/abs/1910.09447",
    "",
    "",
    "https://arxiv.org/abs/1910.09447",
    "",
    "A novel quantitative evaluation procedure for style transfer methods.",
    2020,
    "published"
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