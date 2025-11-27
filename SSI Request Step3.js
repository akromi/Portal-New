// SSI Step 3
const SSI_STEP3_PAGE_TITLE = "{{snippets['ethi-ssi-step3']}}" + " - " + "{{snippets['ethi-ssi-request-title']}}";
document.title = SSI_STEP3_PAGE_TITLE;

window.addEventListener("load", (e) => {
  debugger;

  document.title = SSI_STEP3_PAGE_TITLE;

  $("div.top").html("<h2 style = 'padding-bottom: 30px;' >" + "{{snippets['ethi-ssi-step3']}}"+"</h2>")
  $(".tab-title").css("padding-bottom", "30px");
  $("h2[class='tab-title']").hide();
  $("input").removeAttr("placeholder");
  $("#wb-lng").attr("class","text-right");
  $('#wb-sm').remove();
  $("div[class='app-bar-mb container visible-xs-block hidden-print']").remove();
  
  //set focus to document boday
  $('body').attr('tabindex', '-1').focus();
  setTimeout(function () { $('body').removeAttr('tabindex'); }, 0);
  window.WETFocus?.install({ selector: 'h2.tab-title', mode: 'announce' }); // or omit mode to actually focus

  $("select").each(function () {
    if (!$(this).parent().hasClass("select-icon")) {
      $(this).wrap('<div class="select-icon"></div>');
      $(this).after('<i class="fas fa-chevron-down" aria-hidden="true"></i>');
    }
  });

  $('#ethi_uploadshipparticulars_input_file')
    .attr('data-allowed-ext', 'pdf,jpg,png,gif')
    .attr('data-max-bytes',  String(4 * 1024 * 1024));   // 4 MB default

  $('#ethi_existingssc_input_file')
    .attr('data-allowed-ext', 'pdf,jpg,png,gif')
    .attr('data-max-bytes',  String(4 * 1024 * 1024));   // 4 MB default


  if ($("#ethi_otherregistryflag").val()) { $("#ethi_otherregistryflag").parent().parent().show() }
  else { $("#ethi_otherregistryflag").parent().parent().hide() };

  var lan = "{{ website.selected_language.code }}";

  var nettonnageLabel = $("#ethi_nettonnage_label").text().trim();
  var uploadShipParticularsLabel = $("#ethi_uploadshipparticulars_label").text().trim();
  var existingSscLabel = $("#ethi_existingssc_label").text().trim();

  var fields = [
    {
      id: 'ethi_imoregistrationnumber',
      type: 'text',
      length: 8,
      required: true,
      validators: [
        {
          validator: validateIMO,
          message_en: "{{snippets['ethi-imo']}}",
          message_fr: "{{snippets['ethi-imo']}}"
        }
      ]
    },
    {
      id: 'ethi_shipname',
      type: 'text',
      length: 100,
      required: true,
      validators: [
      ]
    },
    {
      id: 'ethi_flaginregistry',
      type: 'lookup',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_shipowner',
      type: 'text',
      length: 100,
      required: true,
      validators: [
      ]
    },
    {
      id: 'ethi_typeofcargo',
      type: 'text',
      length: 100,
      required: false,
      validators: [
      ]
    },
    {
      id: 'ethi_nettonnage', 
      type: 'text',
      length: 100, 
      required: false,
      validators: [
        {
          validator: validatePositiveNumberOnlyMaxSevenDigits,
          message_en: nettonnageLabel + " " + "{{snippets['ethi-tonnage']}}",
          message_fr: nettonnageLabel + " " + "{{snippets['ethi-tonnage']}}"
        }
      ]
    },
    {
      id: 'ethi_numberofholds',
      type: 'text',
      length: 100,
      required: false,
      validators: [
        {
          validator: validatePositiveNumberOnlyMaxSevenDigits,
          message_en: "{{snippets['ethi-holds']}}",
          message_fr: "{{snippets['ethi-holds']}}"
        }
      ]
    },
    {
      id: 'ethi_uploadshipparticulars',
      type: 'file',
      length: 100,
      required: true,
      validators: [
        {
          validator: validateFileSelected,
          message_en: uploadShipParticularsLabel + " " + "{{snippets['ethi-requiredfield']}}",
          message_fr: uploadShipParticularsLabel + " " + "{{snippets['ethi-requiredfield']}}"
        },
        { validator: validateFileSizeZeroByte,   
          message_en: uploadShipParticularsLabel + " " + "This file is empty.", 
          message_fr: uploadShipParticularsLabel + " " + "Ce fichier est vide." 
        },
        {
          validator: validateFileSizeMax,
          message_en: uploadShipParticularsLabel + " " + "{{snippets['ethi-file-size']}}",
          message_fr: uploadShipParticularsLabel + " " + "{{snippets['ethi-file-size']}}"
        },
        {
          validator: validateFileType,
          message_en: uploadShipParticularsLabel + " " + "{{snippets['ethi-file-type']}}",
          message_fr: uploadShipParticularsLabel + " " + "{{snippets['ethi-file-type']}}"
        }
      ]
    },
    {
      id: 'ethi_existingssc',
      type: 'file',
      length: 100,
      required: true,
      validators: [
        {
          validator: validateFileSelected,
          message_en: existingSscLabel + " " + "{{snippets['ethi-requiredfield']}}",
          message_fr: existingSscLabel + " " + "{{snippets['ethi-requiredfield']}}"
        },
        { validator: validateFileSizeZeroByte,   
          message_en: existingSscLabel + " " + "This file is empty.", 
          message_fr: existingSscLabel + " " + "Ce fichier est vide." 
        },
        {
          validator: validateFileSizeMax,
          message_en: existingSscLabel + " " + "{{snippets['ethi-file-size']}}",
          message_fr: existingSscLabel + " " + "{{snippets['ethi-file-size']}}"
        },
        {
          validator: validateFileType,
          message_en: existingSscLabel + " " + "{{snippets['ethi-file-type']}}",
          message_fr: existingSscLabel + " " + "{{snippets['ethi-file-type']}}"
        }
      ]
    }
  ];

  addValidators(fields);

  getRegistryFlag(lan);

  checkOtherRegistryFlag();

  $("#ethi_flaginregistry").on('change', function () {
    checkOtherRegistryFlag();
  });
  
// Base init
patchAllFileControlsForAccessibility();
relabelAllFileUploadControls();
window.FILE_LOG_LEVEL = 'trace'; // or 'info' in PROD
observeFileControls(); // initial pass + watch for redraws

//Also suppress PP’s stock inline file error blocks for these fields

if (window.suppressStockFileErrors) {
    suppressStockFileErrors(['ethi_uploadshipparticulars', 'ethi_existingssc']);
}

if (window.FileStockSuppression && FileStockSuppression.enableForField) {
    FileStockSuppression.enableForField('ethi_uploadshipparticulars');
    FileStockSuppression.enableForField('ethi_existingssc');
}


  return true;

  
  function getRegistryFlag(lang) {
    const $sel = $('#ethi_flaginregistry');
    const hasOptions = $sel.find('option').length > 1;               // more than placeholder?
    const hasBilingualData = !!$sel.find('option:eq(1)').data('en'); // set by LookupLoader.load()

    if (hasOptions && hasBilingualData) {
      // Already populated → relabel only (no network)
      LookupLoader.switchLanguage('#ethi_flaginregistry', lang, { resort: true });
    } else {
      // First time (or after hard reload) → fetch from /_api
      LookupLoader.load({
        select: '#ethi_flaginregistry',
        entitySet: 'ethi_countries',      // EXACT EntitySetName
        idField: 'ethi_countryid',
        enField: 'ethi_englishname',
        frField: 'ethi_frenchname',
        lang
      });
    }
  };

  function checkOtherRegistryFlag() {
    var otherRegistryFlagLabel = $("#ethi_otherregistryflag_label").text().trim();
    if ($("#ethi_flaginregistry").val() == "f8fad702-0328-ef11-840a-000d3af40fa9") {
      $("#ethi_otherregistryflag").parent().parent().show();

      //addAccessibilityMods("ethi_otherregistryflag");

      addValidator(
        {
          id: 'ethi_otherregistryflag',
          type: 'text',
          length: 100,
          required: true,
          validators: [
            {
              validator: validateRequired,
              message_en: otherRegistryFlagLabel + " " + "{{snippets['ethi-requiredfield']}}",
              message_fr: "Le champ " + otherRegistryFlagLabel + " " + "{{snippets['ethi-requiredfield']}}",
            }
          ]
        });
    }
    else {
      removeValidators("ethi_otherregistryflag");

      //removeAccessibilityMods("ethi_otherregistryflag");

      $("#ethi_otherregistryflag").parent().parent().hide();
      $("#ethi_otherregistryflag").val("");
    };
  };

});
