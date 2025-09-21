// Product Tree Manager - Standalone Application
class ProductTreeManager {
  constructor() {
    this.productTree = null;
    this.expandedNodes = new Set();
    this.searchTerm = '';
    this.aiEndpoint = 'http://localhost:8081';
    this.selectedNode = null;
    this.editingNode = null;
    this.autoStartEndpoint = 'http://localhost:3000';
    
    this.initializeEventListeners();
    this.autoStartServices();
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
      if (file && file.type === 'text/xml' || file.name.endsWith('.xml')) {
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

    // AI
    document.getElementById('btnTestConnection').addEventListener('click', () => this.testConnection());
    document.getElementById('btnSendAI').addEventListener('click', () => this.sendAIMessage());
    document.getElementById('aiInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendAIMessage();
    });

    // Modal
    document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
    document.getElementById('workItemModal').addEventListener('click', (e) => {
      if (e.target.id === 'workItemModal') this.closeModal();
    });

    // API endpoint
    document.getElementById('apiEndpoint').addEventListener('change', (e) => {
      this.aiEndpoint = e.target.value;
    });
  }

  async handleFileSelect(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      if (xmlDoc.documentElement.nodeName === 'parsererror') {
        throw new Error('Invalid XML format');
      }

      this.productTree = this.parseXMLToTree(xmlDoc);
      this.renderTree();
      this.showTreePanel();
      this.updateImportSummary();
    } catch (error) {
      alert('Error loading XML file: ' + error.message);
    }
  }

  parseXMLToTree(xmlDoc) {
    const root = xmlDoc.documentElement;
    const tree = {
      nodes: [],
      edges: []
    };

    let nodeId = 1;
    const nodeMap = new Map();

    // Parse nodes recursively
    const parseNode = (xmlNode, parentId = null) => {
      const node = {
        id: `node_${nodeId++}`,
        title: this.getTextContent(xmlNode, 'title'),
        type: xmlNode.nodeName,
        description: this.getTextContent(xmlNode, 'description'),
        summary: this.getTextContent(xmlNode, 'summary'),
        status: xmlNode.getAttribute('status') || 'not_started',
        priority: xmlNode.getAttribute('priority') || 'P2',
        team: xmlNode.getAttribute('team') || '',
        owner_email: xmlNode.getAttribute('owner') || '',
        created_at: xmlNode.getAttribute('created') || new Date().toISOString(),
        updated_at: xmlNode.getAttribute('updated') || new Date().toISOString(),
        tags: [],
        job_data: null
      };

      // Parse job-specific data
      if (node.type === 'job') {
        const jobContent = this.getTextContent(xmlNode, 'job_content');
        const effortEstimate = xmlNode.getAttribute('effort');
        const startDate = xmlNode.getAttribute('start');
        const endDate = xmlNode.getAttribute('end');
        
        node.job_data = {
          job_content: jobContent,
          effort_estimate: effortEstimate,
          start_date: startDate,
          end_date: endDate
        };
      }

      tree.nodes.push(node);
      nodeMap.set(xmlNode, node);

      // Add edge if has parent
      if (parentId) {
        tree.edges.push({
          id: `edge_${tree.edges.length + 1}`,
          from: parentId,
          to: node.id,
          type: 'contains'
        });
      }

      // Parse children
      Array.from(xmlNode.children).forEach(child => {
        if (child.nodeName !== 'title' && child.nodeName !== 'description' && child.nodeName !== 'summary' && child.nodeName !== 'job_content') {
          parseNode(child, node.id);
        }
      });

      return node;
    };

    parseNode(root);
    
    // Import to Dot service for analysis
    this.importToDotService(tree);
    
    return tree;
  }

  getTextContent(xmlNode, tagName) {
    const element = xmlNode.querySelector(tagName);
    return element ? element.textContent.trim() : '';
  }

  async importToDotService(tree) {
    try {
      const response = await fetch(`${this.aiEndpoint}/product-tree/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tree),
      });

      if (response.ok) {
        console.log('Product tree imported to Dot service');
      } else {
        console.error('Failed to import to Dot service');
      }
    } catch (error) {
      console.error('Error importing to Dot service:', error);
    }
  }

  async debugProductTree() {
    try {
      const response = await fetch(`${this.aiEndpoint}/product-tree/debug`);
      const debugInfo = await response.json();
      
      if (response.ok) {
        console.log('Product Tree Debug Info:', debugInfo);
        
        let message = `Debug Info:\n`;
        message += `Total Nodes: ${debugInfo.total_nodes || 0}\n`;
        message += `Total Edges: ${debugInfo.total_edges || 0}\n`;
        message += `Root Nodes: ${debugInfo.root_nodes ? debugInfo.root_nodes.length : 0}\n`;
        
        if (debugInfo.duplicates && debugInfo.duplicates.length > 0) {
          message += `\nDUPLICATES FOUND:\n`;
          debugInfo.duplicates.forEach(dup => {
            message += `- "${dup.title}" appears in nodes: ${dup.nodes.join(', ')}\n`;
          });
        } else {
          message += `\nNo duplicates found.\n`;
        }
        
        if (debugInfo.circular_references && debugInfo.circular_references.length > 0) {
          message += `\nCIRCULAR REFERENCES: ${debugInfo.circular_references.length}\n`;
        } else {
          message += `\nNo circular references found.\n`;
        }
        
        if (debugInfo.node_titles) {
          message += `\nAll Node Titles:\n`;
          debugInfo.node_titles.forEach(title => {
            message += `- ${title}\n`;
          });
        }
        
        alert(message);
      } else {
        alert(`Debug failed: ${debugInfo.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Debug error:', error);
      alert(`Debug failed: ${error.message}`);
    }
  }

  renderTree() {
    if (!this.productTree) return;

    const container = document.getElementById('productTree');
    container.innerHTML = '';

    // Build hierarchy
    const nodeMap = new Map();
    const children = new Map();

    this.productTree.nodes.forEach(node => {
      nodeMap.set(node.id, node);
      children.set(node.id, []);
    });

    this.productTree.edges.forEach(edge => {
      if (children.has(edge.from)) {
        children.get(edge.from).push(edge.to);
      }
    });

    // Find root nodes (nodes without parents)
    const rootNodes = this.productTree.nodes.filter(node => 
      !this.productTree.edges.some(edge => edge.to === node.id)
    );

    rootNodes.forEach(rootNode => {
      const nodeElement = this.createNodeElement(rootNode, children, 0);
      container.appendChild(nodeElement);
    });
  }

  createNodeElement(node, children, depth) {
    const hasChildren = children.get(node.id).length > 0;
    const isExpanded = this.expandedNodes.has(node.id);
    const isVisible = !this.searchTerm || 
      node.title.toLowerCase().includes(this.searchTerm) ||
      node.description.toLowerCase().includes(this.searchTerm);

    if (!isVisible && !this.hasVisibleChildren(node.id, children)) {
      return document.createElement('div'); // Empty div for hidden nodes
    }

    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';
    nodeDiv.style.marginLeft = `${depth * 20}px`;

    const header = document.createElement('div');
    header.className = `node-header ${isExpanded ? 'expanded' : ''}`;
    header.onclick = () => this.toggleNode(node.id);

    // Toggle button
    if (hasChildren) {
      const toggle = document.createElement('div');
      toggle.className = `node-toggle ${isExpanded ? 'expanded' : ''}`;
      toggle.textContent = isExpanded ? '−' : '+';
      header.appendChild(toggle);
    } else {
      const spacer = document.createElement('div');
      spacer.style.width = '20px';
      header.appendChild(spacer);
    }

    // Node icon
    const icon = document.createElement('div');
    icon.className = 'node-icon';
    icon.textContent = this.getNodeIcon(node.type);
    header.appendChild(icon);

    // Node content
    const content = document.createElement('div');
    content.className = 'node-content';
    content.setAttribute('data-node-id', node.id);
    content.onclick = (e) => {
      e.stopPropagation();
      this.selectNode(node.id);
    };

    const title = document.createElement('div');
    title.className = 'node-title';
    title.textContent = node.title;
    content.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'node-meta';

    // Status badge
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge status-${node.status}`;
    statusBadge.textContent = node.status.replace('_', ' ');
    meta.appendChild(statusBadge);

    // Priority badge
    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge priority-${node.priority}`;
    priorityBadge.textContent = node.priority;
    meta.appendChild(priorityBadge);

    // Team
    if (node.team) {
      const teamSpan = document.createElement('span');
      teamSpan.textContent = node.team;
      meta.appendChild(teamSpan);
    }

    // Work item button
    if (node.type === 'work_item') {
      const workItemBtn = document.createElement('button');
      workItemBtn.textContent = 'View Details';
      workItemBtn.className = 'btn-outline';
      workItemBtn.style.marginLeft = '8px';
      workItemBtn.onclick = (e) => {
        e.stopPropagation();
        this.showWorkItemModal(node);
      };
      meta.appendChild(workItemBtn);
    }

    content.appendChild(meta);
    header.appendChild(content);
    nodeDiv.appendChild(header);

    // Children
    if (hasChildren && isExpanded) {
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'node-children';
      
      children.get(node.id).forEach(childId => {
        const childNode = this.productTree.nodes.find(n => n.id === childId);
        if (childNode) {
          const childElement = this.createNodeElement(childNode, children, depth + 1);
          childrenDiv.appendChild(childElement);
        }
      });
      
      nodeDiv.appendChild(childrenDiv);
    }

    return nodeDiv;
  }

  hasVisibleChildren(nodeId, children) {
    const childIds = children.get(nodeId) || [];
    return childIds.some(childId => {
      const childNode = this.productTree.nodes.find(n => n.id === childId);
      if (!childNode) return false;
      
      const isChildVisible = !this.searchTerm || 
        childNode.title.toLowerCase().includes(this.searchTerm) ||
        childNode.description.toLowerCase().includes(this.searchTerm);
      
      return isChildVisible || this.hasVisibleChildren(childId, children);
    });
  }

  getNodeIcon(type) {
    const icons = {
      'product': '🏢',
      'goal': '🎯',
      'job': '💼',
      'work_item': '🔧',
      'work': '⚙️'
    };
    return icons[type] || '📄';
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
    this.productTree.nodes.forEach(node => {
      this.expandedNodes.add(node.id);
    });
    this.renderTree();
  }

  collapseAll() {
    this.expandedNodes.clear();
    this.renderTree();
  }

  showTreePanel() {
    document.getElementById('treePanel').style.display = 'block';
    document.getElementById('aiPanel').style.display = 'block';
  }

  updateImportSummary() {
    const summary = document.getElementById('importSummary');
    const counts = this.getNodeCounts();
    summary.innerHTML = `
      <strong>Imported:</strong> ${counts.total} nodes 
      (${counts.products} products, ${counts.goals} goals, ${counts.jobs} jobs, ${counts.workItems} work items)
    `;
  }

  getNodeCounts() {
    const counts = { total: 0, products: 0, goals: 0, jobs: 0, workItems: 0 };
    this.productTree.nodes.forEach(node => {
      counts.total++;
      counts[node.type + 's'] = (counts[node.type + 's'] || 0) + 1;
    });
    return counts;
  }

  exportXML() {
    if (!this.productTree) return;
    
    const xml = this.generateXML();
    this.downloadFile(xml, 'product-tree-export.xml', 'application/xml');
  }

  exportJira() {
    if (!this.productTree) return;
    
    const csv = this.generateJiraCSV();
    this.downloadFile(csv, 'product-tree-jira-import.csv', 'text/csv');
  }

  generateXML() {
    // Build hierarchy for XML generation
    const nodeMap = new Map();
    const children = new Map();

    this.productTree.nodes.forEach(node => {
      nodeMap.set(node.id, node);
      children.set(node.id, []);
    });

    this.productTree.edges.forEach(edge => {
      if (children.has(edge.from)) {
        children.get(edge.from).push(edge.to);
      }
    });

    const rootNodes = this.productTree.nodes.filter(node => 
      !this.productTree.edges.some(edge => edge.to === node.id)
    );

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<product_tree>\n';
    
    const generateNodeXML = (node, depth) => {
      const indent = '  '.repeat(depth);
      const attrs = [];
      
      if (node.status) attrs.push(`status="${node.status}"`);
      if (node.priority) attrs.push(`priority="${node.priority}"`);
      if (node.team) attrs.push(`team="${node.team}"`);
      if (node.owner_email) attrs.push(`owner="${node.owner_email}"`);
      if (node.created_at) attrs.push(`created="${node.created_at}"`);
      if (node.updated_at) attrs.push(`updated="${node.updated_at}"`);
      
      // Job-specific attributes
      if (node.type === 'job' && node.job_data) {
        if (node.job_data.effort_estimate) attrs.push(`effort="${node.job_data.effort_estimate}"`);
        if (node.job_data.start_date) attrs.push(`start="${node.job_data.start_date}"`);
        if (node.job_data.end_date) attrs.push(`end="${node.job_data.end_date}"`);
      }
      
      const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
      const childNodes = children.get(node.id) || [];
      
      if (childNodes.length > 0) {
        xml += `${indent}<${node.type}${attrStr}>\n`;
        xml += `${indent}  <title>${this.escapeXML(node.title)}</title>\n`;
        if (node.description) xml += `${indent}  <description>${this.escapeXML(node.description)}</description>\n`;
        if (node.summary) xml += `${indent}  <summary>${this.escapeXML(node.summary)}</summary>\n`;
        if (node.type === 'job' && node.job_data?.job_content) {
          xml += `${indent}  <job_content>${this.escapeXML(node.job_data.job_content)}</job_content>\n`;
        }
        
        childNodes.forEach(childId => {
          const childNode = nodeMap.get(childId);
          if (childNode) generateNodeXML(childNode, depth + 1);
        });
        
        xml += `${indent}</${node.type}>\n`;
      } else {
        xml += `${indent}<${node.type}${attrStr}>\n`;
        xml += `${indent}  <title>${this.escapeXML(node.title)}</title>\n`;
        if (node.description) xml += `${indent}  <description>${this.escapeXML(node.description)}</description>\n`;
        if (node.summary) xml += `${indent}  <summary>${this.escapeXML(node.summary)}</summary>\n`;
        if (node.type === 'job' && node.job_data?.job_content) {
          xml += `${indent}  <job_content>${this.escapeXML(node.job_data.job_content)}</job_content>\n`;
        }
        xml += `${indent}</${node.type}>\n`;
      }
    };

    rootNodes.forEach(rootNode => {
      generateNodeXML(rootNode, 1);
    });

    xml += '</product_tree>';
    return xml;
  }

  generateJiraCSV() {
    const headers = [
      'Issue Type', 'Summary', 'Description', 'Priority', 'Status',
      'Assignee', 'Reporter', 'Labels', 'Components', 'Story Points',
      'Created', 'Updated'
    ];

    const rows = [headers.join(',')];

    this.productTree.nodes.forEach(node => {
      const issueType = this.mapToJiraType(node.type);
      const labels = [node.type];
      
      // Add product as label if we can determine it
      const product = this.findProductForNode(node.id);
      if (product) labels.push(product.title);

      const row = [
        this.escapeCSV(issueType),
        this.escapeCSV(node.title),
        this.escapeCSV(node.description || node.summary || ''),
        this.escapeCSV(node.priority),
        this.escapeCSV(node.status.replace('_', ' ')),
        this.escapeCSV(node.owner_email || ''),
        this.escapeCSV('admin'),
        this.escapeCSV(labels.join(',')),
        this.escapeCSV(node.team || ''),
        this.escapeCSV(node.job_data?.effort_estimate || ''),
        this.escapeCSV(node.created_at ? new Date(node.created_at).toISOString().split('T')[0] : ''),
        this.escapeCSV(node.updated_at ? new Date(node.updated_at).toISOString().split('T')[0] : '')
      ];
      
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  mapToJiraType(type) {
    const typeMap = {
      'product': 'Initiative',
      'goal': 'Initiative', 
      'job': 'Epic',
      'work_item': 'Story',
      'work': 'Story'
    };
    return typeMap[type] || 'Story';
  }

  findProductForNode(nodeId) {
    // Find the root product for this node by traversing up the hierarchy
    let currentNodeId = nodeId;
    const visited = new Set();
    
    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId);
      const node = this.productTree.nodes.find(n => n.id === currentNodeId);
      if (node && node.type === 'product') {
        return node;
      }
      
      // Find parent
      const parentEdge = this.productTree.edges.find(e => e.to === currentNodeId);
      currentNodeId = parentEdge ? parentEdge.from : null;
    }
    
    return null;
  }

  escapeXML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
  }

  escapeCSV(value) {
    if (!value) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  showWorkItemModal(node) {
    const modal = document.getElementById('workItemModal');
    const content = document.getElementById('workItemContent');
    
    content.innerHTML = `
      <h4>${node.title}</h4>
      <p><strong>Type:</strong> ${node.type}</p>
      <p><strong>Status:</strong> ${node.status}</p>
      <p><strong>Priority:</strong> ${node.priority}</p>
      ${node.team ? `<p><strong>Team:</strong> ${node.team}</p>` : ''}
      ${node.description ? `<p><strong>Description:</strong> ${node.description}</p>` : ''}
      ${node.job_data?.job_content ? `<p><strong>Job Content:</strong> ${node.job_data.job_content}</p>` : ''}
    `;
    
    modal.style.display = 'flex';
  }

  closeModal() {
    document.getElementById('workItemModal').style.display = 'none';
  }

  async autoStartServices() {
    console.log('🚀 Checking services...');
    
    try {
      // First try to connect directly to Dot service
      const response = await fetch(`${this.aiEndpoint}/health`);
      if (response.ok) {
        console.log('✅ Dot service is already running');
        this.testConnection();
        return;
      }
    } catch (error) {
      console.log('🔧 Dot service not running, attempting auto-start...');
    }
    
    try {
      // Try auto-start server if available
      const checkResponse = await fetch(`${this.autoStartEndpoint}/api/check-services`);
      const status = await checkResponse.json();
      
      if (status.dotService) {
        console.log('✅ Dot service is already running');
        this.testConnection();
        return;
      }
      
      // Services not running, start them
      console.log('🔧 Starting Dot service...');
      const startResponse = await fetch(`${this.autoStartEndpoint}/api/start-services`);
      const result = await startResponse.json();
      
      if (result.success) {
        console.log('✅ Services started successfully');
        // Wait a moment for services to fully start
        setTimeout(() => {
          this.testConnection();
        }, 2000);
      } else {
        console.error('❌ Failed to start services:', result.message);
        this.showManualStartMessage();
      }
    } catch (error) {
      console.error('❌ Auto-start server not available:', error.message);
      this.showManualStartMessage();
    }
  }

  showManualStartMessage() {
    const message = `
🚀 Product Tree Manager Ready!

To start the Dot service manually:

1. Open Terminal
2. Run: cd ${window.location.pathname.replace('/ui/index.html', '')}
3. Run: ./start-everything.sh

Or double-click: START-HERE.command

Then refresh this page.
    `;
    
    // Show a friendly message instead of an error
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div style="background: #f0f8ff; border: 1px solid #4a90e2; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h3 style="margin: 0 0 10px 0; color: #4a90e2;">🚀 Ready to Start!</h3>
          <p style="margin: 0 0 10px 0;">The Dot service needs to be started manually.</p>
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Quick Start:</strong> Double-click <code>START-HERE.command</code> in Finder, then refresh this page.
          </p>
        </div>
      `;
    }
  }

  async testConnection() {
    const endpoint = document.getElementById('apiEndpoint').value;
    const button = document.getElementById('btnTestConnection');
    
    button.textContent = 'Testing...';
    button.disabled = true;
    
    try {
      const response = await fetch(`${endpoint}/health`);
      if (response.ok) {
        button.textContent = '✅ Connected';
        button.style.background = 'var(--success)';
        this.aiEndpoint = endpoint;
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      button.textContent = '❌ Failed';
      button.style.background = 'var(--error)';
    } finally {
      setTimeout(() => {
        button.textContent = 'Test Connection';
        button.disabled = false;
        button.style.background = '';
      }, 2000);
    }
  }

  async sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    if (!message) return;

    const messagesContainer = document.getElementById('aiMessages');
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'ai-message user';
    userMessage.textContent = message;
    messagesContainer.appendChild(userMessage);
    
    input.value = '';
    
    // Add loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'ai-message assistant';
    loadingMessage.textContent = 'Thinking...';
    messagesContainer.appendChild(loadingMessage);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
      const response = await fetch(`${this.aiEndpoint}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          context: {
            productTree: this.productTree,
            currentNode: null
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        loadingMessage.textContent = data.response || 'No response received';
      } else {
        throw new Error('AI request failed');
      }
    } catch (error) {
      loadingMessage.textContent = `Error: ${error.message}`;
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // CRUD Operations
  async createNode(nodeData) {
    try {
      const response = await fetch(`${this.aiEndpoint}/product-tree/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodeData),
      });

      if (!response.ok) {
        throw new Error(`Create failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.showMessage('Node created successfully!', 'success');
      return result.node;
    } catch (error) {
      console.error('Create error:', error);
      this.showMessage(`Create failed: ${error.message}`, 'error');
      return null;
    }
  }

  async updateNode(nodeId, updates) {
    try {
      const response = await fetch(`${this.aiEndpoint}/product-tree/nodes/${nodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.showMessage('Node updated successfully!', 'success');
      return result.node;
    } catch (error) {
      console.error('Update error:', error);
      this.showMessage(`Update failed: ${error.message}`, 'error');
      return null;
    }
  }

  async deleteNode(nodeId) {
    try {
      const response = await fetch(`${this.aiEndpoint}/product-tree/nodes/${nodeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.showMessage('Node deleted successfully!', 'success');
      return result;
    } catch (error) {
      console.error('Delete error:', error);
      this.showMessage(`Delete failed: ${error.message}`, 'error');
      return null;
    }
  }

  // Node selection and editing
  selectNode(nodeId) {
    this.selectedNode = nodeId;
    this.highlightSelectedNode();
    this.showNodeDetails(nodeId);
  }

  highlightSelectedNode() {
    // Remove previous selection
    document.querySelectorAll('.node-item').forEach(node => {
      node.classList.remove('selected');
    });

    // Highlight selected node
    const selectedElement = document.querySelector(`[data-node-id="${this.selectedNode}"]`);
    if (selectedElement) {
      selectedElement.classList.add('selected');
    }
  }

  showNodeDetails(nodeId) {
    const node = this.findNodeById(nodeId);
    if (!node) return;

    const detailsHtml = `
      <div class="node-details">
        <h3>${node.title}</h3>
        <div class="details-grid">
          <div class="detail-item">
            <label>Type:</label>
            <span>${node.type}</span>
          </div>
          <div class="detail-item">
            <label>Status:</label>
            <span>${node.status || 'Not Set'}</span>
          </div>
          <div class="detail-item">
            <label>Priority:</label>
            <span>${node.priority || 'Not Set'}</span>
          </div>
          <div class="detail-item">
            <label>Team:</label>
            <span>${node.team || 'Not Set'}</span>
          </div>
          <div class="detail-item">
            <label>Owner:</label>
            <span>${node.owner || 'Not Set'}</span>
          </div>
          <div class="detail-item">
            <label>Effort:</label>
            <span>${node.effort || 'Not Set'}</span>
          </div>
        </div>
        ${node.description ? `<div class="description"><label>Description:</label><p>${node.description}</p></div>` : ''}
        <div class="node-actions">
          <button onclick="app.editNode('${nodeId}')" class="btn-accent">Edit</button>
          <button onclick="app.deleteNodeConfirm('${nodeId}')" class="btn-danger">Delete</button>
          <button onclick="app.addChildNode('${nodeId}')" class="btn-primary">Add Child</button>
        </div>
      </div>
    `;

    document.getElementById('nodeDetails').innerHTML = detailsHtml;
  }

  findNodeById(nodeId) {
    if (!this.productTree || !this.productTree.nodes) return null;
    return this.productTree.nodes.find(node => node.id === nodeId);
  }

  editNode(nodeId) {
    const node = this.findNodeById(nodeId);
    if (!node) return;

    this.editingNode = nodeId;
    this.showEditForm(node);
  }

  showEditForm(node) {
    const formHtml = `
      <div class="edit-form">
        <h3>Edit Node: ${node.title}</h3>
        <form id="editNodeForm">
          <div class="form-group">
            <label>Title:</label>
            <input type="text" id="editTitle" value="${node.title}" required>
          </div>
          <div class="form-group">
            <label>Type:</label>
            <select id="editType">
              <option value="Product" ${node.type === 'Product' ? 'selected' : ''}>Product</option>
              <option value="Goal" ${node.type === 'Goal' ? 'selected' : ''}>Goal</option>
              <option value="Job" ${node.type === 'Job' ? 'selected' : ''}>Job</option>
              <option value="Work Item" ${node.type === 'Work Item' ? 'selected' : ''}>Work Item</option>
            </select>
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea id="editDescription">${node.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Status:</label>
            <select id="editStatus">
              <option value="Not Started" ${node.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
              <option value="In Progress" ${node.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${node.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="On Hold" ${node.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority:</label>
            <select id="editPriority">
              <option value="Low" ${node.priority === 'Low' ? 'selected' : ''}>Low</option>
              <option value="Medium" ${node.priority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="High" ${node.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Critical" ${node.priority === 'Critical' ? 'selected' : ''}>Critical</option>
            </select>
          </div>
          <div class="form-group">
            <label>Team:</label>
            <input type="text" id="editTeam" value="${node.team || ''}">
          </div>
          <div class="form-group">
            <label>Owner:</label>
            <input type="text" id="editOwner" value="${node.owner || ''}">
          </div>
          <div class="form-group">
            <label>Effort:</label>
            <input type="text" id="editEffort" value="${node.effort || ''}" placeholder="e.g., 5 days, 2 weeks">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Save Changes</button>
            <button type="button" onclick="app.cancelEdit()" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('nodeDetails').innerHTML = formHtml;

    // Add form submit handler
    document.getElementById('editNodeForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveNodeChanges();
    });
  }

  async saveNodeChanges() {
    const updates = {
      title: document.getElementById('editTitle').value,
      type: document.getElementById('editType').value,
      description: document.getElementById('editDescription').value,
      status: document.getElementById('editStatus').value,
      priority: document.getElementById('editPriority').value,
      team: document.getElementById('editTeam').value,
      owner: document.getElementById('editOwner').value,
      effort: document.getElementById('editEffort').value,
    };

    const updatedNode = await this.updateNode(this.editingNode, updates);
    if (updatedNode) {
      // Update the local tree
      const node = this.findNodeById(this.editingNode);
      if (node) {
        Object.assign(node, updates);
        this.renderTree();
        this.showNodeDetails(this.editingNode);
      }
      this.editingNode = null;
    }
  }

  cancelEdit() {
    this.editingNode = null;
    if (this.selectedNode) {
      this.showNodeDetails(this.selectedNode);
    } else {
      document.getElementById('nodeDetails').innerHTML = '<p>Select a node to view details</p>';
    }
  }

  addChildNode(parentId) {
    const parentNode = this.findNodeById(parentId);
    if (!parentNode) return;

    const newNodeId = `node_${Date.now()}`;
    const newNode = {
      id: newNodeId,
      title: 'New Node',
      type: 'Work Item',
      description: '',
      status: 'Not Started',
      priority: 'Medium',
      team: '',
      owner: '',
      effort: '',
      parent_id: parentId,
    };

    // Add to local tree
    if (!this.productTree.nodes) {
      this.productTree.nodes = [];
    }
    this.productTree.nodes.push(newNode);

    // Add edge
    if (!this.productTree.edges) {
      this.productTree.edges = [];
    }
    this.productTree.edges.push({
      from: parentId,
      to: newNodeId,
    });

    this.renderTree();
    this.selectNode(newNodeId);
    this.editNode(newNodeId);
  }

  async deleteNodeConfirm(nodeId) {
    const node = this.findNodeById(nodeId);
    if (!node) return;

    if (confirm(`Are you sure you want to delete "${node.title}"? This action cannot be undone.`)) {
      const result = await this.deleteNode(nodeId);
      if (result) {
        // Remove from local tree
        this.productTree.nodes = this.productTree.nodes.filter(n => n.id !== nodeId);
        this.productTree.edges = this.productTree.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
        
        this.renderTree();
        this.selectedNode = null;
        document.getElementById('nodeDetails').innerHTML = '<p>Select a node to view details</p>';
      }
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ProductTreeManager();
});
