const core = require('@actions/core');
const github = require('@actions/github');

const getAndParsePullRequestDescriptionForFeatureFlag = () => {
  const { pull_request: pullRequest } = github.context.payload;
  core.debug(`Pull Request: ${JSON.stringify(pullRequest)}`);
  if (pullRequest === undefined || pullRequest?.body === undefined) {
    throw new Error('This action should only be run with Pull Request Events');
  }


  return {assignee: pullRequest.user.login , featureFlag: 'temp_web_enable_test_ff'};
};

const createFeatureFlagEntryInProject = () => {
  try {
    core.debug('Starting PR Description Check for New FF');

    const {assignee, featureFlag} = getAndParsePullRequestDescriptionForFeatureFlag() || {};

    core.debug(featureFlag);

    // github.rest.issues.addLabels({
    //   issue_number: context.issue.number,
    //   owner: assignee,
    //   repo: context.repo.repo,
    //   title: featureFlag,
    //   labels: ['Temporary Feature Flag']
    // });

    core.exportVariable('author', commit.data.commit.author.email)
    core.info(`${context.issue.number} ${assignee}, ${context.repo.repo}`)
    core.info(`Adding to Project, Feature Flag: ${featureFlag}`);
  } catch (error) {
    core.setFailed(error?.message);
  }
};

createFeatureFlagEntryInProject()
