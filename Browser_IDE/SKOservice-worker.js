// Service worker that provides a communication channel between
// the user's code and the main page.
// File must be located at or above where the Execution Environment's page is.
importScripts('./../../fallibleMessage.js');

// event queue
let programEvents = [];

// queue events when supplied
self.addEventListener("message", (event) => {
    // these can't really fail, so avoid overhead of try catch and just resolve - still useful for timing purposes

    if (event.data.type == "programEvent")
        programEvents.push([event.data.command, event.data.args]);

    if (event.data.type == "clearEvents")
        programEvents = [];

    resolveMessageFallible(event, undefined, event.source);
});

// when /programEvents.js is accessed, return all the events
// in the queue, and clear it.
self.addEventListener("fetch", (event) => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.pathname === "/programEvents.js") {
        let currentEvents = programEvents;
        programEvents = [];
        event.respondWith(constructResponse(currentEvents));
    }
});

function constructResponse(programEvents) {
    return new Response(
        JSON.stringify(programEvents), {
            status: 200,
            statusText: "OK",
            headers: {
                "Content-Type": "text/javascript",
            }
        });
}

// attempts to make the service worker start quickly - don't seem to work in Firefox at least
self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});