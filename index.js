/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This skill supplies users with information from the Mustang Band calendar.
 * This skill supports English. (en-US).
 **/

'use strict';

const Alexa = require('alexa-sdk');
const ical = require('ical');
const http = require('http');
const utils = require('util');

var alexa;

const APP_ID = undefined;

var cal = 'https://calendar.google.com/calendar/ical/9aqoirufc0h1mrihk78us5mlgs%40group.calendar.google.com/public/basic.ics';

var languageStrings = {
   'en': {
      'translation': {
         'HELP_MESSAGE': 'Welcome to Mustang Band Reminders. You can ask a question like, what are my upcoming band events?... You will then be told the next event on the Mustang Band calendar.',
         'STOP_MESSAGE': 'Goodbye! 8-oh-7.'
      }
   }
};

function removeTags(str) {
   if (str) {
      return str.replace(/<(?:.|\n)*?>/gm, '');
   }
}

function getUpcomingEvents(callback) {
   var events = new Array();
   var today = new Date();

   ical.fromURL(cal, {}, function(err, data) {
      for (var k in data) {
         if (data.hasOwnProperty(k)) {
            var ev = data[k];

            var eventData = {
               summary: removeTags(ev.summary),
               location: removeTags(ev.location),
               description: removeTags(ev.description),
               start: ev.start
            };

            if (eventData.summary != undefined && eventData.start >= today)
               events.push(eventData);
         }
      }

      var nextEvent = getNextEvent(events);
      callback(nextEvent);
   });
}

function getNextEvent(eventList) {
   var nextEvent = eventList[0];

   for (var i = 0; i < eventList.length; i++) {
      if (eventList[i].start < nextEvent.start)
         nextEvent = eventList[i];
   }

   return nextEvent;
}

const handlers = {
   'LaunchRequest': function () {
      this.emit('BandEvents');
   },
   'BandEventsIntent': function () {
      this.emit('BandEvents');
   },
   'BandEvents': function () {
      getUpcomingEvents(function(output) {
         var speechOutput = '';
         speechOutput += 'Your next event is ';
         speechOutput += output.summary;
         speechOutput += ' on ';

         var options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
         options.timeZone = 'UTC';

         var date = output.start.toLocaleString('en-US', options);

         speechOutput += date;
         alexa.emit(':tellWithCard', speechOutput, 'Mustang Band', speechOutput);
      });
   },
   'AMAZON.HelpIntent': function () {
      const speechOutput = this.t('HELP_MESSAGE');
      const reprompt = this.t('HELP_MESSAGE');
      this.emit(':tell', speechOutput, reprompt);
   },
   'AMAZON.CancelIntent': function () {
      this.emit(':tell', this.t('STOP_MESSAGE'));
   },
   'AMAZON.StopIntent': function () {
      this.emit(':tell', this.t('STOP_MESSAGE'));
   },
};

exports.handler = function (event, context) {
   alexa = Alexa.handler(event, context);
   alexa.APP_ID = APP_ID;
   alexa.resources = languageStrings;
   alexa.registerHandlers(handlers);
   alexa.execute();
};
