window.addEventListener("load", (e) => {
   debugger;
  document.title =   "{{snippets['ethi-gi-step1-title']}}"  + " - " +  "{{snippets['ethi-gi-report-title']}}";
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


  // Check for html lang attribute and set default if missing
  if (!document.documentElement.hasAttribute('lang')) {
    console.warn('Missing lang attribute on <html> element, setting default to "en"');
    document.documentElement.setAttribute('lang', 'en');
  }

  //$("div.top").attr("style", "display: flex; justify-content: left; align-items: center; height: 200px;").html("<h2>" + "{{snippets['ethi-gi-step1-title']}}" + "</h2>");
  
  $('h2.tab-title')
  .text("{{ snippets['ethi-gi-step1-title'] }}")
  .css({ display:'flex', 'justify-content':'flex-start', 'align-items':'center', height:'80px' });

  $('body').attr('tabindex', '-1').focus();
  setTimeout(function () { $('body').removeAttr('tabindex'); }, 0);

  window.WETFocus?.install({ selector: 'h2.tab-title', mode: 'announce' }); // or omit mode to actually focus
  
  params = new URLSearchParams(window.location.search);
  $("#ethi_stepid").val(params.get("stepid"));

  
   var $basic = document.querySelector('.wb-slc a.wb-sl');
    if ($basic && (!$basic.textContent || /undefined/i.test($basic.textContent))) {
      var fr = (document.documentElement.lang||'').toLowerCase().startsWith('fr');
      $basic.textContent = fr ? 'Version HTML simplifiée' : 'Basic HTML version';
    }

  var curlang = $('html').attr('data-lang') || "en";

  $("input").removeAttr("placeholder");
  
  $("select").css({ "width": "100%" });
  $("input:not([type='radio'])").css({ "width": "100%" });
  $("fieldset:nth-child(6)").hide();
  //accesibility 
  $("#ethi_yourname").attr("autocomplete", "name");
  //$("#ethi_yourtitle").attr("autocomplete", "title");
  $("#ethi_yourtitle").attr("autocomplete", "honorific-prefix");
  $("#ethi_youremailaddress").attr("autocomplete", "email");
  $("#ethi_yourphonenumber").attr("autocomplete", "tel");
  //update web template for accessibility
  //$("#wb-lng").attr("class", "text-right");
  
  //$("#wb-srch").attr("class", "col-lg-offset-4 col-md-offset-4 col-sm-offset-2 col-xs-12 col-sm-5 col-md-4");
    $(".tab-title").css("padding-bottom", "30px");
  
  $('#wb-sm').remove();

  $("div[class='app-bar-mb container visible-xs-block hidden-print']").remove();


  //const styleString = "width:100% ;font-size: 16px; line-height:35px; padding: 0 12px;";
  //$(".form-control").attr('style', styleString);


  $("#ethi_nextcanadadate").attr("type", "date");
  $("#ethi_nextcanadatime").attr("type", "time");
  $("#ethi_embarkationdate").attr("type", "date");
  $("#ethi_disembarkationdate").attr("type", "date");

  //initWetDatePolyfill(['ethi_embarkationdate','ethi_disembarkationdate','ethi_nextcanadadate']);

  $("select").each(function () {
    if (!$(this).parent().hasClass("select-icon")) {
      $(this).wrap('<div class="select-icon"></div>');
      $(this).after('<i class="fas fa-chevron-down" aria-hidden="true"></i>');
    }
  });


  if ($("#ethi_othernextcanadianport").val()) { $("#ethi_othernextcanadianport").parent().parent().show() }
  else { $("#ethi_othernextcanadianport").parent().parent().hide() };

  const captainsEmailAddressLabel = $("#ethi_captainsemailaddress_label").text().trim();
  const medicalContactEmailAddressLabel = $("#ethi_medicalcontactemailaddress_label").text().trim();
  const yourPhoneNumberLabel = $("#ethi_yourphonenumber_label").text().trim();
  const yourTitleLabel = $("#ethi_yourtitle_label").text().trim();
  const yourEmailAddressLabel = $("#ethi_youremailaddress_label").text().trim();
  const yourNameLabel = $("#ethi_yourname_label").text().trim();  
  const nextCanadaDateLabel = $("#ethi_nextcanadadate").text().trim();

  var fields = [
    {
      id: 'ethi_imo',
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
      id: 'ethi_cruiselinename',
      type: 'lookup',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_vesselname',
      type: 'lookup',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_captainsname',
      type: 'text',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_captainsemailaddress',
      type: 'text',
      length: 100,
      required: true,
      validators: [
        {
          validator: validateEmailFormat,
          message_en: captainsEmailAddressLabel + " " + "{{snippets['ethi-invalid']}}",
          message_fr: captainsEmailAddressLabel + " " + "{{snippets['ethi-invalid']}}",
        }
      ]
    },
    {
      id: 'ethi_shipphonenumber',
      type: 'text',
      length: 10,
      required: true,
      validators: [
        {
          validator: validateRequired

        },
        {
          validator: validatePhoneDigitsCount,
          message_en: "{{snippets['ethi-gi-shipphone']}}",
          message_fr: "{{snippets['ethi-gi-shipphone']}}",
        }
      ]
    },
    {
      id: 'ethi_shipfaxnumber',
      type: 'text',
      length: 10,
      required: false,
      validators: [
        {
          validator: validatePhoneDigitsCount,
          message_en: "{{snippets['ethi-gi-shipfax']}}",
          message_fr: "{{snippets['ethi-gi-shipfax']}}",
        }
      ]
    },
    {
      id: 'ethi_lastport',
      type: 'text',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_nextport',
      type: 'lookup',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_voyagenumber',
      type: 'text',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_reporttype',
      type: 'lookup',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_nextcanadadate',
      type: 'date',
      length: 10,
      required: true,
      validators: [
      {
          validator: validateDateOnly,
          message_en: nextCanadaDateLabel + " " + "{{snippets['ethi-invalid']}}",
          message_fr: nextCanadaDateLabel + " " + "{{snippets['ethi-invalid']}}"
      },
      {
          validator: function () { return compare2Dates('ethi_nextcanadadate', 'ethi_disembarkationdate'); },
          message_en: "{{snippets['ethi-gi-nextportdate']}}",
          message_fr: "{{snippets['ethi-gi-nextportdate']}}"
      }
      ]
    },
    {
      id: 'ethi_nextcanadatime',
      type: 'time',
      length: 10,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_embarkationdate',
      type: 'text',
      length: 10,
      required: true,
      validators: [
        {
          validator: function () { return compare2Dates('ethi_embarkationdate', 'ethi_disembarkationdate'); },
          message_en: "{{snippets['ethi-gi-embarkationdate']}}",
          message_fr: "{{snippets['ethi-gi-embarkationdate']}}"
        }
      ]
    },
    {
      id: 'ethi_disembarkationdate',
      type: 'text',
      length: 10,
      required: true,
      validators: [
        {
          validator: function () { return compare2Dates('ethi_embarkationdate', 'ethi_disembarkationdate'); },
          message_en: "{{snippets['ethi-gi-embarkationdate']}}",
          message_fr: "{{snippets['ethi-gi-embarkationdate']}}"
        }
      ]
    },
    {
      id: 'ethi_embarkationdate',
      type: 'date',
      length: 10,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_totalnumberofpassengersonboard',
      type: 'number',
      length: 8,
      required: true,
      validators: [
        {
          validator: validatePositiveNumberOnly,
          message_en: "{{snippets['ethi-total-passenger']}}",
          message_fr: "{{snippets['ethi-total-passenger']}}",
        },
        {
          validator: function () { return compare2Number('ethi_totalnumberofpassengersonboard', 'ethi_numberofpassengergastrointestinalcases'); },
          message_en: "{{snippets['ethi-gi-passengercase']}}",
          message_fr: "{{snippets['ethi-gi-passengercase']}}"
        }
      ]
    },
    {
      id: 'ethi_numberofpassengergastrointestinalcases',
      type: 'number',
      length: 8,
      required: true,
      validators: [
        {
          validator: validatePositiveNumberOnly,
          message_en: "{{snippets['ethi-gi-totalpassenger']}}",
          message_fr: "{{snippets['ethi-gi-totalpassenger']}}",
        },
        {
          validator: function () { return compare2Number('ethi_totalnumberofpassengersonboard', 'ethi_numberofpassengergastrointestinalcases'); },
          message_en: "{{snippets['ethi-gi-passengercase']}}",
          message_fr: "{{snippets['ethi-gi-passengercase']}}"
        }
      ]
    },
    {
      id: 'ethi_totalnumberofcrewonboard',
      type: 'number',
      length: 8,
      required: true,
      validators: [
        {
          validator: validatePositiveNumberOnly,
          message_en: "{{snippets['ethi-total-crew']}}",
          message_fr: "{{snippets['ethi-total-crew']}}",
        },
        {
          validator: function () { return compare2Number('ethi_totalnumberofcrewonboard', 'ethi_numberofcrewgastrointestinalcases'); },
          message_en: "{{snippets['ethi-crewcase']}}",
          message_fr: "{{snippets['ethi-crewcase']}}"
        }
      ]
    },
    {
      id: 'ethi_numberofcrewgastrointestinalcases',
      type: 'number',
      length: 8,
      required: true,
      validators: [
        {
          validator: validatePositiveNumberOnly,
          message_en: "{{snippets['ethi-gi-totalcrew']}}",
          message_fr: "{{snippets['ethi-gi-totalcrew']}}",
        },
        {
          validator: function () { return compare2Number('ethi_totalnumberofcrewonboard', 'ethi_numberofcrewgastrointestinalcases'); },
          message_en: "{{snippets['ethi-crewcase']}}",
          message_fr: "{{snippets['ethi-crewcase']}}"
        }
      ]
    },
    {
      id: 'ethi_medicalcontacttitle',
      type: 'text',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_medicalcontactname',
      type: 'text',
      length: 100,
      required: true,
      validators: [validateRequired]
    },
    {
      id: 'ethi_medicalcontactphonenumber',
      type: 'text',
      length: 10,
      required: true,
      validators: [
        {
          validator: validatePhoneDigitsCount,
          message_en: "{{snippets['ethi-gi-medicalphone']}}",
          message_fr: "{{snippets['ethi-gi-medicalphone']}}",
        }
      ]
    },
    {
      id: 'ethi_medicalcontactemailaddress',
      type: 'text',
      length: 100,
      required: true,
      validators: [
        {
          validator: validateEmailFormat,
          message_en: medicalContactEmailAddressLabel + " " + "{{snippets['ethi-invalid']}}",
          message_fr: medicalContactEmailAddressLabel + " " + "{{snippets['ethi-invalid']}}",
        }
      ]
    }
  ];
  addValidators(fields);

// Enforce input rules + strip punctuation on blur
enableStrictPhoneInput(['ethi_shipphonenumber']);
enableStrictPhoneInput(['ethi_shipfaxnumber']);
enableStrictPhoneInput(['ethi_medicalcontactphonenumber']);

// Keep the combined hidden field in sync (YYYY-MM-DD HH:MM)
wirePortalComposite({
  dateId:  'ethi_nextcanadadate',
  timeId:  'ethi_nextcanadatime',
  portalId:'ethi_nextcanadadateandtimeportal'
});

  checkNextPort();

  $("#ethi_nextport").on('change', function () {
    checkNextPort();
  });

WET4.patchRadioGroup('ethi_submitterismedicalcontact');

  checkSubmissionBy();

  $('input[type="radio"]').on('change', function () {
    checkSubmissionBy();
  });



  //Add autocomplete  
  // Global array used by the autocomplete
  var shipOwnerArray = [];
  //1. Vessel name
  var apiUrl = '/_api/ethi_ships'; // Power Pages OData endpoint
  $("#ethi_cruiselinename").parent().append('<div id = "owner-list"></div>');
  let currentIndex = -1;
  let currentIndex1 = -1;

  fetchShipList();

  $('#ethi_cruiselinename').on('input', function () {
    $("#ethi_vesselname").val("");
    $("#owner-list").empty();
    if ($(this).val().length == 0)
      return;
    const inputValue = $(this).val().toLowerCase();
    const matchingItems = shipOwnerArray.filter(shipOwner =>
      shipOwner.toLowerCase().startsWith(inputValue)
    );
    let filtered = matchingItems.filter((item, index) => matchingItems.indexOf(item) === index);
    $.each(filtered, function (index, item) {
      $("<div>")
        .addClass("autocomplete-item")
        .attr("data-index", index)
        .text(item)
        .appendTo($("#owner-list"))
        .on("click", function () {
          //debugger;
          $("#ethi_cruiselinename").val($(this).text());
          $("#owner-list").empty(); // Close dropdown
        });
    });
    currentIndex = -1;
  });

  $("#ethi_cruiselinename").on("keydown", function (e) {
    //debugger;
    let items = $(".autocomplete-item");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % items.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentIndex > -1 && items.eq(currentIndex).length) {
        $("#ethi_cruiselinename").val(items.eq(currentIndex).text());
        $("#owner-list").empty(); // Close dropdown
      }
      //$(this).trigger('change'); //to clear pending inline error(s)
    } else if (e.key === "Escape") {
      $("#owner-list").empty(); // Close dropdown
    }
    items.removeClass("highlight");
    if (currentIndex > -1) {
      items.eq(currentIndex).addClass("highlight");
    }
  });

  //2. Facilities
  $("#ethi_vesselname").parent().append('<div id = "vessel-list"></div>');
  $('#ethi_vesselname').on('input', function () {
    //debugger;
    var items, matchingItems;
    $("#vessel-list").empty();
    if ($(this).val().length == 0)
      return;
    const inputValue = $(this).val().toLowerCase();
    matchingItems = facilityArray.filter(facility =>
      facility.ethi_facility.toLowerCase().startsWith(inputValue))
      .map(facility => facility.ethi_facility);
    let filtered = matchingItems.filter((item, index) => matchingItems.indexOf(item) === index);
    $.each(filtered, function (index, item) {
      $("<div>")
        .addClass("autocomplete-item")
        .attr("data-index", index)
        .text(item)
        .appendTo($("#vessel-list"))
        .on("click", function () {
          //debugger;
          $("#ethi_vesselname").val($(this).text());
          $("#vessel-list").empty(); // Close dropdown
        });
    });
    currentIndex1 = -1;
  });

  $("#ethi_vesselname").focus(function () {
    //debugger;
    var matchingItems;
    $("#vessel-list").empty();
    var inputValue = $("#ethi_cruiselinename").val().toLowerCase();
    if (!inputValue)
      return;
    matchingItems = facilityArray.filter(facility =>
      facility.ethi_owner.toLowerCase().startsWith(inputValue))
      .map(facility => facility.ethi_facility);
    if (matchingItems.length == 0) return;
    let filtered = matchingItems.filter((item, index) => matchingItems.indexOf(item) === index);
    $.each(filtered, function (index, item) {
      $("<div>")
        .addClass("autocomplete-item")
        .attr("data-index", index)
        .text(item)
        .appendTo($("#vessel-list"))
        .on("click", function () {
          //debugger;
          $("#ethi_vesselname").val($(this).text());
          $("#vessel-list").empty(); // Close dropdown
        });
    });
    currentIndex1 = -1;
  });

  $("#ethi_vesselname").on("keydown", function (e) {
    //debugger;
    let items = $(".autocomplete-item");
    if (e.key === "ArrowDown") {
      //debugger;
      e.preventDefault();
      currentIndex1 = (currentIndex1 + 1) % items.length;
    } else if (e.key === "ArrowUp") {
      //debugger;
      e.preventDefault();
      currentIndex1 = (currentIndex1 - 1 + items.length) % items.length;
    } else if (e.key === "Enter") {
      //debugger;
      e.preventDefault();
      if (currentIndex1 > -1 && items.eq(currentIndex1).length) {
        $("#ethi_vesselname").val(items.eq(currentIndex1).text());
        $("#vessel-list").empty(); // Close dropdown
      }
      //$(this).trigger('change'); //to clear pending inline error(s)
    } else if (e.key === "Escape") {
      $("#vessel-list").empty(); // Close dropdown
    }
    items.removeClass("highlight");
    if (currentIndex1 > -1) {
      items.eq(currentIndex1).addClass("highlight");
    }
  });

  //Get active ports (Service locations with type Port)
  getActiveCanadianPorts(curlang);

  return true;

  function checkNextPort() {
    var otherNextPortLabel = $("#ethi_othernextcanadianport_label").text().trim();
    if ($("#ethi_nextport").val() == "03fb7ebd-13e3-ef11-9342-6045bdf97903") {
      $("#ethi_othernextcanadianport").parent().parent().show();

      //addAccessibilityMods("ethi_othernextcanadianport");

      addValidator(
        {
          id: 'ethi_othernextcanadianport',
          type: 'text',
          length: 100,
          required: true,
          validators: [
            {
              validator: validateRequired,
              message_en: otherNextPortLabel + " " + "{{snippets['ethi-requiredfield']}}",
              message_fr: otherNextPortLabel + " " + "{{snippets['ethi-requiredfield']}}",
            }
          ]
        });
    }
    else {
      removeValidators("ethi_othernextcanadianport");

      //removeAccessibilityMods("ethi_othernextcanadianport");

      $("#ethi_othernextcanadianport").parent().parent().hide();
      $("#ethi_othernextcanadianport").val("");
    };
  };

  function checkSubmissionBy() {
    if ($("#ethi_submitterismedicalcontact_1").is(':checked')) {
      removeValidators("ethi_yourname");
      removeValidators("ethi_yourtitle");
      removeValidators("ethi_youremailaddress");
      removeValidators("ethi_yourphonenumber");
      $("fieldset:nth-child(5)").hide();
      $("#ethi_yourname").val("");
      $("#ethi_yourtitle").val("");
      $("#ethi_youremailaddress").val("");
      $("#ethi_yourphonenumber").val("");
    }
    if ($("#ethi_submitterismedicalcontact_0").is(':checked')) {
      //remove validators just incase they exist before adding the new ones.
      removeValidators("ethi_yourname");
      removeValidators("ethi_yourtitle");
      removeValidators("ethi_youremailaddress");
      removeValidators("ethi_yourphonenumber");
      $("fieldset:nth-child(5)").show();
      addValidator(
        {
          id: 'ethi_yourname',
          type: 'text',
          length: 100,
          required: true,
          validators: [
            {
              validator: validateRequired,
              message_en: yourNameLabel + " " + "{{snippets['ethi-requiredfield']}}",
              message_fr: "Le champ " + yourNameLabel + " " + "{{snippets['ethi-requiredfield']}}",
            }
          ]
        });
      addValidator(
        {
          id: 'ethi_yourtitle',
          type: 'text',
          length: 100,
          required: true,
          validators: [
            {
              validator: validateRequired,
              message_en: yourTitleLabel + " " + "{{snippets['ethi-requiredfield']}}",
              message_fr: "Le champ " + yourTitleLabel + " " + "{{snippets['ethi-requiredfield']}}",
            }
          ]
        });
      addValidator(
        {
          id: 'ethi_youremailaddress',
          type: 'text',
          length: 100,
          required: true,
          validators: [
            {
              validator: validateRequired,
              message_en: yourEmailAddressLabel + " " + "{{snippets['ethi-requiredfield']}}",
              message_fr: "Le champ " + yourEmailAddressLabel + " " + "{{snippets['ethi-requiredfield']}}",
            },
            {
              validator: validateEmailFormat,
              message_en: yourEmailAddressLabel + " " + "{{snippets['ethi-invalid']}}",
              message_fr: "Le champ " + yourEmailAddressLabel + " " + "{{snippets['ethi-invalid']}}",
            }
          ]
        });
      addValidator(
        {
          id: 'ethi_yourphonenumber',
          type: 'text',
          length: 10,
          required: true,
          validators: [
            {
              validator: validateRequired,
              message_en: yourPhoneNumberLabel + " " + "{{snippets['ethi-requiredfield']}}",
              message_fr: "Le champ " + yourPhoneNumberLabel + " " + "{{snippets['ethi-requiredfield']}}",
            },
            {
              validator: validatePhoneDigitsCount,
              message_en: yourPhoneNumberLabel + " " + "{{snippets['ethi-yournumber']}}",
              message_fr: "Le champ " + yourPhoneNumberLabel + " " + "{{snippets['ethi-yournumber']}}",
            }
          ]
        });
        // Enforce input rules + strip punctuation on blur
        enableStrictPhoneInput(['ethi_yourphonenumber']);  
    };
  };



  function fetchShipList() {
    // Build OData query:
    //  - Only select the fields we actually use
    //  - Filter to ACTIVE records only (statecode eq 0)
    var url = apiUrl +
      "?$select=ethi_shipowner,ethi_shipname,statecode" +
      "&$filter=statecode eq 0"; // 0 = Active

    webapi.safeAjax({
      type: 'GET',
      url: url,
      dataType: 'json',
      success: function (data) {
        if (!data || !data.value) {
          console.error('[ships] Invalid data format received from', url, data);
          return;
        }

        var rows = Array.isArray(data.value) ? data.value : [];

        // Build shipOwnerArray from ACTIVE records only
        shipOwnerArray = rows
          .map(function (record) {
            return record.ethi_shipowner;
          })
          .filter(function (name) {
            return !!name; // drop null/empty
          })
          .filter(function (name, idx, arr) {
            // make unique
            return arr.indexOf(name) === idx;
          })
          .sort(function (a, b) {
            return a.localeCompare(b);
          });

        // Build facilityArray mapping owner → vessel (also implicitly active only)
        facilityArray = rows.map(function (record) {
          return {
            ethi_owner: record.ethi_shipowner,
            ethi_facility: record.ethi_shipname
          };
        });

        console.log('[ships] Loaded active ship owners:', shipOwnerArray.length);
        console.log('[ships] Loaded facilities:', facilityArray.length);
      },
      error: function (xhr, status, error) {
        console.error('[ships] Failed to fetch ship list:', error || status, xhr);
      }
    });
  }

// Call LookupLoader.load to populate #ethi_nextport 
function getActiveCanadianPorts(lang) {
  const filter = [
    "statecode eq 0",
    "(" +
      "ethi_servicelocationtype eq 992800000 or " +
      "ethi_servicelocationtype eq 992800001 or " +
      "ethi_servicelocationtype eq 992800002" +
    ")",
    "ethi_travellingpublicprogram eq true",
    "_ethi_country_value eq f23dc860-6f39-ef11-a317-000d3af44283"
  ].join(" and ");

  return LookupLoader.load({
    select: '#ethi_nextport',
    entitySet: 'ethi_servicelocations',      // EXACT EntitySetName
    idField: 'ethi_servicelocationid',
    enField: 'ethi_nameenglish',
    frField: 'ethi_namefrench',
    filter,
    lang
  });
}


});
