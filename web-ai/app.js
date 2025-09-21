// Product Tree Manager - Web Version with Local AI (Ollama)
class ProductTreeManager {
  constructor() {
    this.productTree = null;
    this.expandedNodes = new Set();
    this.searchTerm = '';
    this.selectedNode = null;
    this.editingNode = null;
    this.aiHistory = [];
    this.aiEndpoint = 'http://localhost:3001'; // Ollama proxy server
    this.aiConnected = false;
    
    this.initializeEventListeners();
    this.checkAIConnection();
    this.showWelcomeMessage();
  }

  initializeEventListeners() {
    // File input
    document.getElementById('xmlFile').addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files[0]);
    });

    // Drag and drop
    const dropZone = document.getElementById('dropZone');
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

    // Toolbar buttons
    document.getElementById('btnExpandAll').addEventListener('click', () => this.expandAll());
    document.getElementById('btnCollapseAll').addEventListener('click', () => this.collapseAll());
    document.getElementById('btnExportXML').addEventListener('click', () => this.exportXML());
    document.getElementById('btnExportJira').addEventListener('click', () => this.exportJira());
    document.getElementById('btnDebug').addEventListener('click', () => this.debugProductTree());

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.renderTree();
    });

    // AI Chat
    document.getElementById('btnSendAI').addEventListener('click', () => this.sendAIMessage());
    document.getElementById('aiInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendAIMessage();
    });

    // AI Test button
    document.getElementById('btnTestAI').addEventListener('click', () => this.testAIConnection());

    // Modal
    document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
    document.getElementById('workItemModal').addEventListener('click', (e) => {
      if (e.target.id === 'workItemModal') this.closeModal();
    });
  }

  async checkAIConnection() {
    try {
      const response = await fetch(`${this.aiEndpoint}/api/ollama/status`);
      const data = await response.json();
      
      if (data.status === 'connected') {
        this.aiConnected = true;
        this.updateAIStatus('connected', `✅ Connected to Ollama (${data.models.length} models available)`);
      } else {
        this.aiConnected = false;
        this.updateAIStatus('error', `❌ Ollama not running: ${data.message}`);
      }
    } catch (error) {
      this.aiConnected = false;
      this.updateAIStatus('error', `❌ Cannot connect to Ollama proxy: ${error.message}`);
    }
  }

  async testAIConnection() {
    const button = document.getElementById('btnTestAI');
    const originalText = button.textContent;
    button.textContent = 'Testing...';
    button.disabled = true;

    try {
      const response = await fetch(`${this.aiEndpoint}/api/ollama/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Hello! Can you confirm you are working?',
          model: 'llama3.2:3b'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.aiConnected = true;
        this.updateAIStatus('connected', `✅ AI Test Successful! Response: "${data.response.substring(0, 50)}..."`);
        this.addChatMessage(`Test successful! AI responded: "${data.response}"`, 'ai');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      this.aiConnected = false;
      this.updateAIStatus('error', `❌ AI Test Failed: ${error.message}`);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  updateAIStatus(status, message) {
    const statusDiv = document.getElementById('aiStatus');
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');
    
    statusDiv.className = `ai-status ${status}`;
    text.textContent = message;
    
    if (status === 'connected') {
      indicator.textContent = '🟢';
    } else if (status === 'error') {
      indicator.textContent = '🔴';
    } else {
      indicator.textContent = '🟡';
    }
  }

  showWelcomeMessage() {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `
      <div style="background: #e3f2fd; border-left: 4px solid #4a90e2; padding: 15px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #4a90e2;">🌳 Welcome to Product Tree Manager with Local AI</h3>
        <p style="margin: 0 0 10px 0;">This version uses your local Ollama model for real AI analysis.</p>
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>Features:</strong> Import XML, analyze with real AI, export to XML/CSV, debug tools
        </p>
      </div>
    `;
  }

  async handleFileSelect(file) {
    if (!file) return;

    this.showMessage('Loading XML file...', 'info');
    
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XML format');
      }

      this.productTree = this.parseXMLToTree(xmlDoc);
      this.showMessage(`✅ Successfully loaded ${this.productTree.nodes.length} nodes`, 'success');
      
      this.renderTree();
      this.showToolbar();
      this.showAISection();
      
    } catch (error) {
      this.showMessage(`❌ Error loading file: ${error.message}`, 'error');
    }
  }

  parseXMLToTree(xmlDoc) {
    const nodes = [];
    const edges = [];
    
    // Parse nodes
    const nodeElements = xmlDoc.getElementsByTagName('node');
    for (let node of nodeElements) {
      const nodeData = {
        id: node.getAttribute('id'),
        title: node.getElementsByTagName('title')[0]?.textContent || '',
        type: node.getElementsByTagName('type')[0]?.textContent || '',
        description: node.getElementsByTagName('description')[0]?.textContent || '',
        job_content: node.getElementsByTagName('job_content')[0]?.textContent || '',
        status: node.getElementsByTagName('status')[0]?.textContent || 'active'
      };
      nodes.push(nodeData);
    }
    
    // Parse edges
    const edgeElements = xmlDoc.getElementsByTagName('edge');
    for (let edge of edgeElements) {
      const edgeData = {
        from: edge.getAttribute('from'),
        to: edge.getAttribute('to'),
        type: edge.getAttribute('type') || 'contains'
      };
      edges.push(edgeData);
    }
    
    return { nodes, edges };
  }

  renderTree() {
    if (!this.productTree) return;

    const container = document.getElementById('productTree');
    container.innerHTML = '';

    // Filter nodes based on search
    const filteredNodes = this.productTree.nodes.filter(node => 
      this.searchTerm === '' || 
      node.title.toLowerCase().includes(this.searchTerm) ||
      node.description.toLowerCase().includes(this.searchTerm)
    );

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = filteredNodes.filter(node => 
      !this.productTree.edges.some(edge => edge.to === node.id)
    );

    rootNodes.forEach(node => this.renderNode(node, container, 0));
  }

  renderNode(node, container, level) {
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    nodeElement.style.marginLeft = `${level * 20}px`;
    
    const isExpanded = this.expandedNodes.has(node.id);
    const hasChildren = this.productTree.edges.some(edge => edge.from === node.id);
    
    nodeElement.innerHTML = `
      <div class="node-content" data-node-id="${node.id}">
        ${hasChildren ? `<span class="expand-icon">${isExpanded ? '📂' : '📁'}</span>` : '<span class="expand-icon">📄</span>'}
        <span class="node-title">${node.title}</span>
        <span class="node-type">${node.type}</span>
        ${node.description ? `<div class="node-description">${node.description}</div>` : ''}
      </div>
    `;

    // Add click handlers
    const content = nodeElement.querySelector('.node-content');
    content.onclick = (e) => {
      e.stopPropagation();
      this.selectNode(node.id);
    };

    const expandIcon = nodeElement.querySelector('.expand-icon');
    if (hasChildren) {
      expandIcon.onclick = (e) => {
        e.stopPropagation();
        this.toggleNode(node.id);
      };
    }

    container.appendChild(nodeElement);

    // Render children if expanded
    if (isExpanded) {
      const children = this.productTree.edges
        .filter(edge => edge.from === node.id)
        .map(edge => this.productTree.nodes.find(n => n.id === edge.to))
        .filter(child => child && (this.searchTerm === '' || 
          child.title.toLowerCase().includes(this.searchTerm) ||
          child.description.toLowerCase().includes(this.searchTerm)));

      children.forEach(child => this.renderNode(child, container, level + 1));
    }
  }

  selectNode(nodeId) {
    this.selectedNode = nodeId;
    this.highlightSelectedNode();
    this.showNodeDetails(nodeId);
  }

  highlightSelectedNode() {
    // Remove previous selection
    document.querySelectorAll('.tree-node').forEach(node => {
      node.classList.remove('selected');
    });

    // Highlight selected node
    const selectedElement = document.querySelector(`[data-node-id="${this.selectedNode}"]`);
    if (selectedElement) {
      selectedElement.closest('.tree-node').classList.add('selected');
    }
  }

  showNodeDetails(nodeId) {
    const node = this.productTree.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const detailsContainer = document.getElementById('nodeDetails');
    detailsContainer.innerHTML = `
      <div class="node-details">
        <div class="details-grid">
          <div class="detail-item">
            <strong>ID</strong>
            <span>${node.id}</span>
          </div>
          <div class="detail-item">
            <strong>Type</strong>
            <span>${node.type}</span>
          </div>
          <div class="detail-item">
            <strong>Status</strong>
            <span>${node.status}</span>
          </div>
          <div class="detail-item">
            <strong>Title</strong>
            <span>${node.title}</span>
          </div>
        </div>
        ${node.description ? `
          <div class="detail-item">
            <strong>Description</strong>
            <div class="description">${node.description}</div>
          </div>
        ` : ''}
        ${node.job_content ? `
          <div class="detail-item">
            <strong>Job Content</strong>
            <div class="description">${node.job_content}</div>
          </div>
        ` : ''}
        <div class="node-actions">
          <button class="btn-outline" onclick="productTreeManager.editNode('${node.id}')">Edit</button>
          <button class="btn-outline" onclick="productTreeManager.addChildNode('${node.id}')">Add Child</button>
          <button class="btn-danger" onclick="productTreeManager.deleteNodeConfirm('${node.id}')">Delete</button>
        </div>
      </div>
    `;
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
    this.productTree.nodes.forEach(node => this.expandedNodes.add(node.id));
    this.renderTree();
  }

  collapseAll() {
    this.expandedNodes.clear();
    this.renderTree();
  }

  showToolbar() {
    document.getElementById('toolbar').style.display = 'flex';
  }

  showAISection() {
    document.getElementById('aiSection').style.display = 'block';
  }

  showMessage(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    const className = type === 'success' ? 'success' : type === 'error' ? 'error' : '';
    statusDiv.innerHTML = `<div class="status-message ${className}">${message}</div>`;
  }

  // AI Analysis with Real Ollama
  async sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    if (!message) return;

    if (!this.aiConnected) {
      this.addChatMessage('❌ AI is not connected. Please check that Ollama is running and try the "Test AI" button.', 'ai');
      return;
    }

    // Add user message to chat
    this.addChatMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    this.addChatMessage('Thinking...', 'ai', true);

    try {
      const response = await fetch(`${this.aiEndpoint}/api/ollama/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message,
          model: 'llama3.2:3b',
          context: {
            productTree: this.productTree
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Remove typing indicator and add response
        this.removeLastChatMessage();
        this.addChatMessage(data.response, 'ai');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
      
    } catch (error) {
      this.removeLastChatMessage();
      this.addChatMessage(`❌ Error: ${error.message}`, 'ai');
    }
  }

  addChatMessage(message, sender, isTyping = false) {
    const chatContainer = document.getElementById('aiChat');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${sender}`;
    
    if (isTyping) {
      messageDiv.innerHTML = `
        <div class="ai-avatar">🤖</div>
        <div class="ai-content">
          <span class="spinner"></span> ${message}
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="ai-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
        <div class="ai-content">${message}</div>
      `;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  removeLastChatMessage() {
    const chatContainer = document.getElementById('aiChat');
    const lastMessage = chatContainer.lastElementChild;
    if (lastMessage) {
      lastMessage.remove();
    }
  }

  // Export functions (same as before)
  exportXML() {
    if (!this.productTree) {
      this.showMessage('No product tree loaded', 'error');
      return;
    }

    const xml = this.generateXML();
    this.downloadFile(xml, 'product-tree.xml', 'application/xml');
    this.showMessage('✅ XML exported successfully', 'success');
  }

  exportJira() {
    if (!this.productTree) {
      this.showMessage('No product tree loaded', 'error');
      return;
    }

    const csv = this.generateJiraCSV();
    this.downloadFile(csv, 'product-tree-jira.csv', 'text/csv');
    this.showMessage('✅ Jira CSV exported successfully', 'success');
  }

  generateXML() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<product_tree>\n';
    
    // Add nodes
    xml += '  <nodes>\n';
    this.productTree.nodes.forEach(node => {
      xml += `    <node id="${node.id}">\n`;
      xml += `      <title>${this.escapeXml(node.title)}</title>\n`;
      xml += `      <type>${this.escapeXml(node.type)}</type>\n`;
      xml += `      <status>${this.escapeXml(node.status)}</status>\n`;
      if (node.description) {
        xml += `      <description>${this.escapeXml(node.description)}</description>\n`;
      }
      if (node.job_content) {
        xml += `      <job_content>${this.escapeXml(node.job_content)}</job_content>\n`;
      }
      xml += '    </node>\n';
    });
    xml += '  </nodes>\n';
    
    // Add edges
    xml += '  <edges>\n';
    this.productTree.edges.forEach(edge => {
      xml += `    <edge from="${edge.from}" to="${edge.to}" type="${edge.type}"/>\n`;
    });
    xml += '  </edges>\n';
    
    xml += '</product_tree>';
    return xml;
  }

  generateJiraCSV() {
    const headers = ['Issue Type', 'Summary', 'Description', 'Labels'];
    const rows = [headers];
    
    this.productTree.nodes.forEach(node => {
      const issueType = this.mapIssueType(node.type);
      const summary = node.title;
      const description = node.description || '';
      const labels = this.getNodeLabels(node);
      
      rows.push([issueType, summary, description, labels]);
    });
    
    return rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  mapIssueType(nodeType) {
    const mapping = {
      'Product': 'Initiative',
      'Goal': 'Initiative', 
      'Job': 'Epic',
      'Work Item': 'Story',
      'Task': 'Task'
    };
    return mapping[nodeType] || 'Task';
  }

  getNodeLabels(node) {
    const labels = [node.type];
    
    // Add product label if this node belongs to a product
    const productEdge = this.productTree.edges.find(edge => 
      edge.to === node.id && 
      this.productTree.nodes.find(n => n.id === edge.from)?.type === 'Product'
    );
    
    if (productEdge) {
      const product = this.productTree.nodes.find(n => n.id === productEdge.from);
      if (product) {
        labels.push(product.title);
      }
    }
    
    return labels.join(',');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  debugProductTree() {
    if (!this.productTree) {
      this.showMessage('No product tree loaded', 'error');
      return;
    }

    const debugInfo = this.performDebugAnalysis();
    this.showDebugResults(debugInfo);
  }

  performDebugAnalysis() {
    const totalNodes = this.productTree.nodes.length;
    const totalEdges = this.productTree.edges.length;
    
    // Find root nodes
    const rootNodes = this.productTree.nodes.filter(node => 
      !this.productTree.edges.some(edge => edge.to === node.id)
    );
    
    // Find duplicates
    const titles = this.productTree.nodes.map(n => n.title);
    const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];
    
    // Find circular references
    const circularRefs = this.findCircularReferences();
    
    // Get all node titles
    const nodeTitles = [...new Set(titles)];
    
    return {
      total_nodes: totalNodes,
      total_edges: totalEdges,
      root_nodes: rootNodes.map(n => n.title),
      duplicates: uniqueDuplicates.map(title => ({
        title: title,
        nodes: this.productTree.nodes.filter(n => n.title === title).map(n => n.id)
      })),
      circular_references: circularRefs,
      node_titles: nodeTitles.sort()
    };
  }

  findCircularReferences() {
    const circularRefs = [];
    const visited = new Set();
    const recursionStack = new Set();
    
    const dfs = (nodeId, path) => {
      if (recursionStack.has(nodeId)) {
        circularRefs.push([...path, nodeId]);
        return;
      }
      
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const children = this.productTree.edges
        .filter(edge => edge.from === nodeId)
        .map(edge => edge.to);
      
      children.forEach(childId => {
        dfs(childId, [...path, nodeId]);
      });
      
      recursionStack.delete(nodeId);
    };
    
    this.productTree.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });
    
    return circularRefs;
  }

  showDebugResults(debugInfo) {
    let message = `🔍 Debug Analysis Results:\n\n`;
    message += `Total Nodes: ${debugInfo.total_nodes}\n`;
    message += `Total Edges: ${debugInfo.total_edges}\n`;
    message += `Root Nodes: ${debugInfo.root_nodes.length}\n\n`;
    
    if (debugInfo.duplicates.length > 0) {
      message += `🚨 DUPLICATES FOUND:\n`;
      debugInfo.duplicates.forEach(dup => {
        message += `• "${dup.title}" appears in nodes: ${dup.nodes.join(', ')}\n`;
      });
      message += `\n`;
    } else {
      message += `✅ No duplicates found\n\n`;
    }
    
    if (debugInfo.circular_references.length > 0) {
      message += `🔄 CIRCULAR REFERENCES: ${debugInfo.circular_references.length} found\n\n`;
    } else {
      message += `✅ No circular references found\n\n`;
    }
    
    message += `📋 All Node Titles:\n`;
    debugInfo.node_titles.forEach(title => {
      message += `• ${title}\n`;
    });
    
    alert(message);
  }

  // CRUD Operations (simplified for web version)
  editNode(nodeId) {
    this.showMessage('Edit functionality available in full version', 'info');
  }

  addChildNode(parentId) {
    this.showMessage('Add child functionality available in full version', 'info');
  }

  deleteNodeConfirm(nodeId) {
    this.showMessage('Delete functionality available in full version', 'info');
  }

  closeModal() {
    document.getElementById('workItemModal').style.display = 'none';
  }
}

// Initialize the application
const productTreeManager = new ProductTreeManager();
