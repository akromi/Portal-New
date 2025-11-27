// recaptcha.js
//
// Google Recaptcha V3 Library
//
// Collection of functions to add Google Captcha on Power Pages
//
// Hany Greiss
// August 2025
// Akram FArhat
// Oct 2025
//
// NOTE: This version adds detailed diagnostics logging but does not
//       change the original functional behavior, except for:
//       - Bilingual fake Next button text (EN/FR)
//       - Fake Next button shows "Processing..." / "Traitement..." while verifying
//

// Simple diagnostic logger
function recaptchaLog(step, details) {
    if (details !== undefined) {
        console.log('[reCAPTCHA]', step, details);
    } else {
        console.log('[reCAPTCHA]', step);
    }
}

// Determine language from <html lang="...">
function recaptchaGetLang() {
    var lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    if (lang.indexOf('fr') === 0) return 'fr';
    return 'en';
}

// Bilingual text helper
function recaptchaGetText(key) {
    var lang = recaptchaGetLang();
    var en = {
        next: 'Next',
        processing: 'Processing...',
        thresholdError: 'Security check failed. Please try again.',
        genericError: 'We could not complete the security check. Please try again later.'
    };
    var fr = {
        next: 'Suivant',
        processing: 'Traitement...',
        thresholdError: 'La vérification de sécurité a échoué. Veuillez réessayer.',
        genericError: "Nous n’avons pas pu terminer la vérification de sécurité. Veuillez réessayer plus tard."
    };
    var dict = (lang === 'fr') ? fr : en;
    return dict[key] || key;
}

// Threshold helper – reads from window.RECAPTCHA_THRESHOLD (string or number)
function recaptchaGetThreshold() {
    
    var raw = "{{ settings['eTHIreCaptchaThreshold'] | default: '0.5' }}";
    var num = null;

    if (typeof raw === 'number') {
        num = raw;
    } else if (typeof raw === 'string' && raw.trim() !== '') {
        num = parseFloat(raw.trim());
    }

    if (isNaN(num)) {
        // Fallback if site setting missing/invalid
        num = 0.5;
        recaptchaLog('threshold:using-default', { value: num, raw: raw });
    } else {
        recaptchaLog('threshold:from-setting', { value: num, raw: raw });
    }

    // Clamp to [0,1] just in case
    if (num < 0) num = 0;
    if (num > 1) num = 1;

    return num;
}




// Initializes ReCaptcha on the form or form step.
//
// Usage:
//
// include the Google library
//   <script src="https://www.google.com/recaptcha/enterprise.js?render=<<Your-Site-Key>>"></script>
//
// Add this script
//
//   <script src="/recaptcha.js"></script>
//
// when the page is loaded call initializeCaptcha and pass in the site key
//
// $(document).ready(function() {
//       initializeCaptcha( '{{ settings['Recaptcha/SiteKey'] }}' );  // site key stored in site settings
// });
//
// The Next button will be hidden and another button will be displayed instead that intercepts the submit request.
// The new button calls verify to first check if the page is valid and if it is valid, it generates a token from the
// captcha service and verifies it with the service to generate a score. A score of .7 or higher is required to
// actually submit the form.
//

