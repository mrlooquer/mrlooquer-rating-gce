const CEService = require('./ce.service');
const debug = require('debug')('ml-rating:main');
module.exports = function (event) {
    debug('New event: ' + event.source);
    if (!event.jsonPayload) {
        debug('Event not supported');
        return;
    }
    switch (event.jsonPayload.event_subtype) {
        case 'compute.instances.insert':
            return CEService;
        default:
            debug('Event not supported');
            return;
    }
}