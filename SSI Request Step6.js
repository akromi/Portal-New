//Step6 Confirmation
//$(function() {
const SSI_STEP6_PAGE_TITLE = "{{snippets['ethi-ssi-request-confirmation']}}" + " - " + "{{snippets['ethi-ssi-request-title']}}";
document.title = SSI_STEP6_PAGE_TITLE;

window.addEventListener("load", (e) => {
    debugger;
    document.title = SSI_STEP6_PAGE_TITLE;
    //$("#wb-lng").attr("class","text-right");
   // $("#wb-srch").attr("class","col-lg-offset-4 col-md-offset-4 col-sm-offset-2 col-xs-12 col-sm-5 col-md-4");
    $('#wb-sm').remove();
    $("div[class='app-bar-mb container visible-xs-block hidden-print']").remove();
       $("input").removeAttr("placeholder");
    //set focus to document boday
    $('body').attr('tabindex', '-1').focus();
    setTimeout(function () { $('body').removeAttr('tabindex'); }, 0);
    window.WETFocus?.install({ selector: 'h2.tab-title', mode: 'announce' }); // or omit mode to actually focus


    const utcDateTime =$("#ethi_submittimeutc").val();
    $("#ethi_submittimeutc").hide();
    $("#ethi_shipname").hide();
    $("#ethi_name").hide();
    var confirm = "{{snippets['ethi-ssi-confirmation']}}".replace("bb",'<b>' + utcDateTime + '</b>');
     confirm = confirm.replace("aa",'<b>'+ $("#ethi_shipname").val()+'</b>') ;
     confirm = confirm.replace("dd",'<b>'+ $("#ethi_name").val()+ '</b>');
    $("legend.section-title").html("");
    $("h2.tab-title").html("");
    $('#ethi_shipname').after('<div style="font-size: 20px" >' + confirm + '</div>');
    $("div.top").css('align-items', 'center').html("<h2>Confirmation</h2>");  
    
    $("#PreviousButton").removeAttr("onclick").val("{{snippets['ethi-print']}}");
    const request = "{{snippets['ethi-ssi-request']}}";
    $("#NextButton").val(request);

    $('#PreviousButton').off('click') 
    .on('click', function (e) {
       e.preventDefault();
       window.print(); // Add the new click handler
    });

    $('#NextButton').off('click').on('click', function(e) {
        e.preventDefault();
        const currentUrl = new URL(window.location.href);
        // Get the URL without parameters
        const url = currentUrl.origin + currentUrl.pathname;
        window.location.href = url;
    });
});
