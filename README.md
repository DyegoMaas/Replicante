# Replicante

![Build](https://github.com/DyegoMaas/Replicante/workflows/Build/badge.svg)

Replicante is a project template processor, completely agnostic of technology stack. It can process any software project as a template for a new one, just with a little configuration.

The process is pretty straight forward. Replicante copies the application and applies some transformation rules to the source files and file tree structure.

These rule sets are called *recipes*.

## Quick Tutorial

First thing, run `npm install -g replicante` to install *replicante CLI* globally.

You can also install it using Yarn by running `yarn global add replicante`.

### Study case - copying a previous project

Let's get to an example, and assume we are a freelancer. We've made a wonderful job for our last client, and a new job requires us to build a new site, very much like the last.

But our source folders contain the name of the last client, and it also appears in almost every file as an organizing namespace or package. So we will have to rename some folders and files, and apply some *search and replace* operations. But this is an error prone process, and must be a better way to do this operation.

Replicante makes this very easy. The only thing you must do is to identify what terms (or words) you want replaced, and add them to a simple recipe JSON file, as the following:

```javascript
{
  "replicantName": "NewSuperProject",
  "fileNameReplacements": [
    { "from": "OldClientName", "to": "NewClientName" },
    { "from": "oldClientName", "to": "newClientName" } // it is case-sensitive
    // ... any other replacement your project needs
  ],
  "sourceCodeReplacements": [
    { "from": "OldClientName", "to": "NewClientName" },
    { "from": "oldClientName", "to": "newClientName" } // it is case-sensitive
    { "from": "some-other-term", "to": "new-term" }
    // ... any other replacement your project needs
  ]
}
```

This file is called a **replication recipe**, and it contains some important information:

- The name of the "replicant" (the new project)
- The list of replacements to apply to names of folders and files
- The list of replacements to apply to the files' contents

With this recipe in hands, you just tell Replicante to do the job using the `create` command:

`replicante create ./path-to-the-old-project ./path-to-the-recipe-above`

By default, the new project will be created inside the folder `<USER_HOME>/.replicante/<replicant-name>` the your user folder, and the path is printed in the terminal at the end of the process.

You can override the path where the new project should be create with the `--target` parameter:

`replicante create ./path-to-the-old-project ./path-to-the-recipe-above --target=./path-to-create-new-project`

## Advanced features

Replicante also allows you to further customize the replication behaviour. It does so through some features that we'll explore in the following sections.

### Ignoring folders and files

When creating your new project, you probably will need to ignore some special folders, like `.git` or binaries.

You can do this by adding an `ignoreArtifacts` array to the recipe:

```javascript
{
  "replicantName": "NewProjectName",
  "fileNameReplacements": [],
  "sourceCodeReplacements": [],
  "ignoreArtifacts": [".git", ".idea", "bin", "obj", "somefile.dll"]
}
```

### Variables

By default, Replicante creates some variables that may prove useful in your recipes. Especially, it defines pre-processed variables for some variants of the "replicantName" property:

- `<<: name :>>` has the exact same value that the property `replicanteName`
- `<<: nameLowerCase :>>` has this name converted to lower case
- `<<: nameUpperCase :>>` has this name converted to upper case
- `<<: nameLowerDasherized :>>` has the name converted to lower case and separated by hyphens
- `<<: nameUpperDasherized :>>` has the name converted to upper case and separated by hyphens

Following, you can see examples of all these variations:

```javascript
{
  "replicantName": "NewProjectModel", // will replace <<: name :>>
  "fileNameReplacements": [
    { "from": "Sample", "to": "<<: name :>>" } // Sample.Domain.Customer -> NewName.Domain.Customer
    // ... any other replacement your project needs
  ],
  "sourceCodeReplacements": [
    { "from": "Sample", "to": "<<: name :>>" }, // using Sample.Domain; -> using NewName.Domain;
    { "from": "sample", "to": "<<: nameLowerCase :>>" }, // return GetDatabase("sample"); -> return GetDatabase("newname");
    { "from": "SAMPLE", "to": "<<: nameUpperCase :>>" } // return "SAMPLE"; -> return "NEWNAME";
    { "from": "Some Term", "to": "New Hard Coded Term" } // return "Some Term"; -> return "New Hard Coded Term";
    // ... any other replacement your project needs
  ]
}
```

### Custom delimiters for variables

The default delimiters used for these variables are `<<:` and `:>>`. This is to prevent messing you real template files inside projects.

If you run into some problems with this kind of files, you can always customize de delimiters by adding the `customDelimiters` property. It should always contain a pair of delimiters, responsible for identifying the start and end of a variable:

```javascript
{
  "replicantName": "NewProjectName",
  "fileNameReplacements": [],
  "sourceCodeReplacements": [],
  "customDelimiters": ["<<!", "!>>"]
}
```

![Replication workflow](/docs/img/workflow.jpg)

## Node Compatibility

From version 1.0 onwards, Replicante supports Node 14+.

## Roadmap

Our roadmap is publicly avaiable in a [Trello board](https://trello.com/b/T9khQD2v/replicant-roadmap). Feel free to comment and suggest new features.
