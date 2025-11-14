#!/usr/bin/env node

/**
 * Project Badge Generator
 * 
 * Generates visual project identity badges for markdown files
 */

const fs = require('fs').promises;
const path = require('path');

const COLORS = {
  green: '#4CAF50',
  blue: '#2196F3',
  purple: '#9C27B0',
  orange: '#FF9800',
  red: '#F44336',
  gray: '#9E9E9E',
};

class BadgeGenerator {
  constructor(projectName) {
    this.projectName = projectName;
  }

  /**
   * Generate HTML badge
   */
  generateHtmlBadge(options = {}) {
    const color = options.color || 'blue';
    const icon = options.icon || '📦';
    
    return `
<div align="center" style="margin: 20px 0;">
  <span style="display: inline-block; padding: 8px 16px; background-color: ${COLORS[color]}; color: white; border-radius: 4px; font-weight: bold; font-size: 14px;">
    ${icon} Project: ${this.projectName}
  </span>
</div>
`.trim();
  }

  /**
   * Generate markdown badge using shields.io style
   */
  generateMarkdownBadge(options = {}) {
    const color = options.color || 'blue';
    const icon = options.icon || '📦';
    
    return `![Project: ${this.projectName}](https://img.shields.io/badge/Project-${encodeURIComponent(this.projectName)}-${color}?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTggMGE4IDggMCAxIDAgMCAxNkE4IDggMCAwIDAgOCAwem0wIDEuNWE2LjUgNi41IDAgMSAxIDAgMTNBNi41IDYuNSAwIDAgMSA4IDEuNXoiLz48L3N2Zz4=)`;
  }

  /**
   * Generate simple markdown badge
   */
  generateSimpleBadge(options = {}) {
    const icon = options.icon || '📦';
    return `**${icon} Project:** \`${this.projectName}\``;
  }

  /**
   * Generate comment badge (for top of file)
   */
  generateCommentBadge(commentStyle = '//') {
    return `${commentStyle} Project: ${this.projectName}`;
  }

  /**
   * Generate SVG badge
   */
  generateSvgBadge(options = {}) {
    const color = options.color || COLORS.blue;
    const width = Math.max(150, this.projectName.length * 8 + 100);
    const textX = width / 2;
    
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="32" viewBox="0 0 ${width} 32">
  <rect width="${width}" height="32" rx="4" fill="${color}"/>
  <text x="${textX}" y="20" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
        fill="white" text-anchor="middle">
    📦 Project: ${this.projectName}
  </text>
</svg>
`.trim();
  }

  /**
   * Inject badge into markdown file
   */
  async injectIntoMarkdown(filePath, options = {}) {
    const position = options.position || 'top'; // 'top' or 'after-title'
    const style = options.style || 'simple'; // 'html', 'markdown', 'simple'
    
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Check if badge already exists
    if (content.includes(`Project: ${this.projectName}`)) {
      return { injected: false, reason: 'Badge already exists' };
    }
    
    // Generate badge
    let badge;
    switch (style) {
      case 'html':
        badge = this.generateHtmlBadge(options);
        break;
      case 'markdown':
        badge = this.generateMarkdownBadge(options);
        break;
      case 'simple':
      default:
        badge = this.generateSimpleBadge(options);
        break;
    }
    
    // Inject badge
    if (position === 'top') {
      content = `${badge}\n\n${content}`;
    } else if (position === 'after-title') {
      // Find first heading and insert after it
      const lines = content.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#')) {
          insertIndex = i + 1;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, '', badge, '');
      content = lines.join('\n');
    }
    
    // Write back
    await fs.writeFile(filePath, content);
    
    return { injected: true, style, position };
  }

  /**
   * Inject badge into all markdown files in directory
   */
  async injectIntoDirectory(dirPath, options = {}) {
    const results = [];
    
    async function processDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await processDirectory(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const result = await this.injectIntoMarkdown(fullPath, options);
            results.push({ file: fullPath, ...result });
          } catch (error) {
            results.push({ file: fullPath, injected: false, error: error.message });
          }
        }
      }
    }
    
    await processDirectory(dirPath);
    return results;
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help' || command === '--help') {
    console.log(`
Project Badge Generator

Usage:
  badge-generator generate <project-name> [options]
  badge-generator inject <file> <project-name> [options]
  badge-generator inject-all <directory> <project-name> [options]

Commands:
  generate <project-name>           Generate badge for project
  inject <file> <project-name>      Inject badge into markdown file
  inject-all <dir> <project-name>   Inject badge into all markdown files

Options:
  --style <style>      Badge style: html, markdown, simple (default: simple)
  --position <pos>     Badge position: top, after-title (default: top)
  --color <color>      Badge color: green, blue, purple, orange, red, gray
  --icon <icon>        Badge icon (emoji)

Examples:
  badge-generator generate Orchestrator_Project --style=html
  badge-generator inject README.md Orchestrator_Project
  badge-generator inject-all ./docs Orchestrator_Project --style=markdown
    `);
    process.exit(0);
  }
  
  const projectName = args[1];
  if (!projectName) {
    console.error('Error: Project name required');
    process.exit(1);
  }
  
  const generator = new BadgeGenerator(projectName);
  
  // Parse options
  const options = {};
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key] = value || true;
    }
  }
  
  (async () => {
    try {
      if (command === 'generate') {
        const style = options.style || 'simple';
        let badge;
        
        switch (style) {
          case 'html':
            badge = generator.generateHtmlBadge(options);
            break;
          case 'markdown':
            badge = generator.generateMarkdownBadge(options);
            break;
          case 'svg':
            badge = generator.generateSvgBadge(options);
            break;
          case 'simple':
          default:
            badge = generator.generateSimpleBadge(options);
            break;
        }
        
        console.log(badge);
        
      } else if (command === 'inject') {
        const filePath = args[1];
        const projectName = args[2];
        
        if (!filePath || !projectName) {
          console.error('Error: File path and project name required');
          process.exit(1);
        }
        
        const gen = new BadgeGenerator(projectName);
        const result = await gen.injectIntoMarkdown(filePath, options);
        
        if (result.injected) {
          console.log(`✅ Badge injected into ${filePath}`);
        } else {
          console.log(`ℹ️  ${result.reason}`);
        }
        
      } else if (command === 'inject-all') {
        const dirPath = args[1];
        const projectName = args[2];
        
        if (!dirPath || !projectName) {
          console.error('Error: Directory path and project name required');
          process.exit(1);
        }
        
        const gen = new BadgeGenerator(projectName);
        const results = await gen.injectIntoDirectory(dirPath, options);
        
        console.log(`\n📊 Badge Injection Results:\n`);
        
        let injected = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const result of results) {
          if (result.injected) {
            console.log(`✅ ${result.file}`);
            injected++;
          } else if (result.error) {
            console.log(`❌ ${result.file}: ${result.error}`);
            errors++;
          } else {
            console.log(`⏭️  ${result.file}: ${result.reason}`);
            skipped++;
          }
        }
        
        console.log(`\nSummary: ${injected} injected, ${skipped} skipped, ${errors} errors\n`);
        
      } else {
        console.error(`Unknown command: ${command}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error(`Error: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  })();
}

module.exports = BadgeGenerator;

