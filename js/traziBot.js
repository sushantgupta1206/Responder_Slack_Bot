var helper = require("./helper.js")
var os = require('os');
var fs = require('fs');
var _ = require("underscore");
var request = require("request");
var querystring = require('querystring');
var Promise = require("bluebird");

if (!process.env.BOT_TOKEN) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('botkit');
var controller = Botkit.slackbot({
    debug: false
//include "log: false" to disable logging
//or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
controller.spawn({
    token: process.env.BOT_TOKEN,
  }).startRTM()

/**
 * Use Case 1
 * @desc Finding assignee for given issue
 * @param issueNumber issue for which assinee suggestion is required
 */
controller.hears('(.*) collaborators',['mention','direct_mention','direct_message'],function(bot,message)
{   
    controller.storage.users.get(message.user, function(err, user) {
        bot.startConversation(message, function(err, convo) {
            helper.getCollaborators("dupandit","Sample-mock-repo").then(function (collaborators)
            {
                var collabs = _.pluck(collaborators,"login");
                console.log("The collaborators are:" + collabs);
                bot.reply(message,"collaborators are : " + collabs);                
            });
            convo.stop();
        });
    });
});

controller.hears(['hello','hi','Hello','Hi','Hey'],['mention','direct_mention','direct_message'],function(bot,message)
{   
    controller.storage.users.get(message.user, function(err, user) {
        bot.startConversation(message, function(err, convo) {
            bot.reply(message, "Hey ! How may I help you ? ");            
            convo.stop();
        });
    });
});


controller.hears('find assignees for issue (.*)',['mention', 'direct_mention','direct_message'], function(bot,message) 
{   
    var issueNumber = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        bot.startConversation(message, function(err, convo) {
            console.log(message);
            //helper.getPossibleAssignees(issueNumber);
            var response = fs.readFileSync('../mock_data/Ucase1_Developer_skills_and_availability_mock.json');
            var assigneeData = JSON.parse(response);
            var assignee = assigneeData.users;
            //console.log(assignee);
            var userList = [];
            assignee.forEach(function(element) {
                userList.push(element.id);
                bot.reply(message, "Emp Id: " + element.id + " Skills: " + element.skills);
                //console.log(element.skills+ " "+element.id);
            }, this);
            convo.ask("Whom do you want to assign this issue?", function(response, convo) {
                helper.isValidUser(response.text, userList).then(function (userId){
                    console.log("assigning issue");
                    convo.ask('Do you want to assign issue to ' + userId + '? Please confirm', [
                    {
                        pattern: 'yes',
                        callback: function(response, convo) {
                            //convo.say("Issue assigned to " + userId);
                            helper.assignIssueToEmp(userId, issueNumber).then(function(response){
                                console.log("issue assign true");
                                bot.reply(message, response);
                            }).catch(function(err){
                                bot.reply(message, error);
                            });
                            convo.next();
                        }
                    },
                    {
                        pattern: 'no',
                        callback: function(response, convo) {
                            convo.stop();
                        }
                    },
                    {
                        default: true,
                        callback: function(response, convo) {
                            convo.repeat();
                            convo.next();
                        }
                    }]);
                    convo.next();
                }).catch(function (e){
                    bot.reply(message, "User not from given recommendations");
                });
                    
            });
        });
    });
});

controller.hears('find contributors for file (.*)',['mention', 'direct_mention','direct_message'], function(bot,message) 
{

});

controller.hears('find reviewers for issue (.*)',['mention', 'direct_mention','direct_message'], function(bot,message) 
{
    var issueNumber = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        bot.startConversation(message, function(err, convo) {
            console.log(message);
            //helper.getPossibleAssignees(issueNumber);
            var response = fs.readFileSync('../mock_u3.json');
            var reviewerData = JSON.parse(response);
            var reviewers = reviewerData.reviewers;
            //console.log(assignee);
            var userList = [];
            reviewers.forEach(function(element) {
                userList.push(element.id);
                bot.reply(message, "Emp Id: " + element.id + " Skills: " + element.skills);
                //console.log(element.skills+ " "+element.id);
            }, this);
            convo.ask("Whom do you want to select as a reviewer? Provide comma separated ids", function(response, convo) {
                helper.isValidUser(response.text, userList).then(function (userId){
                    console.log("assigning issue");
                    convo.ask('Do you want to assign ' + userId + ' as a reviewer for issue #?' + issueNumber + ' Please confirm', [
                    {
                        pattern: 'yes',
                        callback: function(response, convo) {
                            //convo.say("Issue assigned to " + userId);
                            helper.assignReviewerForIssue(userId, issueNumber).then(function(response){
                                console.log("issue reviewer true");
                                bot.reply(message, response);
                            }).catch(function(err){
                                bot.reply(message, error);
                            });
                            convo.next();
                        }
                    },
                    {
                        pattern: 'no',
                        callback: function(response, convo) {
                            convo.stop();
                        }
                    },
                    {
                        default: true,
                        callback: function(response, convo) {
                            convo.repeat();
                            convo.next();
                        }
                    }]);
                    convo.next();
                }).catch(function (e){
                    bot.reply(message, "User not from given recommendations");
                });
                    
            });
        });
    });
});

controller.hears(['.*'],['mention', 'direct_mention','direct_message'], function(bot,message) 
{
    console.log(message);
    bot.reply(message, "Wrong command!");
});
