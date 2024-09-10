let publications = [];

function addPublication(imagePath, title, authors, venue, paperLink, projectLink, codeLink, arxivLink, githubRepo, tldr, year, published, isHighlight = false, isVideo = false) {
    // Make "Anand Bhattad" bold
    authors = authors.split(', ').map(author => {
        if (author === 'Anand Bhattad' || (author === 'Anand Bhattad*')) {
            return `<strong>${author}</strong>`;
        }
        return author;
    }).join(', ');

    publications.push({
        imagePath, title, authors, venue, paperLink, projectLink, codeLink, arxivLink, githubRepo, tldr, year, published, isHighlight, isVideo
    });
}

async function fetchGitHubStars(repo) {
    try {
        let response = await fetch(`https://api.github.com/repos/${repo}`);
        let data = await response.json();
        return data.stargazers_count;
    } catch (error) {
        console.error('Error fetching GitHub stars:', error);
        return 0;
    }
}

async function renderPublications(filter = "highlights") {
    let $publicationsList = $('#publications-list');
    let $quickList = $('#quick-list');
    $publicationsList.empty();
    $quickList.empty();

    let filteredPublications = publications.filter(pub => {
        if (filter === 'highlights') return pub.isHighlight === true;
        if (filter === 'published') return pub.published === 'published';
        return true; // 'all' filter
    });

    let groupedByYear = filteredPublications.reduce((acc, pub) => {
        (acc[pub.year] = acc[pub.year] || []).push(pub);
        return acc;
    }, {});

    // Render Publications
    for (const year of Object.keys(groupedByYear).sort((a, b) => b - a)) {
        $publicationsList.append(`<h3 class="publication-year">${year}</h3>`);
        for (const pub of groupedByYear[year]) {
            let stars = pub.githubRepo ? await fetchGitHubStars(pub.githubRepo) : 0;

            // Check if the publication should be expanded by default
            let isExpanded = filter === 'highlights' || filter === 'published';

            let publicationHtml = generatePublicationHtml(pub, stars, isExpanded);
            $publicationsList.append(publicationHtml);
        }
    }

    // Render Quick List
    publications.forEach(pub => {
        $quickList.append(`<p><a href="${pub.paperLink}" target="_blank">${pub.title}</a></p>`);
    });

    // Update button active state (This should be outside the loop and the nested function)
    $('.publication-filter').removeClass('active');
    $(`.publication-filter[data-filter="${filter}"]`).addClass('active');
}