function initializeCaptcha(sitekey) {
    recaptchaLog('initializeCaptcha:start', {
        sitekeyPresent: !!sitekey,
        sitekeySample: sitekey ? (sitekey.substring(0, 6) + '…') : null
    });

    var next = $('#NextButton');
    if (!next || next.length === 0) {
        recaptchaLog('initializeCaptcha:NextButton-not-found');
        return;
    }

    recaptchaLog('initializeCaptcha:NextButton-found');

    next.hide();
    recaptchaLog('initializeCaptcha:NextButton-hidden');

    var labelNext = recaptchaGetText('next');
    recaptchaLog('initializeCaptcha:button-label', {
        lang: recaptchaGetLang(),
        text: labelNext
    });

    var $fake = $('#captcha');
    if ($fake.length === 0) {
        $fake = $('<button>', {
            id: 'captcha',
            type: 'button',          // important: NOT a submit button
            class: 'btn btn-primary',
            text: labelNext
        });
        next.before($fake);
        recaptchaLog('initializeCaptcha:fakeNext-created');
    } else {
        // Ensure it has the correct label for the current language
        $fake.text(labelNext);
        recaptchaLog('initializeCaptcha:fakeNext-exists-label-updated', {
            text: labelNext
        });
    }

    // Always (re)bind the click handler, namespaced for safety
    $fake.off('click.recaptcha').on('click.recaptcha', function (evt) {
        recaptchaLog('initializeCaptcha:fakeNext-click-bound');
        if (window.verify) {
            window.verify(evt);
        } else {
            recaptchaLog('initializeCaptcha:verify-missing');
        }
    });
    recaptchaLog('initializeCaptcha:fakeNext-inserted-and-bound');
    
    window.verify = async function (e) {
        recaptchaLog('verify:click', { hasEvent: !!e });

        var $btn = $('#captcha'); // fake Next button
        var processingText = recaptchaGetText('processing');
        var originalText = null;
        var busySet = false;

        // Helper: set the fake button into a “busy” state
        function setBusy() {
            if ($btn.length) {
                originalText = $btn.text();
                $btn.text(processingText);
                busySet = true;
                recaptchaLog('verify:button-busy-set', {
                    originalText: originalText,
                    processingText: processingText
                });
            } else {
                recaptchaLog('verify:button-busy-skip', { reason: 'no-#captcha' });
            }
        }

        // Helper: clear busy state
        function clearBusy() {
            if ($btn.length && busySet) {
                $btn.text(originalText || recaptchaGetText('next'));
                recaptchaLog('verify:button-busy-cleared', {
                    restoredText: $btn.text()
                });
            }
        }

        // Helper: log validator state for diagnostics
        function logValidatorState() {
            try {
                if (!Array.isArray(window.Page_Validators)) {
                    recaptchaLog('verify:validators-state', { hasArray: false });
                    return;
                }
                var invalid = [];
                for (var i = 0; i < window.Page_Validators.length; i++) {
                    var v = window.Page_Validators[i];
                    if (v && v.isvalid === false) {
                        invalid.push({
                            id: v.id,
                            control: v.controltovalidate,
                            message: v.errormessage
                        });
                    }
                }
                recaptchaLog('verify:validators-state', {
                    count: window.Page_Validators.length,
                    invalidCount: invalid.length,
                    invalid: invalid
                });
            } catch (err) {
                recaptchaLog('verify:validators-state:error', {
                    message: err && err.message
                });
            }
        }

        var keepBusy = false;

        try {
            // 1) Put the fake “Next” into busy state
            setBusy();

            // 2) Prevent the original click from submitting immediately
            try {
                if (e && typeof e.preventDefault === 'function') {
                    e.preventDefault();
                    recaptchaLog('verify:preventDefault', { via: 'event.preventDefault' });
                } else if (e && e.event && typeof e.event.preventDefault === 'function') {
                    e.event.preventDefault();
                    recaptchaLog('verify:preventDefault', { via: 'event.event.preventDefault' });
                } else if (window.event && typeof window.event.preventDefault === 'function') {
                    window.event.preventDefault();
                    recaptchaLog('verify:preventDefault', { via: 'window.event.preventDefault' });
                } else {
                    recaptchaLog('verify:preventDefault', { via: 'none-available' });
                }
            } catch (errPd) {
                recaptchaLog('verify:preventDefault:error', {
                    message: errPd && errPd.message
                });
            }

            // 3) Run the standard ASP.NET / portal validators
            if (typeof window.Page_ClientValidate === 'function') {
                recaptchaLog('verify:Page_ClientValidate:call');
                window.Page_ClientValidate('');
            } else {
                recaptchaLog('verify:Page_ClientValidate:missing');
            }

            // Log detailed validator state for debugging
            logValidatorState();

            var isValid = (typeof window.Page_IsValid === 'boolean')
                ? window.Page_IsValid
                : true; // if Page_IsValid missing, assume valid so we don’t block unexpectedly

            recaptchaLog('verify:Page_IsValid-check', { Page_IsValid: isValid });

            // 4) If the page is NOT valid, stop here (let WET summary/inline errors show)
            if (!isValid) {
                recaptchaLog('verify:Page_IsValid:false');
                // We do NOT call getToken or NextButton here.
                clearBusy();
                keepBusy = true; // avoid re-clearing in finally
                return;
            }

            recaptchaLog('verify:Page_IsValid:true');

            // 5) Get a token + server verification
            recaptchaLog('verify:getToken:start');
            var results = await getToken(sitekey, 'submit');
            recaptchaLog('verify:getToken:results', results);

            // 6) Evaluate threshold
            var threshold = recaptchaGetThreshold();
            var pass =
                results &&
                results.hca_verified &&
                typeof results.hca_score === 'number' &&
                results.hca_score >= threshold;

            recaptchaLog('verify:threshold-eval', {
                threshold: threshold,
                score: results && results.hca_score,
                verified: results && results.hca_verified,
                pass: pass
            });

            if (!pass) {
                recaptchaLog('verify:threshold-fail', {
                    threshold: threshold,
                    score: results && results.hca_score,
                    verified: results && results.hca_verified
                });
                alert(recaptchaGetText('thresholdError')); // bilingual threshold failure
                clearBusy();
                keepBusy = true; // avoid re-clearing in finally
                return;
            }

            // 7) Threshold passed; click the real Next button
            recaptchaLog('verify:threshold-pass', {
                threshold: threshold,
                score: results && results.hca_score
            });

            // Keep the button in the busy state while the next step loads
            keepBusy = true;

            if (next && next.length && typeof next[0].click === 'function') {
                recaptchaLog('verify:next-click', { via: 'DOM click() on #NextButton' });
                next[0].click();
            } else {
                recaptchaLog('verify:next-click-fallback', {
                    reason: 'NextButton not found or no click()'
                });
                // Last-resort fallback: try submitting the form directly
                var $form = $('#liquid_form');
                if ($form.length && typeof $form[0].submit === 'function') {
                    recaptchaLog('verify:form-submit-fallback', { formId: $form[0].id });
                    $form[0].submit();
                }
            }
        } catch (err) {
            recaptchaLog('verify:error', {
                message: err && err.message,
                stack: err && err.stack
            });
            alert(recaptchaGetText('genericError'));   // bilingual generic failure
            throw err;
        } finally {
            // Restore the fake button text unless we are intentionally keeping it busy
            if (!keepBusy) {
                clearBusy();
            }
        }
    };


    recaptchaLog('initializeCaptcha:end');
}

