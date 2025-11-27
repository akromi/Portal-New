//Step 2
const GI_STEP2_PAGE_TITLE = "{{snippets['ethi-gi-step2-title']}}" + " - " + "{{snippets['ethi-gi-report-title']}}";
document.title = GI_STEP2_PAGE_TITLE;

window.addEventListener("load", (e) => {

  document.title = GI_STEP2_PAGE_TITLE;

  //Using an immediately invoked function expression, to remove "basic form form" via aria-label + role for accessibility
(function removeBasicFormAria() { 
  document.querySelectorAll('[aria-label]').forEach(el => {
    const v = el.getAttribute('aria-label');
    if (v && /basic\s*form/i.test(v)) {
      el.removeAttribute('aria-label');
      if (el.getAttribute('role') === 'form') {
        el.removeAttribute('role');
      }
    }
  });
})();

  //update web template for accessibility
  $("#wb-lng").attr("class","text-right");
  $("#wb-srch").attr("class","col-lg-offset-4 col-md-offset-4 col-sm-offset-2 col-xs-12 col-sm-5 col-md-4");
  $('#wb-sm').remove();
  $("input").removeAttr("placeholder");
  // Flag page as a read-only summary so radios render in grey
  $('body').addClass('read-only-summary');
  //$('#wb-tphp a.wb-sl')?.focus(); // should focus the skip link

  $('body').attr('tabindex', '-1').focus();
  setTimeout(function () { $('body').removeAttr('tabindex'); }, 0);

window.WETFocus?.install({ selector: 'h2.tab-title', mode: 'announce' }); // or omit mode to actually focus

  $("div[class='app-bar-mb container visible-xs-block hidden-print']").remove();

  var lang = $('html').attr('data-lang') || "en";
  // Final step: relabel the Next/Submit button to match the submit action
  const submitLabel = /^fr/i.test(lang) ? 'Soumettre' : 'Submit';
  $('#NextButton').val(submitLabel);
  $('#captcha').text(submitLabel);

  const styleString = "outline: none;border: none; width: 50%";
// Read-only summary: strip required cues so asterisks do not appear on locked fields
const $form = $('.crmEntityFormView');
$form.find('.table-info.required, .required').removeClass('required');
// Also hide any lingering validator star containers
$form.find('.validators').hide();
// Prevent SR from announcing 'required' on read-only summary fields
$form.find('[aria-required="true"]').removeAttr('aria-required');
// Remove inline <abbr>*</abbr> marks that sometimes decorate required labels
$form.find('abbr').filter(function () { return $(this).text().trim() === '*'; }).remove();

// Report type (summary view): make it visually read-only and non-interactive
// Keep SR + Tab working; no hints injected.
window.ReadOnlySelect?.make('#ethi_reporttype', { ariaDisabled: true});
window.ReadOnlySelect?.reapply('#ethi_reporttype', { ariaDisabled: true });

TabbableReadOnly.make('#ethi_nextport_name', { ariaDisabled: true, label: '#ethi_nextport_label' });
TabbableReadOnly.reapply('#ethi_nextport_name', { ariaDisabled: true, label: '#ethi_nextport_label' });

// Make the “Submitter is medical contact?” radios tabbable but read-only
$('#ethi_submitterismedicalcontact').addClass('wet-patched-radio');
ReadOnlyRadioGroup.make('#ethi_submitterismedicalcontact');
ReadOnlyRadioGroup.reapply('#ethi_submitterismedicalcontact'); // for partial postbacks
BindRadioGroupLabel.make({
  group: '#ethi_submitterismedicalcontact',
  label: '#ethi_submitterismedicalcontact_label'
});

  $("select").css({"width": "100%"})
  $("input:not([type='radio'])").css({"width": "100%"});
  //$("#ethi_nextcanadadate").attr('style', styleString);

  //$("#ethi_nextcanadatime").attr('style', styleString);

  //$("#ethi_embarkationdate").attr("type","date").css('line-height','30px');
  //$("#ethi_disembarkationdate").attr("type","date").css('line-height','30px');

  $("input").removeAttr("placeholder");

  $('h2.tab-title')
  .text("{{ snippets['ethi-gi-step2-title'] }}")
  .css({ display:'flex', 'justify-content':'flex-start', 'align-items':'center', height:'80px' });



  params = new URLSearchParams(window.location.search);
  $("#ethi_stepid").val(params.get("stepid"));
  
  $("fieldset:nth-child(6)").hide();
  
  const name = window.LookupStore?.getName("ethi_nextport", lang) || "";

  if (name) { $("#ethi_nextport_name").val(name); } 

  if($("#ethi_othernextcanadianport").val())
  {
      $("#ethi_othernextcanadianport").parent().parent().show();
  }
  else {
          $("#ethi_othernextcanadianport").parent().parent().hide();
  };

  if($("#ethi_submitterismedicalcontact_1").is(':checked'))
  {
      $("fieldset:nth-child(5)").hide();
  };
  if($("#ethi_submitterismedicalcontact_0").is(':checked'))  
  {
      $("fieldset:nth-child(5)").show();
  };

  const now = new Date();
  $("#ethi_submittimeutc").val(formatDateUTC(now));

  $("#ethi_nextcanadadateandtimeportal").val($("#ethi_nextcanadadate").val() + " " + $("#ethi_nextcanadatime").val());

  //console.log($("#ethi_nextcanadadateandtimeportal").val());
// Remove native tooltips on read-only summary pages (inputs/selects/textareas only)
 $('.crmEntityFormView input[title], .crmEntityFormView select[title], .crmEntityFormView textarea[title]')
    .each(function () {
      // keep a breadcrumb for debugging if you want
      $(this).attr('data-title-removed', $(this).attr('title'));
      this.removeAttribute('title');
    });

});

const formatDateUTC = (date) => {
  const year = date.getUTCFullYear(); // Get UTC year
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Get UTC month (0-based)
  const day = String(date.getUTCDate()).padStart(2, '0'); // Get UTC day

  let hours = date.getUTCHours(); // Get UTC hours (24-hour format)
  const minutes = String(date.getUTCMinutes()).padStart(2, '0'); // Get UTC minutes

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format (0 becomes 12)

  return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

const formattedDateLocal = (dateObj) =>{

  let year = dateObj.getFullYear();
  let month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Ensure 2-digit month
  let day = String(dateObj.getDate()).padStart(2, '0'); // Ensure 2-digit day

  // Extract time and AM/PM
  let hours = dateObj.getHours() % 12 || 12; // Convert 24-hour to 12-hour
  let minutes = String(dateObj.getMinutes()).padStart(2, '0'); // Ensure 2-digit minutes
  let ampm = dateObj.getHours() >= 12 ? "PM" : "AM";

  // Format as "YYYY-MM-DD h:mm AM/PM"
  return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
}

const formattedTime = (dateObj) =>{

  // Extract time and AM/PM
  let hours = dateObj.getHours() % 12 || 12; // Convert 24-hour to 12-hour
  let minutes = String(dateObj.getMinutes()).padStart(2, '0'); // Ensure 2-digit minutes
  let ampm = dateObj.getHours() >= 12 ? "PM" : "AM";

  // Format as "h:mm" or "h:mm AM/PM"
  return formattedTime = `${hours}:${minutes} ${ampm}`;
}
