'use strict';
const debug = require('debug')('ml-rating:main');
const factory = require('./services/event.factory');


exports.handler = async (ev, context) => {
  debug('New message');
  debug(Buffer.from(ev.data, 'base64').toString());
  const event = JSON.parse(Buffer.from(ev.data, 'base64').toString());
  const service = factory(event)
  if (!service) {
    return;
  }
  await service.treatEvent(event);
};
