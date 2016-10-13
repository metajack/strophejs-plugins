# Changelog

## 0.0.7 (13 October 2016)

- #108 [muc]: Pass error code and name along from MUC errors
- #110 [roster]: Add check for items
- #111 Add a plugin for Message Carbons - XEP-0280
- #83 [muc] Fix reference to name in XmppRoom class
- #88 [caps] Replace odd chars with space
- #90 [pubsub] Fix typo
- #91 [vcard]  Overload get
- #92: Add plugin strophe.streamManagement.js - XEP-0198
- Add AMD-enabled versions of strophe.vcard and strophe.ping
- Make iexdomain work with newer strophe.js versions

## 0.0.6 (26 August 2015)

- Update package.json so that the plugin files are included in the NPM package.

## 0.0.5 (25 August 2015)

- Fix missing var statements causing error on strophe.roster.js
- Add missing 'hidden' type on FORM_TYPE field
- Wrap Strophe.RSM and Strophe.disco for AMD
- Avoid adding duplicate handlers in XmppRoom objects when join is called
- New bookmarks plugin
- New plugins: sensordata and control
- Allow passing authcid param introduced by [strophe/strophejs#113](https://github.com/strophe/strophejs/pull/113)
- Add event handler management for pubsub plugin

## 0.0.4 (15 October 2014)

- Merge pull request #40 from allan-simon/more_precise_control_on_roster_update_events
- Merge pull request #38 from pelish8/master
- Merge pull request #31 from arielscarpinelli/archive-preferences
- mug: Buefix, don't deregister handler when receiving presence stanza containing an error. 
- muc: Added ability to invite multiple users.
- muc: New method createConfiguredRoom
- muc: IE9 fixes.
- Create strophe.mam.v0.3.js

## 0.0.3 (23 Auguest 2014)

- Merge pull request #35 from jaygeeseman/fuck_ie8
- Fix IE9 errors in Strophe.muc
