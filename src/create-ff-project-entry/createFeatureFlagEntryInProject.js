const core = require('@actions/core');
const github = require('@actions/github');

const getAndParsePullRequestDescriptionForFeatureFlag = () => {
  const { pull_request: pullRequest } = github.context.payload;
  core.debug(`Pull Request: ${JSON.stringify(pullRequest)}`);
  if (pullRequest === undefined || pullRequest?.body === undefined) {
    throw new Error('This action should only be run with Pull Request Events');
  }

if(pullRequest.body.indexOf('temp_web_enabled_') > 0) {
  core.info('FF in description', pullRequest.body);
}

  return {assignee: pullRequest.user.login , featureFlag: 'temp_web_enable_test_ff'};
};

const createFeatureFlagEntryInProject = async () => {
  try {
    core.debug('Starting PR Description Check for New FF');

    const {assignee, featureFlag} = getAndParsePullRequestDescriptionForFeatureFlag() || {};

    core.debug(featureFlag);

    const myToken = core.getInput('token');
    const octokit = github.getOctokit(myToken);

    core.info(`${github.context.issue.number} ${assignee}, ${github.context.repo.repo}`, featureFlag);
    core.info(`Adding to Project, Feature Flag: ${featureFlag}, ${myToken}`);


    const context = github.context;

    const newIssue = await octokit.rest.issues.create({
      ...context.repo,
      assignee: assignee,
      body: 'GENERATED BY FEATURE FLAG TRACKING ACTION',
      labels: ['Temporary Feature Flag'],
      title: featureFlag,
    });
  
  } catch (error) {
    core.setFailed(error?.message);
  }
};

createFeatureFlagEntryInProject()
