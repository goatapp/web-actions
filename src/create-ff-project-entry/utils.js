const buildFieldQuery = (projectId, itemId, fieldId, value) => {
    return `mutation {
      updateProjectNextItemField(
        input: {
          projectId: ${projectId}
          itemId: ${itemId}
          fieldId: ${fieldId}
          value: ${value}
        }
      ) {
        projectNextItem {
          id
        }
      }
    }`;
}

const buildAddItemToProjectQuery = (projectIdNumber, issueNodeId) => {
    return `
      mutation {
        addProjectNextItem(input: {projectId: ${projectIdNumber} contentId: ${issueNodeId}}) {
          projectNextItem {
            id
          }
        }
      }`;
}

const buildProjectFieldsdQuery = (projectItemId) => {
    return  `{
        node(id: ${projectItemId}) {
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
}

const getFieldFromProject = (fieldName, fields) => {
    const result = fields.find( ({ name }) => name === fieldName );
    return result;
}

const getOptionIdFromFieldOptions = (settings) => {
    const { options } = settings;
    const result = options.find( ({ name }) => name === 'Created' );
    return result;
}

function isCharacterALetter(char) {
  return (/[a-zA-Z]/).test(char)
}

module.exports = {
    buildFieldQuery,
    buildAddItemToProjectQuery,
    buildProjectFieldsdQuery,
    getFieldFromProject,
    getOptionIdFromFieldOptions,
    isCharacterALetter,
}