//Step 2
$(document).ready(function(){
  debugger;
  //update web template for accessibility
  $("#wb-lng").attr("class","text-right");
  $("#wb-srch").attr("class","col-lg-offset-4 col-md-offset-4 col-sm-offset-2 col-xs-12 col-sm-5 col-md-4");
  $('#wb-sm').remove();
  $("div[class='app-bar-mb container visible-xs-block hidden-print']").remove();
  
  var lang = $('html').attr('data-lang') || "en";

  const styleString = "outline: none;border: none; width: 50%";
// Read-only summary: strip required class to prevent visual asterisks
$('.crmEntityFormView .table-info.required').removeClass('required');
// Also hide any lingering validator star containers
$('.crmEntityFormView .validators').hide();
// Prevent SR from announcing 'required' on read-only summary fields
$('.crmEntityFormView [aria-required="true"]').removeAttr('aria-required');


  $("select").css({"width": "100%"})
  $("input:not([type='radio'])").css({"width": "100%"});
  $("#ethi_nextcanadadate").attr('style', styleString);

  $("#ethi_nextcanadatime").attr('style', styleString);

  $("#ethi_embarkationdate").attr("type","date").css('line-height','30px');
  $("#ethi_disembarkationdate").attr("type","date").css('line-height','30px');

  $("input").removeAttr("placeholder");

  document.title =   "{{snippets['ethi-gi-step2-title']}}" + " - " + "{{snippets['ethi-gi-report-title']}}";

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
  const $f = $("#ethi_nextcanadadateandtimeportal");
  console.log('found:', $f.length, 'tag:', $f.prop('tagName'), 'type:', $f.attr('type'));
  console.log('val():', $f.val(), 'text():', $f.text());

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
