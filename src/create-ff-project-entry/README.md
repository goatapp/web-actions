# Create Feature Flag Entry In Githhub Project Action

This action searches a pull request description for a feature flag and a feature area. If a feature flag matching the
provided naming convention is found and is not already in the current project's feature flag tab, a new entry for that feature
flag will be added to the table, with a status, date, and feature area and an issue will be created for it.

## Inputs

### `namingConvention`

**Required** The name substring that all the matching feature flags contain. Default `"temp_web_enable_"`.

### `projectIdNumber`

**Required** This can be found in the url of your project example url: https://github.com/orgs/goatapp/projects/8/views/1 Project ID Number `8`.

### `myToken`

**Required** This is the token used for accessing the repo and its issues as well as adding them your you will need read:org write:package and repo permissions on the token

## Example usage

```yaml
uses: ./src/create-ff-project-entry
with:
  namingConvention: temp_web_enable_
  projectIdNumber: '8'
  token: '${{ secrets.NPM_TOKEN }}'
  gitToken: '${{ secrets.GITHUB_TOKEN }}'
```
