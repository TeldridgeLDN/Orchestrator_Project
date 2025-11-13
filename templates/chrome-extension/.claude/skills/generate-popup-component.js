#!/usr/bin/env node

/**
 * Generate Popup Component Skill
 * 
 * This Claude skill generates new popup UI components with HTML, CSS, and JavaScript.
 * 
 * @skill generate-popup-component
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Generate a popup component
 * @param {Object} options - Generation options
 * @param {string} options.name - Component name
 * @param {string} options.type - Component type (button, card, list, form)
 * @param {string} options.outputDir - Output directory
 * @returns {Promise<Object>} Generation result
 */
export async function generatePopupComponent(options) {
  const {
    name,
    type = 'card',
    outputDir = 'src/popup/components'
  } = options;
  
  if (!name) {
    throw new Error('Component name is required');
  }
  
  const fileName = name.toLowerCase().replace(/\s+/g, '-');
  const componentPath = path.join(outputDir, `${fileName}.js`);
  
  // Generate component based on type
  const content = generateComponentContent(name, type);
  
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(componentPath, content, 'utf-8');
  
  return {
    success: true,
    componentPath,
    usage: generateUsageInstructions(fileName),
    message: `Popup component generated at ${componentPath}`
  };
}

/**
 * Generate component content based on type
 */
function generateComponentContent(name, type) {
  const templates = {
    button: generateButtonComponent,
    card: generateCardComponent,
    list: generateListComponent,
    form: generateFormComponent
  };
  
  const generator = templates[type] || templates.card;
  return generator(name);
}

function generateButtonComponent(name) {
  return `/**
 * ${name} Button Component
 */

export function create${toPascalCase(name)}Button(options = {}) {
  const {
    text = 'Click Me',
    onClick = () => {},
    className = '',
    disabled = false
  } = options;
  
  const button = document.createElement('button');
  button.className = \`action-button \${className}\`;
  button.textContent = text;
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  
  return button;
}
`;
}

function generateCardComponent(name) {
  return `/**
 * ${name} Card Component
 */

export function create${toPascalCase(name)}Card(data = {}) {
  const {
    title = 'Card Title',
    content = 'Card content goes here',
    actions = []
  } = data;
  
  const card = document.createElement('div');
  card.className = 'card-component';
  
  card.innerHTML = \`
    <div class="card-header">
      <h3>\${title}</h3>
    </div>
    <div class="card-body">
      <p>\${content}</p>
    </div>
    <div class="card-actions"></div>
  \`;
  
  const actionsContainer = card.querySelector('.card-actions');
  actions.forEach(action => {
    const button = document.createElement('button');
    button.textContent = action.text;
    button.addEventListener('click', action.onClick);
    actionsContainer.appendChild(button);
  });
  
  return card;
}
`;
}

function generateListComponent(name) {
  return `/**
 * ${name} List Component
 */

export function create${toPascalCase(name)}List(items = []) {
  const list = document.createElement('ul');
  list.className = 'list-component';
  
  items.forEach(item => {
    const listItem = document.createElement('li');
    listItem.className = 'list-item';
    listItem.textContent = item.text || item;
    
    if (item.onClick) {
      listItem.addEventListener('click', item.onClick);
      listItem.style.cursor = 'pointer';
    }
    
    list.appendChild(listItem);
  });
  
  return list;
}

export function addItemTo${toPascalCase(name)}List(list, item) {
  const listItem = document.createElement('li');
  listItem.className = 'list-item';
  listItem.textContent = item.text || item;
  
  if (item.onClick) {
    listItem.addEventListener('click', item.onClick);
  }
  
  list.appendChild(listItem);
}
`;
}

function generateFormComponent(name) {
  return `/**
 * ${name} Form Component
 */

export function create${toPascalCase(name)}Form(options = {}) {
  const {
    fields = [],
    onSubmit = () => {},
    submitText = 'Submit'
  } = options;
  
  const form = document.createElement('form');
  form.className = 'form-component';
  
  fields.forEach(field => {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'form-field';
    
    const label = document.createElement('label');
    label.textContent = field.label;
    label.htmlFor = field.name;
    
    const input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
    input.type = field.type || 'text';
    input.name = field.name;
    input.id = field.name;
    input.placeholder = field.placeholder || '';
    input.required = field.required || false;
    
    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);
    form.appendChild(fieldContainer);
  });
  
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = submitText;
  submitButton.className = 'submit-button';
  form.appendChild(submitButton);
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  });
  
  return form;
}
`;
}

function toPascalCase(str) {
  return str.split(/[_-\s]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function generateUsageInstructions(fileName) {
  return `
Usage:

1. Import in your popup.js:
   import { create${toPascalCase(fileName)} } from './components/${fileName}.js';

2. Use in your code:
   const component = create${toPascalCase(fileName)}({ /* options */ });
   container.appendChild(component);
`;
}

// CLI
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(\`
Generate Popup Component Skill

Usage: node generate-popup-component.js <name> [--type button|card|list|form]

Examples:
  node generate-popup-component.js "Action Button" --type button
  node generate-popup-component.js "Status Card" --type card
    \`);
    process.exit(0);
  }
  
  const name = args[0];
  const type = args.includes('--type') ? args[args.indexOf('--type') + 1] : 'card';
  
  generatePopupComponent({ name, type })
    .then(result => {
      console.log('✓', result.message);
      console.log(result.usage);
    })
    .catch(error => {
      console.error('✗ Error:', error.message);
      process.exit(1);
    });
}

export default { generatePopupComponent };

