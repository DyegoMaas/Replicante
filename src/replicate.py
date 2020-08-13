#!/usr/bin/env python

from shutil import copyfile, rmtree
import os, shutil, codecs
import argparse
import json

def remove_bom(full_path):
    BUFSIZE = 4096
    BOMLEN = len(codecs.BOM_UTF8)

    with open(full_path, "r+b") as fp:
        chunk = fp.read(BUFSIZE)
        if chunk.startswith(codecs.BOM_UTF8):
            i = 0
            chunk = chunk[BOMLEN:]
            while chunk:
                fp.seek(i)
                fp.write(chunk)
                i += len(chunk)
                fp.seek(BOMLEN, os.SEEK_CUR)
                chunk = fp.read(BUFSIZE)
            fp.seek(-BOMLEN, os.SEEK_CUR)
            fp.truncate()


class ReplicationRecipe:
    def __init__(self, template_name, template_dir, file_name_replacements, source_code_replacements, directories_to_ignores):
        super().__init__()
        self.template_name = template_name
        self.template_dir = template_dir
        self.file_name_replacements = file_name_replacements
        self.source_code_replacements = source_code_replacements
        self.directories_to_ignores = directories_to_ignores

    @staticmethod
    def from_dict(data):
        template_name = data['templateName']

        def read_replacements(array_key: str):
            return [
                (item['from'], item['to'])
                for item in data[array_key]
            ]

        return ReplicationRecipe(
            template_name=template_name,
            template_dir=f'./src/_templates/{template_name}', # TODO review
            file_name_replacements=read_replacements('fileNameReplacements'),
            source_code_replacements=read_replacements('sourceCodeReplacements'),
            directories_to_ignores=data['ignoreDirectories']
        )


class Replicator:
    def __init__(self, replication_recipe: ReplicationRecipe):
        super().__init__()
        self.replication_recipe = replication_recipe


    def __replace_terms_in_text(self, text: str, replacements) -> str:
        for replacement in replacements:
            old, new = replacement
            text = text.replace(old, new)

        return text


    def __prepare_file(self, file_path, lines_to_prepend, variables, source_code_replacements):
        with open(file_path, 'r', encoding='utf-8') as original:
            original_content = original.read()
            with open(file_path, 'w', encoding='utf-8') as modified:
                for line in lines_to_prepend:
                    line = self.__replace_terms_in_text(line, source_code_replacements)
                    modified.write(f'{line}\n')

                adjusted_content = variables + self.__replace_terms_in_text(original_content, source_code_replacements)
                modified.write(adjusted_content.lstrip())


    def to_template(self, src, dest, relative_path):
        full_src = os.path.abspath(src)
        full_dest = f'{os.path.abspath(dest)}.ejs.t'

        print(f'Generating template from {full_src} to {full_dest}')
        copyfile(full_src, full_dest) # merge two parts
        remove_bom(full_dest)

        target_path = relative_path.replace('\\', '/')
        target_path = self.__replace_terms_in_text(target_path,
            replacements=self.replication_recipe.file_name_replacements
        )
        frontmatter = [
            '---',
            f'to: <%= name %>/{target_path}',
            'force: true',
            '---',
        ]
        variables = (
            '<% '
            + 'NameUpperCase = name.toUpperCase();'
            + 'NameLowerCase = name.toLowerCase();'
            + 'NameLowerDasherized = h.inflection.dasherize(NameLowerCase);'
            + 'NameCapitalized = h.inflection.capitalize(name); %>'
            # TODO take other variables Hygen prompt
        )
        self.__prepare_file(full_dest,
            lines_to_prepend=frontmatter,
            variables=variables,
            source_code_replacements=self.replication_recipe.source_code_replacements
        )

    def __process_files_in_directory(self, path, root_path):
        print(f'Processing directory {path}')

        for file in os.listdir(path):
            full_path = os.path.join(path, file)

            if os.path.isfile(full_path):
                relative_path = os.path.relpath(full_path, root_path)
                middle_path = relative_path.replace(os.path.basename(relative_path), '')
                virtual_path = os.path.join(middle_path, file).replace('\\', '-').replace('/', '-')
                self.to_template(full_path, f'{self.replication_recipe.template_dir}/new/{virtual_path}', relative_path)
                continue

            directory = file
            if directory in self.replication_recipe.directories_to_ignores:
                continue

            self.__process_files_in_directory(full_path, root_path)


    def clean_template_directory(self):
        template_dir = self.replication_recipe.template_dir

        if not os.path.exists(template_dir):
            os.mkdir(template_dir)

        new_command_dir = os.path.join(template_dir, 'new')
        if not os.path.exists(new_command_dir):
            os.mkdir(new_command_dir)

        for file in os.listdir(new_command_dir):
            file_name = os.path.abspath(os.path.join(new_command_dir, file))

            if os.path.isfile(file_name):
                os.remove(file_name)
            else:
                rmtree(file_name, ignore_errors=False)


    def process_recipe_files(self, path):
        self.__process_files_in_directory(path, root_path=path)


def __load_replication_config(replication_config_file_path) -> ReplicationRecipe:
    with open(replication_config_file_path, 'r') as file:
        json_dict = json.loads(file.read())
        # print('CONFIG', yaml.dump(yaml_dict))
        return ReplicationRecipe.from_dict(json_dict)


def update_template(replication_instructions):
    sample_dir = replication_instructions['sample_directory'] # TODO include sample_dir in config loading somehow?
    recipe = __load_replication_config(replication_instructions['replication_recipe_file'])
    print(recipe.file_name_replacements)
    print(recipe.source_code_replacements)

    replicator = Replicator(replication_recipe=recipe)
    replicator.clean_template_directory()
    replicator.process_recipe_files(sample_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('-s', '--sample', dest='sample_directory', required=True)
    parser.add_argument('-r', '--recipe', dest='replication_recipe', required=True)
    args = parser.parse_args()
    print(f'Will use {args.sample_directory} as sample for replication process.')
    print(f'Replication recipe loaded: {args.replication_recipe}')

    update_template({
        'sample_directory': args.sample_directory,
        'replication_recipe_file': args.replication_recipe
    })