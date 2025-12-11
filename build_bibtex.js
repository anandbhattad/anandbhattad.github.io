#!/usr/bin/env node

/**
 * BibTeX Builder Script
 * 
 * This script processes your publications.js file and builds a local publications.bib file
 * by fetching BibTeX entries from Semantic Scholar API. It avoids duplicates and can be
 * run periodically to update the bibliography.
 * 
 * Usage: node build-bibtex.js
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const PUBLICATIONS_JS_PATH = './publications.js';
const BIBTEX_OUTPUT_PATH = './publications.bib';
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay to be API-friendly

/**
 * Parse existing BibTeX file to extract citation keys and manual entries
 */
async function parseExistingBibTeX(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const citationKeys = new Set();
    const manualEntries = new Map(); // Map title to citation key for manual entries
    
    // Extract citation keys using regex
    const keyMatches = content.match(/@\w+\{([^,]+),/g);
    if (keyMatches) {
      keyMatches.forEach(match => {
        const key = match.match(/@\w+\{([^,]+),/)[1];
        citationKeys.add(key);
      });
    }
    
    // Look for manual entries (entries with special comments)
    const manualEntryRegex = /% MANUAL ENTRY - Title: ([^\n]+)\n@\w+\{([^,]+),/g;
    let manualMatch;
    while ((manualMatch = manualEntryRegex.exec(content)) !== null) {
      const title = manualMatch[1].trim();
      const key = manualMatch[2].trim();
      manualEntries.set(title.toLowerCase(), key);
    }
    
    return { content, citationKeys, manualEntries };
  } catch (error) {
    console.log('No existing BibTeX file found, creating new one...');
    return { content: '', citationKeys: new Set(), manualEntries: new Map() };
  }
}

/**
 * Extract publications from publications.js using regex parsing
 */
async function extractPublications() {
  try {
    const jsContent = await fs.readFile(PUBLICATIONS_JS_PATH, 'utf-8');
    
    // Find all addPublication calls using regex
    const addPublicationRegex = /addPublication\s*\(\s*([\s\S]*?)\s*\)\s*;/g;
    const publications = [];
    let match;
    
    while ((match = addPublicationRegex.exec(jsContent)) !== null) {
      const args = match[1];
      try {
        const pub = parseAddPublicationArgs(args);
        if (pub) {
          publications.push(pub);
        }
      } catch (e) {
        console.warn('Failed to parse publication:', e.message);
      }
    }
    
    console.log(`Found ${publications.length} publications`);
    return publications;
  } catch (error) {
    console.error('Error reading publications.js:', error.message);
    throw error;
  }
}

/**
 * Parse arguments from addPublication call
 */
function parseAddPublicationArgs(argsString) {
  // Split arguments by comma, but respect quotes and brackets
  const args = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let bracketCount = 0;
  let parenCount = 0;
  
  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];
    const prevChar = argsString[i - 1];
    
    if (!inQuotes && (char === '"' || char === "'" || char === '`')) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar && prevChar !== '\\') {
      inQuotes = false;
      quoteChar = '';
    } else if (!inQuotes) {
      if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
      else if (char === '(') parenCount++;
      else if (char === ')') parenCount--;
      else if (char === ',' && bracketCount === 0 && parenCount === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }
    }
    
    current += char;
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }
  
  // Clean up the arguments
  const cleanArgs = args.map(arg => {
    arg = arg.trim();
    // Remove surrounding quotes
    if ((arg.startsWith('"') && arg.endsWith('"')) ||
        (arg.startsWith("'") && arg.endsWith("'"))) {
      arg = arg.slice(1, -1);
    }
    return arg;
  });
  
  // Parse the ssIds array (second to last argument)
  let ssIds = [];
  if (cleanArgs.length >= 15 && cleanArgs[14]) {
    const ssIdsArg = cleanArgs[14];
    if (ssIdsArg.startsWith('[') && ssIdsArg.endsWith(']')) {
      const content = ssIdsArg.slice(1, -1);
      if (content.trim()) {
        ssIds = content.split(',').map(id => id.trim().replace(/['"]/g, '')).filter(Boolean);
      }
    }
  }
  
  // Parse the bibKey (last argument, optional)
  let bibKey = null;
  if (cleanArgs.length >= 16 && cleanArgs[15]) {
    bibKey = cleanArgs[15];
    // Remove quotes if present
    if ((bibKey.startsWith('"') && bibKey.endsWith('"')) ||
        (bibKey.startsWith("'") && bibKey.endsWith("'"))) {
      bibKey = bibKey.slice(1, -1);
    }
    // If it's null/undefined string, set to null
    if (bibKey === 'null' || bibKey === 'undefined' || bibKey === '') {
      bibKey = null;
    }
  }
  
  return {
    img: cleanArgs[0] || '',
    title: cleanArgs[1] || '',
    authors: cleanArgs[2] || '',
    venue: cleanArgs[3] || '',
    paper: cleanArgs[4] || '',
    project: cleanArgs[5] || '',
    code: cleanArgs[6] || '',
    arxiv: cleanArgs[7] || '',
    githubRepo: cleanArgs[8] || '',
    tldr: cleanArgs[9] || '',
    year: cleanArgs[10] || '',
    published: cleanArgs[11] || '',
    isHighlight: cleanArgs[12] === 'true',
    isVideo: cleanArgs[13] === 'true',
    ssIds: ssIds,
    bibKey: bibKey
  };
}

/**
 * Fetch BibTeX from Semantic Scholar API using corpus ID
 */
async function fetchBibTeX(corpusId) {
  try {
    const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/CorpusId:${corpusId}?fields=citationStyles`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.citationStyles && data.citationStyles.bibtex) {
      return data.citationStyles.bibtex;
    }
    
    // Fallback to direct BibTeX endpoint
    const bibResponse = await fetch(`https://www.semanticscholar.org/CorpusId:${corpusId}.bib`);
    if (bibResponse.ok) {
      return await bibResponse.text();
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to fetch BibTeX for CorpusId ${corpusId}:`, error.message);
    return null;
  }
}

/**
 * Fetch BibTeX from Semantic Scholar API by searching for title
 */
async function fetchBibTeXByTitle(title) {
  try {
    // Search for the paper by title
    const searchQuery = encodeURIComponent(title);
    const searchResponse = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${searchQuery}&fields=paperId,title,citationStyles&limit=1`);
    
    if (!searchResponse.ok) {
      throw new Error(`Search HTTP ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (searchData.data && searchData.data.length > 0) {
      const paper = searchData.data[0];
      
      // Check if the titles match closely (to avoid false positives)
      const titleSimilarity = calculateTitleSimilarity(title, paper.title);
      if (titleSimilarity < 0.7) {
        console.warn(`Title similarity too low (${titleSimilarity.toFixed(2)}): "${title}" vs "${paper.title}"`);
        return null;
      }
      
      if (paper.citationStyles && paper.citationStyles.bibtex) {
        return paper.citationStyles.bibtex;
      }
      
      // If no citationStyles, try to fetch using paper ID
      if (paper.paperId) {
        const bibResponse = await fetch(`https://api.semanticscholar.org/graph/v1/paper/${paper.paperId}?fields=citationStyles`);
        if (bibResponse.ok) {
          const bibData = await bibResponse.json();
          if (bibData.citationStyles && bibData.citationStyles.bibtex) {
            return bibData.citationStyles.bibtex;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to fetch BibTeX by title "${title}":`, error.message);
    return null;
  }
}

/**
 * Calculate similarity between two titles (simple word-based comparison)
 */
function calculateTitleSimilarity(title1, title2) {
  const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  
  const words1 = normalize(title1);
  const words2 = normalize(title2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}

/**
 * Generate a citation key from title and year
 */
function generateCitationKey(title, year) {
  const cleanTitle = title
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 2)
    .slice(0, 3)
    .join('');
  
  return `${cleanTitle}${year}`.toLowerCase();
}

/**
 * Extract citation key from BibTeX entry
 */
function extractCitationKey(bibtex) {
  const match = bibtex.match(/@\w+\{([^,]+),/);
  return match ? match[1] : null;
}

/**
 * Sleep function for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to build BibTeX file
 */
async function buildBibTeX() {
  console.log('Building local BibTeX file...');
  
  try {
    // Parse existing BibTeX file
    const { content: existingContent, citationKeys: existingKeys, manualEntries } = await parseExistingBibTeX(BIBTEX_OUTPUT_PATH);
    
    // Extract publications from JS file
    const publications = await extractPublications();
    
    if (publications.length === 0) {
      console.log('No publications found.');
      return;
    }
    
    let newEntries = [];
    let processedCount = 0;
    
    for (const pub of publications) {
      console.log(`Processing: ${pub.title}`);
      
      // Check if we already have this entry
      const tempKey = generateCitationKey(pub.title, pub.year);
      if (existingKeys.has(tempKey)) {
        console.log(`  Skipping (already exists by temp key)`);
        processedCount++;
        continue;
      }
      
      // Check if this is a manual entry (either by bibKey or by title)
      let isManualEntry = false;
      let manualKey = null;
      
      if (pub.bibKey) {
        // Check if the specified bibKey exists
        if (existingKeys.has(pub.bibKey)) {
          console.log(`  Skipping (manual entry with bibKey: ${pub.bibKey})`);
          processedCount++;
          continue;
        }
        manualKey = pub.bibKey;
        isManualEntry = true;
      } else {
        // Check if there's a manual entry with matching title
        const titleKey = pub.title.toLowerCase();
        if (manualEntries.has(titleKey)) {
          const existingManualKey = manualEntries.get(titleKey);
          console.log(`  Skipping (manual entry found with key: ${existingManualKey})`);
          processedCount++;
          continue;
        }
      }
      
      // If it's marked as manual but not found, warn and skip
      if (isManualEntry && !existingKeys.has(manualKey)) {
        console.warn(`  Warning: Manual entry with bibKey "${manualKey}" not found in .bib file`);
        console.log(`  Skipping (manual entry not found)`);
        processedCount++;
        continue;
      }
      
      let bibtex = null;
      let usedCorpusId = null;
      let searchMethod = '';
      
      // If corpus IDs are present, use only the first one
      if (pub.ssIds && pub.ssIds.length > 0) {
        const firstCorpusId = pub.ssIds[0];
        console.log(`  Using corpus ID: ${firstCorpusId}`);
        
        if (existingKeys.has(firstCorpusId)) {
          console.log(`  Skipping (corpus ID already exists)`);
          processedCount++;
          continue;
        }
        
        bibtex = await fetchBibTeX(firstCorpusId);
        usedCorpusId = firstCorpusId;
        searchMethod = 'corpus ID';
        
        if (bibtex) {
          console.log(`  ✓ Fetched BibTeX using corpus ID`);
        } else {
          console.log(`  ✗ Failed to fetch BibTeX using corpus ID`);
        }
      }
      
      // If no corpus ID or corpus ID is empty/null, or fetching failed, search by title
      if (!bibtex && pub.title) {
        console.log(`  Searching by title: ${pub.title}`);
        bibtex = await fetchBibTeXByTitle(pub.title);
        searchMethod = 'title search';
        
        if (bibtex) {
          console.log(`  ✓ Fetched BibTeX using title search`);
        } else {
          console.log(`  ✗ Failed to fetch BibTeX by title`);
        }
      }
      
      // Add the entry if we got BibTeX
      if (bibtex) {
        const actualKey = extractCitationKey(bibtex);
        if (actualKey && !existingKeys.has(actualKey)) {
          newEntries.push({
            key: actualKey,
            bibtex: bibtex,
            title: pub.title,
            corpusId: usedCorpusId,
            searchMethod: searchMethod
          });
          existingKeys.add(actualKey);
          if (usedCorpusId) existingKeys.add(usedCorpusId);
          existingKeys.add(tempKey);
          console.log(`  ✓ Added ${actualKey} (via ${searchMethod})`);
        } else {
          console.log(`  Skipping (duplicate or invalid key: ${actualKey})`);
        }
      } else {
        console.log(`  ✗ No BibTeX found for "${pub.title}"`);
        console.log(`  Tip: If you have this entry manually, add it to your .bib file with:`);
        console.log(`       % MANUAL ENTRY - Title: ${pub.title}`);
        console.log(`       Or add bibKey parameter to your addPublication call`);
      }
      
      processedCount++;
      console.log(`Progress: ${processedCount}/${publications.length}`);
      
      // Rate limiting
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
    
    // Write updated BibTeX file
    if (newEntries.length > 0) {
      let finalContent = existingContent;
      
      if (finalContent && !finalContent.endsWith('\n')) {
        finalContent += '\n';
      }
      
      finalContent += '\n% New entries added by build-bibtex.js\n';
      finalContent += `% Generated on ${new Date().toISOString()}\n\n`;
      
      newEntries.forEach(entry => {
        finalContent += `% ${entry.title}\n`;
        if (entry.corpusId) {
          finalContent += `% CorpusId: ${entry.corpusId}\n`;
        }
        finalContent += `% Method: ${entry.searchMethod}\n`;
        finalContent += entry.bibtex + '\n\n';
      });
      
      await fs.writeFile(BIBTEX_OUTPUT_PATH, finalContent);
      console.log(`\n✓ Added ${newEntries.length} new entries to ${BIBTEX_OUTPUT_PATH}`);
    } else {
      console.log('\n✓ No new entries to add. BibTeX file is up to date.');
    }
    
    console.log('\nBibTeX build completed successfully!');
    
  } catch (error) {
    console.error('Error building BibTeX:', error);
    process.exit(1);
  }
}

// Run the build process
if (require.main === module) {
  buildBibTeX();
}

module.exports = { buildBibTeX };