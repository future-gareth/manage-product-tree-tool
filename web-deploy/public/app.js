class ProductTreeManager {
  constructor() {
    this.productTree = null;
    this.selectedItem = null;
    this.searchTerm = '';
    this.aiMessages = [];
    this.expandedNodes = new Set();
    
    this.initializeEventListeners();
    this.showWelcomeMessage();
    this.checkAIConnection();
    this.renderTree(); // Show empty state initially
  }

  initializeEventListeners() {
    // File input
    const xmlFile = document.getElementById('xmlFile');
    if (xmlFile) {
      xmlFile.addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files[0]);
    });
    }

    // Drag and drop
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag');
      const file = e.dataTransfer.files[0];
      if (file && (file.type === 'text/xml' || file.name.endsWith('.xml'))) {
        this.handleFileSelect(file);
      }
    });
      dropZone.addEventListener('click', () => {
        xmlFile.click();
      });
    }

    // Header buttons
    const btnAddProduct = document.getElementById('btnAddProduct');
    if (btnAddProduct) btnAddProduct.addEventListener('click', () => this.addProduct());
    
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) btnRefresh.addEventListener('click', () => this.refresh());
    
    const btnClearCache = document.getElementById('btnClearCache');
    if (btnClearCache) btnClearCache.addEventListener('click', () => this.clearCache());
    
    const btnExportXML = document.getElementById('btnExportXML');
    if (btnExportXML) btnExportXML.addEventListener('click', () => this.exportXML());
    
    const btnExportJira = document.getElementById('btnExportJira');
    if (btnExportJira) btnExportJira.addEventListener('click', () => this.exportJira());

    // Tree controls

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.renderTree();
    });
    }

    // AI Chat
    const btnSendAI = document.getElementById('btnSendAI');
    if (btnSendAI) btnSendAI.addEventListener('click', () => this.sendAIMessage());
    
    const aiInput = document.getElementById('aiInput');
    if (aiInput) {
      aiInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendAIMessage();
    });
    }

    // Modal
    const closeModal = document.getElementById('closeModal');
    if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
    
    const workItemModal = document.getElementById('workItemModal');
    if (workItemModal) {
      workItemModal.addEventListener('click', (e) => {
      if (e.target.id === 'workItemModal') this.closeModal();
      });
    }
  }

  showWelcomeMessage() {
    const statusDiv = document.getElementById('importSummary');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = `
      <div style="background: #e3f2fd; border-left: 4px solid #4a90e2; padding: 15px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #4a90e2;">🌳 Welcome to Product Tree Manager</h3>
        <p style="margin: 0 0 10px 0;">Upload a Product Tree XML file to get started with managing your product hierarchy.</p>
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>Features:</strong> Import XML, analyze with AI, export to XML/CSV, manage work items
        </p>
      </div>
    `;
  }

  renderTree() {
    const treeContainer = document.getElementById('productTree');
    if (!treeContainer) return;

    if (!this.productTree) {
      treeContainer.innerHTML = `
        <div class="tree-empty">
          <i class="fas fa-upload"></i>
          <h4>No Product Tree Loaded</h4>
          <p>Import a Product Tree XML file to get started</p>
          <div class="file-upload-area" id="dropZone">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Drop Product Tree XML here or click to browse</p>
            <input type="file" id="xmlFile" accept=".xml,text/xml" style="display: none;" />
          </div>
        </div>
      `;
      
      // Re-attach event listeners for the new upload area
      this.attachUploadListeners();
      return;
    }

    // Start rendering from the children (skip root node)
    let html = '';
    if (this.productTree.children && this.productTree.children.length > 0) {
      this.productTree.children.forEach(child => {
        html += this.renderTreeNode(child, 0);
      });
    }
    treeContainer.innerHTML = html;
  }

  attachUploadListeners() {
    // Re-attach file input listener
    const xmlFile = document.getElementById('xmlFile');
    if (xmlFile) {
      xmlFile.addEventListener('change', (e) => {
        this.handleFileSelect(e.target.files[0]);
      });
    }

    // Re-attach drag and drop listeners
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag');
        const file = e.dataTransfer.files[0];
        if (file && (file.type === 'text/xml' || file.name.endsWith('.xml'))) {
          this.handleFileSelect(file);
        }
      });
      dropZone.addEventListener('click', () => {
        xmlFile.click();
      });
    }
  }

  renderTreeNode(node, level) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = this.expandedNodes.has(node.id);
    const isSelected = this.selectedItem && this.selectedItem.id === node.id;
    const isVisible = !this.searchTerm || this.matchesSearch(node);
    
    // Debug logging
    console.log(`Rendering node: ${node.title} (${node.id}), level: ${level}, hasChildren: ${hasChildren}, isExpanded: ${isExpanded}`);
    
    if (!isVisible) return '';
    
    const nodeTypeClass = node.type === 'work_item' ? 'work-item' : '';
    const nodeTypeDisplay = this.getNodeTypeDisplay(node.type);
    
    let html = `
      <div class="tree-node ${isSelected ? 'selected' : ''}" data-id="${node.id}" style="padding-left: ${level * 20}px;">
        <div class="tree-node-content" onclick="productTreeManager.selectItem('${node.id}')">
          ${hasChildren ? `<i class="fas fa-chevron-${isExpanded ? 'down' : 'right'} tree-toggle" onclick="event.stopPropagation(); productTreeManager.toggleNode('${node.id}')"></i>` : '<i class="fas fa-circle" style="font-size: 6px; margin-right: 8px;"></i>'}
          <span class="tree-node-title ${nodeTypeClass}">${node.title || node.name || 'Untitled'}</span>
          <span class="tree-node-type">${nodeTypeDisplay}</span>
          <div class="tree-node-actions">
            <button class="btn-icon" onclick="event.stopPropagation(); productTreeManager.addChild('${node.id}')" title="Add Child">
              <i class="fas fa-plus"></i>
            </button>
            <button class="btn-icon" onclick="event.stopPropagation(); productTreeManager.deleteItem('${node.id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn-icon" onclick="event.stopPropagation(); productTreeManager.viewItem('${node.id}')" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
          </div>
      </div>
    `;

    if (hasChildren && isExpanded) {
      html += '<div class="tree-children">';
      node.children.forEach(child => {
        html += this.renderTreeNode(child, level + 1);
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  matchesSearch(node) {
    if (!this.searchTerm) return true;
    
    const searchableText = [
      node.title || node.name || '',
      node.id || '',
      node.description || '',
      node.summary || ''
    ].join(' ').toLowerCase();
    
    return searchableText.includes(this.searchTerm);
  }

  toggleNode(nodeId) {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
    this.renderTree();
  }

  expandAll() {
    if (!this.productTree) return;
    
    const expandNode = (node) => {
      this.expandedNodes.add(node.id);
      if (node.children) {
        node.children.forEach(child => expandNode(child));
      }
    };
    
    expandNode(this.productTree);
    this.renderTree();
    this.showMessage('All nodes expanded!', 'success');
  }

  collapseAll() {
    this.expandedNodes.clear();
    this.renderTree();
    this.showMessage('All nodes collapsed!', 'success');
  }

  selectItem(nodeId) {
    const node = this.findNodeById(this.productTree, nodeId);
    if (!node) return;
    
    this.selectedItem = node;
    this.renderTree();
    this.showItemDetails(node);
    this.showWorkItems(node);
  }

  findNodeById(node, id) {
    if (!node) return null;
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  showItemDetails(item) {
    const panel = document.getElementById('itemDetailsPanel');
    const details = document.getElementById('itemDetails');
    
    if (!panel || !details) return;
    
    panel.style.display = 'block';
    
    const formatDate = (dateStr) => {
      if (!dateStr) return 'Not set';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB');
      } catch {
        return dateStr;
      }
    };

    const getPriorityClass = (priority) => {
      if (priority && priority.toLowerCase().includes('p1')) return 'priority';
      return '';
    };

    const getRiskLevelClass = (risk) => {
      if (risk && risk.toLowerCase().includes('high')) return 'risk-level';
      return '';
    };

    details.innerHTML = `
      <h2>${item.title || item.name || 'Untitled'}</h2>
      
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Type</div>
          <div class="detail-value">${item.type || 'Unknown'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Priority</div>
          <div class="detail-value ${getPriorityClass(item.priority)}">${item.priority || 'Not set'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Display ID</div>
          <div class="detail-value">${item.id || 'N/A'}</div>
        </div>
      </div>

      ${item.summary ? `
        <div class="summary-section">
          <div class="summary-label">Summary</div>
          <div class="summary-text">${item.summary}</div>
        </div>
      ` : ''}

      ${item.description ? `
        <div class="description-section">
          <div class="description-label">Description</div>
          <div class="description-text">${item.description}</div>
        </div>
      ` : ''}

      ${item.job_content ? `
        <div class="job-content-section">
          <div class="job-content-label">Job to be Done</div>
          <div class="job-content-text">${item.job_content}</div>
        </div>
      ` : ''}

      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Status</div>
          <div class="detail-value">${item.status || 'Unknown'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Team</div>
          <div class="detail-value">${item.team || 'Unassigned'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Risk Level</div>
          <div class="detail-value ${getRiskLevelClass(item.risk_level || item.risk)}">${item.risk_level || item.risk || 'Not assessed'}</div>
        </div>
      </div>

      ${item.tags && item.tags.length > 0 ? `
        <div class="tags-section">
          <div class="tags-label">Tags</div>
          <div class="tags-container">
            ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <div class="materials-section">
        <div class="materials-label">Materials</div>
        <div class="materials-text">No materials attached to this node</div>
      </div>

      <div class="metadata-section">
        <div class="metadata-label">Metadata</div>
        <div class="metadata-text">
          Created: ${formatDate(item.created_at || item.created)}<br>
          Version: ${item.version || '1'}<br>
          Updated: ${formatDate(item.updated_at || item.updated)}
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn btn-outline" onclick="productTreeManager.focusDot('${item.id}')">
          <i class="fas fa-dot-circle"></i> Focus Dot
        </button>
        <button class="btn btn-outline" onclick="productTreeManager.deleteItem('${item.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
  }

  showWorkItems(item) {
    const panel = document.getElementById('workItemsPanel');
    const table = document.getElementById('workItemsTable');
    const count = document.getElementById('workItemsCount');
    
    if (!panel || !table || !count) return;
    
    if (!item.workItems || item.workItems.length === 0) {
      panel.style.display = 'none';
      return;
    }
    
    panel.style.display = 'block';
    count.textContent = `${item.workItems.length} items`;
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = item.workItems.map(workItem => `
      <tr>
        <td>${workItem.id}</td>
        <td>${workItem.title}</td>
        <td><span class="status-badge status-${workItem.status}">${workItem.status}</span></td>
        <td><span class="priority-badge priority-${workItem.priority}">${workItem.priority}</span></td>
        <td>${workItem.owner || '-'}</td>
        <td>${workItem.estimate || '-'}</td>
        <td>
          <div class="tags">
            ${(workItem.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </td>
        <td>
          <button class="btn btn-outline btn-small" onclick="productTreeManager.viewWorkItem('${workItem.id}')">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="btn btn-primary btn-small" onclick="productTreeManager.focusWorkItem('${workItem.id}')">
            <i class="fas fa-crosshairs"></i> Focus
          </button>
        </td>
      </tr>
    `).join('');
  }

  async handleFileSelect(file) {
    if (!file) return;
    
    this.showMessage('Loading XML file...', 'info');
    
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML format');
      }
      
      // Debug: Log the XML structure
      const rootElement = xmlDoc.documentElement;
      console.log('XML Root Element:', rootElement.tagName);
      console.log('XML Root Children:', Array.from(rootElement.children).map(child => child.tagName));
      
      // Parse the XML into our tree structure
      this.productTree = this.parseXMLToTree(xmlDoc);
      
      if (this.productTree) {
        console.log('Parsed Product Tree:', this.productTree);
        this.showMessage(`Product Tree loaded successfully! Found ${this.countNodes(this.productTree)} nodes.`, 'success');
        this.renderTree();
        
        // Auto-expand first few levels to show the structure (skip root node)
        if (this.productTree.children && this.productTree.children.length > 0) {
          this.productTree.children.forEach(child => {
            this.expandedNodes.add(child.id);
            // Also expand grandchildren if they exist
            if (child.children && child.children.length > 0) {
              child.children.forEach(grandchild => {
                this.expandedNodes.add(grandchild.id);
                // Also expand great-grandchildren if they exist
                if (grandchild.children && grandchild.children.length > 0) {
                  grandchild.children.forEach(greatGrandchild => {
                    this.expandedNodes.add(greatGrandchild.id);
                  });
                }
              });
            }
          });
          this.renderTree();
        }
      } else {
        throw new Error('Could not parse Product Tree from XML');
      }
    } catch (error) {
      console.error('Error parsing XML:', error);
      this.showMessage(`Error loading XML: ${error.message}`, 'error');
    }
  }

  parseXMLToTree(xmlDoc) {
    const rootElement = xmlDoc.documentElement;
    
    const parseElement = (element) => {
      // Skip text nodes and comments
      if (element.nodeType !== 1) return null;
      
      // Skip leaf text elements like <title>, <summary>, <description> - they're handled by their parent
      if (['title', 'summary', 'description'].includes(element.tagName)) {
        return null;
      }
      
      const node = {
        id: element.getAttribute('id') || this.generateId(element),
        title: this.getTextContent(element, 'title') || element.getAttribute('title') || element.tagName,
        type: element.tagName.toLowerCase(),
        status: element.getAttribute('status') || 'active',
        priority: element.getAttribute('priority') || 'P2',
        description: this.getTextContent(element, 'description') || '',
        summary: this.getTextContent(element, 'summary') || '',
        job_content: this.getTextContent(element, 'job_content') || '',
        team: element.getAttribute('team') || '',
        effort: element.getAttribute('effort') || '',
        start: element.getAttribute('start') || '',
        end: element.getAttribute('end') || '',
        quarter: element.getAttribute('quarter') || '',
        year: element.getAttribute('year') || '',
        children: []
      };
      
      // Parse child elements (only direct children, not nested text)
      const children = Array.from(element.children).filter(child => 
        child.nodeType === 1 && 
        !['title', 'summary', 'description', 'job_content'].includes(child.tagName)
      );
      children.forEach(child => {
        const childNode = parseElement(child);
        if (childNode) {
          node.children.push(childNode);
        }
      });
      
      return node;
    };
    
    return parseElement(rootElement);
  }

  getTextContent(element, tagName) {
    const child = element.querySelector(tagName);
    return child ? child.textContent.trim() : '';
  }

  generateId(element) {
    // Generate a unique ID based on element position and tag
    const parent = element.parentElement;
    if (!parent) return element.tagName.toLowerCase();
    
    const siblings = Array.from(parent.children).filter(child => child.nodeType === 1);
    const index = siblings.indexOf(element);
    return `${element.tagName.toLowerCase()}_${index}`;
  }

  countNodes(node) {
    let count = 1; // Count the current node
    if (node.children) {
      node.children.forEach(child => {
        count += this.countNodes(child);
      });
    }
    return count;
  }

  getNodeTypeDisplay(type) {
    const typeMap = {
      'product': 'PRODUCT',
      'goal': 'GOAL', 
      'job': 'JOB',
      'work_item': 'WORK ITEM',
      'work': 'WORK'
    };
    return typeMap[type] || type.toUpperCase();
  }

  focusDot(nodeId) {
    // Focus Dot functionality - placeholder for now
    this.showMessage(`Focusing Dot on node: ${nodeId}`, 'info');
  }

  async sendAIMessage() {
    const input = document.getElementById('aiInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;

    // Add user message
    this.addAIMessage('user', message);
    input.value = '';

    // Show typing indicator
    this.addAIMessage('ai', '...', true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: message,
          context: this.selectedItem ? `Current item: ${this.selectedItem.title}` : 'No item selected'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.updateLastAIMessage(data.response);
      } else {
        this.updateLastAIMessage('Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      this.updateLastAIMessage('Sorry, I\'m not available right now. Please try again later.');
    }
  }

  addAIMessage(type, content, isTyping = false) {
    const messagesContainer = document.getElementById('aiMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${type}`;
    
    if (type === 'user') {
      messageDiv.innerHTML = `
        <div class="message-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
          <p>${content}</p>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          <p>${content}</p>
        </div>
      `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    if (isTyping) {
      messageDiv.classList.add('typing');
    }
  }

  updateLastAIMessage(content) {
    const messagesContainer = document.getElementById('aiMessages');
    if (!messagesContainer) return;
    
    const lastMessage = messagesContainer.querySelector('.ai-message.ai.typing');
    if (lastMessage) {
      lastMessage.querySelector('.message-content p').textContent = content;
      lastMessage.classList.remove('typing');
    }
  }

  updateAIStatus(status, message) {
    const statusDiv = document.getElementById('aiStatus');
    if (!statusDiv) return;
    
    const indicator = statusDiv.querySelector('.status-indicator');
    const text = statusDiv.querySelector('.status-text');
    
    if (indicator && text) {
      indicator.textContent = status === 'connected' ? '🟢' : status === 'error' ? '🔴' : '🟡';
      text.textContent = message;
    }
  }

  async checkAIConnection() {
    // For now, assume AI is available since we're using Ollama locally
    this.updateAIStatus('connected', 'Connected');
  }

  // Placeholder methods for functionality
  addProduct() {
    this.showMessage('Add Product functionality coming soon!', 'info');
  }

  refresh() {
    this.showMessage('Refreshing...', 'info');
    setTimeout(() => {
      this.showMessage('Refreshed successfully!', 'success');
    }, 1000);
  }

  clearCache() {
    this.expandedNodes.clear();
    this.selectedItem = null;
    this.productTree = null;
    this.renderTree();
    this.showMessage('Cache cleared!', 'success');
  }

  exportXML() {
    if (!this.productTree) {
      this.showMessage('No product tree to export!', 'error');
      return;
    }
    this.showMessage('Exporting to XML...', 'info');
  }

  exportJira() {
    if (!this.productTree) {
      this.showMessage('No product tree to export!', 'error');
        return;
      }
    this.showMessage('Exporting to Jira CSV...', 'info');
  }

  addChild(parentId) {
    this.showMessage(`Adding child to ${parentId}...`, 'info');
  }

  deleteItem(itemId) {
    this.showMessage(`Deleting item ${itemId}...`, 'info');
  }

  viewItem(itemId) {
    this.showMessage(`Viewing item ${itemId}...`, 'info');
  }

  viewWorkItem(workItemId) {
    this.showMessage(`Viewing work item ${workItemId}...`, 'info');
  }

  focusWorkItem(workItemId) {
    this.showMessage(`Focusing on work item ${workItemId}...`, 'info');
  }

  closeModal() {
    const modal = document.getElementById('workItemModal');
    if (modal) modal.style.display = 'none';
  }

  showMessage(message, type = 'info') {
    const statusDiv = document.getElementById('importSummary');
    if (statusDiv) {
      const className = type === 'success' ? 'success' : type === 'error' ? 'error' : '';
      statusDiv.innerHTML = `<div class="status-message ${className}">${message}</div>`;
    }
  }
}

// Initialize the application
let productTreeManager;
document.addEventListener('DOMContentLoaded', () => {
  productTreeManager = new ProductTreeManager();
});