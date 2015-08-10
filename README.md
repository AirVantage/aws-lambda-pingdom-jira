# AWS Lambda Pingdom to JIRA
This lambda allows to implement a webhook for Pingdom to transform incidents into JIRA issues.
If the event from pingdom is a new incident, it creates a new JIRA issue.
If the check on Pingdom is up again, it closes the previously created JIRA issue.

It uses a custom field on the JIRA issue to link with the incident ID on Pingdom.
