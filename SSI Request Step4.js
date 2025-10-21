// SSI Step 4 
window.addEventListener("load", (e) => {
  debugger;
  document.title = "{{snippets['ethi-ssi-step4']}}" + " - " + "{{snippets['ethi-ssi-request-title']}}";

  $("div.top").html("<h2 style = 'padding-bottom: 30px;' >" + "{{snippets['ethi-ssi-step4']}}" + "</h2>");

  $(".tab-title").css("padding-bottom", "30px");
  $("span[role='button']").css("float", "left");

  $("h2[class='tab-title']").hide();
  $("fieldset:nth-child(2)").hide();

  $('#wb-sm').remove();
  $("div[class='app-bar-mb container visible-xs-block hidden-print']").remove();
  //this makes the comments box more responsive.
  $('#ethi_additionalcomments').removeAttr('cols');

  $("#ethi_vesselexpecteddeparturedateandtime").hide();
  $("input").removeAttr("placeholder");

  $("#ethi_vesselexpectedarrivaldate").attr("type", "date");
  $("#ethi_vesselexpecteddeparturedate").attr("type", "date");
  $("#ethi_certificatesexpiresdate").attr("type", "date");
  $("#ethi_vesselexpectedarrivaldate").attr("max", "2100-12-31");
  $("#ethi_vesselexpectedarrivaldate").attr("min", "2000-12-31");
  $("#ethi_vesselexpecteddeparturedate").attr("max", "2100-12-31");
  $("#ethi_vesselexpecteddeparturedate").attr("min", "2000-12-31");

  var lan = "{{ website.selected_language.code }}";

  $("select").each(function () {
    if (!$(this).parent().hasClass("select-icon")) {
      $(this).wrap('<div class="select-icon"></div>');
      $(this).after('<i class="fas fa-chevron-down" aria-hidden="true"></i>');
    }
  });

  var fields = [
    {
      id: 'ethi_serviceprovince',
      type: 'lookup',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_servicecityname',
      type: 'text',
      length: 100,
      required: true,
      validators: [
      ]
    },
    {
      id: 'ethi_servicelocation',
      type: 'text',
      length: 100,
      required: true,
      validators: [
      ]
    },
    {
      id: 'ethi_dock',
      type: 'text',
      length: 100,
      required: false,
      validators: [
      ]
    },
    {
      id: 'ethi_vesselexpectedarrivaldate',
      type: 'text',
      length: 100,
      required: false,
      validators: [
        {
          validator: function () { return compare2Dates('ethi_vesselexpectedarrivaldate', 'ethi_vesselexpecteddeparturedate'); },
          message_en: "{{snippets['ethi-arrival-compare']}}",
          message_fr: "{{snippets['ethi-arrival-compare']}}"
        }
      ]
    },
    {
      id: 'ethi_vesselexpecteddeparturedate',
      type: 'text',
      length: 100,
      required: false,
      validators: [
        {
          validator: function () { return compare2Dates('ethi_vesselexpectedarrivaldate', 'ethi_vesselexpecteddeparturedate'); },
          message_en: "{{snippets['ethi-departure-compare']}}",
          message_fr: "{{snippets['ethi-departure-compare']}}"
        }
      ]
    },
    {
      id: 'ethi_previousportofcall',
      type: 'text',
      length: 100,
      required: true,
      validators: [
      ]
    },
    {
      id: 'ethi_nextportofcall',
      type: 'text',
      length: 100,
      required: false,
      validators: [
      ]
    },
    {
      id: 'ethi_certificatesexpiresdate',
      type: 'text',
      length: 100,
      required: false,
      validators: [

      ]
    },
    {
      id: 'ethi_additionalcomments',
      type: 'text',
      length: 2000,
      required: false,
      validators: [

      ]
    }
  ];

  addValidators(fields);

  getActiveProvinces(lan);

  return true;


 function getActiveProvinces(lang) {
    const $sel = $('#ethi_serviceprovince');
    const hasOptions = $sel.find('option').length > 1;               // more than placeholder?
    const hasBilingualData = !!$sel.find('option:eq(1)').data('en'); // set by LookupLoader.load()

    if (hasOptions && hasBilingualData) {
      // Already populated → relabel only (no network)
      LookupLoader.switchLanguage('#ethi_serviceprovince', lang, { resort: true });
    } else {
      // First time (or after hard reload) → fetch from /_api
      LookupLoader.load({
        select: '#ethi_serviceprovince',
        entitySet: 'ethi_provinces',      // EXACT EntitySetName
        idField: 'ethi_provinceid',
        enField: 'ethi_englishname',
        frField: 'ethi_frenchname',
        lang
      });
    }
  }


});
