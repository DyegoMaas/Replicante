#!/usr/bin/env python

from shutil import copyfile, rmtree
import os, shutil, codecs
import argparse


def __replace_terms_in_text(text: str, replacements) -> str:
    for replacement in replacements:
        old, new = replacement
        text = text.replace(old, new)

    return text


def __remove_bom(full_path):
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


def __prepare_file(file_path, lines_to_prepend, variables, source_code_replacements):
    with open(file_path, 'r', encoding='utf-8') as original:
        original_content = original.read()
        with open(file_path, 'w', encoding='utf-8') as modified:
            for line in lines_to_prepend:
                line = __replace_terms_in_text(line, source_code_replacements)
                modified.write(f'{line}\n')

            adjusted_content = variables + __replace_terms_in_text(original_content, source_code_replacements)
            modified.write(adjusted_content.lstrip())


def to_template(src, dest, relative_path):
    full_src = os.path.abspath(src)
    full_dest = f'{os.path.abspath(dest)}.ejs.t'

    print(f'Generating template from {full_src} to {full_dest}')
    copyfile(full_src, full_dest) # merge two parts
    __remove_bom(full_dest)

    target_path = relative_path.replace('\\', '/')
    target_path = __replace_terms_in_text(target_path, replacements=[
        ('PrecosClientes', '<%= name %>'), # TODO parameterize
        ('Precos.Clientes', '<%= name %>'),
    ])
    frontmatter = [
        '---',
        f'to: <%= name %>/{target_path}',
        'force: true',
        '---',
    ]
    variables = (
        '<%'
        + 'NameUpperCase = name.toUpperCase();'
        + 'NameLowerCase = name.toLowerCase();'
        + 'NameLowerDasherized = h.inflection.dasherize(NameLowerCase);'
        + 'NameCapitalized = h.inflection.capitalize(name);'
        + 'ChartName = NameLowerCase; %>'
        # TODO pegar outras via prompt do Hygen
    )
    __prepare_file(full_dest,
        lines_to_prepend=frontmatter,
        variables=variables,
        source_code_replacements=[ # TODO parameterize
            ('precosclientes', '<%= ChartName %>'),
            ('PrecosClientes', '<%= name %>'),
            ('Precos.Clientes', '<%= name %>'),
            ('PRECOS-CLIENTES', 'PRECOS-<%= NameUpperCase %>'),
            ('Precos-Clientes', 'Precos-<%= name %>'),
            ('precos-clientes', 'precos-<%= NameLowerCase %>'),
            ('precos_clientes', 'precos_<%= NameLowerCase %>'),
            ('clientes', '<%= NameLowerCase %>'),
            ('Clientes', 'Preços - <%= Name %>'),
        ]
    )

def __process_files_in_directory(path, root_path, template_dir):
    print(f'Processing directory {path}')

    for file in os.listdir(path):
        full_path = os.path.join(path, file)

        if os.path.isfile(full_path):
            relative_path = os.path.relpath(full_path, root_path)
            middle_path = relative_path.replace(os.path.basename(relative_path), '')
            virtual_path = os.path.join(middle_path, file).replace('\\', '-').replace('/', '-')
            to_template(full_path, f'{template_dir}/new/{virtual_path}', relative_path)
            continue

        directory = file
        if directory in ['.git', '.idea', 'Replicant', 'docs', 'bin', 'obj']: # TODO parameterize
            continue

        __process_files_in_directory(full_path, root_path, template_dir)


def __clean_template_directory(template_dir):
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


def __process_files_in_path(path, template_dir):
    __process_files_in_directory(path, path, template_dir)


def update_template(replication_instructions):
    source_dir = replication_instructions['sample_directory']
    template_dir = './_templates/clean-ms-gen' # TODO load from replication recipe
    __clean_template_directory(template_dir)
    __process_files_in_path(source_dir, template_dir)


# TODO receive project dir and config file
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