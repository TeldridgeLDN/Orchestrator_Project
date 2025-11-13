# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

A Chrome extension built with modern web technologies and best practices.

## Features

- 🚀 Modern Chrome Extension Manifest V3
- 🎨 Beautiful popup and options UI
- 📦 Modular code structure
- 🔧 Easy to customize and extend
- 🧪 Testing framework ready
- 📝 Comprehensive documentation

## Installation

### From Source (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}.git
   cd {{PROJECT_NAME}}
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the project directory

### From Chrome Web Store

*Coming soon...*

## Development

### Project Structure

```
{{PROJECT_NAME}}/
├── src/
│   ├── background/       # Background service worker
│   │   ├── index.js      # Main background script
│   │   └── messaging.js  # Message handling
│   ├── content/          # Content scripts
│   │   ├── index.js      # Main content script
│   │   └── dom-utils.js  # DOM manipulation utilities
│   ├── popup/            # Extension popup
│   │   ├── index.html    # Popup HTML
│   │   ├── popup.css     # Popup styles
│   │   └── popup.js      # Popup logic
│   ├── options/          # Options page
│   │   ├── index.html    # Options HTML
│   │   ├── options.css   # Options styles
│   │   └── options.js    # Options logic
│   └── utils/            # Shared utilities
│       ├── storage.js    # Storage helpers
│       └── api.js        # API utilities
├── assets/               # Icons and images
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── tests/                # Test files
│   └── unit/             # Unit tests
├── docs/                 # Documentation
│   ├── development.md    # Development guide
│   └── publishing.md     # Publishing guide
└── manifest.json         # Extension manifest
```

### Building

Currently, this extension doesn't require a build step. All files are loaded directly.

For production optimization, you can:
```bash
npm run build  # (Add build script as needed)
```

### Testing

Run tests with:
```bash
npm test
```

### Linting

Check code quality:
```bash
npm run lint
```

## Usage

1. Click the extension icon in your browser toolbar
2. Use the popup to access quick actions
3. Click the settings icon to customize options
4. The extension runs automatically on web pages (configurable)

## Configuration

### Permissions

This extension requires the following permissions:
- `storage`: To save settings and data
- `activeTab`: To interact with the current tab

### Settings

Access the options page by clicking the settings icon in the popup or right-clicking the extension icon and selecting "Options".

Available settings:
- Enable/disable the extension
- Auto-run on page load
- Notification preferences
- Theme selection
- UI size adjustment
- Debug mode
- Custom API URL

## API

### Background Script

Send messages to the background script:

```javascript
chrome.runtime.sendMessage({
  type: 'GET_SETTINGS'
}, (response) => {
  if (response.success) {
    console.log('Settings:', response.settings);
  }
});
```

### Content Script

The content script is automatically injected into web pages. It can:
- Access and modify the DOM
- Communicate with the background script
- Observe page changes

### Storage

Use the built-in storage utilities:

```javascript
import { getItem, setItem } from './utils/storage.js';

// Save data
await setItem('key', 'value');

// Retrieve data
const value = await getItem('key');
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

### Development Guidelines

- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Test in Chrome before submitting

## Publishing

See [docs/publishing.md](docs/publishing.md) for detailed instructions on publishing to the Chrome Web Store.

## Troubleshooting

### Extension not loading

1. Check the Chrome Extensions page for error messages
2. Ensure all files are in the correct locations
3. Verify manifest.json is valid
4. Check the console for JavaScript errors

### Content script not running

1. Verify the URL pattern in manifest.json matches the target pages
2. Check that content scripts are properly listed
3. Reload the extension after making changes

### Storage issues

1. Check Chrome's storage quota
2. Verify storage permissions in manifest.json
3. Use the Chrome DevTools Storage panel to inspect data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- Created with [Claude Orchestrator](https://github.com/{{GITHUB_USERNAME}}/claude-orchestrator)

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}/issues)
- 💬 [Discussions](https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

Made with ❤️ by [{{AUTHOR_NAME}}](https://github.com/{{GITHUB_USERNAME}})

