    'use strict';

    // require('safe-browse-url-lookup')
    const lookup = require('./SafeBrowsingLookup')({ apiKey: 'AIzaSyCjSUgyjlIEvVLTo_LLopPMtI3ybSLhrj4' });

    lookup.checkSingle('http://testsafebrowsing.appspot.com/apiv4/ANY_PLATFORM/MALWARE/URL/')
        .then(isMalicious => {
            console.log(isMalicious ? 'Hands off! This URL is evil!' : 'Everything\'s safe.');
        })
        .catch(err => {
            console.log('Something went wrong.');
            console.log(err);
        });

    lookup.checkMulti(['https://muetsch.io', 'https://kit.edu'])
        .then(urlMap => {
            for (let url in urlMap) {
                console.log(urlMap[url] ? `${url} is evil!` : `${url} is safe.`);
            }
        })
        .catch(err => {
            console.log('Something went wrong.');
            console.log(err);
        });