function generatePublicationHtml(pub, stars, isExpanded) {
    // Add a CSS class to control visibility
    let detailsClass = isExpanded ? 'pub-details expanded' : 'pub-details';

    // Determine the appropriate link for the title
    let titleLink = pub.projectLink ? pub.projectLink : pub.arxivLink;
    
    return `
        <div class="publication-item">
            <div class="pub-image">
                ${pub.isVideo ? `<video src="${pub.imagePath}" width="200" controls autoplay loop muted></video>` : `<img src="${pub.imagePath}" alt="${pub.title}" width="200">`}
            </div>
            <div class="${detailsClass}">
                <div class="pub-title"><a href="${titleLink}" target="_blank">${pub.title}</a></div>
                <div class="pub-authors">${pub.authors}</div>
                <div class="pub-venue">${pub.venue}</div>
                <div class="pub-links">
                    ${pub.paperLink ? `<a href="${pub.paperLink}" target="_blank">Paper</a>` : ''}
                    ${pub.projectLink ? `<a href="${pub.projectLink}" target="_blank">Project</a>` : ''}
                    ${pub.codeLink ? `<a href="${pub.codeLink}" target="_blank">Code</a>` : ''}
                    ${pub.arxivLink ? `<a href="${pub.arxivLink}" target="_blank">arXiv</a>` : ''}
                </div>
                <div class="pub-tldr"><strong>TL;DR:</strong> ${pub.tldr}</div>
                ${pub.githubRepo ? `<div class="pub-stars">${stars} ★ on GitHub</div>` : ''}
            </div>
        </div>
    `;
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

addPublication(
    "images/latent_intrinsics.png",
    "Latent Intrinsics Emerge from Training to Relight",
    "Xiao Zhang, William Gao, Seemandhar Jain, Michael Maire, David.A.Forsyth, Anand Bhattad",
    "arXiv 2024",
    "https://arxiv.org/abs/2405.21074",
    "https://latent-intrinsics.github.io/",
    "",
    "https://arxiv.org/abs/2405.21074",
    "Latent Intrinsics",
    "Free albedo extraction from latent features in a relighting-trained model, without seeing albedo like images",
    2024,
    "pre-print",
    true,
    ""
);

addPublication(
    "./images/videoshop.gif",
    "VideoShop: Localized Semantic Video Editing with Noise-Extrapolated Diffusion Inversion",
    "Xiang Fan, Anand Bhattad*, Ranjay Krishna*",
    "ECCV 2024",
    "https://arxiv.org/abs/2403.14617",
    "https://videoshop-editing.github.io/",
    "https://github.com/sfanxiang/videoshop",
    "https://arxiv.org/abs/2403.14617",
    "sfanxiang/videoshop",
    "Videoshop is a training-free algorithm that allows users to edit videos by modifying only the first frame using familiar image editing tools. It automatically propagates these edits throughout the video, maintaining consistency and allowing for precise, localized semantic changes.",
    2024,
    "published",
    true
);

addPublication(
    "./images/proj_geom_teaser.mp4",
    "Shadows Don't Lie and Lines Can't Bend! Generative Models don't know Projective Geometry...for now",
    "Ayush Sarkar*, Hanlin Mai*, Amitabh Mahapatra*, Svetlana Lazebnik, David Forsyth, Anand Bhattad",
    "CVPR 2024",
    "https://arxiv.org/abs/2311.17138",
    "https://projective-geometry.github.io/",
    "https://github.com/hanlinm2/projective-geometry/",
    "https://arxiv.org/abs/2311.17138",
    "hanlinm2/projective-geometry",
    "Generative models are not aware of projective geometry. We show that generated images can be easily distinguished by looking at derived projective geometry cues.",
    2024,
    "published",
    true,
    true
);

addPublication(
    "./images/I-lora.gif",
    "Generative Models: What do they know? Do they know things? Let's find out!",
    "Xiaodan Du, Nicholas Kolkin, Greg Shakhnarovich, Anand Bhattad",
    "CVPR-W 2024",
    "https://arxiv.org/abs/2311.17137",
    "https://intrinsic-lora.github.io/",
    "https://github.com/duxiaodan/intrinsic-lora",
    "https://arxiv.org/abs/2311.17137",
    "duxiaodan/intrinsic-lora",
    "Intrinsic LoRA: A method to extract intrinsic images from ANY generative model, be it Autoregressive, GAN, Diffusion!",
    2024,
    "published",
    true
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
    true
);

addPublication(
    "./images/urbanir_night_sim.mp4",
    "UrbanIR: Large-Scale Urban Scene Inverse Rendering from a Single Video",
    "Zhi-Hao Lin, Bohan Liu, Yi-Ting Chen, David Forsyth, Jia-Bin Huang, Anand Bhattad, Shenlong Wang",
    "CVPR-W 2024",
    "https://arxiv.org/abs/2306.09349",
    "https://urbaninverserendering.github.io/",
    "https://github.com/zhihao-lin/urbanir/",
    "https://arxiv.org/abs/2306.09349",
    "zhihao-lin/urbanir",
    "UrbanIR creates realistic 3D renderings of urban scenes from single videos, allowing for novel lighting conditions and controllable editing.",
    2024,
    "published",
    "",
    true
);

addPublication(
    "./images/stylegan_knows.gif",
    "StyleGAN knows Normal, Depth, Albedo and more",
    "Anand Bhattad, Daniel McKee, Derek Hoiem, David Forsyth",
    "NeurIPS 2023",
    "https://arxiv.org/abs/2306.00987",
    "",
    "",
    "https://arxiv.org/abs/2306.00987",
    "",
    "StyleGAN has easy accessible internal encoding of intrinsic images as originally defined by Barrow and Tenenbaum in their influential paper of 1978.",
    2023,
    "published",
    true
);

addPublication(
    "./images/object_edit.png",
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
    "published"
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
    "./images/reshaded.png",
    "Cut-and-Paste Object Insertion by Enabling Deep Image Prior for Reshading",
    "Anand Bhattad, David A. Forsyth",
    "3DV 2022",
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
    "https://github.com/AI-secure/Big-but-Invisible-Adversarial-Attack",
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