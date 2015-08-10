module.exports = {
    jira: {
        url: "https://YOUR-JIRA-SERVER/rest/api/2",
        project: "YOUR-JIRA-PROJECT",
        resolveTransition: "THE-ID-OF-THE-RESOLUTION-TRANSITION",
        fieldForExternalId: {
            id: "customfield_XXX",
            name: "External issue ID"
        },
        auth: {
            user: "JIRA-USER",
            pass: "JIRA-PASSWORD"
        }
    }
};