// 
// All the functions below are for internal use. Only initializeCaptcha is public.
// 

//
// There are 2 API's enterprise and non-enterprise. HC is licensed for enterprise. We check that the 
// Google script was included here.
//
function getRecaptchaApi() {
    var hasGlobal = !!window.grecaptcha;
    var hasEnterprise = !!(window.grecaptcha && window.grecaptcha.enterprise);

    if (hasEnterprise) {
        recaptchaLog('getRecaptchaApi:return-enterprise');
        return window.grecaptcha.enterprise;
    }
    if (hasGlobal) {
        recaptchaLog('getRecaptchaApi:return-standard');
        return window.grecaptcha;
    }

    recaptchaLog('getRecaptchaApi:missing', {
        windowHasGrecaptcha: hasGlobal
    });
    return null;
}

//
// This function checks that the token generation is ready for requests.
//
function waitForReady(timeoutMs = 4000) {
    recaptchaLog('waitForReady:start', { timeoutMs: timeoutMs });

    return new Promise((resolve, reject) => {
        const api = getRecaptchaApi();
        if (!api?.ready) {
            recaptchaLog('waitForReady:api-or-ready-missing');
            return reject(new Error('reCAPTCHA API not loaded'));
        }

        let done = false;
        let polls = 0;

        const timer = setTimeout(() => {
            if (!done) {
                done = true;
                recaptchaLog('waitForReady:timeout', { polls: polls });
                reject(new Error('reCAPTCHA ready() timeout'));
            }
        }, timeoutMs);

        api.ready(() => {
            polls++;
            if (!done) {
                done = true;
                clearTimeout(timer);
                recaptchaLog('waitForReady:ready-callback', { polls: polls });
                resolve();
            }
        });
    });
}

