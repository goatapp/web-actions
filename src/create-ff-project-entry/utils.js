const getFieldFromProject = (fieldName, fields) => {
    const result = fields.find( ({ name }) => name === fieldName );
    return result;
}

module.exports = {
    getFieldFromProject: getFieldFromProject,
}