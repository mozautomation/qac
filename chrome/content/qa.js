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


var qaMain = {
  htmlNS: "http://www.w3.org/1999/xhtml",

  openQATool : function() {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
             .getService(Components.interfaces.nsIWindowMediator);
    var qacWindow = wm.getMostRecentWindow("qac:main") 
                    || window.open("chrome://qa/content/qa.xul", "_blank",
                                   "chrome,all,dialog=no,resizable=yes");
    qacWindow.focus();
  },
  
  closeQATool : function() {
    window.close();
  },
  
  onToolOpen : function() {
    if (qaPref.getPref(qaPref.prefBase+'.isFirstTime', 'bool') == true) {
      window.open("chrome://qa/content/firstrun.xul", "_blank",
                  "chrome,all,dialog=yes");
	    qaPref.setPref(qaPref.prefBase+'.isFirstTime',false,'bool');
    }
    bugzilla.init();
    litmus.loadSavedTest();

    // get configuration again in case they changed branches/platforms
    if(!qaPref.getPref(qaPref.prefBase + ".config.remember", "bool"))
      qaPref.setConfig(qaPref.defaultConfig());
	
    // for Mac-specific CSS rules
    var runtime = Components.classes["@mozilla.org/xre/app-info;1"]
                  .getService(Components.interfaces.nsIXULRuntime);
    document.getElementById("qa_tabbox").setAttribute("OS", runtime.OS);
  },

  onToolClose : function() {
    litmus.saveTestcase();
  }
};

qaMain.__defineGetter__("bundle", function(){return document.getElementById("bundle_qa");});
qaMain.__defineGetter__("urlbundle", function(){return document.getElementById("bundle_urls");});
