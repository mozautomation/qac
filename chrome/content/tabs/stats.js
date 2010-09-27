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

var qaStats = {
   
   monthly: null, weekly: null, alltime: null, recentBugs: null,
   
   getPersonalStats : function(){
    var currentUser = qaStats.getCurrentUser();
    var url = qaMain.urlbundle.getString("qa.extension.url.litmus.personal_stats");
    
    if(currentUser!=undefined){
      url += currentUser;
      qaStats.loadingThrobber();
      qaTools.getJSON(url, qaStats.getStatsCallback, function(){ throw qaTools.getString("qa.preferences.error"); });
    }
   },
   
   getCurrentUser : function(){
    var credentials = new Array(
        qaLogin.getLogin('chrome://qa/content/qa.xul'),
        qaLogin.getLogin('https://litmus.mozilla.org'));
 
    if(credentials[0] != undefined) {
      document.getElementById("qa-user-stats-cur").value = 
      qaMain.bundle.getFormattedString("qa.stats.subtitle", [credentials[0].username]);
      return credentials[0].username;
    }
    else if(credentials[1] != undefined) {
      document.getElementById("qa-user-stats-cur").value =
      qaMain.bundle.getFormattedString("qa.stats.subtitle", [credentials[1].username]);
      return credentials[1].username;
    }else{
      return undefined;
    }
   },

   getBugzillaUser : function() {
     var login = qaLogin.getLogin('chrome://qa/content/tabs/buglogin.xul');
     if(login)
       return login.username;
     var bugzillaLogin = qaLogin.getLogin("https://bugzilla.mozilla.org");
     if(bugzillaLogin)
       return bugzillaLogin.username;
     var litmusLogin = qaLogin.getLogin('chrome://qa/content/qa.xul');
     if(litmusLogin)
       return litmusLogin.username;
   },
   
   getStatsCallback : function(stats){  
    qaStats.monthly = document.getElementById("myStats_month");
    qaStats.weekly = document.getElementById("myStats_week");
    qaStats.alltime = document.getElementById("myStats_alltime");
    
    qaStats.monthly.value = stats.month;
    qaStats.weekly.value = stats.week;
    qaStats.alltime.value = stats.alltime;
    
    qaStats.setGold();
    qaStats.setStars();
    qaStats.getBugsByUsername();
    qaStats.getTodaysResults();
    qaStats.getWeeksResults();
    qaStats.setCommonResultsURL();
   },
   
   setGold : function(){
    qaStats.alltime.setAttribute("style","-moz-box-shadow: 0 0 1em gold;");
   },
   
   setStars : function(){
    var monthlyGroup = document.getElementById("myStats_month_ranking");
    var weeklyGroup = document.getElementById("myStats_week_ranking");
    var allTimeGroup = document.getElementById("myStats_alltime_ranking");
    
    var starGroup = 10; // Max ranking per category
    
    // Clean up 
    
    if(monthlyGroup.hasChildNodes()){
     while(monthlyGroup.childNodes.length >= 1)
      monthlyGroup.removeChild(monthlyGroup.firstChild);
    }
    if(weeklyGroup.hasChildNodes()){
     while(weeklyGroup.childNodes.length >= 1)
      weeklyGroup.removeChild(weeklyGroup.firstChild);
    }
    if(allTimeGroup.hasChildNodes()){
     while(allTimeGroup.childNodes.length >= 1)
      allTimeGroup.removeChild(allTimeGroup.firstChild);
    }
    
    // Draw rankings grey unstars  
    for(var i=0;i<starGroup;i++){
     monthlyGroup.appendChild(qaStats.makeUnStar());
     weeklyGroup.appendChild(qaStats.makeUnStar());
     allTimeGroup.appendChild(qaStats.makeUnStar());
    }
    
    /*
    Draw rankings gold stars
     A star is added per (to max 10)
    - 10 submissions - Weekly  
    - 50 submissions - Monthly
    - 100 submissions - Alltime
    
    - If stat scores reach max value, all stars wil be filled
    */
    
    if(Math.floor(qaStats.monthly.value / 50) <= 10){ 
     for(var i=0;i<Math.floor(qaStats.monthly.value / 50);i++){
      monthlyGroup.removeChild(monthlyGroup.childNodes[i]);
      monthlyGroup.insertBefore(qaStats.makeStar(), monthlyGroup.firstChild);
     }
     for(var i=0;i<monthlyGroup.childNodes.length;i++){
      if(monthlyGroup.childNodes[i].getAttribute("src") == "chrome://qa/skin/star.png"){
       monthlyGroup.childNodes[i].setAttribute("tooltiptext", 
        qaMain.bundle.getFormattedString('qa.stats.stars', [(i+1) * 50]));
      }
    }
    }else{
     for(var i=0;i<10;i++) {  
      monthlyGroup.removeChild(monthlyGroup.childNodes[i]);
      monthlyGroup.insertBefore(qaStats.makeStar(), monthlyGroup.firstChild);
     }
    }
    
    if(Math.floor(qaStats.weekly.value / 10) <= 10){
     for(var i=0;i<Math.floor(qaStats.weekly.value / 10);i++){
      weeklyGroup.removeChild(weeklyGroup.childNodes[i]);
      weeklyGroup.insertBefore(qaStats.makeStar(), weeklyGroup.firstChild);
     }
     for(var i=0;i<weeklyGroup.childNodes.length;i++){
      if(weeklyGroup.childNodes[i].getAttribute("src") == "chrome://qa/skin/star.png"){
       weeklyGroup.childNodes[i].setAttribute("tooltiptext", 
        qaMain.bundle.getFormattedString('qa.stats.stars', [(i+1) * 10]));
      }
     }
    }else{
     for(var i=0;i<10;i++) {
      weeklyGroup.removeChild(weeklyGroup.childNodes[i]);
      weeklyGroup.insertBefore(qaStats.makeStar(), weeklyGroup.firstChild);   
     }
    }
    
    if(Math.floor(qaStats.alltime.value / 100) <= 10){
     for(var i=0;i<Math.floor(qaStats.alltime.value / 100);i++){
      allTimeGroup.removeChild(allTimeGroup.childNodes[i]);
      allTimeGroup.insertBefore(qaStats.makeStar(), allTimeGroup.firstChild);
     }
     for(var i=0;i<allTimeGroup.childNodes.length;i++){
      if(allTimeGroup.childNodes[i].getAttribute("src") == "chrome://qa/skin/star.png"){
       allTimeGroup.childNodes[i].setAttribute("tooltiptext", 
        qaMain.bundle.getFormattedString('qa.stats.stars', [(i+1) * 100]));
      }
     }
    }else{
     for(var i=0;i<10;i++) {
      allTimeGroup.removeChild(allTimeGroup.childNodes[i]);
      allTimeGroup.insertBefore(qaStats.makeStar(), allTimeGroup.firstChild);   
     }
    }
   },
   
   makeStar : function(){
    var newStar = document.createElement("image");
    newStar.setAttribute("src","chrome://qa/skin/star.png");
    newStar.setAttribute("style","width: 16px; height: 16px");
    return newStar; 
   },
   
   makeUnStar : function(){
    var newUnStar = document.createElement("image");
    newUnStar.setAttribute("src", "chrome://qa/skin/unstar.png");
    newUnStar.setAttribute("style","width: 16px; height: 16px");
    return newUnStar;
   },
   
   getBugsByUsername : function(){
    bugzillaRPC.fastAdvancedSearch({
     chfieldfrom: '4w',
     order: 'Bug+Number',
     emailreporter1: '1',
     emailtype1: 'exact',
     email1: qaStats.getBugzillaUser()
     }, qaStats.getBugsCallback, function(){ 
     throw qaTools.getString("qa.stats.bugs.error");}
    );
   },
   
   getBugsCallback : function(bugs){
    qaStats.recentBugs = bugs;
    qaStats.generateRecentBugListing(qaStats.recentBugs.reverse());    
    qaStats.loadingThrobber();
   },
   
   openBug : function(){
    var menu = document.getElementById('qa-user-stats-buglist');
    var url = qaMain.urlbundle.getString("qa.extension.url.bugzilla.showbug");
     
    window.opener.getBrowser().addTab(url+=menu.selectedItem.value);
   },
   
   loadingThrobber : function(){
    var loadingThrobber = document.getElementById("loading");  
    
    if(loadingThrobber.style.visibility == "hidden") {
     loadingThrobber.style.visibility = "visible";
    }
    else {
     loadingThrobber.style.visibility = "hidden";
    }
   },
   
   generateRecentBugListing : function(bugs){   
    var menu = document.getElementById("qa-user-stats-buglist");
    while(menu.getRowCount()) menu.removeItemAt(0);
     
    for(var i=0;i<bugs.length;i++){
      var row = document.createElement("listitem");
      row.value = bugs[i].id;

      var id = document.createElement("listcell");
      id.setAttribute("label",bugs[i].id);

      var name = document.createElement("listcell");
      name.setAttribute("label",bugs[i].summary); 
      name.setAttribute("class","stats-buglisting-listcell");

      row.appendChild(id);
      row.appendChild(name);

      menu.appendChild(row);
    }
   },
   
   sortRecentBugs : function(){
     qaStats.generateRecentBugListing(qaStats.recentBugs.reverse());
   },
   
   getTodaysResults : function(){     
     var advancedSearchURL =  qaMain.urlbundle.getString("qa.extension.url.litmus.advanced_search");
     var todaysDate = new Date();
     
     document.getElementById("qa-user-stats-results-today")
             .setAttribute("href", advancedSearchURL += 
             "start_date=" + todaysDate.getFullYear() + (todaysDate.getMonth() + 1) + todaysDate.getDate() +
             "&timespan=&end_date=Now&limit=500&my_results_only=on");
   },
   
   getWeeksResults : function(){
     var advancedSearchURL =  qaMain.urlbundle.getString("qa.extension.url.litmus.advanced_search");
    
     document.getElementById("qa-user-stats-results-week")
              .setAttribute("href", advancedSearchURL += 
              "end_date=Now&timespan=-7&limit=500&my_results_only=on");
   },
   
   setCommonResultsURL : function(){
     var url = qaMain.urlbundle.getString("qa.extension.url.litmus.common_results");
     var failed = document.getElementById("qa-user-stats-recommended-failed");
     var unclear = document.getElementById("qa-user-stats-recommended-unclear");
     
     failed.setAttribute("href", url + "status=fail");
     failed.innerHTML = qaMain.bundle.getString("qa.stats.failed");
     
     unclear.setAttribute("href", url + "status=unclear");
     unclear.innerHTML = qaMain.bundle.getString("qa.stats.unclear");
  }
};
