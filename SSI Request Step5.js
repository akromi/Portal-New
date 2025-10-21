// SSI Step 5 
//$(function() {
window.addEventListener("load", (e) => {
    document.title =   "{{snippets['ethi-ssi-step5']}}" + " - " + "{{snippets['ethi-ssi-request-title']}}";
    $("div.top").html("<h2 style = 'padding-bottom: 30px;' >" + "{{snippets['ethi-ssi-step5']}}"+"</h2>");
    $("input:not([type='radio'],[type='button'],[id='wb-srch-q'])").css({"width": "500px"}).removeAttr('maxlength');
    $('textarea').css('width', '500px');
    $("fieldset:nth-child(5)").hide();
    $("input").removeAttr("placeholder");
    $(".tab-title").css("padding-bottom", "30px");
    $("h2[class='tab-title']").hide();
    $("#ethi_submittimeutc").hide();
    $("#ethi_submittimeutc").val(formatDateToYYYYMMDD12Hour(new Date()));
    $("#wb-lng").attr("class","text-right");
    //$("#wb-srch").attr("class","col-lg-offset-4 col-md-offset-4 col-sm-offset-2 col-xs-12 col-sm-5 col-md-4");
    $('#wb-sm').remove();
    $("div[class='app-bar-mb container visible-xs-block hidden-print']").remove();
    $("#ethi_uploadshipparticulars").hide();
    $("#ethi_uploadshipparticulars_delete_button").hide();
    $("#ethi_existingssc").hide();
    $("#ethi_existingssc_delete_button").hide();

    var lang = "{{ website.selected_language.code }}";

    if($("#ethi_invoicecountry").val() =="f23dc860-6f39-ef11-a317-000d3af44283")
        { 
            $("div #ethi_invoiceprovincestate_label").parent().parent().css("display","none");
            $("div #ethi_invoicepostalcodezipcode_label").parent().parent().css("display","none");
            $("div #ethi_invoiceprovince_label").parent().parent().css("display","block");
            $("div #ethi_invoicepostalcode_label").parent().parent().css("display","block")
        } 
      else{ $("div #ethi_invoiceprovincestate_label").parent().parent().css("display","block");
            $("div #ethi_invoicepostalcodezipcode_label").parent().parent().css("display","block");
            $("div #ethi_invoiceprovince_label").parent().parent().css("display","none");
            $("div #ethi_invoicepostalcode_label").parent().parent().css("display","none");
        };


  // Pull saved EN/FR names from localStorage:
  const map = {
    ethi_invoicecountry:   "#ethi_invoicecountry_name",
    ethi_invoiceprovince:  "#ethi_invoiceprovince_name",
    ethi_flaginregistry:   "#ethi_flaginregistry_name",
    ethi_serviceprovince:  "#ethi_serviceprovince_name"
  };

  for (const [fieldId, target] of Object.entries(map)) {
    const name = window.LookupStore?.getName(fieldId, lang) || "";
    if (name) { $(target).val(name); }  // no triggers, as you prefer
  }

  if ($("#ethi_otherregistryflag").val()) { $("#ethi_otherregistryflag").parent().parent().show() }
  else { $("#ethi_otherregistryflag").parent().parent().hide() };

    if($("#ethi_canadiancoastguard_0").is(':checked')){
        $("#ethi_isorganizationnumber").parent().parent().hide();
        $("#ethi_isreferencenumber").parent().parent().hide();
    };
});

// Format date to 'yyyy-mm-dd hh:mm AM/PM'
const formatDateToYYYYMMDD12Hour = (date) => {
    debugger;
    const year = date.getUTCFullYear(); // Get UTC year
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Get UTC month (0-based)
    const day = String(date.getUTCDate()).padStart(2, '0'); // Get UTC day

    let hours = date.getUTCHours(); // Get UTC hours (24-hour format)
    const minutes = String(date.getUTCMinutes()).padStart(2, '0'); // Get UTC minutes

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format (0 becomes 12)

    return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${minutes} ${ampm} UTC`;
};
