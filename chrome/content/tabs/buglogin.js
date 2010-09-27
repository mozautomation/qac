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
 *  Heather Arthur <harthur@cmu.edu>
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

var bugLogin = {
  hostname : "chrome://qa/content/tabs/buglogin.xul",
  prompts : Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                      .getService(Components.interfaces.nsIPromptService),
  
  fillLogin : function() {
    document.getElementById("main-msg").value = window.arguments[0].msg;
    var login = qaLogin.getLogin("https://bugzilla.mozilla.org");
    if(login) {
      document.getElementById("login-text").value = login.username;
      document.getElementById("password-text").value = login.password;
    }
  },

  verifyLogin : function() {
    document.getElementById("login-verify-box").hidden = false;
    document.getElementById("login-error-msg").hidden = true;

    var username = document.getElementById("login-text").value;
    var password = document.getElementById("password-text").value;

    var callback = function() {
      document.getElementById("login-verify-box").hidden = true;
      qaLogin.saveLogin("chrome://qa/content/tabs/buglogin.xul", username, password);
      
      bugLogin.prompts.alert(null, "", document.getElementById("bundle_qa")
                                      .getString("qa.extension.bugzilla.loggedin"));
      bugLogin.closeDialog();
    };

    var errback = function(error) {
     if(document.height >= 120 && document.height < 170)
        window.resizeBy(0,40);

     document.getElementById("login-verify-box").hidden = true;
     var errMsg = document.getElementById("login-error-msg");
     
     while(errMsg.firstChild)
       errMsg.removeChild(errMsg.firstChild );

     errMsg.appendChild(document.createTextNode(error));
     errMsg.hidden = false;
    };

    bugzillaRPC.login(username, password, callback, errback);
    return false;
  },

  cancel : function() {
    bugLogin.closeDialog();
    return true;
  },

  closeDialog : function() {
    var loadingMsg = window.arguments[0].loading; // on main window
    if(loadingMsg)
      loadingMsg.hidden = true;
    var submitButton = window.arguments[0].submit;
    if(submitButton)
      submitButton.setAttribute('disabled', 'false');
    window.close();
  }
}
