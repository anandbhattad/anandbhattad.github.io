/* ==================================================================
   Publications list with GitHub stars **and** citation counts — uses
   the open Semantic Scholar Graph API. Supports multiple CorpusIds,
   sums citations, and shows BibTeX inline under each publication.
   
   UPDATED: Now supports local BibTeX file for faster loading!
   Copy button copies BibTeX **and auto‑hides the block after 0.5 s**.
==================================================================*/

const CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day
const LOCAL_BIBTEX_PATH = './publications.bib'; // Path to local BibTeX file

// Global variable to store loaded BibTeX data
let localBibTeXData = null;

/* ------------------------------------------------------------------
   0. Helpers / Cache
------------------------------------------------------------------*/
function getCache(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const { ts, val } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return val;
  } catch {}
  localStorage.removeItem(key);
  return null;
}

function setCache(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), val }));
  } catch {}
}

/* ------------------------------------------------------------------
   0.1. Local BibTeX Loading
------------------------------------------------------------------*/
async function loadLocalBibTeX() {
  if (localBibTeXData !== null) return localBibTeXData;
  
  try {
    const response = await fetch(LOCAL_BIBTEX_PATH);
    if (!response.ok) {
      console.warn('Local BibTeX file not found, falling back to API');
      return null;
    }
    
    const content = await response.text();
    localBibTeXData = parseBibTeX(content);
    console.log(`Loaded ${Object.keys(localBibTeXData).length} BibTeX entries from local file`);
    return localBibTeXData;
  } catch (error) {
    console.warn('Failed to load local BibTeX file:', error);
    return null;
  }
}

function parseBibTeX(content) {
  const entries = {};
  
  // Split by @ to get individual entries
  const rawEntries = content.split(/^@/gm).filter(entry => entry.trim());
  
  rawEntries.forEach(entry => {
    if (!entry.trim()) return;
    
    // Add back the @ symbol
    const fullEntry = '@' + entry;
    
    // Extract the citation key
    const keyMatch = fullEntry.match(/@\w+\{([^,]+),/);
    if (keyMatch) {
      const key = keyMatch[1];
      entries[key] = fullEntry.trim();
    }
  });
  
  return entries;
}

function generateCitationKey(title, year) {
  const cleanTitle = title
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 2)
    .slice(0, 3)
    .join('');
  
  return `${cleanTitle}${year}`.toLowerCase();
}

