// Knowledge Base View Component
// Check #27 — Knowledge Base (HTML/Markdown Rendering XSS)
// Provides enterprise self-service documentation, technical guides, and policy references.

const KnowledgeBaseView = {
  _articles: [],
  _selectedArticleId: null,
  _activeCategory: 'All',

  async render(currentUser) {
    const user = currentUser || State.user;

    try {
      const res = await State.apiFetch('/api/kb/articles');
      this._articles = res.articles || [];
    } catch (err) {
      console.error('Failed to load KB articles:', err);
      this._articles = [];
    }

    // Default select first article if none selected
    if (!this._selectedArticleId && this._articles.length > 0) {
      this._selectedArticleId = this._articles[0].id;
    }

    return this._buildHTML(user);
  },

  // Markdown rendering pipeline (XSS-07 Processing)
  // Translates markdown markup into HTML while permitting embedded markup.
  renderMarkdown(markdownText) {
    if (!markdownText) return '';
    let html = String(markdownText);

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-on-surface mt-5 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-on-surface mt-6 mb-2 pb-1 border-b border-outline-variant/30">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-on-surface mb-3">$1</h1>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 py-2 my-3 bg-primary-container/20 rounded-r text-on-surface italic">$1</blockquote>');

    // Code blocks & inline code
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="bg-[#1e293b] text-slate-100 p-4 rounded-xl my-3 overflow-x-auto font-mono text-xs shadow-inner"><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/gim, '<code class="bg-surface-container-high text-primary px-1.5 py-0.5 rounded font-mono text-xs font-semibold">$1</code>');

    // Bold & Italics
    html = html.replace(/\*\*([^*]+)\*\*/gim, '<strong class="font-bold text-on-surface">$1</strong>');
    html = html.replace(/\*([^*]+)\*/gim, '<em class="italic">$1</em>');

    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gim, '<a href="$2" class="text-primary hover:text-primary-container font-semibold underline underline-offset-2 transition-colors">$1</a>');

    // List items
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-on-surface-variant my-1">$1</li>');

    // Paragraph double line breaks
    html = html.replace(/\n\n/gim, '</p><p class="my-3 text-on-surface-variant leading-relaxed">');

    // Generated HTML wrapper (Unsafe pipeline output)
    return '<div class="kb-article-prose"><p class="my-3 text-on-surface-variant leading-relaxed">' + html + '</p></div>';
  },

  _buildHTML(user) {
    const categories = ['All', ...new Set(this._articles.map(a => a.category).filter(Boolean))];
    const filteredArticles = this._activeCategory === 'All'
      ? this._articles
      : this._articles.filter(a => a.category === this._activeCategory);

    return `
      <div class="flex flex-col w-full pb-12 max-w-6xl mx-auto" id="kb-view-root">
        <!-- Header Context Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Help &amp; Documentation</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">Enterprise Knowledge Base</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Internal Tier-2
            </span>
          </div>

          <div class="flex items-center gap-3">
            <button
              class="h-[38px] px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-2 font-label-lg text-label-lg shadow-sm shadow-primary/20"
              onclick="KnowledgeBaseView.openDraftModal()"
              type="button"
              id="kb-new-guide-btn"
            >
              <span class="material-symbols-outlined text-[18px]">post_add</span>
              <span>Propose Guide / Article</span>
            </button>
          </div>
        </div>

        <!-- Hero Header -->
        <div class="relative w-full rounded-2xl bg-gradient-to-r from-primary via-primary-container to-surface-container-high p-8 text-on-primary shadow-sm mb-8 overflow-hidden">
          <div class="relative z-10 max-w-2xl">
            <div class="flex items-center gap-2 mb-2 text-primary-fixed">
              <span class="material-symbols-outlined text-[20px]">menu_book</span>
              <span class="text-xs uppercase tracking-wider font-bold">Enterprise Documentation Hub</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg font-bold tracking-tight mb-2">Knowledge Base &amp; Technical Guides</h1>
            <p class="font-body-md text-body-md opacity-90 leading-relaxed">
              Official operating standards, network configurations, credential management protocols, and remote work security policies.
            </p>
          </div>
        </div>

        <!-- Main Layout: Left Sidebar List + Right Article Canvas -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left Column: Categories and Article Cards -->
          <div class="lg:col-span-4 flex flex-col gap-4">
            <!-- Category Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
              ${categories.map(cat => `
                <button
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    this._activeCategory === cat
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }"
                  onclick="KnowledgeBaseView.setCategory('${cat}')"
                >
                  ${cat}
                </button>
              `).join('')}
            </div>

            <!-- Article Cards List -->
            <div class="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1" id="kb-article-list">
              ${filteredArticles.map(a => `
                <div
                  class="p-4 rounded-xl cursor-pointer transition-all border ${
                    this._selectedArticleId === a.id
                      ? 'bg-surface-container-low border-primary/40 shadow-sm ring-1 ring-primary/20'
                      : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low/50'
                  }"
                  onclick="KnowledgeBaseView.selectArticle('${a.id}')"
                  id="kb-card-${a.id}"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-mono text-[11px] font-bold text-primary">${a.id}</span>
                    <span class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">${a.category || 'General'}</span>
                  </div>
                  <h3 class="font-title-md text-title-md font-bold text-on-surface line-clamp-1">${a.title}</h3>
                  <p class="text-xs text-on-surface-variant line-clamp-2 mt-1">${a.summary || ''}</p>
                  <div class="mt-2.5 flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
                    <span>${a.author || 'IT Operations'}</span>
                    <span>Updated ${a.lastUpdated || 'Recent'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right Column: Rendered Article Canvas -->
          <div class="lg:col-span-8">
            <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-8 shadow-sm min-h-[500px]" id="kb-article-display-canvas">
              <div class="flex items-center justify-center h-48 text-on-surface-variant">
                <span class="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Propose / Draft Article Modal -->
        <div id="kb-draft-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-on-surface/40 backdrop-blur-sm">
          <div class="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-primary text-[22px]">post_add</span>
                <h3 class="font-title-md text-title-md font-bold text-on-surface">Propose Documentation Guide</h3>
              </div>
              <button onclick="KnowledgeBaseView.closeDraftModal()" class="text-on-surface-variant hover:text-on-surface p-1 rounded">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Modal Body -->
            <form id="kb-draft-form" onsubmit="KnowledgeBaseView.saveDraftArticle(event)" class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div class="space-y-1">
                <label class="font-label-md text-label-md text-on-surface font-semibold" for="kb-draft-title">Guide Title</label>
                <input id="kb-draft-title" required placeholder="e.g. Workstation Disk Encryption & Recovery Key Protocol" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="font-label-md text-label-md text-on-surface font-semibold" for="kb-draft-category">Category</label>
                  <select id="kb-draft-category" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary">
                    <option value="IT & Infrastructure">IT & Infrastructure</option>
                    <option value="Account Security">Account Security</option>
                    <option value="Internal Policies">Internal Policies</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="font-label-md text-label-md text-on-surface font-semibold" for="kb-draft-summary">Brief Summary</label>
                  <input id="kb-draft-summary" placeholder="One sentence synopsis..." class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-on-surface focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div class="space-y-1">
                <div class="flex items-center justify-between mb-1">
                  <label class="font-label-md text-label-md text-on-surface font-semibold" for="kb-draft-content">Article Content (Markdown Supported)</label>
                  <div class="flex items-center gap-2">
                    <button type="button" class="text-xs font-semibold text-primary hover:underline" onclick="KnowledgeBaseView.togglePreviewTab(false)">Editor</button>
                    <span class="text-outline-variant text-xs">•</span>
                    <button type="button" class="text-xs font-semibold text-primary hover:underline" onclick="KnowledgeBaseView.togglePreviewTab(true)">Live Markdown Preview</button>
                  </div>
                </div>

                <div id="kb-editor-pane">
                  <textarea id="kb-draft-content" rows="8" required class="w-full px-3 py-2 rounded-lg border border-outline-variant/50 font-mono text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="# Guide Heading&#10;&#10;Explain instructions here...&#10;- Step 1&#10;- Step 2"></textarea>
                  <p class="text-[11px] text-on-surface-variant mt-1">Supports Markdown headers (#, ##), bold, italics, links, blockquotes, lists, and code blocks.</p>
                </div>

                <div id="kb-preview-pane" class="hidden p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 min-h-[160px] max-h-60 overflow-y-auto">
                  <div id="kb-preview-content"></div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <span class="text-xs text-on-surface-variant">Changes will be submitted for enterprise documentation sync.</span>
                <div class="flex items-center gap-2">
                  <button type="button" onclick="KnowledgeBaseView.closeDraftModal()" class="h-9 px-4 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors">
                    Cancel
                  </button>
                  <button type="submit" class="h-9 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm">
                    Publish Guide
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  async selectArticle(articleId) {
    this._selectedArticleId = articleId;
    const canvas = document.getElementById('kb-article-display-canvas');
    if (!canvas) return;

    // Update active highlight on left list
    document.querySelectorAll('[id^="kb-card-"]').forEach(el => {
      el.classList.remove('bg-surface-container-low', 'border-primary/40', 'shadow-sm', 'ring-1', 'ring-primary/20');
      el.classList.add('bg-surface-container-lowest', 'border-outline-variant/30');
    });
    const activeCard = document.getElementById(`kb-card-${articleId}`);
    if (activeCard) {
      activeCard.classList.remove('bg-surface-container-lowest', 'border-outline-variant/30');
      activeCard.classList.add('bg-surface-container-low', 'border-primary/40', 'shadow-sm', 'ring-1', 'ring-primary/20');
    }

    try {
      const res = await State.apiFetch(`/api/kb/articles/${articleId}`);
      const article = res.article;
      if (!article) throw new Error('Article not found');

      // Processing: convert article.content through the Markdown pipeline
      const renderedHtml = this.renderMarkdown(article.content);

      // Sink: dynamic innerHTML injection of rendered markdown output
      canvas.innerHTML = `
        <div class="space-y-4">
          <!-- Article Metadata Header -->
          <div class="border-b border-outline-variant/20 pb-4 mb-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">${article.id}</span>
              <span class="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px] font-semibold">${article.category || 'Documentation'}</span>
            </div>
            <h2 class="font-headline-md text-headline-md font-bold text-on-surface">${article.title}</h2>
            <div class="flex items-center gap-4 text-xs text-on-surface-variant mt-2">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">person</span>
                ${article.author || 'Author'}
              </span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">schedule</span>
                Last revised ${article.lastUpdated || 'Recently'}
              </span>
            </div>
          </div>

          <!-- Executable Rendered Body (Sink) -->
          <div id="kb-rendered-body" class="prose max-w-none">
            ${renderedHtml}
          </div>
        </div>
      `;
    } catch (err) {
      canvas.innerHTML = `
        <div class="text-center py-12 text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
          <p class="font-semibold text-sm text-on-surface">Failed to load article</p>
          <p class="text-xs mt-1">${err.message}</p>
        </div>
      `;
    }
  },

  setCategory(category) {
    this._activeCategory = category;
    AppRouter.renderCurrentRoute();
  },

  openDraftModal() {
    const modal = document.getElementById('kb-draft-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeDraftModal() {
    const modal = document.getElementById('kb-draft-modal');
    if (modal) modal.classList.add('hidden');
  },

  togglePreviewTab(showPreview) {
    const editor = document.getElementById('kb-editor-pane');
    const preview = document.getElementById('kb-preview-pane');
    const previewContent = document.getElementById('kb-preview-content');
    const contentInput = document.getElementById('kb-draft-content');

    if (showPreview) {
      if (editor) editor.classList.add('hidden');
      if (preview) preview.classList.remove('hidden');
      if (previewContent && contentInput) {
        // Render current textarea content through markdown processor into preview sink
        previewContent.innerHTML = this.renderMarkdown(contentInput.value);
      }
    } else {
      if (preview) preview.classList.add('hidden');
      if (editor) editor.classList.remove('hidden');
    }
  },

  async saveDraftArticle(event) {
    event.preventDefault();
    const title = document.getElementById('kb-draft-title').value;
    const category = document.getElementById('kb-draft-category').value;
    const summary = document.getElementById('kb-draft-summary').value;
    const content = document.getElementById('kb-draft-content').value;

    try {
      const res = await State.apiFetch('/api/kb/articles', {
        method: 'POST',
        body: JSON.stringify({ title, category, summary, content })
      });

      this.closeDraftModal();
      State.showToast('Knowledge base article published', 'check_circle');
      this._selectedArticleId = res.article.id;
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message || 'Failed to publish guide', 'error');
    }
  }
};

window.KnowledgeBaseView = KnowledgeBaseView;
