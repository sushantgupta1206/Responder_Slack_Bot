var data = require('../mock_data/mock.json'); 
var mysql = require("./mysql.js")
var nock = require("nock");
var request = require("request");
var Promise = require("bluebird"); 
var spawn = require("child_process").spawn;
var token = "token " + process.env.GITHUB_TOKEN;
var urlRoot = "https://github.ncsu.edu/api/v3";
/*
var issuedetails = nock("https://github.ncsu.edu/api/v3")
.persist() // This will persist mock interception for lifetime of program.
.get("/repos/dupandit/Sample-mock-repo/issues/1")
.reply(200, JSON.stringify(data.issueList[0]) );

var mockCollaborators = nock("https://github.ncsu.edu/api/v3")
.persist() // This will persist mock interception for lifetime of program.
.get("/repos/dupandit/Sample-mock-repo/collaborators")
.reply(200, JSON.stringify(data.collaborators) );

var mockCommits = nock("https://github.ncsu.edu/api/v3")
.persist() // This will persist mock interception for lifetime of program.
.get("/repos/dupandit/Sample-mock-repo/commits")
.reply(200, JSON.stringify(data.commits_of_a_file) );
*/

/**
 * @desc this will assign userId to issueNumber
 * @param userId emp to whom we will assign an issue
 * @param issueNumber issue to assigned
 * @return 
 */
 // Use Case 1
 function getIssueDetails(owner,repo,number){
    
        var options = {
            url: urlRoot + "/repos/" + owner + "/" + repo + "/issues/"+number,
            method: 'GET',
            headers: {
                         "User-Agent": "EnableIssues",
                         "content-type": "application/json",
                         "Authorization": token
                     }
            };
    
        return new Promise(function (resolve, reject)
        {
                // Send a http request to url and specify a callback that will be called upon its return.
                request(options, function (error, response, body) {
                    var obj = JSON.parse(body);
                    resolve(obj);
                });
        });
    }

function getIssueTags(issueName){
    var process = spawn('python',["../python/find_tags/issue_tags.py", issueName]);
    var tags;
    return new Promise(function (resolve, reject)
    {
        process.stdout.on('data', function (data){
            data=data.toString().replace(/[']+/g,'"');
            tags=JSON.parse(data);
            resolve(tags);
        });     
    });
}
    
var getPossibleAssignees = function getPossibleAssignees(issueNumber){
    //var issueTagsList = getIssueTags(issueNumber);
    //var userList = getCollaborators();
    return new Promise(function(resolve, reject){
        var issueTagsList = ['c++','java','ruby'];
        var userList = ['sbshete','sagupta'];
        mysql.getUserTagsCount(userList, issueTagsList).then(function(assigneeList){
            resolve(assigneeList);
        }).catch(function(err){
            reject(error);
        });
    });
}

function assignIssueToEmp(userId, owner, repo, issueNumber){
    var options = {
            url: urlRoot + "/repos/" + owner + "/" + repo + "/issues/"+issueNumber,
            method: 'PATCH',
            headers: {
                         "User-Agent": "EnableIssues",
                         "content-type": "application/json",
                         "Authorization": token
                     },
            json:  {
                        "assignees" : [
                                        userId
                                    ]
                   }
            };
    
        return new Promise(function (resolve, reject)
        {
            request(options, function (error, response, body) {
                resolve("Issue " + issueNumber + " assigned to user " + userId);
            });
        });
       
}

// Usecase 2 :
function listOfCommits(owner,repo) {
    var options = {
        url: urlRoot + "/repos/" + owner + "/" + repo + "/commits",
        method: 'GET',
        headers: {
                     "User-Agent": "EnableIssues",
                     "content-type": "application/json",
                     "Authorization": token
                 }
        };
  
        return new Promise(function (resolve, reject)
        {
             // Send a http request to url and specify a callback that will be called upon its return.
             request(options, function (error, response, body) {
                 var obj = JSON.parse(body);
                 resolve(obj);
             });
        });
}


// Use Case 3
function getPossibleReviewers(issueNumber){
    var reviewers = data.reviewers;
    return reviewers;
}

function assignReviewerForIssue(userId, issueNumber){
    return new Promise(function(resolve, reject){
        resolve("Reviewer " + userId + " assigned to issue #" + issueNumber);
    });
}


// Utilities
function isValidUser(userId, userList){
    return new Promise(function (resolve, reject)
    {
         if(userList.indexOf(userId)>-1){
            resolve(userId);
        }
        reject(userId);
    });
}

function isValidReviwer(userId, userList){
    return new Promise(function (resolve, reject)
    {
        var users = userId.split(",");
        users.forEach(function(user) {
            if(userList.indexOf(user.trim())<0){
                reject(user);
            } 
        });
        resolve(userId);
    });
}

function getCollaborators(owner,repo){
    
    var options = { 
        url: urlRoot + "/repos/" + owner + "/" + repo + "/collaborators",  
        method: 'GET',
        headers: {
                     "User-Agent": "EnableIssues",
                     "content-type": "application/json",
                     "Authorization": token
                 }
        };
        
    return new Promise(function (resolve, reject)
    {
            // Send a http request to url and specify a callback that will be called upon its return.
            request(options, function (error, response, body) {
                var obj = JSON.parse(body);
                resolve(obj);
            });
    });
}

exports.getCollaborators = getCollaborators;
exports.assignIssueToEmp = assignIssueToEmp;
exports.getIssues = getIssues;
exports.isValidUser = isValidUser;
exports.getPossibleAssignees = getPossibleAssignees;
exports.assignReviewerForIssue = assignReviewerForIssue;
exports.listOfCommits = listOfCommits
exports.getPossibleReviewers = getPossibleReviewers;
exports.isValidReviwer = isValidReviwer;
exports.getIssueDetails = getIssueDetails;
exports.getIssueTags = getIssueTags;
