// Product Tree Manager - Web Version (Browser Only)
class ProductTreeManager {
  constructor() {
    this.productTree = null;
    this.expandedNodes = new Set();
    this.searchTerm = '';
    this.selectedNode = null;
    this.editingNode = null;
    this.aiHistory = [];
    
    this.initializeEventListeners();
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

    // Modal
    document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
    document.getElementById('workItemModal').addEventListener('click', (e) => {
      if (e.target.id === 'workItemModal') this.closeModal();
    });
  }

  showWelcomeMessage() {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `
      <div style="background: #e3f2fd; border-left: 4px solid #4a90e2; padding: 15px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #4a90e2;">🌳 Welcome to Product Tree Manager</h3>
        <p style="margin: 0 0 10px 0;">This is the web version that works entirely in your browser.</p>
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>Features:</strong> Import XML, analyze hierarchy, export to XML/CSV, AI-powered insights
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
        .filter(child => child && this.searchTerm === '' || 
          child.title.toLowerCase().includes(this.searchTerm) ||
          child.description.toLowerCase().includes(this.searchTerm));

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

  // AI Analysis (Browser-based)
  async sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    if (!message) return;

    // Add user message to chat
    this.addChatMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    this.addChatMessage('Analyzing your product tree...', 'ai', true);

    try {
      // Simulate AI analysis (in a real implementation, you'd call an AI API)
      const response = await this.analyzeProductTree(message);
      
      // Remove typing indicator and add response
      this.removeLastChatMessage();
      this.addChatMessage(response, 'ai');
      
    } catch (error) {
      this.removeLastChatMessage();
      this.addChatMessage('Sorry, I encountered an error analyzing your request.', 'ai');
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

  async analyzeProductTree(question) {
    // Browser-based AI analysis
    const analysis = this.performBrowserAnalysis(question);
    return analysis;
  }

  performBrowserAnalysis(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('duplicate') || lowerQuestion.includes('duplicate')) {
      return this.findDuplicates();
    }
    
    if (lowerQuestion.includes('hierarchy') || lowerQuestion.includes('structure')) {
      return this.analyzeHierarchy();
    }
    
    if (lowerQuestion.includes('gap') || lowerQuestion.includes('missing')) {
      return this.findGaps();
    }
    
    if (lowerQuestion.includes('dependency') || lowerQuestion.includes('relationship')) {
      return this.analyzeDependencies();
    }
    
    // General analysis
    return this.generalAnalysis();
  }

  findDuplicates() {
    const titles = this.productTree.nodes.map(n => n.title);
    const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
    
    if (duplicates.length === 0) {
      return "✅ No duplicate titles found in your product tree. Your hierarchy looks clean!";
    }
    
    const uniqueDuplicates = [...new Set(duplicates)];
    return `🔍 Found ${uniqueDuplicates.length} duplicate title(s):\n\n${uniqueDuplicates.map(title => `• "${title}"`).join('\n')}\n\nConsider consolidating or renaming these items to avoid confusion.`;
  }

  analyzeHierarchy() {
    const rootNodes = this.productTree.nodes.filter(node => 
      !this.productTree.edges.some(edge => edge.to === node.id)
    );
    
    const maxDepth = this.calculateMaxDepth();
    const avgChildren = this.calculateAverageChildren();
    
    return `📊 Hierarchy Analysis:\n\n• Root nodes: ${rootNodes.length}\n• Maximum depth: ${maxDepth} levels\n• Average children per node: ${avgChildren.toFixed(1)}\n\n${rootNodes.length > 5 ? '⚠️ Consider consolidating root nodes for better organization.' : '✅ Good root node structure.'}`;
  }

  findGaps() {
    const orphanNodes = this.productTree.nodes.filter(node => 
      !this.productTree.edges.some(edge => edge.from === node.id) &&
      !this.productTree.edges.some(edge => edge.to === node.id)
    );
    
    if (orphanNodes.length === 0) {
      return "✅ No orphaned nodes found. All nodes are properly connected.";
    }
    
    return `🔍 Found ${orphanNodes.length} orphaned node(s):\n\n${orphanNodes.map(node => `• "${node.title}" (${node.type})`).join('\n')}\n\nConsider connecting these to your main hierarchy.`;
  }

  analyzeDependencies() {
    const highDependencyNodes = this.productTree.nodes.filter(node => {
      const incoming = this.productTree.edges.filter(edge => edge.to === node.id).length;
      const outgoing = this.productTree.edges.filter(edge => edge.from === node.id).length;
      return incoming > 2 || outgoing > 5;
    });
    
    if (highDependencyNodes.length === 0) {
      return "✅ No high-dependency nodes found. Your dependencies are well-balanced.";
    }
    
    return `🔍 Found ${highDependencyNodes.length} high-dependency node(s):\n\n${highDependencyNodes.map(node => {
      const incoming = this.productTree.edges.filter(edge => edge.to === node.id).length;
      const outgoing = this.productTree.edges.filter(edge => edge.from === node.id).length;
      return `• "${node.title}" (${incoming} incoming, ${outgoing} outgoing dependencies)`;
    }).join('\n')}\n\nConsider breaking these into smaller, more manageable components.`;
  }

  generalAnalysis() {
    const totalNodes = this.productTree.nodes.length;
    const totalEdges = this.productTree.edges.length;
    const nodeTypes = [...new Set(this.productTree.nodes.map(n => n.type))];
    
    return `📈 General Analysis:\n\n• Total nodes: ${totalNodes}\n• Total relationships: ${totalEdges}\n• Node types: ${nodeTypes.join(', ')}\n• Average relationships per node: ${(totalEdges / totalNodes).toFixed(1)}\n\nYour product tree has a ${totalNodes > 50 ? 'complex' : 'manageable'} structure with ${nodeTypes.length} different types of components.`;
  }

  calculateMaxDepth() {
    const rootNodes = this.productTree.nodes.filter(node => 
      !this.productTree.edges.some(edge => edge.to === node.id)
    );
    
    let maxDepth = 0;
    rootNodes.forEach(root => {
      const depth = this.getNodeDepth(root.id, 0);
      maxDepth = Math.max(maxDepth, depth);
    });
    
    return maxDepth;
  }

  getNodeDepth(nodeId, currentDepth) {
    const children = this.productTree.edges
      .filter(edge => edge.from === nodeId)
      .map(edge => edge.to);
    
    if (children.length === 0) return currentDepth;
    
    let maxChildDepth = currentDepth;
    children.forEach(childId => {
      const childDepth = this.getNodeDepth(childId, currentDepth + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    });
    
    return maxChildDepth;
  }

  calculateAverageChildren() {
    const nodesWithChildren = this.productTree.nodes.filter(node => 
      this.productTree.edges.some(edge => edge.from === node.id)
    );
    
    if (nodesWithChildren.length === 0) return 0;
    
    const totalChildren = nodesWithChildren.reduce((sum, node) => {
      return sum + this.productTree.edges.filter(edge => edge.from === node.id).length;
    }, 0);
    
    return totalChildren / nodesWithChildren.length;
  }

  // Export functions
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
