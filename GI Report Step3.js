// Step 3
const GI_STEP3_PAGE_TITLE = "{{snippets['ethi-confirmation']}}" + " - "  + "{{snippets['ethi-gi-report-title']}}";
// Set immediately to avoid default heading flash
if (document.title !== GI_STEP3_PAGE_TITLE) {
  document.title = GI_STEP3_PAGE_TITLE;
}

window.addEventListener('load', () => {
  // Keep the heading in sync after load completes
  document.title = GI_STEP3_PAGE_TITLE;

  const has$ = typeof window.jQuery === "function";
  const $ = has$ ? window.jQuery : null;

  // --- utilities ------------------------------------------------------------
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function setText(el, text) { if (el) el.textContent = text; }
  // function ensureProgFocusable(el) {
  //   if (!el) return;
  //   if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1"); // NOT tabbable
  // }
  // function focusHeadingOnce(selector) {
  //   const h = qs(selector) || qs("#wb-cont") || qs("main[role='main'] h1, main[role='main'] h2");
  //   if (!h) return;
  //   ensureProgFocusable(h);
  //   try { h.focus({ preventScroll: false }); } catch { h.focus(); }
  // }

  try {
    // --- step id ------------------------------------------------------------
    const params = new URLSearchParams(window.location.search);
    const stepId = params.get("stepid") || "";
    const stepIdEl = qs("#ethi_stepid");
    if (stepIdEl) stepIdEl.value = stepId;

    // --- remove "basic form" aria noise (accessibility clean-up) ------------
    (function removeBasicFormAria() {
      qsa("[aria-label]").forEach(el => {
        const v = el.getAttribute("aria-label");
        if (v && /basic\s*form/i.test(v)) {
          el.removeAttribute("aria-label");
          if (el.getAttribute("role") === "form") el.removeAttribute("role");
        }
      });
    })();

    if ($) {
      $("#wb-lng").attr("class", "text-right");
      $("#wb-srch").attr("class", "col-lg-offset-4 col-md-offset-4 col-sm-offset-2 col-xs-12 col-sm-5 col-md-4");
      $("#wb-sm").remove();
        $("input").removeAttr("placeholder");
      //$('#wb-tphp a.wb-sl')?.focus(); // should focus the skip link
      // Use class selectors rather than a fragile [class="..."] equality
      $(".app-bar-mb.container.visible-xs-block.hidden-print").remove();
    }
      $('body').attr('tabindex', '-1').focus();
  setTimeout(function () { $('body').removeAttr('tabindex'); }, 0);
    window.WETFocus?.install({ selector: 'h2.tab-title', mode: 'announce' }); // or omit mode to actually focus
      
    const stepTitleSel = "h2.tab-title";
    const stepTitle = qs(stepTitleSel);
    if (stepTitle) {
      setText(stepTitle, "{{ snippets['ethi-gi-report-confirmation'] }}");
      // Keep your visual layout
      Object.assign(stepTitle.style, {
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        height: "80px"
      });
    }

    // --- confirmation UI bits (guard jQuery usage) --------------------------
    if ($) {
      // Add Print button once
      if (!document.getElementById("PrintButton")) {
        $("#WebFormPanel").after(
          '<div class="actions">' +
            '<div class="col-md-6 clearfix">' +
              '<div role="group" class="btn-group entity-action-button">' +
                '<input type="button" id="PrintButton" class="btn btn-default button previous previous-btn" style="width:100%">' +
              "</div>" +
            "</div>" +
          "</div>"
        );
        $("#PrintButton")
          .val("{{snippets['ethi-print']}}")
          .on("click", () => window.print());
      }

      // Hide source fields (if present)
      $("#ethi_submittimeutc").hide();
      $("#ethi_vesselname").hide();
      $("#ethi_name").hide();

      // Build confirmation HTML (rename variable to avoid shadowing window.confirm)
      const subUtc = $("#ethi_submittimeutc").val() || "";
      const vessel = $("#ethi_vesselname").val() || "";
      const name = $("#ethi_name").val() || "";
      let confirmationHtml = "{{snippets['ethi-confirmation']}}";
      confirmationHtml = confirmationHtml.replace("bb", "<b>" + subUtc + " UTC</b>");
      confirmationHtml = confirmationHtml.replace("aa", "<b>" + vessel + "</b>");
      confirmationHtml = confirmationHtml.replace("dd", "<b>" + name + "</b>");

      $("legend.section-title").html("");
      $("#ethi_vesselname").after('<div style="font-size:20px">' + confirmationHtml + "</div>");
    } else {
      // No jQuery: do minimal equivalents (optional)
      const subUtcEl = qs("#ethi_submittimeutc");
      const vesselEl = qs("#ethi_vesselname");
      const nameEl = qs("#ethi_name");

      if (subUtcEl) subUtcEl.style.display = "none";
      if (vesselEl) vesselEl.style.display = "none";
      if (nameEl) nameEl.style.display = "none";

      const subUtc = subUtcEl?.value || "";
      const vessel = vesselEl?.value || "";
      const name = nameEl?.value || "";

      let confirmationHtml = "{{snippets['ethi-confirmation']}}";
      confirmationHtml = confirmationHtml.replace("bb", "<b>" + subUtc + " UTC</b>");
      confirmationHtml = confirmationHtml.replace("aa", "<b>" + vessel + "</b>");
      confirmationHtml = confirmationHtml.replace("dd", "<b>" + name + "</b>");

      const legend = qs("legend.section-title");
      if (legend) legend.innerHTML = "";
      if (vesselEl) {
        const div = document.createElement("div");
        div.style.fontSize = "20px";
        div.innerHTML = confirmationHtml;
        vesselEl.insertAdjacentElement("afterend", div);
      }
    }
  } catch (err) {
    // Never crash the page because of this script
    try { console.error("[Step3] Initialization failed:", err); } catch {}
  }
});
