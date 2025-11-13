# Publishing Guide

This guide covers how to prepare, package, and publish {{PROJECT_NAME}} to the Chrome Web Store.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Publishing Checklist](#pre-publishing-checklist)
- [Preparing for Release](#preparing-for-release)
- [Creating a Package](#creating-a-package)
- [Chrome Web Store Publishing](#chrome-web-store-publishing)
- [Post-Publishing](#post-publishing)
- [Updates and Maintenance](#updates-and-maintenance)

## Prerequisites

### Chrome Web Store Developer Account

1. Create a Chrome Web Store developer account:
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Sign in with your Google account
   - Pay the one-time $5 registration fee

2. Verify your email address and complete the account setup

### Required Assets

Before publishing, prepare these assets:

1. **Extension Icons**:
   - 16x16px icon (`assets/icon-16.png`)
   - 48x48px icon (`assets/icon-48.png`)
   - 128x128px icon (`assets/icon-128.png`)

2. **Store Listing Images**:
   - Small promotional tile: 440x280px (required)
   - Large promotional tile: 920x680px (optional)
   - Marquee promotional tile: 1400x560px (optional)
   - Screenshots: 1280x800px or 640x400px (at least 1 required, up to 5 recommended)

3. **Store Listing Content**:
   - Extension name (max 45 characters)
   - Short description (max 132 characters)
   - Detailed description (max 16,000 characters)
   - Category selection
   - Language selection

## Pre-Publishing Checklist

### Code Quality

- [ ] All features are working correctly
- [ ] No console errors or warnings
- [ ] Code is linted and formatted
- [ ] All tests pass
- [ ] Security best practices followed
- [ ] Performance optimized

```bash
npm run validate  # Run lint, format check, and tests
```

### Manifest Validation

Verify your `manifest.json`:

- [ ] Correct version number (use semantic versioning)
- [ ] Accurate description
- [ ] Minimal necessary permissions
- [ ] Valid icons paths
- [ ] Correct update URL (if using)
- [ ] Content Security Policy compliant

### Privacy and Permissions

- [ ] Privacy policy written and hosted (if collecting data)
- [ ] Only request necessary permissions
- [ ] Clear justification for each permission
- [ ] Data handling disclosed in store listing

### Testing

Test thoroughly before publishing:

- [ ] Fresh install works
- [ ] All features function correctly
- [ ] Works on different Chrome versions
- [ ] Tested on different operating systems
- [ ] No conflicts with popular extensions
- [ ] Content scripts work on target sites

### Documentation

- [ ] README is complete and accurate
- [ ] Changelog updated
- [ ] License file included
- [ ] Support information provided

## Preparing for Release

### 1. Update Version Number

Update in both `manifest.json` and `package.json`:

```json
// manifest.json
{
  "version": "1.0.0",
  ...
}

// package.json
{
  "version": "1.0.0",
  ...
}
```

Follow [Semantic Versioning](https://semver.org/):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

### 2. Update Changelog

Create or update `CHANGELOG.md`:

```markdown
# Changelog

## [1.0.0] - 2024-01-15

### Added
- Initial release
- Popup UI with settings toggle
- Options page with full configuration
- Content script for page interaction
- Background service worker

### Changed
- N/A (first release)

### Fixed
- N/A (first release)
```

### 3. Create Release Notes

Prepare user-friendly release notes for the store listing:

```
Version 1.0.0 - Initial Release

What's New:
• Beautiful popup interface
• Comprehensive settings page
• Fast and efficient page processing
• Lightweight and privacy-focused

Features:
• Quick enable/disable toggle
• Customizable appearance
• Auto-run on page load
• Debug mode for developers
```

### 4. Review Privacy Policy

If your extension collects any data, create a privacy policy:

```markdown
# Privacy Policy for {{PROJECT_NAME}}

## Data Collection
This extension does not collect, store, or transmit any personal data.

## Permissions
- storage: To save your settings locally
- activeTab: To interact with the current tab when you click the extension

## Third-Party Services
This extension does not use any third-party services or analytics.

## Contact
For questions, contact: {{AUTHOR_EMAIL}}
```

Host it online and include the URL in your store listing.

## Creating a Package

### Method 1: Manual ZIP

Create a ZIP file of your extension:

```bash
# Remove unnecessary files first
rm -rf node_modules tests coverage .git

# Create ZIP (from parent directory)
cd ..
zip -r {{PROJECT_NAME}}.zip {{PROJECT_NAME}}/ \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*tests*" \
  -x "*.DS_Store"
```

### Method 2: Using NPM Script

Add to `package.json`:

```json
{
  "scripts": {
    "package": "node scripts/package.js"
  }
}
```

Create `scripts/package.js`:

```javascript
import { createWriteStream } from 'fs';
import { readdir } from 'fs/promises';
import archiver from 'archiver';
import path from 'path';

async function createPackage() {
  const output = createWriteStream('dist/extension.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(`Package created: ${archive.pointer()} bytes`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // Add files
  archive.directory('src/', 'src');
  archive.directory('assets/', 'assets');
  archive.file('manifest.json', { name: 'manifest.json' });
  archive.file('README.md', { name: 'README.md' });
  archive.file('LICENSE', { name: 'LICENSE' });

  await archive.finalize();
}

createPackage().catch(console.error);
```

Then run:
```bash
npm run package
```

### What to Include

**Include**:
- `manifest.json`
- `src/` directory
- `assets/` directory
- `LICENSE` file
- `README.md`

**Exclude**:
- `node_modules/`
- `.git/`
- `.env` files
- Test files
- Build scripts
- Development tools
- IDE configuration

## Chrome Web Store Publishing

### 1. Initial Submission

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

2. Click "New Item"

3. Upload your ZIP file

4. Complete the store listing:

   **Store Listing**:
   - Product name
   - Summary (short description)
   - Detailed description
   - Category
   - Language

   **Graphic Assets**:
   - Upload all icons and screenshots
   - Add promotional images

   **Privacy Practices**:
   - Select data collection practices
   - Add privacy policy URL (if applicable)
   - Justify permissions

5. Set distribution options:
   - Visibility: Public, Unlisted, or Private
   - Countries: Select target countries
   - Pricing: Free or paid

6. Submit for review

### 2. Review Process

- **Initial review**: 1-3 business days (typically)
- **Updates**: Usually faster than initial submission
- **Rejections**: Common reasons and how to fix them

Common rejection reasons:
1. **Permission misuse**: Request only necessary permissions
2. **Misleading description**: Be accurate and honest
3. **Policy violations**: Follow all Chrome Web Store policies
4. **Poor quality**: Ensure extension works correctly
5. **Missing privacy policy**: Required if collecting data

### 3. Responding to Review Feedback

If rejected:
1. Read the rejection email carefully
2. Fix the issues mentioned
3. Update the version number
4. Resubmit with notes explaining changes

## Post-Publishing

### 1. Verify Installation

After approval:
- Install from Chrome Web Store
- Test all features
- Check for any issues
- Monitor user reviews

### 2. Marketing and Promotion

- Share on social media
- Post on relevant forums
- Write a blog post
- Submit to extension directories
- Engage with users in reviews

### 3. Monitor Analytics

Use Chrome Web Store analytics to track:
- Installations
- Weekly active users
- Impressions
- Reviews and ratings
- Uninstall rate

### 4. Support

Set up support channels:
- GitHub issues for bug reports
- Discussion forum for questions
- Email for direct contact
- FAQ documentation

## Updates and Maintenance

### Publishing Updates

1. Make changes and test thoroughly
2. Update version number
3. Update changelog
4. Create new package
5. Upload to Chrome Web Store
6. Provide update notes
7. Submit for review

### Version Management

Use semantic versioning:
```
1.2.3
│ │ └── Patch: Bug fixes
│ └──── Minor: New features
└────── Major: Breaking changes
```

### Automatic Updates

Users receive updates automatically:
- Chrome checks for updates every few hours
- Updates install when Chrome restarts
- Users can force update at `chrome://extensions`

### Beta Testing

For testing before public release:

1. Create a separate extension (same code, different ID)
2. Publish as "Unlisted"
3. Share link with beta testers
4. Gather feedback
5. Apply fixes
6. Publish to main extension

### Emergency Updates

If critical bug found:
1. Fix immediately
2. Bump patch version
3. Submit expedited review (explain urgency)
4. Monitor for successful rollout

## Best Practices

### Version Control

- Tag releases in git:
  ```bash
  git tag -a v1.0.0 -m "Release version 1.0.0"
  git push origin v1.0.0
  ```

### Changelog Maintenance

- Keep detailed changelog
- Group changes by type (Added, Changed, Fixed, Removed)
- Include dates
- Reference issue numbers

### User Communication

- Respond to reviews professionally
- Provide timely support
- Keep users informed of major changes
- Be transparent about data usage

### Compliance

- Follow Chrome Web Store policies
- Respect user privacy
- Be transparent about permissions
- Maintain security best practices

## Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Web Store Publishing Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Chrome Web Store Best Practices](https://developer.chrome.com/docs/webstore/best_practices/)
- [Chrome Extension Quality Guidelines](https://developer.chrome.com/docs/webstore/quality_guidelines/)

## Troubleshooting

### Submission Rejected

**Permission warnings**:
- Review requested permissions
- Remove unnecessary permissions
- Provide clear justification

**Policy violations**:
- Review Chrome Web Store policies
- Ensure compliance
- Contact support if unclear

**Technical issues**:
- Test with fresh install
- Check manifest syntax
- Verify all files are included

### Update Not Installing

- Verify version number increased
- Check manifest syntax
- Test package locally first
- Wait for Chrome update check cycle

### Low Installation Rate

- Improve store listing description
- Add better screenshots
- Request initial reviews from trusted users
- Improve SEO in title and description
- Share on relevant platforms

---

Good luck with your extension launch! 🚀

