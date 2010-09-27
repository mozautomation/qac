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
 * The Initial Developer of the Original Code is the Mozilla Foundation.
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

var qaFirstRun = {
 
  prompts : Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                     .getService(Components.interfaces.nsIPromptService),

  loginURL : qaPref.getPref(qaPref.prefBase + ".litmus.url", "char")
                            + "login.cgi",

  registerURL : qaPref.getPref(qaPref.prefBase + ".litmus.url", "char")
                               + "extension.cgi?createAccount=1",
  
  login : function(){
    var postDataQuery = qaTools.urlEncode({
      login_type: 'litmus',
      login_loc: 'index.cgi',
      email: document.getElementById("qa-firstrun-email").value,
      password: document.getElementById("qa-firstrun-password").value,
      Submit: "Login"
    });
  
    qaFirstRun.loadingThrobber();
    qaTools.httpPostRequest(qaFirstRun.loginURL, postDataQuery,
                        qaFirstRun.loginResponse, qaFirstRun.reqError);
  },
  
  register : function(){
    var postDataQuery = qaTools.urlEncode({
      login_type: 'newaccount',
      login_loc: 'extension.cgi', 
      login_extension: 'true',
      email: document.getElementById("qa-firstrun-email").value,
      password: document.getElementById("qa-firstrun-password").value,
      password_confirm: document.getElementById("qa-firstrun-confirm").value, 
    });
    
    postDataQuery += "&Submit=Create+Account";
   
    if(qaFirstRun.checkRegEmail()){
        if(qaFirstRun.checkRegPassword()){
         qaFirstRun.loadingThrobber();
           qaTools.httpPostRequest(qaFirstRun.registerURL,postDataQuery, 
                                qaFirstRun.regResponse, qaFirstRun.reqError)
      }
    }
  },
    
  checkRegEmail : function(){
    var validEmail = new RegExp("^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$");
    var match = validEmail.exec(document.getElementById("qa-firstrun-email").value);
        
    if(!match) {
      qaFirstRun.prompts.alert(null,"",qaTools.getString("qa.firstrun.email.invalid"));
      qaFirstRun.setFocusOnError("qa-firstrun-email");
      return false;
    }
    else 
      return true;
  },
    
  checkRegPassword : function(){
    if (document.getElementById("qa-firstrun-password").value == "" ){
      qaFirstRun.prompts.alert(null,"",qaTools.getString("qa.firstrun.create.password.required"));
      qaFirstRun.setFocusOnError("qa-firstrun-password");
      return false;
    }
    else if (document.getElementById("qa-firstrun-password").value.length < 5 ){
      qaFirstRun.prompts.alert(null,"",qaTools.getString("qa.firstrun.create.password.length"));
      qaFirstRun.setFocusOnError("qa-firstrun-password");
      return false;
    }
    else return true;
  },
    
  saveCredentials : function(){
    qaLogin.saveLogin('chrome://qa/content/qa.xul',
                       document.getElementById("qa-firstrun-email").value,
                       document.getElementById("qa-firstrun-password").value);
  },

  checkCredentials : function() {
    var credentials = new Array(
          qaLogin.getLogin('chrome://qa/content/qa.xul'), 
          qaLogin.getLogin('https://litmus.mozilla.org'));

    if(credentials[0]) {
      qaFirstRun.setCredentials(credentials[0]);
      qaFirstRun.hideRegForm();
    }
    else if(credentials[1]) {
      qaFirstRun.setCredentials(credentials[1]);  
      qaFirstRun.hideRegForm();
    }
  },

  setCredentials : function(login) {
    document.getElementById("qa-firstrun-email").value = login.username;
    document.getElementById("qa-firstrun-password").value = login.password;
  },

  hideRegForm : function() {
    document.getElementById("qa-firstrun-create").disabled = "true";
    document.getElementById("qa-firstrun-confirm").disabled="true";
  },

  loginResponse : function(response) {
    var reqResponse = response.responseText;
    var failMessage =  new RegExp("'failure','(.*)'");
    var failResponse = failMessage.exec(reqResponse);
  
    if(response.status == 200)
      qaFirstRun.loadingThrobber();
    if(failResponse)
     qaFirstRun.prompts.alert(null,"",failResponse[1]);
    else {
      qaFirstRun.saveCredentials();
      qaFirstRun.prompts.alert(null, "", document.getElementById("bundle_qa")
                                       .getString("qa.extension.litmus.loggedin"));
      window.close();
    }
  },  
  
  regResponse : function(response){
    var reqResponse = response.responseText; 
    var failMessage =  new RegExp("'failure','(.*)'");
    var failResponse = failMessage.exec(reqResponse);

    if(response.status==200)
      qaFirstRun.loadingThrobber();
    if(failResponse)
      qaFirstRun.prompts.alert(null,"",failResponse[1]);
    else {
      qaFirstRun.saveCredentials();
      qaFirstRun.prompts.alert(null, "", document.getElementById("bundle_qa")
                                        .getString("qa.firstrun.accountCreated"));
      window.close();
    }
  },
    
  reqError : function(response){
    qaTools.showErrorMessage(response.responseText);
  },

  loadingThrobber : function(){
   if(document.getElementById("loading").style.visibility == "hidden") {
     document.getElementById("loading").style.visibility = "visible";
     document.getElementById("qa-firstrun-create").disabled = true;
     document.getElementById("qa-firstrun-login").disabled = true;
   }
   else {
     document.getElementById("loading").style.visibility = "hidden";
     document.getElementById("qa-firstrun-create").disabled = false;
     document.getElementById("qa-firstrun-login").disabled = false;
   }
  },

  setFocusOnError : function(aElement) {
    document.getElementById(aElement).focus();
  },
   
  windowHelp : function () {
    var aUrl = document.getElementById("bundle_urls").getString("qa.extension.url.qmo.qmodoc");
    qaTools.statusBarOpenWindow(aUrl);
  }
};
