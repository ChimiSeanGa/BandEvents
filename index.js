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
         'WELCOME_MESSAGE': 'Welcome to Mustang Band Reminders. What would you like to know?',
         'HELP_MESSAGE': 'Welcome to Mustang Band Reminders. You can ask a question like, what are my upcoming band events?... This will let you know what the next Mustang Band event is. What would you like to know?',
         'REPROMPT_MESSAGE': 'Sorry, I didn\'t get that. What would you like to know?',
         'STOP_MESSAGE': 'Goodbye! 8-oh-7.',
         '807_MESSAGE': 'The band always wins!'
      }
   }
};

function removeTags(str) {
   if (str) {
      return str.replace(/<(?:.|\n)*?>/gm, '');
   }
}

function getUpcomingEvents(callback) {
   var today = new Date();
   var nextEvent = undefined;

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
               if (nextEvent == undefined || eventData.start < nextEvent.start)
                  nextEvent = eventData;
         }
      }

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
      this.emit(':ask', this.t('WELCOME_MESSAGE'));
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
   'BAWIntent': function() {
      this.emit('BAW');
   },
   'BAW': function() {
      this.emit(':tell', this.t('807_MESSAGE'));
   },
   'AMAZON.HelpIntent': function () {
      const speechOutput = this.t('HELP_MESSAGE');
      const reprompt = this.t('REPROMPT_MESSAGE');
      this.emit(':ask', speechOutput, reprompt);
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
