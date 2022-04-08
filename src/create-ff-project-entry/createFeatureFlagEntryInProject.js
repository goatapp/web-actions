const core = require('@actions/core');
const github = require('@actions/github');

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

    const projects =  await octokit.request('GET /orgs/{org}/projects', {
      headers: {
        authorization: `token ${myToken}`,
      },
      org: github.context.repo.owner,
    });

   const p2 =  await octokit.rest.projects.listForRepo({
     headers: {
        authorization: `token ${myToken}`,
      },
      owner: github.context.repo.owner,
      repo: github.context.repo.repo
    });

    const p3 = await octokit.graphql(`{
    organization(login: "goatapp"){
      name
      projectNext(number: 8) {
        id
      }
    }
  }`);

    core.info(`Status: ${JSON.stringify(projects.status)}, Project URL ${JSON.stringify(projects.url)}, Project Data: ${JSON.stringify(projects.data)}`);
    core.info(`Status: ${JSON.stringify(p2.status)}, Project URL ${JSON.stringify(p2.url)}, Project Data: ${JSON.stringify(p2.data)}`);
    core.info(`GraphQl: ${JSON.stringify(p3)}`);

    const newIssue = await octokit.rest.issues.create({
      ...context.repo,
      assignee: assignee,
      body: 'GENERATED BY FEATURE FLAG TRACKING ACTION',
      labels: ['Temporary Feature Flag'],
      title: featureFlag,
    });

    if(newIssue) {
      await octokit.graphql(`{
          mutation {
            addProjectNextItem(input: {projectId: ${p3.organization.projectNext.id} contentId: ${newIssue.data.node_id}}) {
              projectNextItem {
                id
              }
            }
    }
      }`);
    }

    core.info(JSON.stringify(newIssue));
  
  } catch (error) {
    core.setFailed(error?.message);
  }
};

createFeatureFlagEntryInProject()