function findBibTeXByTitle(title, year) {
  if (!localBibTeXData) return null;
  
  // Try exact key match first
  const key = generateCitationKey(title, year);
  if (localBibTeXData[key]) {
    return localBibTeXData[key];
  }
  
  // Try fuzzy matching by title
  const normalizeTitle = (t) => t.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const normalizedTitle = normalizeTitle(title);
  
  for (const [citationKey, bibtex] of Object.entries(localBibTeXData)) {
    // Extract title from BibTeX
    const titleMatch = bibtex.match(/title\s*=\s*[{"]([^"}]+)["}]/i);
    if (titleMatch) {
      const bibTitle = normalizeTitle(titleMatch[1]);
      if (bibTitle === normalizedTitle) {
        return bibtex;
      }
    }
  }
  
  return null;
}

function findBibTeXByCorpusId(corpusId) {
  if (!localBibTeXData) return null;
  
  // Look for corpus ID in BibTeX entries
  for (const [citationKey, bibtex] of Object.entries(localBibTeXData)) {
    if (bibtex.includes(corpusId)) {
      return bibtex;
    }
  }
  
  return null;
}

/* ------------------------------------------------------------------
   1. Data + addPublication
------------------------------------------------------------------*/
const publications = [];

/* Author homepages: any author whose exact name (markers stripped) appears here is linked, new tab.
   Add a line to link someone; leave them out to keep the name plain. */
const AUTHOR_LINKS = {
  "Chaohao Yang": "https://louiscroix.github.io/",
  "Ankit Vaidya": "https://scholar.google.com/citations?user=IYizOPMAAAAJ&hl=en",
  "Annie Wang": "https://scholar.google.com/citations?user=8Pg7CpwAAAAJ&hl=en",
  "Ayush Sarkar": "https://siebelschool.illinois.edu/research/undergraduate-research/summer-research-experience-undergraduates/participants/ayush-sarkar",
  "Bo Li": "https://codas.uchicago.edu/people/bo-li/",
  "Bohan Liu": "https://bohanliu.com/",
  "Cheng Peng": "https://sites.google.com/view/cheng-peng/home",
  "Daniel McKee": "https://www.danielbmckee.com/",
  "Fr\u00e9d\u00e9ric Fortier-Chouinard": "https://lefreud.github.io/",
  "Hanlin Mai": "https://hanlinmai.web.illinois.edu/",
  "Haoyu Liu": "https://huajianduzhuo-code.github.io/",
  "Jae Yong Lee": "https://jyl.kr/",
  "James Soole": "https://jamessoole.github.io/",
  "Jansen Seheult": "https://scholar.google.com/citations?user=YcaZZ2wAAAAJ&hl=en",
  "Jiading Fang": "https://www.fangjiading.com/",
  "Jingtian Ji": "https://lucienji.github.io/",
  "Jixuan Ying": "https://scholar.google.com/citations?user=wxPubfMAAAAJ&hl=en",
  "Kaizhao Liang": "https://kyleliang919.github.io/",
  "Konrad Groh": "https://is.mpg.de/person/kgroh",
  "Mathieu Garon": "https://mathieugaron.ca/",
  "Min Jin Chong": "https://mchong6.github.io/",
  "Oscar Michel": "https://ojmichel.github.io/",
  "Prakhar Kaushik": "https://toshi2k2.github.io/",
  "Seemandhar Jain": "https://seemandhar.github.io/",
  "Sezer Karaoglu": "https://karaoglusezer.github.io/",
  "Shuai Tang": "https://scholar.google.com/citations?user=-BWQeOoAAAAJ&hl=en",
  "Tianchong Jiang": "https://tianchong-jiang.github.io/",
  "Tiezheng Zhang": "https://tiezheng11.github.io/",
  "Tingyu Zhu": "https://scholar.google.com/citations?user=59rSrYUAAAAJ&hl=en",
  "Vaibhav Vavilala": "https://siebelschool.illinois.edu/54482",
  "Wenchao Han": "https://scholar.google.com/citations?user=E_labUUAAAAJ&hl=en",
  "Xiangshan Tan": "https://vincent-tann.github.io/",
  "Yi-Ting Chen": "https://jamie725.github.io/website/",
  "Yuani Zhong": "https://scholar.google.com/citations?hl=en&user=PtmjwooAAAAJ",
  "Namitha Guruprasad": "https://aiem.jhu.edu/people/namitha-guruprasad/",
  "Zhi-Hao Lin": "https://chih-hao-lin.github.io/",
  "Andrew Tao": "https://scholar.google.com/citations?user=Wel9l1wAAAAJ&hl=en",
  "Aditya Kusupati": "https://adityakusupati.com/",
  "Alan Yuille": "https://www.cs.jhu.edu/~ayuille/",
  "Alexei A. Efros": "https://people.eecs.berkeley.edu/~efros/",
  "Ali Farhadi": "https://homes.cs.washington.edu/~ali/",
  "Ani Kembhavi": "https://anikem.github.io/",
  "Aniruddha Kembhavi": "https://anikem.github.io/",
  "Aysegul Dundar": "https://www.cs.bilkent.edu.tr/~adundar/",
  "Bodo Rosenhahn": "https://www.tnt.uni-hannover.de/staff/rosenhahn/",
  "Bryan Catanzaro": "https://ctnzr.io/",
  "Chih-Hao Lin": "https://chih-hao-lin.github.io/",
  "Chuhang Zou": "https://zouchuhang.github.io/",
  "Cihang Xie": "https://cihangxie.github.io/",
  "D.A. Forsyth": "http://luthuli.cs.uiuc.edu/~daf/",
  "David A. Forsyth": "http://luthuli.cs.uiuc.edu/~daf/",
  "David Forsyth": "http://luthuli.cs.uiuc.edu/~daf/",
  "David Serrano-Lozano": "https://davidserra9.github.io/",
  "David.A.Forsyth": "http://luthuli.cs.uiuc.edu/~daf/",
  "Deming Li": "https://scholar.google.com/citations?user=s3fmKrMAAAAJ&hl=en",
  "Derek Hoiem": "https://dhoiem.cs.illinois.edu/",
  "Feng Wang": "https://wangf3014.github.io/home/",
  "Florian Kluger": "https://www.tnt.uni-hannover.de/staff/kluger/",
  "Greg Shakhnarovich": "https://home.ttic.edu/~gregory/",
  "Guilin Liu": "https://liuguilin1225.github.io/",
  "Javier Vazquez-Corral": "https://www.jvazquez-corral.net/",
  "Jean-Fran\u00e7ois Lalonde": "https://vision.gel.ulaval.ca/~jflalonde/",
  "Jia-Bin Huang": "https://jbhuang0604.github.io/",
  "Jiahan Zhang": "https://me.jiahanzhang.top/",
  "Jun Myeong Choi": "https://chedgekorea.github.io/",
  "Konpat Preechakul": "https://konpat.me/",
  "Liwen Wu": "https://lwwu2.github.io/",
  "Luis Herranz": "https://www.lherranz.org/",
  "Matt Deitke": "https://mattdeitke.com/",
  "Matthew R. Walter": "https://home.ttic.edu/~mwalter/",
  "Matthew Wallingford": "https://mattwallingford.github.io/",
  "Michael Maire": "https://people.cs.uchicago.edu/~mmaire/",
  "Nicholas Kolkin": "https://home.ttic.edu/~nickkolkin/",
  "Pieter Peers": "https://www.cs.wm.edu/~ppeers/",
  "Pradhaan S Bhat": "https://pradhaansbhat.github.io/",
  "Rama Chellappa": "https://engineering.jhu.edu/faculty/rama-chellappa/",
  "Ranjay Krishna": "https://ranjaykrishna.com/",
  "Rishubh Parihar": "https://rishubhpar.github.io/",
  "Roni Sengupta": "https://www.cs.unc.edu/~ronisen/",
  "Roozbeh Mottaghi": "https://roozbehm.info/",
  "Sham Kakade": "https://sham.seas.harvard.edu/",
  "Shenlong Wang": "https://shenlong.web.illinois.edu/",
  "Shivam Tripathi": "https://shivamt-tr.github.io/",
  "Soumava Paul": "https://mvp18.github.io/",
  "Sucheng Ren": "https://oliverrensu.github.io/",
  "Svetlana Lazebnik": "https://slazebni.cs.illinois.edu/",
  "Tanmay Gupta": "https://tanmaygupta.info/",
  "Theo Gevers": "https://staff.fnwi.uva.nl/th.gevers/",
  "Timing Yang": "https://yangtiming.github.io/",
  "Trong-Tung Nguyen": "https://nttung1110.github.io/",
  "Varun Varma Thozhiyoor": "https://varunvarmat.github.io/",
  "Venkatesh Babu": "https://cds.iisc.ac.in/faculty/venky/",
  "Venkatesh Babu Radhakrishnan": "https://cds.iisc.ac.in/faculty/venky/",
  "Vinayak Gupta": "https://vinayak-vg.github.io/",
  "Viraj Shah": "https://virajshah.com/",
  "Vitor Guizilini": "https://vitorguizilini.weebly.com/",
  "Vivek Ramanujan": "https://vkramanuj.github.io/",
  "Wei-Chiu Ma": "https://www.cs.cornell.edu/~weichiu/",
  "William Gao": "https://scholar.google.com/citations?user=SacEpXoAAAAJ&hl=en",
  "Xiang Fan": "https://xiangfan.io/",
  "Xiao Zhang": "https://xiao7199.github.io/",
  "Xiaodan Du": "https://xiaodan.io/",
  "Xiaoyan Xing": "https://xyxingx.github.io/",
  "Yuxiong Wang": "https://yxw.cs.illinois.edu/",
  "Zeyu Zheng": "https://ieor.berkeley.edu/people/zeyu-zheng/",
  "Zitian Zhang": "https://github.com/zzt76"
};
function linkAuthor(tok) {
  const name = tok.replace(/<sup>.*?<\/sup>|\*/g, "").trim();        // "Name*" / "Name<sup>†</sup>" -> "Name"
  const url  = AUTHOR_LINKS[name];
  const out  = url ? tok.replace(name, `<a href="${url}" target="_blank" rel="noopener">${name}</a>`) : tok;
  return /Anand Bhattad/.test(name) ? `<strong>${out}</strong>` : out;
}

function addPublication(
  img, title, authors, venue, paper, project, code, arxiv,
  githubRepo, tldr, year, published,
  isHighlight = false, isVideo = false,
  ssIds = [],  bibKey = null,
  addedOn = null            // "YYYY-MM-DD": shows a "New" pill for 90 days after this date
) {
  authors = authors.split(", ").map(linkAuthor).join(", ");

  if (typeof ssIds === "string")
    ssIds = ssIds.split(",").map((s) => s.trim()).filter(Boolean);

  publications.push({
    img, title, authors, venue, paper, project, code, arxiv,
    githubRepo, tldr, year, published, isHighlight, isVideo, ssIds, addedOn
  });
}

/* ------------------------------------------------------------------
   4. Rendering
------------------------------------------------------------------*/
async function renderPublications(filter = "highlights") {
  const $list = $("#publications-list").empty();

  const subset = publications.filter((p) =>
    filter === "highlights" ? p.isHighlight
    : filter === "published" ? p.published === "published"
    : true);

  /* group by year */
  const byYear = subset.reduce((m, p) => {
    const y = p.year === "In Submission" ? "In Submission" : p.year;
    (m[y] ||= []).push(p);
    return m;
  }, {});

  Object.keys(byYear)
    .sort((a, b) => a === "In Submission" ? -1 : b === "In Submission" ? 1 : b - a)
    .forEach((y) => {
      $list.append(`<h3 class="publication-year">${y}</h3>`);
      byYear[y].forEach((p) => $list.append(genPubHTML(p)));
    });

  $(".publication-filter").removeClass("active");
  $(`.publication-filter[data-filter="${filter}"]`).addClass("active");
  if (typeof window !== "undefined" && window.initI2V) window.initI2V();
}

/* ------------------------------------------------------------------
   6. Card template
------------------------------------------------------------------*/
const NEW_FOR_DAYS = 90;
function isNew(addedOn) {
  if (!addedOn) return false;
  const age = (Date.now() - Date.parse(addedOn)) / 864e5;
  return age >= 0 && age < NEW_FOR_DAYS;
}

function genPubHTML(p) {
  const link = p.project || p.arxiv || p.paper;
  const media = (src) => p.isVideo
    ? `<video src="${src}" autoplay loop muted playsinline></video>`
    : `<img src="${src}" alt="${p.title}">`;
  const i2v = (m) =>                                      // staged teaser: single image -> (3D authoring clip) -> generated video (see initI2V in script.js)
    `<div class="i2v is-still"><video src="${m.src}" muted playsinline preload="auto"></video>` +
    (m.control ? `<video class="i2v-control" src="${m.control}" muted playsinline preload="auto"></video>` : "") +
    `<span class="i2v-badge">Single input image</span></div>`;
  const img = (p.img && p.img.kind === "i2v") ? i2v(p.img)
    : Array.isArray(p.img)                                 // a list renders side by side; entries may be "file" or {src, label}
    ? `<div class="pub-media-row">${p.img.map(m => typeof m === "string"
        ? media(m)
        : `<figure class="pub-media-item">${media(m.src)}<figcaption>${m.label}</figcaption></figure>`).join("")}</div>`
    : media(p.img);

  return `
  <div class="publication-item">
    <div class="pub-image">${img}</div>
    <div class="pub-details">
      <div class="pub-title"><a href="${link}" target="_blank">${p.title}</a>${isNew(p.addedOn) ? ' <span class="new-pill">New</span>' : ""}</div>
      <div class="pub-authors">${p.authors}</div>
      <div class="pub-venue">${p.venue}</div>
      <div class="pub-links">
        ${p.paper   ? `<a href="${p.paper}"   target="_blank"><i class="fas fa-file-pdf"></i> Paper</a>`   : ""}
        ${p.project ? ` <a href="${p.project}" target="_blank"><i class="fas fa-globe"></i> Project</a>` : ""}
        ${p.code    ? ` <a href="${p.code}"    target="_blank"><i class="fas fa-code"></i> Code</a>`    : ""}
        ${p.arxiv   ? ` <a href="${p.arxiv}"   target="_blank"><i class="fas fa-archive"></i> arXiv</a>`  : ""}
      </div>
      <div class="pub-tldr"><strong>TL;DR:</strong> ${p.tldr}</div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------
   6b. Video controls appear only while a card is hovered (keeps teasers clean)
------------------------------------------------------------------*/
if (typeof document !== 'undefined') {
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest && e.target.closest('.publication-item');
    if (card) card.querySelectorAll('video').forEach((v) => { if (!v.closest('.i2v')) v.controls = true; });
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest && e.target.closest('.publication-item');
    if (card && !card.contains(e.relatedTarget)) card.querySelectorAll('video').forEach((v) => { v.controls = false; });
  });
}

/* ------------------------------------------------------------------
   7. Inline BibTeX expander (enhanced with local support)
------------------------------------------------------------------*/
if (typeof window !== 'undefined') {
  (function () {
    async function bibById(id) {
      try {
        const api = `https://api.semanticscholar.org/graph/v1/paper/CorpusId:${id}?fields=citationStyles`;
        const { citationStyles = {} } = await (await fetch(api)).json();
        return citationStyles.bibtex ||
               await (await fetch(`https://www.semanticscholar.org/CorpusId:${id}.bib`)).text();
      } catch { return null; }
    }

    async function bibByTitle(title) {
      try {
        const s = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(title)}&limit=1&fields=corpusId`;
        const { data = [] } = await (await fetch(s)).json();
        const cid = data[0]?.corpusId;
        return cid ? bibById(cid) : null;
      } catch { return null; }
    }

    async function getBibTeX(title, year, corpusId) {
      // First try local BibTeX
      await loadLocalBibTeX();
      
      if (localBibTeXData) {
        // Try by corpus ID first
        if (corpusId) {
          const localBib = findBibTeXByCorpusId(corpusId);
          if (localBib) {
            console.log('Found BibTeX in local file by corpus ID');
            return localBib;
          }
        }
        
        // Try by title
        const localBib = findBibTeXByTitle(title, year);
        if (localBib) {
          console.log('Found BibTeX in local file by title');
          return localBib;
        }
      }
      
      // Do not fallback to API
      console.log('No BibTeX found in local file');
      return 'BibTeX unavailable (not found in local file)';
    }

    // global handler attached via onclick
    window.showBibtex = async (e, link) => {
      e.preventDefault();
      const card = link.closest('.publication-item');
      if (!card) return;

      let pre = card.querySelector('.bibtex-inline');
      let btn = card.querySelector('.bibtex-copy');
      if (pre) { pre.hidden = btn.hidden = !pre.hidden; return; }

      pre = document.createElement('pre');
      pre.className = 'bibtex-inline';
      pre.textContent = 'Loading BibTeX …';
      card.querySelector('.pub-details').appendChild(pre);

      btn = document.createElement('button');
      btn.className = 'bibtex-copy';
      btn.textContent = 'Copy';
      card.querySelector('.pub-details').appendChild(btn);

      btn.onclick = () => {
        navigator.clipboard.writeText(pre.textContent).then(() => {
          setTimeout(() => { pre.hidden = btn.hidden = true; }, 500);
        });
      };

      const title = link.dataset.title;
      const year = link.dataset.year;
      const corpusId = link.dataset.corpusid;
      
      const cacheKey = corpusId
        ? `bib_${corpusId}`
        : `bib_t_${title.toLowerCase()}`;
      const cached = getCache(cacheKey);
      if (cached) { pre.textContent = cached; return; }

      const bib = await getBibTeX(title, year, corpusId);
      // Remove BibTeX comments (lines starting with %)
      const bibNoComments = bib
        .split('\n')
        .filter(line => !/^\s*%/.test(line))
        .join('\n');
      setCache(cacheKey, bibNoComments);
      pre.textContent = bibNoComments;
    };
  })();
}

/* ------------------------------------------------------------------
   8. CSS hooks  (add once to your stylesheet)
------------------------------------------------------------------*/
/*
.bibtex-inline{
  background:var(--secondary-color,#f8fafc);
  padding:.6rem .8rem;
  margin-top:.6rem;
  white-space:pre-wrap;
  border-left:3px solid var(--primary-color);
  font-size:.85em;
  border-radius:4px;
}
.bibtex-copy{
  margin:.4rem 0 0;
  padding:.25rem .7rem;
  font-size:.75em;
  cursor:pointer;
}
*/

/* ------------------------------------------------------------------
   9. Utilities + Node export
------------------------------------------------------------------*/
function filterPublications(f) { renderPublications(f); }

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  document.querySelector('.theme-toggle i').className =
    document.body.classList.contains('dark-theme') ? 'fas fa-sun' : 'fas fa-moon';
}

if (typeof module !== 'undefined') {
  module.exports = { publications };
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
  {src: "./images/gencine_teaser.mp4", control: "./images/gencine_control.mp4", kind: "i2v"},
  "Generative Cinematographer: Composing Camera and Object Motion in 3D",
  "Jiahan Zhang, Chaohao Yang, Namitha Guruprasad, Vivekjyoti Banerjee, Trong-Tung Nguyen, Alan Yuille, Anand Bhattad",
  "Preprint, arXiv 2026",
  "https://arxiv.org/abs/2610.02180",
  "https://generative-cinematographer.github.io/", // project page
  "", // code link
  "https://arxiv.org/abs/2610.02180",
  "", // github-repo-name
  "Author the camera path and object motion together in a 3D scene lifted from a single image; a video diffusion model turns them into a coherent shot.",
  "In Submission",
  "pre-print",
  true,
  true,
  [],
  "",
  "2026-10-01"
);

addPublication(
  "./images/powersim_mirror.mp4",
  "PowerSim: Differentiable Physics Simulation and Rendering with Power Diagrams",
  "Trong-Tung Nguyen, Anand Bhattad",
  "Preprint, arXiv 2026",
  "https://arxiv.org/abs/2609.38153",
  "https://power-sim.github.io/", // project page
  "", // code link
  "https://arxiv.org/abs/2609.38153",
  "", // github-repo-name
  "Differentiable MPM dynamics on a PowerFoam power-diagram scene: poke captured scenes, recover materials, compose objects, and ray-trace reflections that stay consistent as they deform.",
  "In Submission",
  "pre-print",
  true,
  true,
  [],
  "",
  "2026-09-30"
);

addPublication(
  [{src: "./images/fracgen_early.mp4", label: "Early fracture"}, {src: "./images/fracgen_delay.mp4", label: "Delayed fracture"}],
  "FracGen: Learning How Objects Stretch and Tear with Physics-Informed Video Generation",
  "Trong-Tung Nguyen, Jiahan Zhang, Anand Bhattad",
  "Preprint, arXiv 2026",
  "https://arxiv.org/abs/2609.38152",
  "https://fracgen.github.io/", // project page
  "", // code link
  "https://arxiv.org/abs/2609.38152",
  "", // github-repo-name
  "Fracture-aware video generation from one image of an intact object. Trained on MPM fracture simulations with pixel-aligned physics maps, it controls where, how fast, and how much an object tears.",
  "In Submission",
  "pre-print",
  true,
  true,
  [],
  "",
  "2026-09-30"
);

addPublication(
  "./images/vit5_model.png",
  "ViT-5: Vision Transformers for The Mid-2020s",
  "Feng Wang, Sucheng Ren, Tiezheng Zhang, Predrag Neskovic, Anand Bhattad, Cihang Xie, Alan Yuille",
  "Preprint, arXiv 2026",
  "https://arxiv.org/abs/2602.08071",
  "", // project page
  "https://github.com/wangf3014/ViT-5", // code link
  "https://arxiv.org/abs/2602.08071",
  "wangf3014/ViT-5", // github-repo-name
  "A component-wise modernization of the plain ViT: ViT-5-Base reaches 84.2% ImageNet-1k top-1 and is a stronger diffusion backbone (1.84 vs 2.06 FID), as a drop-in upgrade.",
  "In Submission",
  "pre-print",
  false,
  false,
  [],
  "",
  "2026-09-29"
);

addPublication(
  "./images/principia.mp4",
  "Principia: Relational Physics Tests for Video Models",
  "Varun Varma Thozhiyoor*, Shivam Tripathi*, Venkatesh Babu Radhakrishnan, Anand Bhattad",
  "NeurIPS 2026 (Evaluations & Datasets Track)",
  "https://arxiv.org/abs/2609.04200",
  "https://principiabench.github.io/", // project page
  "", // code link
  "https://arxiv.org/abs/2609.04200",
  "", // github-repo-name
  "Calibration-free relational physics tests for video generators: state-of-the-art models show inconsistent, mostly sub-Earth gravity.",
  "2026",
  "published",
  true,
  true,
  [],
  "",
  "2026-09-15"
);

addPublication(
  "./images/thinking_in_boxes_v2.mp4",
  "Thinking in Boxes: 3D Editing in Real Images Made Easy",
  "Pradhaan S Bhat*, Naveen Chandra*, Rishubh Parihar, Vaibhav Vavilala, Venkatesh Babu, D.A. Forsyth, Anand Bhattad",
  "NeurIPS 2026",
  "https://arxiv.org/abs/2606.20556",
  "https://thinking-in-boxes.github.io/", // project page
  "", // code link
  "https://arxiv.org/abs/2606.20556",
  "", // github-repo-name
  "Objects become coarse 3D boxes you can move, rotate, and rescale, giving in-the-wild 3D-aware edits of real images that keep identity and scene consistency.",
  "2026",
  "published",
  true,
  true,
  [],
  "",
  "2026-09-24"
);

addPublication(
  "./images/synclight_teaser_3.mp4",
  "SyncLight: Single-Edit Multi-View Relighting",
  "David Serrano-Lozano, Anand Bhattad<sup>†</sup>, Luis Herranz, Jean-François Lalonde<sup>†</sup>, Javier Vazquez-Corral<sup>†</sup>",
  "NeurIPS 2026",
  "https://arxiv.org/abs/2601.16981",
  "https://sync-light.github.io/",
  "https://github.com/CVC-Color/synclight", // code link
  "https://arxiv.org/abs/2601.16981",
  "CVC-Color/synclight", // github-repo-name
  "SyncLight generates consistent multi-view relighting by only specifing the lighting in one view and it consistently propagates to all views in a single inference step.",
  "2026",
  "published",
  true,
  true,
  [],
  "",
  "2026-09-24"
);

addPublication(
  "./images/rats_teaser.png",
  "RATS! Patches Talk Through Registers: Emergent Parts in Register Attention Transformers",
  "Timing Yang, Predrag Neskovic, Jansen Seheult, Wenchao Han, Anand Bhattad, Alan Yuille, Feng Wang",
  "NeurIPS 2026",
  "https://arxiv.org/abs/2606.14701",
  "", // project page
  "", // code link
  "https://arxiv.org/abs/2606.14701",
  "", // github-repo-name
  "Learnable register tokens route patch information through a compress-communicate-broadcast bottleneck and specialize into object parts with no supervision: +12 mIoU on part segmentation.",
  "2026",
  "published",
  false,
  false,
  [],
  "",
  "2026-09-24"
);

addPublication(
  "./images/context_ar_placeholder.png",
  "Context-Aware Autoregressive Image Generation for Emerging Reasoning Properties",
  "Jixuan Ying, Haoyu Liu, Timing Yang, Tingyu Zhu, Predrag Neskovic, Anand Bhattad, Cihang Xie, Zeyu Zheng, Alan Yuille, Feng Wang",
  "NeurIPS 2026",
  "", // paper (not yet public)
  "", // project page
  "", // code link
  "", // arXiv
  "", // github-repo-name
  "Context-aware autoregressive image generation from which reasoning properties emerge. Paper, project page, and teaser to follow once the camera-ready is public.",
  "2026",
  "published",
  false,
  false,
  [],
  "",
  "2026-09-24"
);

addPublication(
  "./images/syncfix.mp4",
  "SyncFix: Fixing 3D Reconstructions via Multi-View Synchronization",
  "Deming Li, Abhay Yadav, Cheng Peng, Rama Chellappa, Anand Bhattad",
  "ECCV 2026",
  "https://arxiv.org/abs/2604.11797",
  "https://syncfix.github.io/",
  "https://github.com/Deming77/SyncFix", // code link
  "https://arxiv.org/abs/2604.11797",
  "SyncFix", // github-repo-name
  "Refines 3D reconstructions by synchronizing distorted and clean views with a latent bridge-matching diffusion model; trained on image pairs, it generalizes to any number of views.",
  "2026",
  "published",
  false,
  true,
  [],
  "",
  "2026-10-01"
);

addPublication(
    "./images/ALI.png",
    "Relighting as a Probe of Visual Priors via Augmented Latent Intrinsics",
    "Xiaoyan Xing, Xiao Zhang, Sezer Karaoglu, Theo Gevers, Anand Bhattad",
    "ICML 2026",
    "https://arxiv.org/abs/2602.01391",
    "https://augmented-latent-intrinsics.github.io/",
    "", // code link",
    "https://arxiv.org/abs/2602.01391",
    "short project name",
    "Stronger semantic encoders can hurt relighting. Augmented Latent Intrinsics (ALI) balances semantic context with dense photometric structure.",
    2026,
    "published",
    false,
    false
);


addPublication(
  "./images/gravity_eval.mp4",
  "Objects in Generated Videos Are Slower Than They Appear: Models Suffer Sub-Earth Gravity and Don’t Know Galileo’s Principle...for now",
  "Varun Varma Thozhiyoor, Shivam Tripathi, Venkatesh Babu Radhakrishnan, Anand Bhattad",
  "CVPR 2026 (Findings)",
  "https://arxiv.org/abs/2512.02016",
  "https://gravity-eval.github.io/",
  "", // code link
  "https://arxiv.org/abs/2512.02016",
  "", // github-repo-name
  "A unit-free, relative-motion protocol shows generated videos violate Galileo's principle: objects fall with inconsistent, mostly sub-Earth accelerations.",
  "2026",
  "published",
  true,
  true,
  [],
  ""
);



addPublication(
  "./images/part_segmentation.mp4",
  "Name That Part: 3D Part Segmentation and Naming",
  "Soumava Paul*, Prakhar Kaushik*, Ankit Vaidya, Anand Bhattad, Alan Yuille",
  "CVPR 2026 (Findings)",
  "https://arxiv.org/abs/2512.18003",
  "https://name-that-part.github.io/",
  "", // code link,
  "https://arxiv.org/abs/2512.18003",
  "", // github-repo-name
  "Our model predicts a complete set of named 3D parts by aligning part-level representations (“Partlets”) to affordance-aware natural-language descriptions.",
  "2026",
  "published",
  true,
  true,
  [],
  ""
);

addPublication(
  "images/genwildsplat.mp4",
  "Generalizable Sparse-View 3D Reconstruction from Unconstrained Images",
  "Vinayak Gupta, Chih-Hao Lin, Shenlong Wang, Anand Bhattad, Jia-Bin Huang",
  "CVPR 2026",
  "",
  "",
  "",
  "",
  "",
  "Reconstructs 3D scenes from sparse, unposed images with changing illumination and transient objects in one 3-second feed-forward pass, no per-scene optimization.",
  2026,
  "published",
 false,
 true,
);


addPublication(
  "./images/kyc.gif",
  "Do You Know Where Your Camera Is? View-Invariant Policy Learning with Camera Conditioning",
  "Tianchong Jiang, Jingtian Ji, Xiangshan Tan, Jiading Fang, Anand Bhattad, Vitor Guizilini, Matthew R. Walter",
  "ICRA 2026 (Oral, <span style='color:red;'>Best Paper Award in Robot Learning</span>)",
  "https://arxiv.org/abs/2510.02268",
  "https://ripl.github.io/know_your_camera/",
  "https://github.com/ripl/CamPoseOpensource", // code link
  "https://arxiv.org/abs/2510.02268",
  "CamPoseOpensource", // github-repo-name
  "Conditioning imitation-learning policies on camera extrinsics removes background shortcuts and makes them robust to camera placement and workspace changes.",
  "2026",
  "published",
  true,
  false,
  [],
  ""
);

addPublication(
  "./images/gbw_2.gif",
  "Generative Blocks World: Moving Things Around in Pictures",
  "Vaibhav Vavilala, Seemandhar Jain, Rahul Vasanth, D.A. Forsyth, Anand Bhattad",
  "ICLR 2026",
  "https://arxiv.org/abs/2506.20703",
  "",
  "", // code link
  "https://arxiv.org/abs/2506.20703",
  "", // github-repo-name
  "Edit generated images by moving multi-scale 3D convex primitives; a flow-based generator conditioned on depth and texture hints preserves object identity.",
  "2026",
  "published",
  true,
  false,
  [],
  ""
);

addPublication(
  "./images/convex_decomp_2.png",
  "Improved Convex Decomposition with Ensembling and Boolean Primitives",
  "Vaibhav Vavilala, Florian Kluger, Seemandhar Jain, Bodo Rosenhahn, Anand Bhattad, David Forsyth",
  "3DV 2026",
  "https://arxiv.org/abs/2405.19569",
  "",
  "", // code link
  "https://arxiv.org/abs/2405.19569",
  "", // github-repo-name
  "Represents geometry from a single RGB-D frame with an adaptive ensemble of positive and negative convex polytopes, combining unsupervised initialization with test-time fine-tuning.",
  "2026",
  "published",
  false,
  false,
  [],
  ""
);

addPublication(
  "./images/spotlight.gif",
  "SpotLight: Shadow-Guided Object Relighting via Diffusion",
  "Frédéric Fortier-Chouinard, Zitian Zhang, Louis-Etienne Messier, Mathieu Garon, Anand Bhattad, Jean-François Lalonde",
  "3DV 2026",
  "https://arxiv.org/abs/2411.18665",
  "https://lvsn.github.io/spotlight/",
  "https://github.com/lvsn/SpotLight", // code link
  "https://arxiv.org/abs/2411.18665",
  "lvsn/SpotLight", // github-repo-name
  "SpotLight enables object relighting by using shadow guidance to control lighting conditions without requiring additional training. Builds upon our previous work ZeroComp.",
  "2026",
  "published",
  false,
  false,
  [],
  "Spotlight"
);

addPublication(
    "./images/visual_jenga.gif", 
    "Visual Jenga: Discovering Object Dependencies via Counterfactual Inpainting",
    "Anand Bhattad, Konpat Preechakul, Alexei A. Efros",
    "NeurIPS 2025",
    "https://visualjenga.github.io/static/Visual_Jenga.pdf",
    "https://visualjenga.github.io/",
    "", // code link
    "https://arxiv.org/abs/2503.21770",
    "", // github-repo-name
    "A new task: remove objects from a single image one by one while the rest of the scene stays stable. A large inpainting model decides the removal order.",
    "2025",
    "published",
    true,
    false,
    ["277349597"]);



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
    "Latent intrinsics (NeurIPS 2024) meet pretrained diffusion models for photorealistic indoor relighting, with a variational StyLitGAN generating training data.",
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
    "Xiang Fan, Anand Bhattad<sup>†</sup>, Ranjay Krishna<sup>†</sup>",
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
    "CVPR 2022 (Oral; <span style='color:red;'>Best Paper Finalist</span>))",
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