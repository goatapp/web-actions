const core = require('@actions/core');
const github = require('@actions/github');

const { getFieldFromProject } = require('./utils');

function isCharacterALetter(char) {
  return (/[a-zA-Z]/).test(char)
}

const getAndParsePullRequestDescriptionForFeatureFlag = () => {
  const { pull_request: pullRequest } = github.context.payload;
  core.debug(`Pull Request: ${JSON.stringify(pullRequest)}`);
  if (pullRequest === undefined || pullRequest?.body === undefined) {
    throw new Error('This action should only be run with Pull Request Events');
  }

  const body = JSON.stringify(pullRequest.body);
  const indexOfFeatureFlag = body.indexOf('temp_web_enable_');
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
    core.debug('Starting PR Description Check for New FF');

    const {assignee, featureFlag} = getAndParsePullRequestDescriptionForFeatureFlag() || {};

    if(!assignee === undefined || !assignee) {
      core.info(`No new Temporary FF Added To This PR`);
      return;
    }

    core.debug(featureFlag);

    const myToken = core.getInput('token');
    const octokit = github.getOctokit(myToken);

    core.info(`${github.context.issue.number} ${assignee}, ${github.context.repo.repo}`, JSON.stringify(featureFlag));
    core.info(`Adding to Project, Feature Flag: ${JSON.stringify(featureFlag)}, ${myToken}`);


    const context = github.context;

    const project = await octokit.graphql(`{
    organization(login: "goatapp"){
      name
      projectNext(number: 8) {
        id
      }
    }
  }`);

    core.info(`GraphQl: ${JSON.stringify(project.organization.projectNext.id)}`);

    const newIssue = await octokit.rest.issues.create({
      ...context.repo,
      assignee: assignee,
      body: 'GENERATED BY FEATURE FLAG TRACKING ACTION',
      labels: ['Temporary Feature Flag'],
      title: featureFlag,
    });
    core.info(`Issue Id: ${JSON.stringify(newIssue.data.node_id)}`);

    const query = `
      mutation {
        addProjectNextItem(input: {projectId: ${JSON.stringify(project.organization.projectNext.id)} contentId: ${JSON.stringify(newIssue.data.node_id)}}) {
          projectNextItem {
            id
          }
        }
      }`;

      const projectFieldsdQuery = `{
        node(id: ${JSON.stringify(project.organization.projectNext.id)}) {
          ... on ProjectNext {
            fields(first: 20) {
              nodes {
                id
                name
                settings
              }
            }
          }
        }
      }`;

    if(newIssue) {
      const projectFields = await octokit.graphql(projectFieldsdQuery);
      const dateField = JSON.stringify(getFieldFromProject('Date Added', projectFields.node.fields.nodes));
      core.info(`FIELDS: ${projectFields.node.fields.nodes}`);
      core.info(dateField);
      const newProjectRow = await octokit.graphql(query);
      const rowToUpdate = JSON.stringify(newProjectRow);
      core.info(`new row attr ${newProjectRow.addProjectNextItem}`);


   const updateDateFieldQuery = `mutation {
    updateProjectNextItemField(
      input: {
        projectId: ${JSON.stringify(project.organization.projectNext.id)}
        itemId: ${rowToUpdate.projectNextItem.id}
        fieldId: ${dateField.id}
        value: "April 8, 2022"
      }
    ) {
      projectNextItem {
        id
      }
    }
  };`

    const updatedRow = await octokit.graphql(updateDateFieldQuery);

    }

    core.info(JSON.stringify(newIssue));
  
  } catch (error) {
    core.setFailed(error?.message);
  }
};

createFeatureFlagEntryInProject();
