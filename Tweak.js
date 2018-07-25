if (ObjC.available) {
  console.log('[*] Tweak launched');

  var config = {
    version: 0.21,
    debug: false,
    force_fcc: false,
    force_boost: false,
    force_2_3_G: false,
    force_2_5_G: false,
    illegal_channels: false,
    country_code_us: true,
    disable_fw_upgrade: true,
    disable_nfz_upgrade: true
  };

  var block_queue = [];
  var alert_queue = [];
  var active_alert = null;

  function getViewController()
  {
    try {
      var rootViewController = ObjC.classes.UIApplication.sharedApplication().keyWindow().rootViewController();
      var presentedViewController = rootViewController.presentedViewController();
    
      return presentedViewController ? presentedViewController : rootViewController;
    } catch (err) {
      return null;
    }
  }

  function alert(title, message, actions) {
    alert_queue.push({title, message, actions});
  }

  function dispatchAlert() {
    if(getViewController() && !active_alert) {
      if(active_alert = alert_queue.shift()) {
        var alert = ObjC.classes.UIAlertController.alertControllerWithTitle_message_preferredStyle_(active_alert.title, active_alert.message, 1);

        active_alert.actions.forEach(function(action_desc){
          const block = new ObjC.Block({
            retType: 'void',
            argTypes: ['object'],
            implementation: function(){
              if(typeof action_desc.callback == 'function') {
                action_desc.callback();
              }
              
              active_alert = null;
              block_queue.splice(block_queue.indexOf(block), 1);
            }
          });

          block_queue.push(block);

          var action = ObjC.classes.UIAlertAction.actionWithTitle_style_handler_(action_desc.title, 0, block);
          alert.addAction_(action);

          if(action_desc.preferred) {
            alert.setPreferredAction_(action);
          }
        });

        getViewController().presentViewController_animated_completion_(alert, true, NULL);
      }
    }
  }

   function modify_implementation(class_name, method_name, functions) {
    try {
      var methodObj = ObjC.classes[class_name][method_name]
      var old_implementation = methodObj.implementation;

      methodObj.implementation = ObjC.implement(methodObj, function () {
        var args = [].slice.call(arguments); // modifying Arguments object into array
        
        if(typeof functions['arguments'] === 'function') {
          functions['arguments'](args);
        }

        var result = old_implementation.apply(null, args);
        
        if(typeof functions['result'] === 'function') {
          result = functions['result'](result);
        }

        return result;
      });
    } catch (err) {
      console.log('[!] Error while hooking ' + class_name + ' [' + method_name + ']', err);
    }
  }

  function modify_value(class_name, method_name, new_value, toggle) {
    console.log('[*] Hooking for modify value ' + class_name + '[' + method_name + ']');

    modify_implementation(class_name, method_name, {
      result: function(original_value) {
        if(!toggle || (typeof toggle === 'function' && toggle())) {
          if(original_value != new_value) {
            console.log('[*] Modified ' + class_name + '[' + method_name + '] value from ' + original_value + ' to ' + new_value);

            if(config.debug) {
              alert(class_name, 'Modified value [' + method_name + '] from ' + original_value + ' to ' + new_value, [
                {
                  title: 'Ok'
                }
              ]);
            }
          }

          return new_value;
        } else {
          return original_value;
        }
      }
    });
  }

  function modify_arguments(class_name, method_name, args_func, toggle) {
    console.log('[*] Hooking for modify arguments ' + class_name + '[' + method_name + ']');

    modify_implementation(class_name, method_name, {
      arguments: function(args) {
        if(!toggle || (typeof toggle === 'function' && toggle())) {
          args = args_func(args);
        }

        return args;
      }
    });
  }

  function check(class_name, method_name, callback) {
    console.log('[*] Hooking for check ' + class_name + '[' + method_name + ']');

    modify_implementation(class_name, method_name, {
      result: function(original_value) {
        console.log('[*] Value ' + class_name + '[' + method_name + '] - ' + original_value);
        
        if(config.debug) {
          alert(class_name, 'Value [' + method_name + '] - ' + original_value, [
            {
              title: 'Ok'
            }
          ]);
        }

        if(typeof callback == 'function') {
          callback(original_value);
        }

        return original_value;
      }
    });
  }

  function checkObject(pointer){
    try {
      var object = new ObjC.Object(pointer);
      
      console.log('[*] Kind', object.$kind);
      console.log('[*] ClassName', object.$className);
      console.log('[*] Value', object.toString());
      console.log('[*] Methods');
      object.$ownMethods.forEach(function(method) {
        console.log("\t" + method);
      });
    } catch (err) {
      console.log(err);
    }
  }

  function interaction() {
    var welcome_message = [
      'Author: ddzobov@gmail.com',
      'Slack: https://dji-rev.slack.com/#ios_ipa_reversing',
      '',
      'P.S. Donations to PayPal are welcome :)'
    ];

    alert('DJI GO 4 Tweak ' + config.version, welcome_message.join('\n'), [
      {
        title: 'Configure',
        preferred: true,
        callback: function() {
          alert('Choose mode', 'Increase RC and Video Transmission power', [
            {
              title: 'Force FCC',
              preferred: true,
              callback: function() {
                console.log('[*] Enabled Force FCC');
                config.force_fcc = true;
              }
            },
            {
              title: 'CE in EU, FCC in US (default)'
            }
          ]);

          alert('Enable BOOST?', 'Boost Transmission power', [
            {
              title: 'No (default)',
              preferred: true
            },
            {
              title: 'Yes (use with caution)',
              callback: function() {
                console.log('[*] Enabled Force BOOST');
                config.force_boost = true;
              }
            }
          ]);

          alert('Enable 32ch?', 'Increace number of channels to 32', [
            {
              title: 'Yes',
              preferred: true,
              callback: function() {
                console.log('[*] Enabled Illegal Channels');
                config.illegal_channels = true;
              }
            },
            {
              title: 'No (default)'
            }
          ]);

          alert('Change frequency?', 'Choose frequency', [
            {
              title: '2.4G (default, multiple channels)',
              preferred: true,
            },
            {
              title: '2.3G (single channel)',
              callback: function() {
                console.log('[*] Enabled Force 2.3G');
                config.force_2_3_G = true;
              }
            },
            {
              title: '2.5G (LTE, single channel)',
              callback: function() {
                console.log('[*] Enabled Force 2.5G');
                config.force_2_5_G = true;
              }
            }
          ]);
        }
      },
      {
        title: 'Skip'
      }
    ]);
  }

  /* Disable FW update check */
  modify_value('DJIAppForceUpdateManager', '- hasChecked', 1, function(){ return config.disable_fw_upgrade; });
  modify_value('DJIUpgradeNotifyViewModel', '- notifyHidden', 1, function(){ return config.disable_fw_upgrade; });

  /* Change country code to US */
  modify_arguments('DJICountryCodeProviderLogic', '- setCountryCode:withSource:', function(args){
      args[2] = ptr(ObjC.classes.NSString.stringWithString_('US'));
  }, function(){ return config.country_code_us; });

  /* Force FCC */
  modify_value('DJIAppSettings', '- sdr_force_fcc', 1, function(){ return config.force_fcc; });

  /* Force BOOST */
  modify_value('DJIAppSettings', '- sdr_force_boost', 1, function(){ return config.force_boost; });
  
  /* Force 2.3G */
  modify_value('DJIAppSettings', '- sdr_force_2_3_G', 1, function(){ return config.force_2_3_G; });

  /* Force 2.5G */
  modify_value('DJIAppSettings', '- sdr_force_2_5_G', 1, function(){ return config.force_2_5_G; });
  
  /* Enable 32ch */
  modify_value('DJIAppSettings', '- canUseIllegalChannels', 1, function(){ return config.illegal_channels; });
  modify_value('DJIRadioLogic', '- canUseIllegalChannels', 1, function(){ return config.illegal_channels; });

  /* Hide terms */
  modify_value('DJITermsNotificationController', '- shouldShowTerms', 0);

  /* Unlock Pano, QuickMovie and other features */
  modify_value('DJIVisionCapabilityCheckModel', '- supportAppPano', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportPanoSphere', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportPanoSphereAutoFillSky', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportPano180', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportPano3x3', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportPano3x1', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportQuickMovie', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportMavicQuickMovie', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportQuickMovieCircle', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportQuickMovieSetting', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportQuickMovieDirectionSetting', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportQuickMoviePlanetAndComet', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportSelfie', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportThrowPlane', 1);
  modify_value('DJIVisionCapabilityCheckModel', '- supportBokeh', 1);

  interaction();
  setInterval(dispatchAlert, 100);
}