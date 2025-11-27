// Step 3
const GI_STEP3_PAGE_TITLE = "{{snippets['ethi-confirmation']}}" + " - " + "{{snippets['ethi-gi-step3-title']}}" + " - " + "{{snippets['ethi-gi-report-title']}}";
// Set immediately to avoid default heading flash
if (document.title !== GI_STEP3_PAGE_TITLE) {
  document.title = GI_STEP3_PAGE_TITLE;
}

window.addEventListener('load', () => {
  // Keep the heading in sync after load completes
  document.title = GI_STEP3_PAGE_TITLE;
});
