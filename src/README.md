# Template generator

## Setup

You will need to install Hygen with the command `npm i -g hygen`, and then `hygen init self`.

## How to run the project

The `update-template.py` converts a project into a [Hygen](https://www.hygen.io) template.

Conceptually, it generates a new Project from a Living, Running Project.

In order to update the template from the source living project, run `python replicator.py`. It will generate a Hygen template inside the folder _templates/clean-ms-gen/new.

Then, you can generate your new project using Hygen directly: `hygen clean-ms-gen new <NewProjectName>`

And so, the new service will be generated in the folder `/<NewProjectName>`.