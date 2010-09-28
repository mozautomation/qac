/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Mozilla Community QA Extension
 *
 * The Initial Developer of the Original Code is the Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Zach Lipton <zach@zachlipton.com>
 *  Aaron Train <atrain@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
* ***** END LICENSE BLOCK ***** */

var qaPref = {
  litmus: null,
  prefBase: "qa.extension",

  setPref: function(aName, aValue, aType) {
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefBranch);
    try {
      if (aType == "bool")
        pref.setBoolPref(aName, aValue);
      else if (aType == "int")
        pref.setIntPref(aName, aValue);
      else if (aType == "char")
        pref.setCharPref(aName, aValue);
     }
     catch(e) {};
  },

  getPref: function(aName, aType) {
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefBranch);
    try {
      var result;
      if (aType == "bool")
        result = pref.getBoolPref(aName);
      else if (aType == "int")
        result = pref.getIntPref(aName);
      else if (aType == "char")
        result = pref.getCharPref(aName);

      return result;
    }
    catch(e) {
      if (aType == "bool")
        return false;
      else if (aType == "int")
        return 0;
      else if (aType == "char")
        return null;
    }
    return null;
  },

  getConfig: function() {
    qaPref.getAllConfig("platformList", "platforms=1", ".config.platform");
    qaPref.getAllConfig("productList", "products=1", ".config.product");
  },

  getAllConfig: function(aMenuList, aQuery, pref) {
    var url = qaPref.getPref(qaPref.prefBase + ".litmus.url", "char")
               + "json.cgi?" + aQuery;

    var testingLoading = document.getElementById("testingLoading");
    testingLoading.hidden = false;
   
    var currentPref = qaPref.getPref(qaPref.prefBase + pref, "char");
    var menuList = document.getElementById(aMenuList);
    menuList.appendItem(qaPref.bundle.getString("qa.extension.loading"), 
                        currentPref);
    menuList.selectedIndex = 0;
           
    qaTools.getJSON(url,
      function(items) {
        menuList.removeItemAt(0);  // remove loading message
        for(var i = 0; i < items.length; i++) {
          let item = items[i];
          if (aQuery == "branches=1") {
            if (item.product_id.product_id == "1")
              if(item.name == "2.0 Branch") // 2.0 isn't active
                continue;
          }
          if (aQuery == "products=1") {
            if(item.name == "Weave" || item.name == "Mozilla.com"
               || item.name == "Firebug") // don't have test runs
              continue;
          }
          let menuItem = menuList.appendItem(item.name, item.name);
          if (aQuery == "products=1")
            menuItem.valueId = item.product_id;
          else if (aQuery == "platforms=1")
            menuItem.valueId = item.platform_id;
          else if (aQuery == "branches=1")
            menuItem.parentId = item.product_id.product_id;
          else if(aQuery == "opsyses=1")
            menuItem.parentId = item.platform_id.platform_id;
        }

        if(aQuery == "products=1") {
          qaPref.getAllConfig("branchList", "branches=1", ".config.branch");
        }
        else if(aQuery == "platforms=1") {
          qaPref.getAllConfig("opsysList", "opsyses=1", ".config.os");
        }
        else if(aQuery == "opsyses=1") {
          qaPref.menuMatchup('platformList', 'opsysList');
          document.getElementById("platformList").setAttribute("disabled", "false");
          menuList.setAttribute("disabled","false");
          testingLoading.hidden = true;
        }
        else if(aQuery == "branches=1") {
          qaPref.menuMatchup('productList', 'branchList');
          document.getElementById("productList").setAttribute("disabled", "false");
          menuList.setAttribute("disabled","false");
          testingLoading.hidden = true;
        }

        for(var i = 0; i < menuList.itemCount; i++) {
          var menuItem = menuList.getItemAtIndex(i);
          if(menuItem.value == currentPref)
            menuList.selectedItem = menuItem;
        }    
      },  function() { throw "QAC: Error fetching " + url; });
  },

  menuMatchup: function(list1, list2) {
    var parentList = document.getElementById(list1);
    var childList = document.getElementById(list2);

    for(var i = 0; i < childList.itemCount; i++) {
      var item = childList.getItemAtIndex(i);
      if (item.parentId == parentList.selectedItem.valueId) {
        item.hidden = false; 
        childList.selectedItem = item;
      }
      else
        item.hidden = true;
    }
  },

  invalidateTestrun : function() {
    qaPref.setPref(qaPref.prefBase + ".litmus.runId", -1, "int");
  },

  restoreDefaults : function() {
    qaPref.setConfig(qaPref.defaultConfig());
  },

  openAccountBugzilla: function() {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
             .getService(Components.interfaces.nsIWindowMediator);
    var bugWindow = wm.getMostRecentWindow("qac:buglogin") 
                 || window.openDialog('chrome://qa/content/tabs/buglogin.xul', '',
                                         'chrome, dialog', {msg: ""});
    bugWindow.focus();
  },

  openAccountLitmus: function(){
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
             .getService(Components.interfaces.nsIWindowMediator);
    var litmusWindow = wm.getMostRecentWindow("qac:litmuslogin")
                       || window.openDialog('chrome://qa/content/litmuslogin.xul', '', 
                                            'chrome, dialog, centerscreen=yes')
    litmusWindow.focus();
  },

  setConfig : function(aConfig){
    qaPref.setPref(qaPref.prefBase + '.config.platform', aConfig.platform, 'char');
    qaPref.setPref(qaPref.prefBase + '.config.os', aConfig.opsys, 'char');
    qaPref.setPref(qaPref.prefBase + '.config.product', aConfig.product, 'char');
    qaPref.setPref(qaPref.prefBase + '.config.branch', aConfig.branch, 'char');
    qaPref.setPref(qaPref.prefBase + '.config.buildId', aConfig.buildid, 'char');
  },

  getSysConfig : function() {
    return { product : qaPref.getPref(qaPref.prefBase + '.config.product', 'char'),
             platform : qaPref.getPref(qaPref.prefBase + '.config.platform', 'char'),
             opsys : qaPref.getPref(qaPref.prefBase + '.config.os', 'char'),
             branch : qaPref.getPref(qaPref.prefBase + '.config.branch', 'char'),
             buildid : qaPref.getPref(qaPref.prefBase + '.config.buildId', 'char'),
             locale: navigator.language };
  },

  defaultConfig : function() {
    var appinfo = Components.classes["@mozilla.org/xre/app-info;1"]
                  .getService(Components.interfaces.nsIXULAppInfo);

    var branch = parseFloat(appinfo.version);
    
    var platform;
    if ((/^MacPPC/).exec(navigator.platform))
      platform = 'Mac (PPC)';
    else if ((/^MacIntel/).exec(navigator.platform))
      platform = 'Mac (Intel)';
    else if ((/^Win/).exec(navigator.platform))
      platform = 'Windows';
    else if ((/^Linux/).exec(navigator.platform))
      platform = 'Linux';
    else if ((/^Solaris/).exec(navigator.platform))
      platform = 'Solaris';

    var opsys;
    if (platform == 'Windows') {
      switch (navigator.oscpu) {
        case 'Windows NT 5.1':
          opsys = 'Windows XP';
          break;
        case 'Windows NT 5.2':
          opsys = 'Windows XP';
          break;
        case 'Windows NT 6.0':       
          opsys = 'Windows Vista';
          break;
        case 'Windows NT 6.1':
          opsys = 'Windows 7';
          break;
        case 'Windows NT 5.0':
          opsys = 'Windows 2000';
          break;
        case 'Win 9x 4.90':
          opsys = 'Windows ME';
          break;
        case 'Win98':
          opsys = 'Windows 98';
          break;
        default:
          opsys = 'Windows XP';
          break;
      }
    } 
    else if (platform == 'Linux') {
      opsys = 'Linux';
    }
    else if (platform == 'Mac (PPC)' || platform == 'Mac (Intel)') {
      switch(navigator.oscpu){
        case 'Intel Mac OS X 10.4':
          opsys = 'Mac OS 10.4';
          break;
        case 'Intel Mac OS X 10.5':
          opsys = 'Mac OS 10.5';
          break;
        case 'Intel Mac OS X 10.6':
          opsys = 'Mac OS 10.6';
          break;
        default:
          opsys = 'Mac OS 10.5';
          break;
      }
    }

    return { product : 'Firefox',
             platform : platform,
             opsys : opsys,
             branch : branch,
             buildid : appinfo.appBuildID,
             locale: navigator.language };
  }
};

qaPref.__defineGetter__("bundle", function(){return document.getElementById("bundle_qa");});
