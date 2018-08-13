+++
title = "Detecting Anomalous Faces with ''No Peeking'' Autoencoders"
date = 2018-03-01T00:00:00
draft = false

# Authors. Comma separated list, e.g. `["Bob Smith", "David Jones"]`.
authors = ["**Anand Bhattad**", "Jason Rock", "David Forsyth"]

# Publication type.
# Legend:
# 0 = Uncategorized
# 1 = Conference paper
# 2 = Journal article
# 3 = Manuscript
# 4 = Report
# 5 = Book
# 6 = Book section
publication_types = ["3"]

# Publication name and optional abbreviated version.
publication = ""
publication_short = ""

# Abstract and optional shortened version.
abstract = "Detecting anomalous faces has important applications. For example, a system might tell when a train driver is incapacitated by a medical event, and assist in adopting a safe recovery strategy. These applications are demanding, because they require accurate detection of rare anomalies that may be seen only at runtime. Such a setting causes building supervised methods unsuitable because of difficulty in collecting rare and generalizable anomaly data. We describe an unsupervised method for detecting an anomalous face image that meets these requirements. We present a novel feature construction technique that reliably has large entries for anomalous images, then use various simple unsupervised methods to score the image based on extracted features. Obvious constructions (autoencoder codes; autoencoder residuals) are defeated by a ‘peeking’ behavior in autoencoders. Our feature construction removes rectangular patches from the image, predicts the likely content of the patch conditioned on the rest of the image using a specially trained autoencoder, then compares the result to the image. High residual scores suggest that the patch was difficult for an autoencoder to predict, and so is likely anomalous. We demonstrate that our method can identify real anomalous face images in pools of typical (natural) images, taken from celeb-A, that is much larger than usual in state-of-the-art experiments. A control experiment based on our method with another set of normal celebrity images - a ‘typical set’, but non-celeb-A are not identified as anomalous; confirms this is not due to special properties of celeb-A."
abstract_short = ""

# Featured image thumbnail (optional)
image_preview = "anomaly.pdf"

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
url_preprint = "http://bhattad2.web.engr.illinois.edu/anomaly.pdf"
#url_code = "#"
#url_dataset = "#"
#url_project = "#"
#url_slides = "#"
#url_video = "#"
url_poster = "http://bhattad2.web.engr.illinois.edu/anomaly_poster.pdf"
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
image = "anomaly.pdf"
caption = "Inpainting Residual Features are strong cues for face anomaly detection"

+++

<!-- More detail can easily be written here using *Markdown* and $\rm \LaTeX$ math code. -->
