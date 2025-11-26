// // SSI Step 2 Invoicing
window.addEventListener("load", (e) => {
  debugger;
  document.title =   "{{snippets['ethi-ssi-step2']}}" + " - " + "{{snippets['ethi-ssi-request-title']}}";

  $("div.top").html("<h2 style = 'padding-bottom: 30px;' >" + "{{snippets['ethi-ssi-step2']}}" + "</h2>");
  $(".tab-title").css("padding-bottom", "30px");

  $("h2[class='tab-title']").hide();
  $("input").removeAttr("placeholder");

  $('#wb-sm').remove();
  $("div[class='app-bar-mb container visible-xs-block hidden-print']").remove();


  $('body').attr('tabindex', '-1').focus();
  setTimeout(function () { $('body').removeAttr('tabindex'); }, 0);
window.WETFocus?.install({ selector: 'h2.tab-title', mode: 'announce' }); // or omit mode to actually focus

      
  $("select").each(function () {
    if (!$(this).parent().hasClass("select-icon")) {
      $(this).wrap('<div class="select-icon"></div>');
      $(this).after('<i class="fas fa-chevron-down" aria-hidden="true"></i>');
    }
  });

  var lang = "{{ website.selected_language.code }}" || "en";

  var isOrganizationNumberLabel = $("#ethi_isorganizationnumber_label").text().trim();
  var isReferenceNumberLabel = $("#ethi_isreferencenumber_label").text().trim();
  var invoiceCountryLabel = $("#ethi_invoicecountry_label").text().trim();
  var invoiceProvinceLabel = $("#ethi_invoiceprovince_label").text().trim();
  var invoicePostalCodeLabel = $("#ethi_invoicepostalcode_label").text().trim();
  var invoiceProvinceStateLabel = $("#ethi_invoiceprovincestate_label").text().trim();
  var invoicePostalCodeZipCodeLabel = $("#ethi_invoicepostalcodezipcode_label").text().trim();
  var businessNumberLabel  = $("#ethi_businessnumber_label").text().trim();

  var fields = [
    {
      id: 'ethi_invoicingname',
      type: 'text',
      length: 100,
      required: true,
      validators: [
      ]
    },
    {
      id: 'ethi_businessnumber',
      type: 'text',
      length: 9,
      required: false,
      validators: [
        {
          validator: validateBusinessNumber,
          message_en: businessNumberLabel + " " + "{{snippets['ethi-businessnumber']}}",
          message_fr: "Le champ " + businessNumberLabel + " " + "{{snippets['ethi-businessnumber']}}"
        }
      ]
    },
    {
      id: 'ethi_invoicecountry',
      type: 'lookup',
      length: 100,
      required: true,
      validators: [
        {
          validator: validateRequired,
          message_en: invoiceCountryLabel + " " + "{{snippets['ethi-requiredfield']}}",
          message_fr: "Le champ " + invoiceCountryLabel + " " + "{{snippets['ethi-requiredfield']}}"
        }
      ]
    },
    {
      id: 'ethi_invoiceprovincestate',
      type: 'text',
      length: 100,
      required: true,
      validators: [
        {
          validator: validateRequired,
          message_en: invoiceProvinceStateLabel + " " + "{{snippets['ethi-requiredfield']}}",
          message_fr: "Le champ " + invoiceProvinceStateLabel + " " + "{{snippets['ethi-requiredfield']}}"
        }
      ]
    },
    {
     id: 'ethi_invoiceprovince',
     type: 'lookup',           
     required: true,           
     validators: [
      {
        validator: validateRequired,
        message_en: invoiceProvinceLabel + " " + "{{snippets['ethi-requiredfield']}}",
        message_fr: "Le champ " + invoiceProvinceLabel + " " + "{{snippets['ethi-requiredfield']}}",
      }
     ]
    },
    {
      id: 'ethi_invoicecity',
      type: 'text',
      length: 100,
      required: true,
      validators: [
      ]
    },
    {
      id: 'ethi_invoiceaddressline1',
      type: 'text',
      length: 100,
      required: true,
      validators: [
      ]
    },
    {
      id: 'ethi_invoiceaddressline2',
      type: 'text',
      length: 100,
      required: false,
      validators: [
      ]
    }
  ];
  addValidators(fields);

WET4.patchRadioGroup('ethi_canadiancoastguard');

  checkCoastGuard();

  $('input[type="radio"]').on('change', function () {
    checkCoastGuard();
  });

  getActiveInvoiceCountry(lang);

  getActiveInvoiceProvinces(lang);

  //showInvoiceProvince();

  const CANADA_GUID = "f23dc860-6f39-ef11-a317-000d3af44283";  // keep in one place
  const $country = $("#ethi_invoicecountry");
 
  // Orchestrator: clear old validators, choose path, and revalidate if active
  function applyInvoiceProvinceRules() {
    // Always clear stale rules first (both paths)
    removeValidators("ethi_invoiceprovincestate");
    removeValidators("ethi_invoicepostalcodezipcode");
    removeValidators("ethi_invoiceprovince");
    removeValidators("ethi_invoicepostalcode");
 
    const val = String($country.val() || "");
 
    // if (val === CANADA_GUID) {
    //   showCanadaProvince2("invoice");
    //   applyCanadaProvinceValidator();

    //   if (window.__validators_active) {
    //     window.revalidate("ethi_invoiceprovince", "lookup", { scrollToFirstError: true });
    //     window.revalidate('ethi_invoicepostalcode', 'text', { scrollToFirstError: true });
    //   }
    // } 
    // else if (val) {
    //   showOtherProvince2("invoice"); 
 
    //   if (window.__validators_active) {
    //     window.revalidate("ethi_invoiceprovincestate", "text", { scrollToFirstError: true });
    //     window.revalidate("ethi_invoicepostalcodezipcode", "text");
    //   }
    // } 
        if (val === CANADA_GUID) {
      showCanadaProvince2("invoice");
      applyCanadaProvinceValidator();

      // if (window.__validators_active) {
      //   window.revalidate("ethi_invoiceprovince", "lookup", { scrollToFirstError: true });
      //   window.revalidate('ethi_invoicepostalcode', 'text', { scrollToFirstError: true });
      // }
    } else {
      showOtherProvince2("invoice"); 
 
      // if (window.__validators_active) {
      //   window.revalidate("ethi_invoiceprovincestate", "text", { scrollToFirstError: true });
      //   window.revalidate("ethi_invoicepostalcodezipcode", "text");
      // }
    } 
  }
 

// Canada province/territory validator
function applyCanadaProvinceValidator() {
  if (window.__validators_active) {
    addValidator({
      id: 'ethi_invoiceprovince',
      type: 'lookup',
      required: true,
      validators: [
        {
          validator: validateRequired,
          message_en: invoiceProvinceLabel + " " + "{{snippets['ethi-requiredfield']}}",
          message_fr: "Le champ " + invoiceProvinceLabel + " " + "{{snippets['ethi-requiredfield']}}",
        }
      ]
    });

    // Force revalidation for inline error 
    window.revalidate('ethi_invoiceprovince', 'lookup', { scrollToFirstError: true });
  } else {
   
    setTimeout(applyCanadaProvinceValidator, 100);
  }
}


$country.off(".prov").on("change.prov", applyInvoiceProvinceRules);

  // Initialize state on load
  applyInvoiceProvinceRules();



  // $("#ethi_invoicecountry")
  //   .on('change', function () {
  //     // removeValidators("ethi_invoiceprovincestate");
  //     // removeValidators("ethi_invoicepostalcodezipcode");
  //     // removeValidators("ethi_invoiceprovince");
  //     // removeValidators("ethi_invoicepostalcode");
  //     var value = $(this).val();
  //     // Check for Canada GUID
  //     if (value == "f23dc860-6f39-ef11-a317-000d3af44283") { 
  //            showCanadaProvince2("invoice"); 
  //     } else { 
  //            showOtherProvince2("invoice"); };
  //     LoadInvoiceCountry();
  // }).triggerHandler('change'); // initialize UI without firing validators


// if (window.__validators_active) { 
//  $("#ethi_invoicecountry").change(function () {
//     removeValidators("ethi_invoiceprovincestate");
//     removeValidators("ethi_invoicepostalcodezipcode");
//     removeValidators("ethi_invoiceprovince");
//     removeValidators("ethi_invoicepostalcode");
//     //var value = $(this).val();
//     //if ($("#ethi_invoicecountry").val() == "f23dc860-6f39-ef11-a317-000d3af44283") { showCanadaProvince2("invoice"); } else { showOtherProvince2("invoice"); };
//     showInvoiceProvince();
//   }).trigger('change'); // initialize state on load
// } else {
//    //var value = $(this).val();    
//    //if ($("#ethi_invoicecountry").val()  == "f23dc860-6f39-ef11-a317-000d3af44283") { showCanadaProvince2("invoice"); } else { ShowOtherProvince2("invoice"); };
//    showInvoiceProvince();
// };

  return true;

function checkCoastGuard() {
  if ($("#ethi_canadiancoastguard_0").is(':checked')) {
    removeValidators("ethi_isorganizationnumber");
    removeValidators("ethi_isreferencenumber");
    $("#ethi_isorganizationnumber").parent().parent().hide();
    $("#ethi_isreferencenumber").parent().parent().hide();
    $("#ethi_isorganizationnumber").val("");
    $("#ethi_isreferencenumber").val("");
  };
  if ($("#ethi_canadiancoastguard_1").is(':checked')) {
    $("#ethi_isorganizationnumber").parent().parent().show();
    $("#ethi_isreferencenumber").parent().parent().show();
    addValidator(
      {
        id: 'ethi_isorganizationnumber',
        type: 'text',
        length: 100,
        required: true,
        validators: [
          {
            validator: validateRequired,
            message_en: isOrganizationNumberLabel + " " + "{{snippets['ethi-requiredfield']}}",
            message_fr: "Le champ " + isOrganizationNumberLabel + " " + "{{snippets['ethi-requiredfield']}}",
          }
        ]
      });
    addValidator(
      {
        id: 'ethi_isreferencenumber',
        type: 'text',
        length: 100,
        required: true,
        validators: [
          {
            validator: validateRequired,
            message_en: isReferenceNumberLabel + " " + "{{snippets['ethi-requiredfield']}}",
            message_fr: "Le champ " + isReferenceNumberLabel + " " + "{{snippets['ethi-requiredfield']}}",
          }
        ]
      });
  };
}
function showInvoiceProvince() {
  if ($("#ethi_invoicecountry").val() == "f23dc860-6f39-ef11-a317-000d3af44283"){ 
    showCanadaProvince2("invoice");
  }
  else { showOtherProvince2("invoice"); };
};

  function showCanadaProvince2(param) {
    $("div #ethi_" + param + "provincestate_label").closest('tr').hide(); //.parent().parent().hide //.css("display", "none");
    $("div #ethi_" + param + "postalcodezipcode_label").closest('tr').hide(); //.parent().parent().hide //.css("display", "none");
    $("div #ethi_" + param + "province_label").closest('tr').show(); //.parent().parent().show //.css("display", "block");
    $("div #ethi_" + param + "postalcode_label").closest('tr').show(); //.parent().parent().show //.css("display", "block");

    removeValidators("ethi_invoiceprovince");
    removeValidators("ethi_invoicecity");
    removeValidators("ethi_invoiceaddressline1");
    removeValidators("ethi_invoiceaddressline2");
    removeValidators("ethi_invoiceprovincestate");
    removeValidators("ethi_invoicepostalcodezipcode");
    removeValidators("ethi_invoicepostalcode");

    addValidator(
      {
        id: 'ethi_invoiceprovince',
        type: 'lookup',
        length: 100,
        required: true,
        validators: [
          {
            validator: validateRequired,
            message_en: invoiceProvinceLabel + " " + "{{snippets['ethi-requiredfield']}}",
            message_fr: "Le champ " + invoiceProvinceLabel + " " + "{{snippets['ethi-requiredfield']}}"
          }
        ]
      });
    addValidator(
      {
        id: 'ethi_invoicecity',
        type: 'text',
        length: 100,
        required: true,
        validators: [
        ]
      });

    addValidator(
        {
      id: 'ethi_invoiceaddressline1',
      type: 'text',
      length: 100,
      required: true,
      validators: [
      ]
    });
    addValidator(
        {
      id: 'ethi_invoiceaddressline2',
      type: 'text',
      length: 100,
      required: false,
      validators: [
      ]
    });

    addValidator(
      {
        id: 'ethi_invoicepostalcode',
        type: 'text',
        length: 100,
        required: true,
        validators: [
          {
            validator: validateRequired,
            message_en: invoicePostalCodeLabel + " " + "{{snippets['ethi-requiredfield']}}",
            message_fr: "Le champ " + invoicePostalCodeLabel + " " + "{{snippets['ethi-requiredfield']}}"
          },
          {
            validator: validateCanadianPostal,
            message_en: invoicePostalCodeLabel + " " + "{{snippets['ethi-postalcode']}}",
            message_fr: "Le champ " + invoicePostalCodeLabel + " " + "{{snippets['ethi-postalcode']}}"
          }
        ]
      });
    $("#ethi_" + param + "provincestate").val("");
    $("#ethi_" + param + "postalcodezipcode").val("");

    //getActiveInvoiceProvinces(lang);

   window.revalidate('ethi_invoiceprovince', 'lookup', { scrollToFirstError: true });
   window.revalidate('ethi_invoicepostalcode', 'text', { scrollToFirstError: true });

  };

  function showOtherProvince2(param) {
    $("div #ethi_" + param + "provincestate_label").closest('tr').show(); //.parent().parent().show //.css("display", "block");
    $("div #ethi_" + param + "postalcodezipcode_label").closest('tr').show(); //.parent().parent().show //.css("display", "block");
    $("div #ethi_" + param + "province_label").closest('tr').hide(); //.parent().parent().hide //.css("display", "none");
    $("div #ethi_" + param + "postalcode_label").closest('tr').hide(); //.parent().parent().hide //.css("display", "none");

    removeValidators("ethi_invoiceprovince");
    removeValidators("ethi_invoicecity");
    removeValidators("ethi_invoiceaddressline1");
    removeValidators("ethi_invoiceaddressline2");
    removeValidators("ethi_invoiceprovincestate");
    removeValidators("ethi_invoicepostalcodezipcode");
    removeValidators("ethi_invoicepostalcode");

    addValidator(
      {
        id: 'ethi_invoiceprovincestate',
        type: 'text',
        length: 100,
        required: true,
        validators: [
          {
            validator: validateRequired,
            message_en: invoiceProvinceStateLabel + " " + "{{snippets['ethi-requiredfield']}}",
            message_fr: "Le champ " + invoiceProvinceStateLabel + " " + "{{snippets['ethi-requiredfield']}}"
          }
        ]
      });

    addValidator(
      {
        id: 'ethi_invoicecity',
        type: 'text',
        length: 100,
        required: true,
        validators: [
        ]
      });

    addValidator(
        {
      id: 'ethi_invoiceaddressline1',
      type: 'text',
      length: 100,
      required: true,
      validators: [
      ]
    });
    addValidator(
        {
      id: 'ethi_invoiceaddressline2',
      type: 'text',
      length: 100,
      required: false,
      validators: [
      ]
    });

    addValidator(
      {
        id: 'ethi_invoicepostalcodezipcode',
        type: 'text',
        length: 20,
        required: true,
        validators: [
          {
            validator: validateRequired,
            message_en: invoicePostalCodeZipCodeLabel + " " + "{{snippets['ethi-requiredfield']}}",
            message_fr: "Le champ " + invoicePostalCodeZipCodeLabel + " " + "{{snippets['ethi-requiredfield']}}"
          }
        ]
      });
    $("#ethi_" + param + "province").val("");
    $("#ethi_" + param + "postalcode").val("");
    window.revalidate('ethi_invoiceprovincestate', 'text', { scrollToFirstError: true });
    window.revalidate('ethi_invoicepostalcodezipcode', 'text', { scrollToFirstError: true });
  };

  function getActiveInvoiceCountry(lang) {
    const $sel = $('#ethi_invoicecountry');
    const hasOptions = $sel.find('option').length > 1;               // more than placeholder?
    const hasBilingualData = !!$sel.find('option:eq(1)').data('en'); // set by LookupLoader.load()

    if (hasOptions && hasBilingualData) {
      // Already populated → relabel only (no network)
      LookupLoader.switchLanguage('#ethi_invoicecountry', lang, { resort: true });
    } else {
      // First time (or after hard reload) → fetch from Webapi
      LookupLoader.load({
        select: '#ethi_invoicecountry',
        entitySet: 'ethi_countries',      // EXACT EntitySetName
        idField: 'ethi_countryid',
        enField: 'ethi_englishname',
        frField: 'ethi_frenchname',
        lang
      });
    }
  }

 function getActiveInvoiceProvinces(lang) {
    const $sel = $('#ethi_invoiceprovince');
    const hasOptions = $sel.find('option').length > 1;               // more than placeholder?
    const hasBilingualData = !!$sel.find('option:eq(1)').data('en'); // set by LookupLoader.load()

    if (hasOptions && hasBilingualData) {
      // Already populated → relabel only (no network)
      LookupLoader.switchLanguage('#ethi_invoiceprovince', lang, { resort: true });
    } else {
      // First time (or after hard reload) → fetch from Webapi
      LookupLoader.load({
        select: '#ethi_invoiceprovince',
        entitySet: 'ethi_provinces',      // EXACT EntitySetName
        idField: 'ethi_provinceid',
        enField: 'ethi_englishname',
        frField: 'ethi_frenchname',
        lang
      });
    }
  }
});
