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

var bugzilla = {

  maxDupes : 12,

  init : function() {
    bugzilla.clearFields();
    var buglink = document.getElementById("bug-qac-link");
    buglink.href = "https://bugzilla.mozilla.org/enter_bug.cgi?component=QA%20Companion" + 
                   "&form_name=enter_bug&op_sys=All&product=Other%20Applications" + 
                   "&qa_contact=qa-companion%40webtools.bugs&rep_platform=All";
  },

  clearFields : function() {
    var sysconfig = qaPref.getSysConfig();
    var report = document.getElementById("bug-caption");
    report.label = sysconfig.product + " "  +
                   qaMain.bundle.getString("qa.bugzilla.report");
    var desc = document.getElementById("bug-description-text");
    var strings = document.getElementById("bundle_qa");
    desc.value = strings.getString("qa.bugzilla.template");

    var summ = document.getElementById("bug-summary-text");
    summ.value = "";
  },
  
  submitBug : function() {
    var dupes = document.getElementById("dupes-box");

    var summary = document.getElementById("bug-summary-text").value;
    if(/^\W*$/.test(summary)) {
      alert(qaMain.bundle.getString("qa.bugzilla.nosummary"));
      return;
    }

    bugzilla.showBox("bug-login-loading");
    var submitButton = document.getElementById("bug-submit-button");
    submitButton.disabled = true;

    var description = document.getElementById("bug-description-text").value;
    var sysconfig = bugzilla.getSysConfig();
    var bugInfo = { summary: "[QAC generated] " + summary,
                    description: description,
                    product: sysconfig.product,
                    component: sysconfig.component,
                    version: sysconfig.branch,
                    status: 'UNCONFIRMED',
                    op_sys: sysconfig.opsys,
                    platform: sysconfig.platform};

    var callback = function(id) {
      bugzilla.hideBox("bug-submit-loading");
      submitButton.disabled = false;
      var url = "https://bugzilla.mozilla.org/show_bug.cgi?id=" + id;
      bugzilla.showBox("bug-success-box");
      var link = document.getElementById("bug-success-link");
      link.href = url;
      link.value = "bug " + id;
      bugzilla.clearFields();
    };

    var errback = function(errMsg) {
      bugzilla.hideBox("bug-login-loading");
      bugzilla.hideBox("bug-submit-loading");
      submitButton.disabled = false;
      document.getElementById("bug-error-label").value = errMsg;
      bugzilla.showBox("bug-error-box");
    };

    var login = qaLogin.getLogin('chrome://qa/content/tabs/buglogin.xul');

    if(login) {
      bugzillaRPC.login(login.username, login.password,
         function(){ bugzilla.hideBox("bug-login-loading");
                     bugzilla.showBox("bug-submit-loading");
                     bugzillaRPC.createBug(bugInfo, callback, errback); },
         errback);
    }
    else {
      bugzilla.openLogin(qaMain.bundle.getString("qa.bugzilla.needlogin"));
    } 
  },

  showDupes : function(event) {
    var terms = document.getElementById('bug-summary-text').value;
    if(/^\W*$/.test(terms))
      return;

    var sysconfig = bugzilla.getSysConfig();
    var coreBugs = []; // set by first callback

    var callback = function(bugs) {
       if(bugs.length < 1 && coreBugs.length < 1) {
         bugzilla.hideBox("bug-dupes-loading");
         return;
       }

       coreBugs = coreBugs.reverse().slice(0, bugzilla.maxDupes);
       bugs = bugs.reverse().slice(0, bugzilla.maxDupes);
       bugs = bugs.concat(coreBugs);

       var tree = document.getElementById("dupes-treechildren");

       while(tree.firstChild)
         tree.removeChild(tree.firstChild);

       for(var i = 0; i < bugs.length; i++) {
         var bug = bugs[i];
         var url = "https://bugzilla.mozilla.org/show_bug.cgi?id=" + bug.id;
         var treerow = document.createElement("treerow");
         var treeitem = document.createElement("treeitem");
         var treeid = document.createElement("treecell");
         var treesumm = document.createElement("treecell");
         treeitem.value = url;
         treeitem.appendChild(treerow);
         treerow.appendChild(treeid);
         treeid.setAttribute("label", bug.id);
         treerow.appendChild(treesumm);
         treesumm.setAttribute("label", bug.summary);
         tree.appendChild(treeitem);
       }
       bugzilla.hideBox("bug-dupes-loading");
       bugzilla.showBox("bug-dupes-box");
    };

    var coreCallback = function(bugs) {
      coreBugs = bugs;
      bugzillaRPC.advancedSearch(
             { short_desc_type: 'anywordssubstr',
               short_desc: terms.split(/[\.,\s]+/).join('+'),
               product: sysconfig.product,
               component: sysconfig.component,
               chfieldfrom: '4w',
               chfieldto: 'Now',
               order: 'Bug+Number'
             }, callback, errback);
    };

    var errback = function(errMsg) {
      bugzilla.hideBox("bug-dupes-loading");
      document.getElementById("bug-error-label").value = errMsg;
      bugzilla.showBox("bug-error-box");
    };

    bugzilla.showBox("bug-dupes-loading");
    bugzillaRPC.advancedSearch(
             { short_desc_type: 'anywordssubstr',
               short_desc: terms.split(/[\.,\s]+/).join('+'),
               product: 'Core',
               component: 'General',
               chfieldfrom: '4w',
               chfieldto: 'Now',
               order: 'Bug+Number'
             }, coreCallback, errback);
    
  },

  openSelectedBug : function(event) {
    if(event.button != 0 || event.detail < 2)
      return;
    var tree = document.getElementById("dupes-tree");
    var children = document.getElementById("dupes-treechildren");
    var url = children.childNodes[tree.currentIndex].value;
    var type = qaPref.getPref("browser.link.open_newwindow", "int");
    var where = "tab";
    if (type == 2)
      where = "window";
    openUILinkIn(url, where);
  },

  openLogin : function(msg) {
    var loading = document.getElementById("bug-login-loading");
    var submit = document.getElementById("bug-submit-button");

    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
             .getService(Components.interfaces.nsIWindowMediator);
    var dialog = wm.getMostRecentWindow("qac:buglogin") 
                 || window.openDialog("chrome://qa/content/tabs/buglogin.xul",
                                      "_blank", "chrome,all,dialog=yes",
                                      {msg: msg, loading: loading, submit: submit});
    dialog.focus();
  },

  hideBox : function(boxId) {
    document.getElementById(boxId).hidden = true;
  },

  showBox : function(boxId) {
    document.getElementById(boxId).hidden = false;
  },

  getSysConfig : function() {
    var buildId = qaPref.getPref(qaPref.prefBase + ".config.buildId", "char");
    var branch = qaPref.getPref(qaPref.prefBase + ".config.branch", "char");
    var platformPref = qaPref.getPref(qaPref.prefBase + ".config.platform", "char");
    var opsysPref = qaPref.getPref(qaPref.prefBase + ".config.os", "char");
    var productPref = qaPref.getPref(qaPref.prefBase + ".config.product", "char");

    var platform, opsys, product;

    // get Bugzilla equivalent for Litmus configuration
    switch(platformPref) {
      case 'Mac (PPC)':
        platform = 'PowerPC';
        break;
      case 'Linux-maemo': case 'Windows-mobile':
        platform = 'ARM';
        break;
      case 'Solaris(Sparc)':
        platform = 'Sun';
        break;
      default:
        platform = 'x86';
        break;
    }

    if(/Mac OS 10/.test(opsysPref)) {
      opsys = 'Mac OS X';
    }
    else if(/Windows-mobile/.test(platformPref)) {
      opsys = 'Windows Mobile 6 Professional';
    }
    else if(/^Solaris/.test(opsysPref)) {
      opsys = 'Solaris';
    }
    else if(/Linux-maemo/.test(platformPref)) {
      opsys = 'Linux (embedded)';
    }
    else if(/Windows 7/.test(opsysPref)) {
      opsys = "Windows 7";
    }
    else if(/Linux/.test(opsysPref)) {
      opsys = "Linux";
    }
    else {
      opsys = opsysPref; 
    }

    switch(productPref) {
      case 'Rock your Firefox (Facebook application)':
        product = 'addons.mozilla.org';
        component = 'Facebook Application';
        break;
      case 'AMO (addons.mozilla.org)':
        product = 'addons.mozilla.org';
        component = 'Public Pages';
        break;
      case 'SUMO (support.mozilla.com)':
        product = 'support.mozilla.com';
        component = 'General';
        break;
      case 'SFx (spreadfirefox.com)':
        product = 'Websites';
        component = 'spreadfirefox.com';
        break;
      case 'Mozilla.com':
        product = 'Websites';
        component = 'www.mozilla.com';
        break;
      case 'Fennec':
        product = 'Fennec';
        if(platformPref == 'Windows-mobile')
          component = 'Windows Mobile';
        else if(platformPref == 'Linux-maemo')
          component = 'Linux/Maemo';
        else
          component = 'General';
        break;
      default:
        product = productPref;
        component = 'General';
        break; 
    }
    
    return { product : product,
             component : component,
             platform : platform,
             opsys : opsys,
             branch : branch,
             buildid : buildId,
             locale: navigator.language };
  }
};
