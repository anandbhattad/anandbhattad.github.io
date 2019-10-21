#!/bin/bash
rm -r public

git rm -r --cached public

git submodule add -f -b master https://github.com/anandbhattad/anandbhattad.github.io.git public
# Go To Public folder
# Add changes to git.
git add -A

# Commit changes.
msg="rebuilding site `date`"
if [ $# -eq 1 ]
  then msg="$1"
fi
git commit -m "$msg"

# Push source and build repos.
git push -u origin master

# Come Back
cd ..