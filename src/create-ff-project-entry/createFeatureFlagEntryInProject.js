const core = require('@actions/core');
const github = require('@actions/github');

const { buildFieldQuery, buildAddItemToProjectQuery, buildProjectFieldsdQuery, getFieldFromProject, getOptionIdFromFieldOptions } = require('./utils');

function isCharacterALetter(char) {
  return (/[a-zA-Z]/).test(char)
}

const getAndParsePullRequestDescriptionForFeatureFlag = () => {
  const { pull_request: pullRequest } = github.context.payload;

  core.debug(`Pull Request: ${JSON.stringify(pullRequest)}`);

  if (pullRequest === undefined || pullRequest?.body === undefined) {
    throw new Error('This action should only be run with Pull Request Events');
  }

  const namingConvention = core.getInput('namingConvention') || 'temp_web_enable_' ;
  const body = JSON.stringify(pullRequest.body);
  const indexOfFeatureFlag = body.indexOf(namingConvention);

  if(indexOfFeatureFlag > 0) {
    const subStringOfPRDescription = body.substring(indexOfFeatureFlag);
    let count = 0;
    let currentChar = subStringOfPRDescription[count];
    let featureFlag = '';

    while(isCharacterALetter(currentChar) || currentChar === '_') {
      featureFlag += currentChar;
      ++count;
      currentChar = subStringOfPRDescription[count];
    }
    return { assignee: pullRequest.user.login , featureFlag };
  }

  return null;
};

const createFeatureFlagEntryInProject = async () => {
  try {
    core.info('Starting PR Description Check for New FF');

    const { assignee, featureFlag } = getAndParsePullRequestDescriptionForFeatureFlag() || {};

    if(!assignee === undefined || !assignee) {
      core.info(`No new Temporary FF Added To This PR`);
      return;
    }

    const myToken = core.getInput('token');
    const projectIdNumber = core.getInput('projectIdNumber');
    const octokit = github.getOctokit(myToken);

    if(projectIdNumber < 0) { 
      core.info(`Invalid project number`);
      return; 
    }

    core.info(`Adding to Project, Feature Flag: ${JSON.stringify(featureFlag)}, ${myToken}`);
    core.info(`Project ID Number: ${projectIdNumber}`);


    const context = github.context;

    const project = await octokit.graphql(`{
      organization(login: "goatapp"){
        name
        projectNext(number: ${parseInt(projectIdNumber)}) {
          id
        }
      }
    }`);

    core.info(`GraphQl Response: ${JSON.stringify(project.organization.projectNext.id)}`);

    const newIssue = await octokit.rest.issues.create({
      ...context.repo,
      assignee: assignee,
      body: 'GENERATED BY FEATURE FLAG TRACKING ACTION',
      labels: ['Temporary Feature Flag'],
      title: featureFlag,
    });

    core.info(`Issue Id: ${JSON.stringify(newIssue.data.node_id)}`);

    const query = buildAddItemToProjectQuery(JSON.stringify(project.organization.projectNext.id), JSON.stringify(newIssue.data.node_id));
    const projectFieldsdQuery = buildProjectFieldsdQuery(JSON.stringify(project.organization.projectNext.id));
      

    if(newIssue) {
      const projectFields = await octokit.graphql(projectFieldsdQuery);
      const dateField = getFieldFromProject('Date Added', projectFields.node.fields.nodes);
      const featureAreaField = getFieldFromProject('Feature Area', projectFields.node.fields.nodes);
      const statusField = getFieldFromProject('Status', projectFields.node.fields.nodes);
      const statusOption = getOptionIdFromFieldOptions(JSON.parse(statusField.settings));

      core.info(`FIELDS: ${projectFields.node.fields.nodes}`);
      core.info(JSON.stringify(dateField));
      core.info(JSON.stringify(featureAreaField));
      core.info(`${JSON.stringify(statusOption)}`);

      const newProjectRow = await octokit.graphql(query);
      const today = (new Date()).toISOString().split('T')[0];

      const updateDateFieldQuery = buildFieldQuery(JSON.stringify(project.organization.projectNext.id), JSON.stringify(newProjectRow.addProjectNextItem.projectNextItem.id), JSON.stringify(dateField.id), JSON.stringify(today));
      const updateFeatureAreaFieldQuery = buildFieldQuery(JSON.stringify(project.organization.projectNext.id), JSON.stringify(newProjectRow.addProjectNextItem.projectNextItem.id), JSON.stringify(featureAreaField.id));
      core.info(`Made it to status: ${JSON.stringify(statusOption.id)}`);
      const updateStatusQuery = buildFieldQuery(JSON.stringify(project.organization.projectNext.id), JSON.stringify(newProjectRow.addProjectNextItem.projectNextItem.id), JSON.stringify(statusField.id), JSON.stringify(statusOption.id));
    

      await octokit.graphql(updateDateFieldQuery);
      await octokit.graphql(updateFeatureAreaFieldQuery);
      await octokit.graphql(updateStatusQuery);
    }

    core.info(JSON.stringify(newIssue));
  
  } catch (error) {
    core.setFailed(error?.message);
  }
};

createFeatureFlagEntryInProject();
