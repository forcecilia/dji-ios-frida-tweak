# Tweak for DJI GO 4
## Key features:
1) Enables FCC on all devices and 5.8 on supported devices (changing country code to US)
2) Enables BOOST, 32ch
3) Disables Firmware checking
4) Forces frequency to 2.3G or 2.5G

> Tested on DJI Mavic Pro and DJI Inspire 2

## Installation How-To
See: [How to install the Patched DJI GO4 App on iPad or iPhone](http://dji.retroroms.info/howto/apple_ios_patched_dji_go4)

## Disable menu:
**Set needed options to true**
```javascript
    var config = {
      version: 0.22,
      debug: false,
      country_code_us: true,
      force_boost: false,
      force_2_3_G: false,
      force_2_5_G: false,
      illegal_channels: true,
      disable_fw_upgrade: true,
      disable_nfz_upgrade: true
    };
```
**Comment line that enables interaction**

Change from:
```javascript
  interaction();
```

to:
```javascript
  //interaction();
```

## Roadmap:
1) Disable NFZ Checking
2) Disable Quiz pop-up

## Contacts
* Email: ddzobov@gmail.com
* Slack: [DJI Reverse Engineering #ios_ipa_reversing](http://dji-rev.slack.com/#ios_ipa_reversing)

## Donations are welcome:
* Paypal: ddzobov@gmail.com
* Bitcoin: 17w7qpgX4KnXFw1ppipm9khKGWEWsXkN3s
* Etherium: 0x4d01f1ce8c283e850591322bd3699908d1e2e464
