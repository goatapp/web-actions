const core = require('@actions/core');
const github = require('@actions/github');

const getAndParsePullRequestDescriptionForFeatureFlag = () => {
  const { pull_request: pullRequest } = github.context.payload;
  core.debug(`Pull Request: ${JSON.stringify(pullRequest)}`);
  core.debug( JSON.stringify(github.event.pull_request.user.login));
  if (pullRequest === undefined || pullRequest?.body === undefined) {
    throw new Error('This action should only be run with Pull Request Events');
  }


  return 'temp_web_enable_test_ff';
};

const createFeatureFlagEntryInProject = () => {
  try {
    core.debug('Starting PR Description Check for New FF');

    const featureFlagName = getAndParsePullRequestDescriptionForFeatureFlag();

    core.debug(featureFlagName);

    core.info(`Adding to Project, Feature Flag: ${featureFlagName}`);
  } catch (error) {
    core.setFailed(error?.message);
  }
};

createFeatureFlagEntryInProject()
