\NeedsTeXFormat{LaTeX2e}[1995/12/01]
\ProvidesClass{modernres}[2024/07/10 v1.3 Modern Single Column Resume Class with Serif Font]

\LoadClass[11pt,letterpaper]{article}

% Package requirements
\RequirePackage[T1]{fontenc}
\RequirePackage[utf8]{inputenc}
\RequirePackage{tgtermes} % TeX Gyre Termes font (similar to Times)
\RequirePackage{titlesec}
\RequirePackage{xcolor}
\RequirePackage{geometry}
\RequirePackage{hyperref}
\RequirePackage{enumitem}
% \usepackage{lmodern}     % Loads the Latin Modern font
% \renewcommand{\familydefault}{\sfdefault}
% Color definitions
\definecolor{sectioncolor}{RGB}{0,79,159}
\definecolor{textcolor}{RGB}{0,0,0}
\definecolor{linkcolor}{RGB}{0,79,159}

% Page layout
\geometry{margin=1in}

% Hyperlink settings
\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor,
    filecolor=linkcolor,
    citecolor=linkcolor,
}

% Section formatting
\usepackage{titlesec}

% Adjust section spacing
\titlespacing*{\section}
  {0pt}{1em}{0.5em} % {left}{before}{after}
  
\titleformat{\section}
  {\Large\bfseries\color{sectioncolor}}
  {}
  {0em}
  {}

% Improved list settings
\setlist{nosep, leftmargin=\parindent}

% Header command for name and address
\newcommand{\header}[2]{%
  \begin{tabular*}{\textwidth}{@{}p{0.65\textwidth}@{}p{0.35\textwidth}@{}}
    \raggedright\Huge\bfseries #1 & \raggedleft #2
  \end{tabular*}
  \vspace{1.5ex}
}

% Custom commands for sections
\newcommand{\workexp}[4]{%
  \textbf{#1} \hfill \textit{#2}\\
  \textbf{#3} \hfill #4\\
  \vspace{1ex}
}

\newcommand{\education}[4]{%
  \begin{tabular*}{\textwidth}{@{}l@{\extracolsep{\fill}}r@{}}
    \textbf{#1}, \textit{#2} & #3 \\
    #4 \\
  \end{tabular*}
  \\[1.5ex]
}

% Define custom commands for education entries
\newcommand{\degree}[4]{%
  \begin{tabular*}{\textwidth}{@{}l@{\extracolsep{\fill}}r@{}}
    \textbf{#1}, \textit{#2} & \textit{#4} \\
  \end{tabular*}
  \hspace*{2em}#3\\[-0.5ex]
}

\newcommand{\thesis}[1]{%
  \hspace*{2em}\textit{Thesis:} \underline{#1} \\[-0.5ex]
}

\newcommand{\committee}[2]{%
  \hspace*{2em}\textit{Thesis committee:} \underline{#1} \\[-0.5ex] \hspace*{2em} \underline{#2} \\[-0.5ex]
}

\newcommand{\skill}[2]{%
  \textbf{#1:} #2\\
  \vspace{0.5ex}
}

% Experience section with bullet points
\newcommand{\experience}[4]{%
  \textbf{#1} \hfill \textit{#2}\\
  \textbf{#3} \hfill #4\\
  \begin{itemize}[leftmargin=*]
    \item #5
  \end{itemize}
  \vspace{1ex}
}


\newcommand{\workexpcompact}[3]{%
  \begin{tabular*}{\textwidth}{@{}l@{\extracolsep{\fill}}r@{}}
    \textbf{#1}, {{#2}} & #3 \\
  \end{tabular*}
  \\[1ex]
}

% Custom command for students
\newcommand{\student}[4]{%
  \item {#1},
  {#2},
  {\color{darkgray}#3} \hfill {#4}
}

% % Define custom command for papers
% \newcommand{\paper}[4]{%
%   \item \textbf{#1}. #2 \textit{#3}. #4 \\
% }

% % Custom command for key papers with a star symbol
% \newcommand{\keypaper}[4]{%
%   \item ★ \textbf{#1}.\\ #2 \textit{#3}. \\#4 \\
% }

% Redefine the page style to remove page numbers
\pagestyle{empty}

\endinput
