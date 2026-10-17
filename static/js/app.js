/* ScopeSaathi AI frontend. No external scripts, fonts, or network services are used. */
(() => {
  'use strict';

  const HISTORY_KEY = 'scopesaathi_history_v1';
  const state = {
    page: 'home',
    status: null,
    analysis: null,
    currentBrief: '',
    currentMeta: { role: 'Web developer', project_type: 'Website Development', language: 'Simple English' },
    currentId: null,
    history: readHistory(),
    settingsTab: 'model',
    errorMessage: ''
  };

  const viewRoot = document.getElementById('view-root');
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function readHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function persistHistory() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history)); }
    catch (_) { showToast('Browser storage is full. Export or clear some history.', 'error'); }
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    try { return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch (_) { return 'Saved analysis'; }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function pageLabel(page) {
    return ({ home: 'Home', new: 'New Analysis', results: 'Analysis Results', followup: 'Follow-up Message', history: 'History', settings: 'Settings', about: 'About ScopeSaathi' })[page] || 'Home';
  }

  function navigate(page) {
    state.page = page;
    state.errorMessage = '';
    render();
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function render() {
    document.getElementById('current-section').textContent = pageLabel(state.page);
    document.querySelectorAll('.nav-item[data-page]').forEach((button) => {
      button.classList.toggle('active', button.dataset.page === state.page || (state.page === 'results' && button.dataset.page === 'new') || (state.page === 'followup' && button.dataset.page === 'new'));
    });
    switch (state.page) {
      case 'new': viewRoot.innerHTML = renderNewAnalysis(); break;
      case 'results': viewRoot.innerHTML = renderResults(); break;
      case 'followup': viewRoot.innerHTML = renderFollowup(); break;
      case 'history': viewRoot.innerHTML = renderHistory(); break;
      case 'settings': viewRoot.innerHTML = renderSettings(); break;
      case 'about': viewRoot.innerHTML = renderAbout(); break;
      default: viewRoot.innerHTML = renderHome();
    }
    if (state.page === 'new') updateCharCount();
  }

  function getRiskCount() {
    return state.history.reduce((total, item) => total + ((item.analysis && Array.isArray(item.analysis.risks)) ? item.analysis.risks.length : 0), 0);
  }

  function renderHome() {
    const recent = state.history.slice(0, 3);
    const cloudMode = !!(state.status && state.status.ai_provider === 'openrouter');
    const aiReady = !!(state.status && state.status.ai_connected);
    return `
      <section class="hero">
        <div class="hero-copy-wrap">
          <span class="eyebrow">✦&nbsp; YOUR LOCAL-FIRST AI WORKSPACE</span>
          <h1>Turn client messages<br>into <span class="gradient-text">clear plans.</span></h1>
          <p>ScopeSaathi AI helps freelancers understand project requirements, spot missing details, identify potential risks, and ask better questions before saying yes to a project.</p>
          <div class="hero-actions">
            <button class="btn btn-primary" data-page="new">Start analysing <span>↗</span></button>
            <button class="btn btn-secondary" data-page="about">See how it works</button>
          </div>
          <div class="hero-trust"><span><b>✦</b> AI-powered insights</span><span><b>⌁</b> ${cloudMode ? 'Online AI via OpenRouter' : 'Runs on your device'}</span><span><b>▣</b> ${cloudMode ? 'Review provider privacy' : 'Private by design'}</span></div>
        </div>
        <img class="hero-art" src="/static/images/hero-workspace.webp" alt="Illustration of an independent freelancer using a laptop">
      </section>
      <section class="stat-grid" aria-label="Workspace overview">
        <div class="stat-card"><div class="stat-icon icon-blue">⌕</div><div class="stat-meta"><div class="stat-value">${state.history.length}</div><div class="stat-label">Analyses saved on this device</div></div></div>
        <div class="stat-card"><div class="stat-icon icon-green">✓</div><div class="stat-meta"><div class="stat-value">${getRiskCount()}</div><div class="stat-label">Potential risks spotted</div></div></div>
        <div class="stat-card"><div class="stat-icon icon-purple">☷</div><div class="stat-meta"><div class="stat-value">${state.history.reduce((n, h) => n + ((h.analysis && h.analysis.suggested_questions) || []).length, 0)}</div><div class="stat-label">Questions prepared</div></div></div>
        <div class="stat-card"><div class="stat-icon icon-amber">⌁</div><div class="stat-meta"><div class="stat-value">${aiReady ? (cloudMode ? 'Online' : 'Live') : 'Offline'}</div><div class="stat-label">AI connection mode</div></div></div>
      </section>
      <div class="section-header"><div><h2 class="section-title">Your project clarity toolkit</h2><p class="section-subtitle">Small tools to help you start client work with confidence.</p></div><span class="muted small">MADE FOR FREELANCERS</span></div>
      <section class="feature-grid">
        <article class="feature-card" data-page="new" tabindex="0" role="button"><div class="feature-icon icon-blue">⌕</div><div class="feature-title">Analyse a client message</div><div class="feature-copy">Turn a rough brief into clear, organised project requirements.</div></article>
        <article class="feature-card" data-page="new" tabindex="0" role="button"><div class="feature-icon icon-amber">?</div><div class="feature-title">Find missing details</div><div class="feature-copy">Discover the important questions to ask before starting.</div></article>
        <article class="feature-card" data-page="new" tabindex="0" role="button"><div class="feature-icon" style="background:#ffe9ed;color:#d95b70">♢</div><div class="feature-title">Spot project risks</div><div class="feature-copy">Notice vague deadlines, unlimited revisions, or unclear scope.</div></article>
        <article class="feature-card" data-page="new" tabindex="0" role="button"><div class="feature-icon icon-purple">▤</div><div class="feature-title">Prepare a follow-up</div><div class="feature-copy">Create a professional message you can edit and send.</div></article>
      </section>
      <section class="home-bottom-grid">
        <div class="panel activity-panel">
          <div class="section-header" style="margin:0"><div><h2 class="section-title">Recent activity</h2><p class="section-subtitle">Your saved analyses stay in this browser.</p></div><button class="btn btn-secondary" data-page="history">View history ↗</button></div>
          ${recent.length ? `<div class="activity-list">${recent.map((item) => `
            <div class="activity-item" data-action="view-history" data-id="${esc(item.id)}" tabindex="0" role="button"><div class="activity-icon">▤</div><div class="activity-text"><strong>${esc(item.title || 'Client project')}</strong><small>${esc(item.project_type || 'Project')} · ${esc(item.analysis && item.analysis.risk_level ? item.analysis.risk_level + ' risk' : 'Analysis saved')}</small></div><span class="activity-time">${esc(formatDate(item.saved_at))} &nbsp;›</span></div>`).join('')}</div>` : `<div class="empty-state" style="padding:27px 12px"><div class="empty-art">▤</div><h3>Your workspace starts here</h3><p>Run your first analysis and it will appear here once you save it.</p><button class="btn btn-primary" data-page="new">Create first analysis ↗</button></div>`}
        </div>
        <div class="panel tip-panel"><div class="tip-graphic">✦</div><div><h3>Be prepared. Work smarter.</h3><p>Clear questions today can prevent confusion tomorrow. Confirm scope, deadline, revisions, and final deliverables before work begins.</p><button class="btn btn-soft" style="margin-top:13px" data-page="about">Explore the workflow ↗</button></div></div>
      </section>`;
  }

  function renderNewAnalysis() {
    const brief = state.currentBrief || '';
    const role = state.currentMeta.role || 'Web developer';
    const type = state.currentMeta.project_type || 'Website Development';
    const language = state.currentMeta.language || 'Simple English';
    return `
      <div class="page-heading-row"><div><span class="eyebrow">✦&nbsp; ANALYSIS WORKSPACE</span><h1 class="page-title">Let's clarify the project.</h1><p class="page-subtitle">Paste the message your client sent you. ${state.status && state.status.ai_provider === 'openrouter' ? 'OpenRouter AI will separate confirmed details from missing information and potential risks.' : 'Your local AI will separate confirmed details from missing information and potential risks.'}</p></div><button class="btn btn-secondary" data-page="history">◷ &nbsp; Past analyses</button></div>
      <div class="form-layout">
        <section class="panel form-panel">
          <div class="field-label"><label for="client-brief">Client message <span style="color:#ee7484">*</span></label><span class="optional">Keep personal details out</span></div>
          <textarea id="client-brief" name="brief" maxlength="10000" placeholder="Example: Hi, I need a website for my cafe with 5 pages and a premium look. I'd like it finished quickly. I want changes until I'm happy. Please also add online ordering if possible…">${esc(brief)}</textarea>
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:7px"><p class="field-help" style="margin:0">Paste only the project details needed for analysis. Do not include passwords or sensitive personal information.</p><span class="char-count" id="char-count">${brief.length}/10,000</span></div>
          <div class="form-two-col">
            <div class="form-field"><label class="field-label" for="project-type">Project type</label><select id="project-type"><option ${type === 'Website Development' ? 'selected' : ''}>Website Development</option><option ${type === 'Graphic Design' ? 'selected' : ''}>Graphic Design</option><option ${type === 'Video Editing' ? 'selected' : ''}>Video Editing</option><option ${type === 'Mobile App' ? 'selected' : ''}>Mobile App</option><option ${type === 'Content Writing' ? 'selected' : ''}>Content Writing</option><option ${type === 'Other / General' ? 'selected' : ''}>Other / General</option></select></div>
            <div class="form-field"><label class="field-label" for="freelancer-role">Your role</label><select id="freelancer-role"><option ${role === 'Web developer' ? 'selected' : ''}>Web developer</option><option ${role === 'Graphic designer' ? 'selected' : ''}>Graphic designer</option><option ${role === 'Video editor' ? 'selected' : ''}>Video editor</option><option ${role === 'App developer' ? 'selected' : ''}>App developer</option><option ${role === 'Content writer' ? 'selected' : ''}>Content writer</option><option ${role === 'Other freelancer' ? 'selected' : ''}>Other freelancer</option></select></div>
            <div class="form-field"><label class="field-label" for="output-language">Output language</label><select id="output-language"><option ${language === 'Simple English' ? 'selected' : ''}>Simple English</option><option ${language === 'Gujarati' ? 'selected' : ''}>Gujarati</option><option ${language === 'Hindi' ? 'selected' : ''}>Hindi</option><option ${language === 'Gujarati-English mix' ? 'selected' : ''}>Gujarati-English mix</option></select></div>
            <div class="form-field"><label class="field-label" for="analysis-style">Analysis style</label><select id="analysis-style"><option>Clear and practical</option><option>Extra detailed</option></select><p class="field-help">This prototype focuses on actionable suggestions, not legal advice.</p></div>
          </div>
          <div id="analysis-error">${state.errorMessage ? `<div class="error-inline">${esc(state.errorMessage)}</div>` : ''}</div>
          <div class="form-foot"><span class="char-count">🔒 &nbsp; ${state.status && state.status.ai_provider === 'openrouter' ? 'Sent to OpenRouter for analysis' : 'Sent only to your local AI server'}</span><button class="btn btn-primary" id="analyze-submit" data-action="analyze">Analyse with ${state.status && state.status.ai_provider === 'openrouter' ? 'OpenRouter AI' : 'local AI'} <span>↗</span></button></div>
        </section>
        <aside class="panel form-aside">
          <div class="aside-heading"><span class="aside-icon">✦</span> What you'll get</div>
          <div class="step-row"><span class="step-num">01</span><div><strong>Confirmed requirements</strong><p>What the client has explicitly requested.</p></div></div>
          <div class="step-row"><span class="step-num">02</span><div><strong>Missing information</strong><p>Details to clarify before you estimate time or cost.</p></div></div>
          <div class="step-row"><span class="step-num">03</span><div><strong>Potential risks</strong><p>Vague expectations, deadlines, revisions, and scope.</p></div></div>
          <div class="step-row"><span class="step-num">04</span><div><strong>Ready-to-use questions</strong><p>Useful questions and a professional follow-up draft.</p></div></div>
          <div class="aside-note"><strong>Privacy first</strong><br>${state.status && state.status.ai_provider === 'openrouter' ? 'Cloud mode sends your message to OpenRouter and its selected model provider. Do not enter confidential client details unless you have permission.' : 'Your message stays on your device when connected to the local model. Check the green local AI status before using real client briefs.'}</div>
          <button class="btn btn-secondary btn-full" style="margin-top:14px" data-action="use-example">Try an example message</button>
        </aside>
      </div>`;
  }

  function renderList(items, emptyText) {
    if (!Array.isArray(items) || !items.length) return `<div class="empty-list">${esc(emptyText || 'No items returned. Review the original message before deciding.')}</div>`;
    return `<ul class="result-list">${items.map((item) => `<li><span class="list-dot"></span><span>${esc(item)}</span></li>`).join('')}</ul>`;
  }

  function renderResults() {
    if (!state.analysis) return `<div class="panel empty-state"><div class="empty-art">⌕</div><h3>No analysis yet</h3><p>Start with a client message to see the results here.</p><button class="btn btn-primary" data-page="new">Start a new analysis</button></div>`;
    const a = state.analysis;
    const riskClass = a.risk_level === 'High' ? 'risk-high' : a.risk_level === 'Low' ? 'risk-low' : 'risk-medium';
    return `
      <div class="page-heading-row"><div><span class="eyebrow">✓&nbsp; ANALYSIS COMPLETE</span><h1 class="page-title">Your project clarity report.</h1><p class="page-subtitle">Review what is confirmed, what is missing, and what you should ask before you commit to the work.</p></div><button class="btn btn-secondary" data-page="new">＋ &nbsp; New analysis</button></div>
      <section class="summary-banner"><div class="summary-mark">✓</div><div class="summary-body"><div class="summary-title-row"><strong>Overall summary</strong><span class="risk-pill ${riskClass}">● ${esc(a.risk_level || 'Medium')} risk</span></div><p>${esc(a.summary || 'Review each section below before agreeing to the project.')}</p></div></section>
      <section class="results-grid">
        <article class="panel result-card confirmed"><div class="result-head"><span class="result-icon">✓</span><div><strong>Clearly mentioned</strong><small>Facts found in the client message</small></div></div>${renderList(a.confirmed_requirements, 'No explicit requirements were extracted.')}</article>
        <article class="panel result-card missing"><div class="result-head"><span class="result-icon">?</span><div><strong>Missing information</strong><small>Details to confirm</small></div></div>${renderList(a.missing_information, 'No missing details were returned. Verify this manually.')}</article>
        <article class="panel result-card risks"><div class="result-head"><span class="result-icon">♢</span><div><strong>Potential risks</strong><small>Items that could cause confusion</small></div></div>${renderList(a.risks, 'No risks were returned. Still confirm deadlines and scope.')}</article>
        <article class="panel result-card questions"><div class="result-head"><span class="result-icon">▤</span><div><strong>Suggested questions</strong><small>Ask your client before starting</small></div></div>${renderList(a.suggested_questions, 'No questions were returned. Add your own if anything is unclear.')}</article>
        <article class="panel result-card checklist" style="grid-column:1/-1"><div class="result-head"><span class="result-icon">☑</span><div><strong>Before-you-start checklist</strong><small>Useful points to confirm before accepting the project</small></div></div>${renderList(a.checklist, 'Confirm deliverables, timeline, budget, revisions, and acceptance criteria.')}</article>
      </section>
      <div class="results-actions"><button class="btn btn-secondary" data-action="save-history">▣ &nbsp; Save to history</button><button class="btn btn-secondary" data-action="download-report">↓ &nbsp; Download report</button><button class="btn btn-primary" data-action="go-followup">Create follow-up message ↗</button></div>`;
  }

  function makeFollowupMessage() {
    const a = state.analysis || {};
    const questions = Array.isArray(a.suggested_questions) ? a.suggested_questions.slice(0, 6) : [];
    const lines = [
      'Hi,',
      '',
      'Thanks for sharing the project details. I want to make sure I understand your expectations correctly before I confirm the scope and timeline. Could you please clarify a few points?',
      ''
    ];
    if (questions.length) questions.forEach((q, index) => lines.push(`${index + 1}. ${q}`));
    else lines.push('1. Could you confirm the exact deliverables, deadline, budget, and revision limits?');
    lines.push('', 'Once these details are clear, I can suggest a realistic plan for the project.', '', 'Best regards,', '[Your Name]');
    return lines.join('\n');
  }

  function renderFollowup() {
    if (!state.analysis) return `<div class="panel empty-state"><div class="empty-art">▤</div><h3>Nothing to draft yet</h3><p>Analyse a client message first, then generate a message based on the findings.</p><button class="btn btn-primary" data-page="new">Start an analysis</button></div>`;
    const defaultMessage = makeFollowupMessage();
    return `
      <div class="page-heading-row"><div><span class="eyebrow">✉&nbsp; CLIENT COMMUNICATION</span><h1 class="page-title">Let's ask the right questions.</h1><p class="page-subtitle">A professional draft based on your analysis. Edit it to match your voice before copying it to your client.</p></div><button class="btn btn-secondary" data-page="results">← &nbsp; Back to results</button></div>
      <div class="message-layout"><section class="panel message-panel"><div class="section-header" style="margin:0 0 14px"><div><h2 class="section-title">Your follow-up message</h2><p class="section-subtitle">The draft is editable. Nothing is sent automatically.</p></div><span class="status-badge">EDITABLE</span></div><textarea id="followup-message" class="message-paper" aria-label="Editable follow-up message">${esc(defaultMessage)}</textarea><div class="results-actions" style="margin-top:13px"><button class="btn btn-secondary" data-action="reset-followup">Reset draft</button><button class="btn btn-secondary" data-action="download-followup">↓ Download .txt</button><button class="btn btn-primary" data-action="copy-followup">▣ Copy message</button></div></section>
      <aside class="panel form-aside"><div class="aside-heading"><span class="aside-icon" style="background:#e6f8f1;color:#1c9b76">✓</span> Before you send</div><div class="tips-list"><div class="tip-row"><span class="tip-check">✓</span><span>Check that every question is relevant to the client’s actual request.</span></div><div class="tip-row"><span class="tip-check">✓</span><span>Add any estimate or deadline only after you have enough information.</span></div><div class="tip-row"><span class="tip-check">✓</span><span>Keep the tone polite, clear, and specific. Remove questions you already know the answer to.</span></div><div class="tip-row"><span class="tip-check">✓</span><span>Read the draft once before sending. ScopeSaathi will never send it on your behalf.</span></div></div><div class="aside-note" style="margin-top:22px"><strong>Based on your report</strong><br>${esc((state.analysis.suggested_questions || []).length)} suggested question(s) were found in your analysis.</div></aside></div>`;
  }

  function renderHistory() {
    const entries = state.history;
    return `
      <div class="page-heading-row"><div><span class="eyebrow">◷&nbsp; YOUR WORKSPACE</span><h1 class="page-title">Analysis history.</h1><p class="page-subtitle">Your saved reports are stored in this browser on this device. They are not uploaded to a cloud account.</p></div><button class="btn btn-primary" data-page="new">＋ &nbsp; New analysis</button></div>
      <div class="history-toolbar"><div class="searchbox"><span>⌕</span><input type="text" id="history-search" placeholder="Search saved projects…" aria-label="Search saved projects"></div><div style="display:flex;gap:8px"><button class="btn btn-secondary" data-action="export-history" ${entries.length ? '' : 'disabled'}>↓ Export JSON</button><button class="btn btn-danger" data-action="clear-history" ${entries.length ? '' : 'disabled'}>Clear history</button></div></div>
      <div id="history-results" class="history-list">${renderHistoryRows(entries)}</div>`;
  }

  function renderHistoryRows(entries) {
    if (!entries.length) return `<div class="panel empty-state"><div class="empty-art">◷</div><h3>No saved analyses yet</h3><p>After you analyse a client message, save the report to keep it here for later.</p><button class="btn btn-primary" data-page="new">Create your first report ↗</button></div>`;
    return entries.map((item) => `
      <article class="history-row"><div class="history-icon">▤</div><div class="history-main"><strong>${esc(item.title || 'Client project')}</strong><p>${esc(item.project_type || 'General project')} · ${esc((item.brief || '').slice(0, 105))}${(item.brief || '').length > 105 ? '…' : ''}</p><span class="history-badge">${esc(item.analysis && item.analysis.risk_level ? item.analysis.risk_level + ' risk' : 'Saved report')}</span></div><div class="history-meta">${esc(formatDate(item.saved_at))}</div><div class="history-actions"><button class="btn btn-secondary" data-action="view-history" data-id="${esc(item.id)}">Open ↗</button><button class="btn btn-secondary" title="Delete report" data-action="delete-history" data-id="${esc(item.id)}">×</button></div></article>`).join('');
  }

  function renderSettings() {
    const s = state.status || {};
    const cloudMode = s.ai_provider === 'openrouter';
    const connected = !!s.ai_connected;
    const modelReady = !!s.model_file_found;
    const serverReady = !!s.llama_server_found;
    const tab = state.settingsTab;
    let body = '';
    if (tab === 'model') {
      if (cloudMode) {
        body = `<div class="setting-card"><div class="setting-card-head"><span class="aside-icon" style="background:${connected ? '#e2f8ee' : '#fff2d8'};color:${connected ? '#1d9b74' : '#b98220'}">◉</span><strong>OpenRouter AI</strong><span class="status-badge ${connected ? '' : 'warn'}" style="margin-left:auto">${connected ? 'API KEY CONFIGURED' : 'API KEY MISSING'}</span></div><div class="setting-value"><b>Provider:</b> OpenRouter<br><b>Model route:</b> ${esc(s.model_name || 'openrouter/free')}<br><b>Endpoint:</b> OpenRouter cloud API<br><b>Processing:</b> Remote server (internet required)</div><div class="setting-badges"><span class="status-badge ${connected ? '' : 'warn'}">${connected ? '✓ Environment key found' : '○ Add OPENROUTER_API_KEY in Render'}</span><span class="status-badge">Never expose API keys in frontend code</span></div></div><div class="setting-card"><div class="setting-card-head"><strong>Connection check</strong><button class="btn btn-secondary" style="margin-left:auto;padding:7px 10px" data-action="refresh-status">↻ Refresh</button></div><div class="setting-value">${connected ? 'The API key is configured. A real provider request is tested when you run an analysis.' : 'Add OPENROUTER_API_KEY in the Render Environment settings, then redeploy.'}</div></div>`;
      } else {
        body = `<div class="setting-card"><div class="setting-card-head"><span class="aside-icon" style="background:${connected ? '#e2f8ee' : '#fff2d8'};color:${connected ? '#1d9b74' : '#b98220'}">◉</span><strong>Local AI model</strong><span class="status-badge ${connected ? '' : 'warn'}" style="margin-left:auto">${connected ? 'CONNECTED' : 'NOT CONNECTED'}</span></div><div class="setting-value"><b>Model:</b> ${esc(s.model_name || 'Qwen3.5 0.8B Q4_0')}<br><b>Runtime:</b> llama.cpp local server<br><b>Endpoint:</b> 127.0.0.1:8080<br><b>Processing:</b> This device only</div><div class="setting-badges"><span class="status-badge ${modelReady ? '' : 'warn'}">${modelReady ? '✓ Model file found' : '○ Model file missing'}</span><span class="status-badge ${serverReady ? '' : 'warn'}">${serverReady ? '✓ llama-server found' : '○ llama-server not found'}</span></div></div><div class="setting-card"><div class="setting-card-head"><strong>Connection check</strong><button class="btn btn-secondary" style="margin-left:auto;padding:7px 10px" data-action="refresh-status">↻ Refresh</button></div><div class="setting-value">${connected ? 'Your local model endpoint responded successfully. You can run an analysis.' : 'The interface can open without the model, but AI analysis will not work until llama.cpp and the model file are installed.'}</div></div>`;
      }
    } else if (tab === 'app') {
      body = `<div class="setting-card"><div class="setting-card-head"><strong>Application data</strong></div><div class="setting-value">Saved analysis count: ${state.history.length}<br>Storage: browser localStorage on this device<br>${cloudMode ? 'Analysis messages are sent to OpenRouter for inference; your saved history remains in this browser.' : 'Frontend calls this local app only. AI requests go to 127.0.0.1:8080.'}</div><div class="setting-badges"><span class="status-badge">✓ No analytics SDK</span><span class="status-badge">${cloudMode ? 'Online inference' : 'Local inference'}</span></div></div>`;
    } else {
      body = `<div class="setting-card"><div class="setting-card-head"><strong>Appearance</strong></div><div class="setting-value">ScopeSaathi uses a navy, blue, and violet interface with a responsive layout. ${cloudMode ? 'The public cloud version requires an internet connection for AI requests.' : 'Assets are stored locally, so the interface and local inference can work offline after setup.'}</div></div>`;
    }
    const privacyTitle = cloudMode ? 'Data goes to cloud AI' : 'Private by design';
    const privacyCopy = cloudMode
      ? 'Cloud mode sends the client message to OpenRouter and the selected model provider. Avoid confidential or personally identifiable client information unless you have permission.'
      : 'ScopeSaathi keeps client messages on your laptop by using a local model rather than a hosted AI API.';
    const checks = cloudMode
      ? '<div class="checkline"><b>✓</b><span>The API key is stored as a Render environment variable, not in browser JavaScript.</span></div><div class="checkline"><b>•</b><span>AI analysis needs an internet connection and may be subject to model limits.</span></div><div class="checkline"><b>✓</b><span>Saved history stays in your browser storage.</span></div>'
      : '<div class="checkline"><b>✓</b><span>AI requests go to the localhost model server.</span></div><div class="checkline"><b>✓</b><span>History stays in your browser storage.</span></div><div class="checkline"><b>•</b><span>First-time model, runtime, and Python package downloads need internet.</span></div>';
    const note = cloudMode ? 'Internet is required for analysis in the Render-hosted version.' : 'Turn Wi-Fi off only after the model file, llama.cpp runtime, and Python packages have been installed.';
    return `
      <div class="page-heading-row"><div><span class="eyebrow">⚙&nbsp; WORKSPACE PREFERENCES</span><h1 class="page-title">Settings & ${cloudMode ? 'OpenRouter AI' : 'local AI'}.</h1><p class="page-subtitle">Check the AI provider and understand where your project briefs are processed.</p></div><button class="btn btn-secondary" data-page="about">About this app</button></div>
      <div class="settings-layout"><section class="panel panel-pad"><div class="settings-tabs"><button class="settings-tab ${tab === 'model' ? 'active' : ''}" data-action="settings-tab" data-tab="model">AI provider</button><button class="settings-tab ${tab === 'app' ? 'active' : ''}" data-action="settings-tab" data-tab="app">Application</button><button class="settings-tab ${tab === 'appearance' ? 'active' : ''}" data-action="settings-tab" data-tab="appearance">Appearance</button></div><h2 class="section-title">${tab === 'model' ? 'AI connection' : tab === 'app' ? 'Application information' : 'Interface preferences'}</h2><p class="section-subtitle">Status is based on server-side configuration.</p>${body}</section>
      <aside class="panel form-aside"><div class="aside-heading"><span class="aside-icon">⌑</span> ${privacyTitle}</div><p class="field-help" style="font-size:11px;margin:0 0 13px">${privacyCopy}</p><div class="checklist-small">${checks}</div><div class="aside-note"><strong>Mode note</strong><br>${note}</div></aside></div>`;
  }

  function renderAbout() {
    const cloudMode = !!(state.status && state.status.ai_provider === 'openrouter');
    return `
      <div class="page-heading-row"><div><span class="eyebrow">✦&nbsp; ABOUT THE PROJECT</span><h1 class="page-title">Clearer scope. Better projects.</h1><p class="page-subtitle">${state.status && state.status.ai_provider === 'openrouter' ? 'An AI assistant for freelancers who want to set clearer expectations with clients.' : 'A local-first AI assistant built for freelancers who want to set clearer expectations with clients.'}</p></div><button class="btn btn-primary" data-page="new">Try an analysis ↗</button></div>
      <section class="about-hero"><img src="/static/images/logo.svg" alt="ScopeSaathi AI logo"><div><h2>Meet ScopeSaathi AI</h2><p>Client messages can leave important details unclear. ScopeSaathi helps you review a brief, separate confirmed requirements from assumptions, spot potential scope risks, and prepare the questions you need before accepting the work.</p></div></section>
      <section class="about-grid"><article class="panel about-card"><div class="feature-icon icon-blue">⌕</div><h3>Understand the brief</h3><p>Organise the details a client has actually mentioned, without treating assumptions as facts.</p></article><article class="panel about-card"><div class="feature-icon icon-amber">♢</div><h3>Ask before agreeing</h3><p>Identify missing deliverables, unclear deadlines, and revision expectations that need confirmation.</p></article><article class="panel about-card"><div class="feature-icon icon-green">⌑</div><h3>${cloudMode ? 'Understand data flow' : 'Keep work private'}</h3><p>${cloudMode ? 'Use a hosted model through OpenRouter. Internet is needed for each analysis, and the selected provider processes the submitted message.' : 'Use an open-weight model through llama.cpp on your own device. Once installed, the local workflow can operate without internet.'}</p></article></section>
      <section class="panel panel-pad" style="margin-top:15px"><h2 class="section-title">How it works</h2><div class="step-row"><span class="step-num">01</span><div><strong>Paste the client message</strong><p>Add the relevant brief, select your role and preferred language.</p></div></div><div class="step-row"><span class="step-num">02</span><div><strong>Review the AI report</strong><p>Check requirements, missing information, risks, and suggested questions. Always verify model suggestions.</p></div></div><div class="step-row"><span class="step-num">03</span><div><strong>Prepare your follow-up</strong><p>Edit, copy, or download a question message. ScopeSaathi does not send messages for you.</p></div></div><div class="aside-note"><strong>Open innovation</strong><br>The application code is MIT-licensed. ${cloudMode ? 'This hosted demo calls OpenRouter and requires internet; free model availability and rate limits can change.' : 'The local inference path can work without a hosted AI API after setup, but still uses your computer’s hardware and electricity.'}</div></section>`;
  }

  function updateCharCount() {
    const input = document.getElementById('client-brief');
    const counter = document.getElementById('char-count');
    if (input && counter) counter.textContent = `${input.value.length.toLocaleString()}/10,000`;
  }

  async function refreshStatus() {
    try {
      const response = await fetch('/api/status', { cache: 'no-store' });
      state.status = await response.json();
    } catch (_) {
      state.status = { ai_provider: 'local', ai_connected: false, local_ai_connected: false, model_file_found: false, llama_server_found: false, model_name: 'AI status unavailable' };
    }
    const cloudMode = !!(state.status && state.status.ai_provider === 'openrouter');
    const connected = !!(state.status && (state.status.ai_connected !== undefined ? state.status.ai_connected : state.status.local_ai_connected));
    const dotClass = connected ? 'is-connected' : 'is-offline';
    const title = cloudMode ? (connected ? 'OpenRouter configured' : 'OpenRouter key missing') : (connected ? 'Local AI connected' : 'Local AI not connected');
    const copy = cloudMode ? (connected ? 'Online AI configured; internet is required.' : 'Add the OpenRouter API key in Render settings.') : (connected ? 'Ready for private on-device analysis.' : 'Set up the local model to enable analysis.');
    ['side-status-dot', 'top-status-dot'].forEach((id) => {
      const dot = document.getElementById(id);
      if (dot) dot.className = `status-dot ${dotClass}`;
    });
    const sideTitle = document.getElementById('side-status-title');
    const sideCopy = document.getElementById('side-status-copy');
    const topText = document.getElementById('top-status-text');
    if (sideTitle) sideTitle.textContent = title;
    if (sideCopy) sideCopy.textContent = copy;
    if (topText) topText.textContent = title;
    const pill = document.getElementById('connection-pill');
    if (pill) pill.title = state.status.privacy || 'Local AI status';
    if (state.page === 'settings' || state.page === 'home' || state.page === 'about') render();
  }

  async function runAnalysis() {
    const briefInput = document.getElementById('client-brief');
    const brief = briefInput ? briefInput.value.trim() : '';
    const errorBox = document.getElementById('analysis-error');
    if (brief.length < 15) {
      if (errorBox) errorBox.innerHTML = '<div class="error-inline">Please enter a little more detail (at least 15 characters).</div>';
      return;
    }
    state.currentBrief = brief;
    state.currentMeta = {
      project_type: document.getElementById('project-type')?.value || 'Other / General',
      role: document.getElementById('freelancer-role')?.value || 'Other freelancer',
      language: document.getElementById('output-language')?.value || 'Simple English'
    };
    viewRoot.innerHTML = `<section class="panel loading-panel"><span class="spinner"></span><h3>Reading the project brief…</h3><p>ScopeSaathi is asking ${state.status && state.status.ai_provider === 'openrouter' ? 'OpenRouter AI' : 'your local AI'} to separate what is clear from what still needs a conversation.</p><div style="margin-top:18px" class="eyebrow">⌑&nbsp; ${state.status && state.status.ai_provider === 'openrouter' ? 'CLOUD AI REQUEST' : 'LOCAL PROCESSING REQUEST'}</div></section>`;
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, role: state.currentMeta.role, project_type: state.currentMeta.project_type, language: state.currentMeta.language })
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        state.page = 'new';
        state.errorMessage = body.error || 'Analysis failed. Check the configured AI provider and try again.';
        render();
        showToast('Analysis could not be completed.');
        return;
      }
      state.analysis = body.analysis;
      state.currentId = null;
      state.page = 'results';
      state.errorMessage = '';
      render();
      refreshStatus();
    } catch (_) {
      state.page = 'new';
      state.errorMessage = 'Could not connect to ScopeSaathi. Check that the Python app is still running, then try again.';
      render();
    }
  }

  function saveCurrentHistory() {
    if (!state.analysis) return;
    const id = state.currentId || `ss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const title = (state.currentBrief || 'Client project').replace(/\s+/g, ' ').slice(0, 54);
    const item = {
      id, title: title.length === 54 ? `${title}…` : title,
      brief: state.currentBrief,
      role: state.currentMeta.role,
      project_type: state.currentMeta.project_type,
      language: state.currentMeta.language,
      analysis: state.analysis,
      saved_at: new Date().toISOString()
    };
    const existingIndex = state.history.findIndex((entry) => entry.id === id);
    if (existingIndex >= 0) state.history[existingIndex] = item;
    else state.history.unshift(item);
    state.currentId = id;
    persistHistory();
    showToast('Analysis saved on this device.');
    render();
  }

  function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard.');
    } catch (_) {
      const temp = document.createElement('textarea'); temp.value = text; temp.style.position = 'fixed'; temp.style.opacity = '0'; document.body.appendChild(temp); temp.select();
      const success = document.execCommand('copy'); temp.remove();
      showToast(success ? 'Copied to clipboard.' : 'Copy failed. Please select the text and copy it.');
    }
  }

  function getFollowupValue() {
    const field = document.getElementById('followup-message');
    return field ? field.value : makeFollowupMessage();
  }

  function closeMobileMenu() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobile-overlay').classList.remove('show');
  }

  function openHistoryItem(id) {
    const item = state.history.find((entry) => entry.id === id);
    if (!item) { showToast('That saved report could not be found.'); return; }
    state.analysis = item.analysis;
    state.currentBrief = item.brief || '';
    state.currentMeta = { role: item.role || 'Freelancer', project_type: item.project_type || 'General project', language: item.language || 'Simple English' };
    state.currentId = item.id;
    navigate('results');
  }

  async function handleAction(action, el) {
    switch (action) {
      case 'analyze': await runAnalysis(); break;
      case 'use-example': {
        const example = "Hi, I need a website for my cafe with 5 pages and a premium look. I'd like it finished quickly. I want changes until I'm happy. Please also add online ordering if possible. Can you start this week?";
        const field = document.getElementById('client-brief');
        if (field) { field.value = example; field.focus(); updateCharCount(); showToast(`Example message added. Click Analyse with ${state.status && state.status.ai_provider === 'openrouter' ? 'OpenRouter AI' : 'local AI'} when ready.`); }
        break;
      }
      case 'save-history': saveCurrentHistory(); break;
      case 'go-followup': if (!state.analysis) showToast('Analyse a message first.'); else navigate('followup'); break;
      case 'copy-followup': await copyText(getFollowupValue()); break;
      case 'reset-followup': { const field = document.getElementById('followup-message'); if (field) field.value = makeFollowupMessage(); showToast('Draft reset.'); break; }
      case 'download-followup': downloadText('scopesaathi-follow-up.txt', getFollowupValue()); showToast('Follow-up downloaded.'); break;
      case 'download-report': {
        if (!state.analysis) break;
        const report = { app: 'ScopeSaathi AI', generated_at: new Date().toISOString(), project_type: state.currentMeta.project_type, role: state.currentMeta.role, client_brief: state.currentBrief, analysis: state.analysis };
        downloadText('scopesaathi-analysis.json', JSON.stringify(report, null, 2), 'application/json;charset=utf-8'); showToast('Report downloaded.'); break;
      }
      case 'view-history': openHistoryItem(el.dataset.id); break;
      case 'delete-history': {
        const id = el.dataset.id;
        state.history = state.history.filter((entry) => entry.id !== id); persistHistory(); render(); showToast('Saved report deleted.'); break;
      }
      case 'clear-history': {
        if (!window.confirm('Delete all saved analyses from this browser? This cannot be undone.')) break;
        state.history = []; persistHistory(); render(); showToast('History cleared from this device.'); break;
      }
      case 'export-history': downloadText('scopesaathi-history.json', JSON.stringify(state.history, null, 2), 'application/json;charset=utf-8'); showToast('History exported.'); break;
      case 'settings-tab': state.settingsTab = el.dataset.tab || 'model'; render(); break;
      case 'refresh-status': await refreshStatus(); showToast('AI provider status refreshed.'); break;
      default: break;
    }
  }

  document.addEventListener('click', (event) => {
    const pageEl = event.target.closest('[data-page]');
    if (pageEl) {
      event.preventDefault();
      navigate(pageEl.dataset.page);
      return;
    }
    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      event.preventDefault();
      handleAction(actionEl.dataset.action, actionEl);
    }
  });

  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.feature-card[data-page], .activity-item[data-action]')) {
      event.preventDefault();
      if (event.target.dataset.page) navigate(event.target.dataset.page);
      else if (event.target.dataset.action === 'view-history') openHistoryItem(event.target.dataset.id);
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.id === 'client-brief') updateCharCount();
    if (event.target.id === 'history-search') {
      const query = event.target.value.toLowerCase().trim();
      const filtered = state.history.filter((item) => `${item.title || ''} ${item.project_type || ''} ${item.brief || ''}`.toLowerCase().includes(query));
      const resultRoot = document.getElementById('history-results');
      if (resultRoot) resultRoot.innerHTML = renderHistoryRows(filtered);
    }
  });

  document.addEventListener('submit', (event) => {
    if (event.target.id === 'analysis-form') { event.preventDefault(); runAnalysis(); }
  });

  document.getElementById('mobile-menu').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('mobile-overlay').classList.toggle('show');
  });
  document.getElementById('mobile-overlay').addEventListener('click', closeMobileMenu);

  render();
  refreshStatus();
  // Re-check local readiness as the model can take several seconds to load.
  setInterval(refreshStatus, 9000);
})();
