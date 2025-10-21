// SSI Step 1 Ship Agency
window.addEventListener("load", (e) => {
    debugger;
    document.title =   "{{snippets['ethi-ssi-step1']}}"  + " - " +  "{{snippets['ethi-ssi-request-title']}}";
    const styleString = "width:100% ;font-size: 16px; line-height:35px; padding: 0 12px;";
    $(".form-control").attr('style', styleString);
    $("div.top").html("<h2 style = 'padding-bottom: 30px;' >" + "{{snippets['ethi-ssi-step1']}}"+"</h2>");
    $("input:not([type='radio'],[type='button'],[id='wb-srch-q'])").css({"width": "550px"});
    $(".tab-title").css("padding-bottom", "30px");
    $("input").removeAttr("placeholder");
    $("h2[class='tab-title']").hide();
    //$("#wb-lng").attr("class","text-right");
   // $("#wb-srch").attr("class","col-lg-offset-4 col-md-offset-4 col-sm-offset-2 col-xs-12 col-sm-5 col-md-4");
    $('#wb-sm').remove();
    $("div[class='app-bar-mb container visible-xs-block hidden-print']").remove();

  var organizationEmailLabel = $("#ethi_organizationemail_label").text().trim();
  
    var fields = [
      {
        id: 'ethi_nameofshippingagentcompany',
        type: 'text',
        length: 100,
        required: true,
        validators: [
        ]
      },
      {
        id: 'ethi_firstnameofshippingagentrequestingservices',
        type: 'text',
        length: 100,
        required: false,
        validators: [   
        ]
      },
      {
        id: 'ethi_lastnameofshippingagentrequestingservices',
        type: 'text',
        length: 100,
        required: false,
        validators: [     
        ]
      },
      {
        id: 'ethi_organizationphone',
        type: 'text',
        length: 100,
        required: true,
        validators: [
         {
           validator: validatePhoneNumberFormat,
           message_en: "{{snippets['ethi-officenumber']}}",
           message_fr: "{{snippets['ethi-officenumber']}}"
         }      
        ]
      },
      {
        id: 'ethi_organizationphoneextension',
        type: 'text',
        length: 100,
        required: false,
        validators: [
         {
           validator: validatePhoneExtension,
           message_en: "{{snippets['ethi-officeextension']}}",
           message_fr: "{{snippets['ethi-officeextension']}}"
         }      
        ]
      },
      {
        id: 'ethi_secondaryphone',
        type: 'text',
        length: 100,
        required: false,
        validators: [
         {
           validator: validatePhoneNumberFormat,
           message_en: "{{snippets['ethi-cellnumber']}}",
           message_fr: "{{snippets['ethi-cellnumber']}}"
         }      
        ]
      },
      {
        id: 'ethi_organizationemail',
        type: 'text',
        length: 100,
        required: true,
        validators: [
         {
           validator: validateEmailFormat,
           message_en: organizationEmailLabel + " " + "{{snippets['ethi-invalid']}}",
           message_fr: organizationEmailLabel + " " + "{{snippets['ethi-invalid']}}"
         }
        ]
      }      
    ];
  
    addValidators(fields); 
    
   return true;
 });
