var http = require('request');
var conf = require('./conf.js');

function createIncident(checkid, checkname, incidentid, callback) {
    var incident = {
        fields: {
            project: {
                key: conf.jira.project
            },
            summary: checkname + " is down",
            issuetype: {
                name: "Bug"
            },
            description: "Pingdom check " + checkname + " is down: https://my.pingdom.com/reports/uptime#check=" + checkid
        }
    };
    incident.fields[conf.jira.fieldForExternalId.id] = "" + incidentid;
    http.post({
        headers: {
            'content-type': 'application/json'
        },
        url: conf.jira.url + "/issue",
        auth: conf.jira.auth,
        rejectUnauthorized: false,
        followAllRedirects: true,
        body: JSON.stringify(incident)
    }, callback);
}

function findIncident(incidentid, callback) {
    console.log(conf.jira.url + "/search?jql=" + encodeURIComponent("project=" + conf.jira.project + " AND \"" + conf.jira.fieldForExternalId.name + "\"=" + incidentid));
    http.get({
        headers: {
            'content-type': 'application/json'
        },
        url: conf.jira.url + "/search?jql=" + encodeURIComponent("project=" + conf.jira.project + " AND \"" + conf.jira.fieldForExternalId.name + "\"=" + incidentid),
        auth: conf.jira.auth,
        rejectUnauthorized: false,
        followAllRedirects: true
    }, function(error, response, body) {
        if (error)
            callback(error, null);
        else {
            var result = JSON.parse(body);
            if (result.total === 0) {
                callback("No incident with external id=" + incidentid, null);
            } else if (result.total === 1) {
                var jiraIncidentKey = result.issues[0].key;
                callback(null, jiraIncidentKey);
            } else {
                callback("More than one incident with external id=" + incidentid, null);
            }
        }
    });
}

function resolveIncident(incidentKey, checkname, callback) {
    var resolve = {
        update: {
            comment: [{
                add: {
                    body: "Pingdom check " + checkname + " is up again"
                }
            }]
        },
        fields: {
            resolution: {
                name: "Fixed"
            }
        },
        transition: {
            id: conf.jira.resolveTransition
        }
    };
    http.post({
        headers: {
            'content-type': 'application/json'
        },
        url: conf.jira.url + "/issue/" + incidentKey + "/transitions",
        auth: conf.jira.auth,
        rejectUnauthorized: false,
        followAllRedirects: true,
        body: JSON.stringify(resolve)
    }, callback);
}


exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    if (event.pingdom) {
        var checkid = event.pingdom.check;
        var checkname = event.pingdom.checkname;
        var incidentid = event.pingdom.incidentid;
        if ("down" === event.pingdom.description && event.pingdom.action === "assign") {
            console.log('Check is down');
            // Create the 'INCIDENT' JIRA ticket
            createIncident(checkid, checkname, incidentid, function(error, response, body) {
                if (error)
                    context.fail(new Error(error));
                else
                    context.succeed("Incident created");
                console.log(body);
            });
        } else if ("up" === event.pingdom.description) {
            console.log('Check is up');
            // find JIRA issue using external id field and incidentId
            findIncident(incidentid, function(error, incidentKey) {
                if (error)
                    context.fail(new Error(error));
                else {
                    console.log('Resolve incident ' + incidentKey);
                    resolveIncident(incidentKey, checkname, function(error, response, body) {
                        if (error) {
                            context.fail(new Error(error));
                        } else
                            context.succeed("Incident resolved");
                        console.log(body);
                    });
                }
            });
        } else {
            context.fail(new Error("Event not coming from Pingdom"));
        }
    } else {
        context.fail(new Error("Event not coming from Pingdom"));
    }
};
