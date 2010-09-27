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

var litmusLogin = {
  hostname: "chrome://qa/content/litmuslogin.xul",
  prompts : Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService),

  fillLogin: function() {
    var credentials = new Array(
        qaLogin.getLogin('chrome://qa/content/qa.xul'),
        qaLogin.getLogin('https://litmus.mozilla.org'));

    if (credentials[0]) {
      document.getElementById("login-text").value = credentials[0].username;
      document.getElementById("password-text").value = credentials[0].password;
    }
    else if (credentials[1]) {
      document.getElementById("login-text").value = credentials[1].username;
      document.getElementById("password-text").value = credentials[1].password;
    }
  },

  verifyLogin: function() {
    document.getElementById("login-verify-box").hidden = false;
    document.getElementById("login-error-msg").hidden = true;

    var username = document.getElementById("login-text").value;
    var password = document.getElementById("password-text").value;

    var callback = function(response) {
      var failMessage = new RegExp("'failure','(.*)'");
      var failResponse = failMessage.exec(response.responseText);

      if (failResponse) {
        var errMsg = document.getElementById("login-error-msg");

        if (errMsg.hasChildNodes()) {
          while (errMsg.childNodes.length >= 1)
            errMsg.removeChild(errMsg.firstChild);
        }

        errMsg.appendChild(document.createTextNode(failResponse[1]));
        errMsg.hidden = false;
                
        document.getElementById("login-verify-box").hidden = true;

        if (document.height >= 120 && document.height < 170)
          window.resizeBy(0, 40);
      }
      else {
        qaLogin.saveLogin("chrome://qa/content/qa.xul", username, password);
        litmusLogin.prompts.alert(null, "", document.getElementById("bundle_qa")
                                    .getString("qa.extension.litmus.loggedin"));
        litmusLogin.closeDialog();
      }
    };

    var errback = function(error) {
      var errMsg = document.getElementById("login-error-msg");
      errMsg.value = error;
      errMsg.hidden = false;
    };

    litmusLogin.login(username, password, callback, errback);
    return false;
  },

  login: function(username, password, callback, errback) {
    var postDataQuery = qaTools.urlEncode({
            login_type: 'litmus',
            login_loc: 'index.cgi',
            email: username,
            password: password,
            Submit: "Login"
          });
    var loginURL = qaPref.getPref(qaPref.prefBase + ".litmus.url", "char") + "login.cgi";
    qaTools.httpPostRequest(loginURL, postDataQuery, callback, errback);
  },

  cancel: function() {
    litmusLogin.closeDialog();
    return true;
  },

  closeDialog: function() {
    window.close();
  }
}
