---
to: <%= name %>/Hi/There/There.js
force: true
---
<%NameUpperCase = name.toUpperCase();NameLowerCase = name.toLowerCase();NameLowerDasherized = h.inflection.dasherize(NameLowerCase);NameCapitalized = h.inflection.capitalize(name);ChartName = NameLowerCase; %>console.log('Hello World')