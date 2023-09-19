`1.9.0` - 2023-09-18
* Add tooltips to skills and stats in character sheets ([#37](https://github.com/wrycu/paranoia2017/issues/37))

`1.8.2` - 2023-09-16
* More fixes due to the system rename (socket stuff and settings this time)

`1.8.1` - 20233-09-15
* Fix for relative paths being out-of-date due to system rename

`1.8.0` - 2023-09-15
* Avoid Foundry name conflict by renaming from `paranoia` to `paranoia2017`

`1.7.0` - 2023-09-15
* Fix for item name change popping up on every item close
* Use modified NODE for re-rolls when spending moxie ([#59](https://github.com/wrycu/paranoia2017/issues/59))
* Add Wifi Deadzone toggle to scene controls ([#58](https://github.com/wrycu/paranoia2017/issues/58))
* Fix for only Action Cards being drag-and-droppable ([#57](https://github.com/wrycu/paranoia2017/issues/57))
* Prevent accidentally closing combat manager ([#56](https://github.com/wrycu/paranoia2017/issues/56))
* Add a one-time link to the Wiki ([#54](https://github.com/wrycu/paranoia2017/issues/54))

`1.6.1` - 2023-09-13
* Fix for poorly-implemented new mutant power flow ([#48](https://github.com/wrycu/paranoia2017/issues/48)) 
* Add GM-only field to prevent items from being added to card decks ([#44](https://github.com/wrycu/paranoia2017/issues/44))
* Harden card state tracking ([#46](https://github.com/wrycu/paranoia2017/issues/46))
* Overall moved console logs to a debugging setting and moved some messaged to the UI ([#50](https://github.com/wrycu/paranoia2017/issues/50))
* Fix for re-roller using initial attr / skill combo instead of selected ([#53](https://github.com/wrycu/paranoia2017/issues/53))

`1.6.0` - 2023-09-12
* Update token names to display full name (`NAME-CLEARANCE-HOME SECTOR-CLONE #`) ([#35](https://github.com/wrycu/paranoia2017/issues/35))
* Activating a mutant power sends an audio cue ([#40](https://github.com/wrycu/paranoia2017/issues/40))
* Activating a mutant power sends an initial notification to let the GM know more is coming ([#42](https://github.com/wrycu/paranoia2017/issues/42))
* Fix for multiple combat managers opening after >1 combat
* Set default bars for tokens ([#10](https://github.com/wrycu/paranoia2017/issues/10))
* Update computer dice result ([#9](https://github.com/wrycu/paranoia2017/issues/9))
* Update decks to be owned by players by default ([#26](https://github.com/wrycu/paranoia2017/issues/26))
* Handle injury in NODE calculation (beyond the initial config) ([#43](https://github.com/wrycu/paranoia2017/issues/43))
* Fix for card manager closing when user hits ESC
* Add a re-roll button for 1 moxie ([#39](https://github.com/wrycu/paranoia2017/issues/39))
* Add drag-and-drop between actors ([#32](https://github.com/wrycu/paranoia2017/issues/32))
* Combat tracker now updates when combatants are changed ([#38](https://github.com/wrycu/paranoia2017/issues/38))

`1.5.5` - 2023-08-24
* Fix for inability to update NPCs

`1.5.4` - 2023-08-24
* Fix for LOSING it triggering when full on MOXIE (instead of empty)
* Fix for MOXIE starting at 0 instead of 8
* Disable "Next Combat Phase" button until end of initiative ([#33](https://github.com/wrycu/paranoia2017/issues/33))
* Move "Next Slot" button next to "Next Combat Phase" button ([#33](https://github.com/wrycu/paranoia2017/issues/33))

`1.5.3` - 2023-08-17
* Playing cards is now public ([#28](https://github.com/wrycu/paranoia2017/issues/28))
* Send message when LOSING it ([#31](https://github.com/wrycu/paranoia2017/issues/31))

`1.5.2` - 2023-07-27
* Move people who fail a challenge to the bottom of the initiative

`1.5.1` - 2023-07-27
* Setting up decks now only runs for GMs
* Fixed Initiative manager when GM does not have a configured/selected user ([#18](https://github.com/wrycu/paranoia2017/issues/18))
* Fix generic dice rolling chat template ([#22](https://github.com/wrycu/paranoia2017/issues/22))
* Make "challenge" button in combat appear _after_ "me" to avoid accidental clicking ([#24](https://github.com/wrycu/paranoia2017/issues/24))
* Correct alt text for combat initiative buttons
* Fix bug in challenging player initiative ([#20](https://github.com/wrycu/paranoia2017/issues/20))
* Limit ability to challenge to once per round ([#19](https://github.com/wrycu/paranoia2017/issues/19))
* NODE is now lowered by injuries ([#21](https://github.com/wrycu/paranoia2017/issues/21))

`1.5.0` - 2023-07-20
* Roll details now include colors to indicate success or failure of individual dice and rolls are split by dice type
* Fix HUD bug when XP points / treason stars are 0

`1.4.1` - 2023-07-13
* NPC notes are now scrollable instead of overflowing into the rest of the sheet

`1.4.0` - 2023-07-12
* Improve card support (now handles drag-and-drop items)

`1.3.0` - 2023-07-01
* Show reaction cards in inventory
* Improve action card "send to chat" functionality
* Notify GM when cards are played

`1.2.0` - 2023-06-23
* Add card management for all items 

`1.1.0` - 2023-06-16
* Show health bar as full when in the "healthy" state

`1.0.1` - 2023-06-15
* Add HUD info on token mouseover
* Add Wifi dead zone support
* Add NPC XP points and Treason Stars

`1.0.0` - 2023-06-09
* Initial release! yay!
