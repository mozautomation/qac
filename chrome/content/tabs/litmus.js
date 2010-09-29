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
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Zach Lipton <zach@zachlipton.com>
 *  Ben Hsieh <bhsieh@mozilla.com>
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

const FIREFOX_ID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";


var litmus = {
  baseURL : qaPref.getPref(qaPref.prefBase + ".litmus.url", "char"),

  getTestcase : function(testId, callback) {
    var url = litmus.baseURL + "json.cgi?testcase_id=" + testId;
    qaTools.getJSON(url, callback, function() {
                throw "QAC: Error fetching " + url;});
  },

  getSubgroup : function(subgroupId, callback) {
    var url = litmus.baseURL + "json.cgi?subgroup_id=" + subgroupId;
    var getEnabled = function(subgroup) {
      var testcases = subgroup.testcases;
      var enabled = [];
      for(var i = 0; i < testcases.length; i++)
        if(testcases[i].enabled == 1)
          enabled.push(testcases[i]);
      subgroup.testcases = enabled;
      callback(subgroup);
    };
    qaTools.getJSON(url, getEnabled, function() {
                throw "QAC: Error fetching " + url;});
  },

  getGroup : function(groupId, callback) {
    var getEnabled = function(group) {
      var subgroups = group.subgroups;
      var enabled = [];
      for(var i = 0; i < subgroups.length; i++)
        if(subgroups[i].enabled == 1)
          enabled.push(subgroups[i]);
      group.subgroups = enabled;
      callback(group);
    };
    var url = litmus.baseURL + "json.cgi?testgroup_id=" + groupId;
    qaTools.getJSON(url, getEnabled, function() {
                throw "QAC: Error fetching " + url;});
  },

  getRun : function(runId, callback) {
    var getEnabled = function(run) {
      var groups = run.testgroups;
      var enabled = [];
      for(var i = 0; i < groups.length; i++)
        if(groups[i].enabled == 1)
          enabled.push(groups[i]);
      run.testgroups = enabled;
      callback(run);
    };
    var url = litmus.baseURL + "json.cgi?test_run_id=" + runId;
    qaTools.getJSON(url, getEnabled, function() {
                throw "QAC: Error fetching " + url;});
  },

  getRuns : function(callback) {
    var getEnabled = function(runs) {
      var enabled = [];
      for(var i = 0; i < runs.length; i++)
        if(runs[i].enabled == 1)
          enabled.push(runs[i]);
      callback(enabled);
    };
    var sysconfig = qaPref.getSysConfig();
    var product = sysconfig.product;
    var branch = sysconfig.branch;
    var url = litmus.baseURL + "json.cgi?test_runs_by_branch_product_name=1"
               + "&testgroup_id=&product_name=" + product
               + "&branch_name=" + branch;

    qaTools.getJSON(url, getEnabled, function() {
                throw "QAC: Error fetching " + url;});
  },

  loadSavedTest : function() {
    litmus.clearTest();
    litmus.runIndex = qaPref.getPref(qaPref.prefBase + ".litmus.runIndex", "int");
    litmus.groupIndex = qaPref.getPref(qaPref.prefBase + ".litmus.groupIndex", "int");
    litmus.subgroupIndex = qaPref.getPref(qaPref.prefBase + ".litmus.subgroupIndex", "int");
    litmus.testcaseIndex = qaPref.getPref(qaPref.prefBase + ".litmus.testcaseIndex", "int");
    
    var runId = qaPref.getPref(qaPref.prefBase + ".litmus.runId", "int");
    if(runId != -1) {
      litmus.getRuns(litmus.populateRuns); // pre-populate runs in dialog
      litmus.loadRun(runId);
      var groupId = qaPref.getPref(qaPref.prefBase + ".litmus.groupId", "int");
      if(groupId != -1)
        litmus.loadGroup(groupId);
      var subgroupId = qaPref.getPref(qaPref.prefBase + ".litmus.subgroupId", "int");
      if(subgroupId != -1)
        litmus.loadSubgroup(subgroupId);
    }
    else {
      // first run - populate select tests menus
     var runsCallback = function(runs) {
        litmus.populateRuns(runs);
        var runCallback = function(run) {
          litmus.populateGroups(run);
          var groupCallback = function(group) {
            litmus.populateSubgroups(group);
          };
          litmus.getGroup(run.testgroups[0].testgroup_id, groupCallback);
        };
        litmus.getRun(runs[0].test_run_id, runCallback);
      };
      litmus.getRuns(runsCallback);

      var id = document.getElementById("litmus-testcase-id");
      id.value = qaMain.bundle.getString("qa.litmus.notestcase");
    }
  },

  saveTestcase : function() {
    if(!litmus.testcase)
      return;
    qaPref.setPref(qaPref.prefBase + ".litmus.testcaseId", litmus.testcase.testcase_id, "int");
    qaPref.setPref(qaPref.prefBase + ".litmus.testcaseIndex", litmus.testcaseIndex, "int");
    qaPref.setPref(qaPref.prefBase + ".litmus.subgroupId", litmus.subgroup.subgroup_id, "int");
    qaPref.setPref(qaPref.prefBase + ".litmus.subgroupIndex", litmus.subgroupIndex, "int");
    qaPref.setPref(qaPref.prefBase + ".litmus.groupId", litmus.group.testgroup_id, "int");
    qaPref.setPref(qaPref.prefBase + ".litmus.groupIndex", litmus.groupIndex, "int");
    qaPref.setPref(qaPref.prefBase + ".litmus.runId", litmus.run.test_run_id, "int");
    qaPref.setPref(qaPref.prefBase + ".litmus.runIndex", litmus.runIndex, "int");
  },

  populateRuns : function(testruns) {
    var runslist = document.getElementById("litmus-runs");
    runslist.disabled = false;
    runslist.removeAllItems();

    for(var i = 0; i < testruns.length; i++) {
      var testrun = testruns[i];
      runslist.appendItem(testrun.name, testrun.test_run_id);
    }
    runslist.selectedIndex = litmus.runIndex;
  },

  populateGroups : function(testrun) {
    litmus.selectedRun = testrun; // cache for possible loading

    var testgroups = testrun.testgroups;
    var groupslist = document.getElementById("litmus-groups");
    groupslist.disabled = false;
    groupslist.removeAllItems();

    for (var i = 0; i < testgroups.length; i++) {
      var testgroup = testgroups[i];
      groupslist.appendItem(testgroup.name, testgroup.testgroup_id);
    }
    groupslist.selectedIndex = litmus.groupIndex;
  },

  populateSubgroups : function(testgroup) {
    litmus.selectedGroup = testgroup;

    var subgroups = testgroup.subgroups;
    var subgrouplist = document.getElementById("litmus-subgroups");
    subgrouplist.disabled = false;
    subgrouplist.removeAllItems();
    document.getElementById("litmus-select-ok").disabled = false;
    document.getElementById("litmus-groups").disabled = false;

    for (var i = 0; i < subgroups.length; i++) {
      var subgroup = subgroups[i];
      subgrouplist.appendItem(subgroup.name, subgroup.subgroup_id);
    }
    subgrouplist.selectedIndex = litmus.subgroupIndex;
  },

  runSelected : function() {
    var runslist = document.getElementById("litmus-runs");
    var run = runslist.selectedItem;
    litmus.groupIndex = 0;
    if(run && run.value) {
      litmus.disableMenulist("litmus-groups");
      litmus.disableMenulist("litmus-subgroups");
      document.getElementById("litmus-select-ok").disabled = true;
      var callback = function(run) {
        litmus.populateGroups(run);
        litmus.groupSelected();
      };
      litmus.getRun(run.value, callback);
    }
  },

  groupSelected : function() {
    var grouplist = document.getElementById("litmus-groups");
    var group = grouplist.selectedItem;
    litmus.subgroupIndex = 0;
    if(group && group.value) {
      grouplist.disabled = true;
      litmus.disableMenulist("litmus-subgroups");
      document.getElementById("litmus-select-ok").disabled = true;
      litmus.getGroup(group.value, litmus.populateSubgroups);
    }
  },

  loadSelectedSubgroup : function() {
    var runs = document.getElementById("litmus-runs");
    litmus.run = litmus.selectedRun;
    litmus.runIndex = runs.selectedIndex

    var groups = document.getElementById("litmus-groups");
    litmus.group = litmus.selectedGroup;
    litmus.groupIndex = groups.selectedIndex;

    var subgroups = document.getElementById("litmus-subgroups");
    litmus.subgroupIndex = subgroups.selectedIndex;
    litmus.loadNewSubgroup(subgroups.selectedItem.value);
    litmus.hideSelectTests();
  },

  loadRun : function(runId) {
    if(litmus.run && runId == litmus.run.test_run_id)
     return; // don't want to re-fetch if already loaded
    var callback = function(run) {
      litmus.run = run;
      litmus.populateGroups(run);
      document.getElementById("litmus-runs").selectedIndex = litmus.runIndex;
    };
    litmus.getRun(runId, callback);
  },

  loadGroup : function(groupId) {
    if(litmus.group && groupId == litmus.group.testgroup_id)
      return;
    var callback = function(group) {
      litmus.group = group;
      litmus.populateSubgroups(group);
      document.getElementById("litmus-groups").selectedIndex = litmus.groupIndex;
    };
    litmus.getGroup(groupId, callback);
  },

  loadNewGroup : function(groupId) {
    litmus.disableSwitching(); // prevent crazy race conditions
    litmus.clearTest();

    var callback = function(group) {
      litmus.subgroupIndex = 0;
      litmus.group = group;
      litmus.populateSubgroups(group);
      document.getElementById("litmus-groups").selectedIndex = litmus.groupIndex;
      var subgroup = group.subgroups[litmus.subgroupIndex];
      litmus.loadNewSubgroup(subgroup.subgroup_id);
    };
    litmus.getGroup(groupId, callback);
  },

  loadSubgroup : function(subgroupId) {
    var callback = function(subgroup) {
      document.title = qaMain.bundle.getFormattedString("qa.extension.title.subgroup",
                      [subgroup.name]);
      document.getElementById("litmus-subgroups").selectedIndex = litmus.subgroupIndex;
      litmus.subgroup = subgroup;
      document.getElementById('litmus-testcase-progress').value =
        qaMain.bundle.getFormattedString('qa.litmus.progress',
        [litmus.testcaseIndex + 1, subgroup.testcases.length]);
      litmus.loadTestcase();
    };
    litmus.getSubgroup(subgroupId, callback);
  },

  loadNewSubgroup : function(subgroupId) {
    litmus.testcaseIndex = 0;

    if(litmus.subgroup && subgroupId == litmus.subgroup.subgroup_id) {
      // just go back to first test
      document.getElementById('litmus-testcase-progress').value =
        qaMain.bundle.getFormattedString('qa.litmus.progress',
        [1, litmus.subgroup.testcases.length]);
      litmus.loadTestcase();
      return;
    }
 
    litmus.disableSwitching();
    litmus.clearTest();

    var callback = function(subgroup) {
      document.title = qaMain.bundle.getFormattedString("qa.extension.title.subgroup",
                                                 [subgroup.name]);
      document.getElementById("litmus-subgroups").selectedIndex = litmus.subgroupIndex;
      litmus.subgroup = subgroup;
      litmus.highlightProgress();
      document.getElementById('litmus-testcase-progress').value =
        qaMain.bundle.getFormattedString('qa.litmus.progress',
        [1, subgroup.testcases.length]);
      litmus.loadTestcase();
    };
    litmus.getSubgroup(subgroupId, callback);
  },

  loadTestcase : function() {
    var testcase = litmus.subgroup.testcases[litmus.testcaseIndex];
    if(!testcase || testcase.enabled == 0) {
      litmus.nextTestcase();
      return;
    }

    litmus.testcase = testcase;
    
    var litmusTestCaseId = document.getElementById('litmus-testcase-id');
    
    litmusTestCaseId.value =
             qaMain.bundle.getString("qa.litmus.testcase.head") + 
             testcase.testcase_id;

    litmusTestCaseId.setAttribute("class","text-link");
    litmusTestCaseId.setAttribute("href", qaMain.urlbundle.getString("qa.extension.url.litmus.link_test")
             + testcase.testcase_id);

    var summary = document.getElementById("litmus-testcase-summary");
    summary.value = testcase.summary;
    summary.tooltipText =  "#" + testcase.testcase_id + " - " + testcase.summary;

    var converter = new Showdown.converter();

    var formattedSteps = converter.makeHtml(testcase.steps);      
    qaTools.writeSafeHTML('litmus-testcase-steps', formattedSteps);
    qaTools.assignLinkHandlers(document.getElementById('litmus-testcase-steps'));

    var formattedResults = converter.makeHtml(testcase.expected_results);
    qaTools.writeSafeHTML('litmus-testcase-expected', formattedResults);
    qaTools.assignLinkHandlers(document.getElementById('litmus-testcase-expected'));

    var comment = document.getElementById('litmus-testcase-comment');
    comment.value = '';
    comment.emptyText = '';

    if(litmus.subgroup) // could not be defined on initial testcase load
      document.getElementById('litmus-testcase-progress').value =
        qaMain.bundle.getFormattedString('qa.litmus.progress',
       [litmus.testcaseIndex + 1, litmus.subgroup.testcases.length]);
    var selectButton = document.getElementById("litmus-select-button");
    selectButton.label = qaMain.bundle.getString("qa.litmus.changetests");

    litmus.enableSwitching();
  },

  nextTestcase : function() {
    var testcases = litmus.subgroup.testcases;
    if(testcases.length <= ++litmus.testcaseIndex) {
      // last testcase in subgroup
      var subgroups = litmus.group.subgroups;
      if(subgroups.length <= ++litmus.subgroupIndex) {
        // last subgroup in group
        var groups = litmus.run.testgroups;
        if(groups.length <= ++litmus.groupIndex) {
          // last group in run
          litmus.disableSwitching();
          litmus.resetFields();
          document.getElementById("litmus-testcase-summary").value =
            qaMain.bundle.getString("qa.litmus.runend");
          document.getElementById("litmus-select-button").label =
            qaMain.bundle.getString("qa.litmus.selecttests");
        }
        else {
          var group = groups[litmus.groupIndex];
          litmus.loadNewGroup(group.testgroup_id);
        }
      }
      else {
        var subgroup = subgroups[litmus.subgroupIndex];
        litmus.loadNewSubgroup(subgroup.subgroup_id);
      }
    }
    else {
      litmus.loadTestcase();
    }
  },

  showSelectTests : function() {
    var dialog = document.getElementById("litmus-selecttests-dialog");
    dialog.setAttribute('hidden', 'false');
    var screen = document.getElementById("litmus-dialog-screen");
    screen.setAttribute('hidden', 'false');
  },

  hideSelectTests : function() {
    var dialog = document.getElementById("litmus-selecttests-dialog");
    dialog.setAttribute('hidden', 'true');
    var screen = document.getElementById("litmus-dialog-screen");
    screen.setAttribute('hidden', 'true');
  },

  resetFields : function() {
    litmus.clearTest();
    document.title = qaMain.bundle.getString("qa.extension.title");
    document.getElementById("litmus-testcase-id").value = '';
    document.getElementById("litmus-testcase-summary").value = '';
  },

  clearTest : function() {
    var id = document.getElementById("litmus-testcase-id");
    id.value = qaMain.bundle.getString("qa.extension.loading");
    document.getElementById("litmus-testcase-summary").value = '';
    document.getElementById("litmus-testcase-comment").value = '';
    qaTools.writeSafeHTML("litmus-testcase-steps", '');
    qaTools.writeSafeHTML("litmus-testcase-expected", '');
  },

  disableMenulist : function(id) {
    var menulist = document.getElementById(id);
    menulist.removeAllItems();
    menulist.appendItem(qaMain.bundle.getString("qa.extension.loading"),'');
    menulist.selectedIndex = 0;
    menulist.disabled = true;
  },

  disableSwitching : function() {
    document.getElementById("litmus-testcase-skip").disabled = true;
    document.getElementById("litmus-testcase-pass").disabled = true;
    document.getElementById("litmus-testcase-fail").disabled = true;
    document.getElementById("litmus-testcase-unclear").disabled = true;
  },

  enableSwitching : function() {
    document.getElementById("litmus-testcase-skip").disabled = false;
    document.getElementById("litmus-testcase-pass").disabled = false;
    document.getElementById("litmus-testcase-fail").disabled = false;
    document.getElementById("litmus-testcase-unclear").disabled = false;
  },

  highlightProgress : function() {
   setTimeout(function() {
        document.getElementById("litmus-progress-box").className = "glow-green";
      setTimeout(function() {
        document.getElementById("litmus-progress-box").className = "";
       }, 1000);
     }, 0);
  },
  
  highlightComment : function(){
    setTimeout(function() {
      document.getElementById("litmus-testcase-comment").className = "glow-red";
       setTimeout(function() {
         document.getElementById("litmus-testcase-comment").className = "";
       }, 1000);
      }, 0);
  },
  
  checkComment : function(){
    var testComment = document.getElementById("litmus-testcase-comment");
    
    if(/^\W*$/.test(testComment.value)){
      litmus.highlightComment();
      testComment.emptyText = qaMain.bundle.getString("qa.litmus.emptycomment");
      return false;
    }else {
      return true;
    }
  },
  
  submitTestcase : function(result) {
    var login = qaLogin.getLogin('chrome://qa/content/qa.xul');
    if(!login) {
      litmus.openLitmusLogin();
      return;
    }
    var l = new LitmusResults({username: login.username,
                  password: login.password,
                  server: litmus.baseURL});

    l.sysconfig(qaPref.getSysConfig());

    if(result == 'Fail' || result == 'Test unclear/broken'){
      if(!(litmus.checkComment())){
        return;
      }
    }

    l.addResult(new Result({
      testid: litmus.testcase.testcase_id,
      resultstatus: result,
      exitstatus: 'Exited Normally',
      duration: 0,
      comment: document.getElementById('litmus-testcase-comment').value,
      isAutomatedResult: 0
    }));

    var errback = function(resp) {
      litmus.hideBox("litmus-submit-loading");
      litmus.enableSwitching();
      var error = document.getElementById("litmus-error-label");
      var msg;
      if(resp && resp.responseText)
        msg = qaMain.bundle.getString("qa.litmus.error") + ": " + resp.responseText;
      else
        msg = qaMain.bundle.getString("qa.litmus.error");

      while(error.firstChild)
        error.removeChild(error.firstChild);
      msg = document.createTextNode(msg);
      error.appendChild(msg); // append so text will wrap

      litmus.showBox("litmus-error-box");
    };

    var callback = function() {
      litmus.hideBox("litmus-submit-loading");
      litmus.enableSwitching();
      litmus.nextTestcase();
    };
    
    litmus.submitWait(true);
    litmus.disableSwitching();
    litmus.showBox("litmus-submit-loading");
    litmus.postResultXML(l.toXML(), callback, errback);
  },

  postResultXML : function(xml, callback, errback) {
    var query = qaTools.urlEncode({ data: xml});
    var newCallback = function(resp) {
      if(!resp)
        errback();
      // only call callback() if we really had a success. XML
      // processing errors should result in a call to errback()
      else if ((/^ok/i).exec(resp.responseText)){
        callback(resp);
        if(resp.status == 200){
          litmus.submitWait(false);
        }
      }
      else
        errback(resp);
    };
    qaTools.httpPostRequest(litmus.baseURL + 'process_test.cgi',
                            query, newCallback, errback);
  },

  openLitmusLogin : function() {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
               .getService(Components.interfaces.nsIWindowMediator);
    var litmusWindow = wm.getMostRecentWindow("qac:litmuslogin")
                       || window.openDialog('chrome://qa/content/litmuslogin.xul', '', 
                                            'chrome, dialog, centerscreen=yes')
    litmusWindow.focus();
  },
  
  submitWait : function(aState){
    document.getElementById("litmus-testcase-pass").disabled = aState;
    document.getElementById("litmus-testcase-fail").disabled = aState;
    document.getElementById("litmus-testcase-unclear").disabled = aState;
  },
  
  hideBox : function(boxId) {
    document.getElementById(boxId).hidden = true;
  },

  showBox : function(boxId) {
    document.getElementById(boxId).hidden = false;
  }
};
