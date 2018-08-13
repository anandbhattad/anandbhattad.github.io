+++
title = "Quantitative Evaluation of Style Transfer"
date = 2018-03-01T00:00:00
draft = false

# Authors. Comma separated list, e.g. `["Bob Smith", "David Jones"]`.
authors = ["Mao-Chuang Yeh", "Shuai Tang", "**Anand Bhattad**", "D A Forsyth"]

# Publication type.
# Legend:
# 0 = Uncategorized
# 1 = Conference paper
# 2 = Journal article
# 3 = Manuscript
# 4 = Report
# 5 = Book
# 6 = Book section
publication_types = ["1"]

# Publication name and optional abbreviated version.
publication = ""
publication_short = ""

# Abstract and optional shortened version.
abstract = "Style transfer methods produce a transferred image which is a rendering of a content image in the manner of a style image. There is a rich literature of variant methods. However, evaluation procedures are qualitative, mostly involving user studies. We describe a novel quantitative evaluation procedure. One plots effectiveness (a measure of the extent to which the style was transferred) against coherence (a measure of the extent to which the transferred image decomposes into objects in the same way that the content image does) to obtain an EC plot. We construct EC plots comparing a number of recent style transfer methods. Most methods control within-layer gram matrices, but we also investigate a method that controls cross-layer gram matrices. These EC plots reveal a number of intriguing properties of recent style transfer methods. The style used has a strong effect on the outcome, for all methods. Using large style weights does not necessarily improve effectiveness, and can produce worse results. Cross-layer gram matrices easily beat all other methods, but some styles remain difficult for all methods. Ensemble methods show real promise. It is likely that, for current methods, each style requires a different choice of weights to obtain the best results, so that automated weight setting methods are desirable. Finally, we show evidence comparing our EC evaluations to human evaluations."
abstract_short = ""

# Featured image thumbnail (optional)
image_preview = "style.png"

# Is this a selected publication? (true/false)
selected = false

# Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's filename without extension.
#   E.g. `projects = ["deep-learning"]` references `content/project/deep-learning.md`.
#   Otherwise, set `projects = []`.
#projects = [""]

# Tags (optional).
#   Set `tags = []` for no tags, or use the form `tags = ["A Tag", "Another Tag"]` for one or more tags.
tags = []

# Links (optional).
#url_pdf = ""
url_preprint = "https://arxiv.org/abs/1804.00118"
#url_code = "#"
#url_dataset = "#"
#url_project = "#"
#url_slides = "#"
#url_video = "#"
url_poster = "http://bhattad2.web.engr.illinois.edu/style_poster.pdf"
#url_source = "#"

# Custom links (optional).
#   Uncomment line below to enable. For multiple links, use the form `[{...}, {...}, {...}]`.
#url_custom = [{name = "Custom Link", url = "http://example.org"}]

# Does this page contain LaTeX math? (true/false)
math = true

# Does this page require source code highlighting? (true/false)
highlight = true

# Featured image
# Place your image in the `static/img/` folder and reference its filename below, e.g. `image = "example.jpg"`.
[header]
image = ""
caption = "Qualitative Visualization of EC plots"

+++

<!-- More detail can easily be written here using *Markdown* and $\rm \LaTeX$ math code. -->
