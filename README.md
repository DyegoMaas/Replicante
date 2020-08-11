# Replicant

Ever needed to use a running application as template for a new project? Replicant makes it easy to morph a living application into a completely new one.

## Tutorial

Currently, replicating an existing application requires some steps. First thing, clone this repository.

### Hygen initialization

First, we need to install and initialize [Hygen](https://www.hygen.io), a flexible template generator mostly agnostic of technology:

To install it, run `npm i -g hygen`. When the installation is complete, run:

```sh
cd src
hygen init self
```

### Defining the sample for replication

If you want to turn an existing application into a new one, you will inevitably need to rename a lot of things. From file names, to folders, modules names, namespaces, package references and the source code itself, its a lot of work, and Replicant can help you with that. You just need to feed it with two things: the directory of the sample application, and the **replication recipe**.

All those details above, the things we want to change, need to be captured in a recipe file. It is JSON file with the following structure:

```javascript
{
  "templateName": "NexusModel",
  "fileNameReplacements": [
    { "from": "Sample", "to": "<%= name %>" } // Sample.Domain.Customer -> NewName.Domain.Customer
    // ... any other replacement your project needs
  ],
  "sourceCodeReplacements": [
    { "from": "Sample", "to": "<%= name %>" }, // using Sample.Domain; -> using NewName.Domain;
    { "from": "sample", "to": "<%= NameLowerCase %>" }, // return GetDatabase("sample"); -> return GetDatabase("newname");
    { "from": "SAMPLE", "to": "<%= NameUpperCase %>" } // return "SAMPLE"; -> return "NEWNAME";
    { "from": "Some Term", "to": "New Hard Coded Term" } // return "Some Term"; -> return "New Hard Coded Term";
    // ... any other replacement your project needs
  ]
}
```

With the recipe defined, we are ready to execute the replication process.

From the `root` folder:
1) Run `python ./src/replicate --sample=<path-to-sample-app> --recipe=<path-to-recipe.json>`. It will generate a template inside the _templates folder.

From the `src` folder:
2) Run `hygen <templateName> new <NewName>`. The `templateName` parameter is the same informed in the recipe, and the `NewName` is the name of your new application. It will be available as the `<%= name %>` variable for the replication steps.

After performing these two steps, you should have a new project, completely operational, plus a Hygen template that allows reuse to generate new projects from it in the future.

![Replication workflow](/docs/img/workflow.jpg)

## Roadmap

Our roadmap is publicly avaiable in a [Trello board](https://trello.com/b/T9khQD2v/replicant-roadmap). Feel free to comment and suggest new features.
