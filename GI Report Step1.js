$(document).ready(function(){
    debugger;

    document.title =   "{{snippets['ethi-gi-step1-title']}}" + " - " + "{{snippets['ethi-gi-report-title']}}";

    // Ensure <html lang> attribute is set
    if (!document.documentElement.hasAttribute('lang')) {
        console.warn('Missing lang attribute on <html> element, setting default to "en"');
        document.documentElement.setAttribute('lang', 'en');
    }

    // Update title and tab header for accessibility
    $('h2.tab-title').text("{{ snippets['ethi-gi-step1-title'] }}")
        .css({ display: 'flex', 'justify-content': 'flex-start', 'align-items': 'center', height: '80px' });

    // Set input type attributes for native date and time fields
    $("#ethi_nextcanadadate").attr("type", "date");
    $("#ethi_nextcanadatime").attr("type", "time");
    $("#ethi_embarkationdate").attr("type", "date");
    $("#ethi_disembarkationdate").attr("type", "date");

    // Accessibility enhancements for date and time fields
    $("#ethi_nextcanadadate, #ethi_embarkationdate, #ethi_disembarkationdate").each(function () {
        $(this).attr({
            'aria-label': 'Date input',
            'aria-describedby': `${this.id}_error`,
            'aria-required': true
        });
    });

    $("#ethi_nextcanadatime").attr({
        'aria-label': 'Time input',
        'aria-describedby': 'ethi_nextcanadatime_error',
        'aria-required': true
    });

    // Synchronize date and time fields for "next Canada date and time"
    wirePortalComposite({
        dateId: 'ethi_nextcanadadate',
        timeId: 'ethi_nextcanadatime',
        portalId: 'ethi_nextcanadadateandtimeportal'
    });

    // Remove placeholders for better accessibility
    $("input").removeAttr("placeholder");

    // Validation and error handling for date and time fields
    const fields = [
        {
            id: 'ethi_nextcanadadate',
            type: 'date',
            length: 10,
            required: true,
            validators: [
                {
                    validator: validateDateOnly,
                    message_en: "The date entered is invalid.",
                    message_fr: "La date saisie est invalide."
                },
                {
                    validator: function () { return compare2Dates('ethi_nextcanadadate', 'ethi_disembarkationdate'); },
                    message_en: "The next Canada date must be after the disembarkation date.",
                    message_fr: "La date d'arrivée au Canada doit être après la date de débarquement."
                }
            ]
        },
        {
            id: 'ethi_nextcanadatime',
            type: 'time',
            length: 10,
            required: true,
            validators: [
                {
                    validator: validateRequired,
                    message_en: "The time is required.",
                    message_fr: "L'heure est requise."
                }
            ]
        }
    ];

    addValidators(fields);

    // Dynamic dropdown updates for ports
    getActiveCanadianPorts($('html').attr('data-lang') || 'en');

    // Other dynamic form behaviors
    $("#ethi_nextport").on('change', function () {
        checkNextPort();
    });

    function checkNextPort() {
        const otherNextPortLabel = $("#ethi_othernextcanadianport_label").text().trim();
        if ($("#ethi_nextport").val() === "03fb7ebd-13e3-ef11-9342-6045bdf97903") {
            $("#ethi_othernextcanadianport").parent().parent().show();
            addValidator({
                id: 'ethi_othernextcanadianport',
                type: 'text',
                required: true,
                validators: [
                    {
                        validator: validateRequired,
                        message_en: `${otherNextPortLabel} is required`,
                        message_fr: `Le champ ${otherNextPortLabel} est requis.`
                    }
                ]
            });
        } else {
            removeValidators("ethi_othernextcanadianport");
            $("#ethi_othernextcanadianport").parent().parent().hide();
        }
    }

    function getActiveCanadianPorts(lang) {
        LookupLoader.load({
            select: '#ethi_nextport',
            entitySet: 'ethi_servicelocations',
            idField: 'ethi_servicelocationid',
            enField: 'ethi_nameenglish',
            frField: 'ethi_namefrench',
            filter: "statecode eq 0",
            lang
        });
    }
});