//
// This function requests a token. It only gets called if the form is valid.
//
async function getRecaptchaToken(sitekey, action = 'submit', timeoutMs = 8000) {
    recaptchaLog('getRecaptchaToken:start', {
        action: action,
        timeoutMs: timeoutMs
    });

    await waitForReady();

    const api = getRecaptchaApi();
    if (!api?.execute) {
        recaptchaLog('getRecaptchaToken:execute-missing');
        throw new Error('reCAPTCHA execute() missing');
    }

    // Race execute vs timeout to avoid hangs
    recaptchaLog('getRecaptchaToken:execute-call');
    const exec = api.execute(sitekey, { action });

    const to = new Promise((_, rej) =>
        setTimeout(() => {
            recaptchaLog('getRecaptchaToken:execute-timeout');
            rej(new Error('reCAPTCHA execute timeout'));
        }, timeoutMs)
    );

    const token = await Promise.race([exec, to]);
    recaptchaLog('getRecaptchaToken:token-acquired', {
        tokenLength: token && token.length
    });

    return token;
}

//
// This function gets the token and verifies it.
//
async function getToken(sitekey, action) {
    recaptchaLog('getToken:start', { action: action });

    try {
        const token = await getRecaptchaToken(sitekey, action);
        recaptchaLog('getToken:token-obtained', {
            tokenLength: token && token.length
        });

        var res = await verifyCaptcha(token, action);
        recaptchaLog('getToken:verifyCaptcha-results', res);

        recaptchaLog('getToken:end-success');
        return res;
    } catch (error) {
        recaptchaLog('getToken:error', {
            message: error && error.message,
            stack: error && error.stack
        });
        throw error;
    }
}

//
// Verification involves creating an entity record of type Recaptcha Attempt. A custom plugin listens
// on Pre-Operation of the Create message and verifies the token and records the score. We read the record 
// after it as been recorded and return the results.
//
async function verifyCaptcha(token, action) {
    recaptchaLog('verifyCaptcha:start', {
        action: action,
        tokenLength: token && token.length
    });

    return new Promise((resolve, reject) => {
        webapi.safeAjax({
            type: "POST",
            url: "/_api/hca_recaptchaattempts",
            contentType: "application/json; charset=utf-8",
            headers: {
                "Accept": "application/json",
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0",
                "Prefer": "return=representation"
            },
            data: JSON.stringify({ hca_token: token, hca_action: action }),

            success: (data, _text, xhr) => {
                const status = xhr?.status || 0;
                const loc = xhr?.getResponseHeader("OData-EntityId")
                    || xhr?.getResponseHeader("Location");

                recaptchaLog('verifyCaptcha:create-success', {
                    status: status,
                    hasBody: !!data,
                    hasLocation: !!loc
                });

                // If we already got a full entity back, just use it
                if ((status === 201 || status === 200) && data) {
                    recaptchaLog('verifyCaptcha:create-success:using-body');
                    resolve(data);
                    return;
                }

                // Try to extract ID from Location / EntityId header
                const match = loc && loc.match(/\(([^)]+)\)/);
                const id = match && match[1];

                if (id) {
                    recaptchaLog('verifyCaptcha:followup-get:start', { id: id });

                    webapi.safeAjax({
                        type: "GET",
                        url: `/_api/hca_recaptchaattempts(${id})?$select=hca_score,hca_verified,hca_recaptchaattemptid`,
                        headers: {
                            "Accept": "application/json",
                            "OData-MaxVersion": "4.0",
                            "OData-Version": "4.0"
                        },
                        success: rec => {
                            recaptchaLog('verifyCaptcha:followup-get:success', rec);
                            resolve(rec);
                        },
                        error: err => {
                            recaptchaLog('verifyCaptcha:followup-get:error', {
                                status: err?.status,
                                response: err?.responseText
                            });
                            reject({
                                ok: false,
                                stage: "followup-get",
                                status: err?.status,
                                response: err?.responseText
                            });
                        }
                    });
                    return;
                }

                // Fallback: nothing useful returned
                recaptchaLog('verifyCaptcha:success-no-id-no-body');
                resolve(null);
            },
            error: xhr => {
                recaptchaLog('verifyCaptcha:create:error', {
                    status: xhr?.status,
                    response: xhr?.responseText
                });
                reject({
                    ok: false,
                    stage: "create",
                    status: xhr?.status,
                    response: xhr?.responseText
                });
            }
        });
    });
}
