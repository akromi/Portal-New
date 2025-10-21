// // SSI Step 2 Invoicing
window.addEventListener("load", (e) => {
  debugger;
  document.title =   "{{snippets['ethi-ssi-step2']}}" + " - " + "{{snippets['ethi-ssi-request-title']}}";

  //const styleString = "width:100% ;font-size: 16px; line-height:35px; padding: 0 12px;";
  //$(".form-control").attr('style', styleString);

  $("div.top").html("<h2 style = 'padding-bottom: 30px;' >" + "{{snippets['ethi-ssi-step2']}}" + "</h2>");
  $(".tab-title").css("padding-bottom", "30px");
 // $("input:not([type='radio']):not([type='button']):not([id='wb-srch-q'])").css({ "width": "550px" });
  //$("select").css({ "width": "550px" })
  $("h2[class='tab-title']").hide();
  $("input").removeAttr("placeholder");
  //$("#wb-lng").attr("class", "text-right");
  //$("#wb-srch").attr("class", "col-lg-offset-4 col-md-offset-4 col-sm-offset-2 col-xs-12 col-sm-5 col-md-4");
  $('#wb-sm').remove();
  $("div[class='app-bar-mb container visible-xs-block hidden-print']").remove();


  $("select").each(function () {
    if (!$(this).parent().hasClass("select-icon")) {
      $(this).wrap('<div class="select-icon"></div>');
      $(this).after('<i class="fas fa-chevron-down" aria-hidden="true"></i>');
    }
  });

  //Patch dropdowns to show the chevron.
  // document.querySelectorAll('.crmEntityFormView .control select.form-control')
  // .forEach(el => el.classList.add('select--bg-arrow'));


  var curLang = $('html').attr('data-lang') || "en";

  var lan = "{{ website.selected_language.code }}";
  // let countries = $("select#ethi_invoicecountry option");
  // getNameFromDropdown(lan, countries);
  //let provinces = $("select#ethi_invoiceprovince option");
  //getNameFromDropdown(lan, provinces);

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
          message_fr: businessNumberLabel + " " + "{{snippets['ethi-businessnumber']}}"
        }
      ]
    },
    {
      id: 'ethi_invoicecountry',
      type: 'lookup',
      length: 100,
      required: true,
      validators: [validateRequired],
      message_en: invoiceCountryLabel + " " + "{{snippets['ethi-requiredfield']}}",
      message_fr: invoiceCountryLabel + " " + "{{snippets['ethi-requiredfield']}}"
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
          message_fr: invoiceProvinceStateLabel + " " + "{{snippets['ethi-requiredfield']}}"
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
    //,
    // {
    //   id: 'ethi_invoicepostalcode',
    //   type: 'text',
    //   length: 100,
    //   required: true,
    //   validators: [
    //     {
    //       validator: validateRequired,
    //       message_en: invoicePostalCodeLabel + " " + "{{snippets['ethi-requiredfield']}}",
    //       message_fr: invoicePostalCodeLabel + " " + "{{snippets['ethi-requiredfield']}}"
    //     },
    //     {
    //       validator: validateCanadianPostal,
    //       message_en: invoicePostalCodeLabel + " " + "{{snippets['ethi-postalcode']}}",
    //       message_fr: invoicePostalCodeLabel + " " + "{{snippets['ethi-postalcode']}}"
    //     }
    //   ]
    // },
    // {
    //   id: 'ethi_invoicepostalcodezipcode',
    //   type: 'text',
    //   length: 20,
    //   required: true,
    //   validators: [
    //     {
    //       validator: validateRequired,
    //       message_en: invoicePostalCodeZipCodeLabel + " " + "{{snippets['ethi-requiredfield']}}",
    //       message_fr: invoicePostalCodeZipCodeLabel + " " + "{{snippets['ethi-requiredfield']}}"
    //     }
    //   ]
    // }
  ];
  addValidators(fields);

WET4.patchRadioGroup('ethi_canadiancoastguard');

  checkCoastGuard();

  $('input[type="radio"]').on('change', function () {
    checkCoastGuard();
  });

  LoadInvoiceCountry();

  $("#ethi_invoicecountry").change(function () {
    removeValidators("ethi_invoiceprovincestate");
    removeValidators("ethi_invoicepostalcodezipcode");
    removeValidators("ethi_invoiceprovince");
    removeValidators("ethi_invoicepostalcode");
    var value = $(this).val();
    if (value == "f23dc860-6f39-ef11-a317-000d3af44283") { ShowCanadaProvince2("invoice"); } else { ShowOtherProvince2("invoice"); };
    LoadInvoiceCountry();
  }).trigger('change'); // initialize state on load

  getActiveInvoiceCountry(curLang);

  getActiveInvoiceProvinces(curLang);

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
function LoadInvoiceCountry() {
  if ($("#ethi_invoicecountry").val() == "f23dc860-6f39-ef11-a317-000d3af44283"){ 
    ShowCanadaProvince2("invoice");
  }
  else { ShowOtherProvince2("invoice"); };
};

  function ShowCanadaProvince2(param) {
    $("div #ethi_" + param + "provincestate_label").closest('tr').hide(); //.parent().parent().hide //.css("display", "none");
    $("div #ethi_" + param + "postalcodezipcode_label").closest('tr').hide(); //.parent().parent().hide //.css("display", "none");
    $("div #ethi_" + param + "province_label").closest('tr').show(); //.parent().parent().show //.css("display", "block");
    $("div #ethi_" + param + "postalcode_label").closest('tr').show(); //.parent().parent().show //.css("display", "block");

    removeValidators("ethi_" + param + "province");
    removeValidators("ethi_" + param + "postalcode");
    removeValidators("ethi_" + param + "provincestate");
    removeValidators("ethi_" + param + "postalcodezipcode");

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

    getActiveInvoiceProvinces(curLang);

  };

  function ShowOtherProvince2(param) {
    $("div #ethi_" + param + "provincestate_label").closest('tr').show(); //.parent().parent().show //.css("display", "block");
    $("div #ethi_" + param + "postalcodezipcode_label").closest('tr').show(); //.parent().parent().show //.css("display", "block");
    $("div #ethi_" + param + "province_label").closest('tr').hide(); //.parent().parent().hide //.css("display", "none");
    $("div #ethi_" + param + "postalcode_label").closest('tr').hide(); //.parent().parent().hide //.css("display", "none");

    removeValidators("ethi_" + param + "province");
    removeValidators("ethi_" + param + "postalcode");
    removeValidators("ethi_" + param + "provincestate");
    removeValidators("ethi_" + param + "postalcodezipcode");

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
