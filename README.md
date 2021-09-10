# Replicante

![License](https://img.shields.io/github/license/DyegoMaas/ForeverFactory.svg)
![tests](https://github.com/DyegoMaas/Replicante/workflows/Build/badge.svg)
![npm](https://img.shields.io/npm/v/replicante)
![npm](https://img.shields.io/npm/dm/replicante)

Replicante is a project template processor, completely agnostic of technology stack. It can process any software project as a template for a new one, just with a little configuration.

The process is pretty straight forward. Replicante copies the application and applies some transformation rules to the source files and file tree structure.

## Quick Tutorial

First thing, run `npm install -g replicante` to install *replicante CLI* globally.

You can also install it using Yarn by running `yarn global add replicante`.

### Study case - a quick tutorial

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

It goes like this:

![Replication workflow](/docs/img/process-simple.jpg)

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

### Custom Variables

You can define custom variables to use in the replacements, and **Replicante** will automatically generate useful variations for you.

For example, you can define a custom variable named `myVariable` as follow:

```javascript
{
  "replicantName": "NewProjectName",
  "customVariables": [
    { 
      "name": "myVariable",
      "value": "BigValue"
    }
  ],
  "fileNameReplacements": [],
  "sourceCodeReplacements": []
}
```

And then, Replicante will create the following variables that you can use in your recipes:

- `<<: myVariable :>>` has the exact same value that you defined (e.g. BigValue)
- `<<: myVariable.toLowerCase() :>>` has this name converted to lower case (e.g. bigvalue)
- `<<: myVariable.toUpperCase() :>>` has this name converted to upper case (e.g. BIGVALUE)
- `<<: myVariable.toLowerDasherized() :>>` has the name converted to lower case and separated by hyphens (e.g. big-value)
- `<<: myVariable.toUpperDasherized() :>>` has the name converted to upper case and separated by hyphens (e.g. BIG-VALUE)
- `<<: myVariable.toLowerUnderscored() :>>` has the name converted to lower case and separated by underscores (e.g. big_value)
- `<<: myVariable.toUpperUnderscored() :>>` has the name converted to upper case and separated by underscores (e.g. BIG_VALUE)

Underscored

Following, you can see examples of all these variations:

```javascript
{
  "replicantName": "BigProject",
  "customVariables": [
    { 
      "name": "myVariable",
      "value": "BigValue"
    }
  ],
  "fileNameReplacements": [
    { "from": "Sample", "to": "<<: myVariable :>>" }
    // ... any other replacement your project needs
  ],
  "sourceCodeReplacements": [
    { "from": "oldValue", "to": "<<: myVariable.toLowerCase() :>>" },
    { "from": "OLDVALUE", "to": "<<: myVariable.toUpperCase() :>>" },
    { "from": "old-value", "to": "<<: myVariable.toLowerDasherized() :>>" },
    { "from": "OLD-VALUE", "to": "<<: myVariable.toUpperDasherized() :>>" },
    { "from": "old-value", "to": "<<: myVariable.toLowerUnderscored() :>>" },
    { "from": "OLD-VALUE", "to": "<<: myVariable.toUpperUnderscored() :>>" }
    // ... any other replacement your project needs
  ]
}
```

**And why not simply hard-code these values?** You definitively can, but there are use cases where they come in handy. One such case is when the recipe is dinamically built by some other tool in a continuous integration pipeline.

### Default variables

Even if you don't actually inform any *custom variables*, **Replicante** automatically creates one for you: `replicantName` and all its variations are available out of the box:

```javascript
{
  "replicantName": "NewProjectModel",
  "fileNameReplacements": [
    { "from": "Sample", "to": "<<: replicantName :>>" }
    // ... any other replacement your project needs
  ],
  "sourceCodeReplacements": [
    { "from": "Sample", "to": "<<: replicantName :>>" }, 
    { "from": "sample", "to": "<<: replicantName.toLowerCase() :>>" }, 
    { "from": "SAMPLE", "to": "<<: replicantName.toUpperCase() :>>" }
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

## Process Overview

If you are interested in the inner workings of this tool, you can always inspect the source files, but following is a brief summary of the overall process.

![Replication workflow](/docs/img/process-step-by-step.jpg)

## NodeJS Compatibility

From version 1.0 onwards, Replicante supports Node 14+.

## Roadmap

Our roadmap is publicly avaiable in a [Trello board](https://trello.com/b/T9khQD2v/replicant-roadmap). Feel free to comment and suggest new features.
