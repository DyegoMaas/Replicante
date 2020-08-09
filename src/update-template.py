from shutil import copyfile, rmtree
import os, shutil, codecs


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

    print(f'Gerando template a partir de {full_src} em {full_dest}')
    copyfile(full_src, full_dest) # merge two parts
    __remove_bom(full_dest)

    target_path = relative_path.replace('\\', '/')
    target_path = __replace_terms_in_text(target_path, replacements=[
        ('PrecosClientes', '<%= name %>'), # vai remover o prefixo Precos dos nomes dos arquivos, resultando em namespaces mais curtos
        ('Precos.Clientes', '<%= name %>'), # vai remover o prefixo Precos dos nomes dos arquivos, resultando em namespaces mais curtos
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
        source_code_replacements=[
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
    print(f'Processando diretório {path}')

    for file in os.listdir(path):
        full_path = os.path.join(path, file)

        if os.path.isfile(full_path):
            relative_path = os.path.relpath(full_path, root_path)
            middle_path = relative_path.replace(os.path.basename(relative_path), '')
            virtual_path = os.path.join(middle_path, file).replace('\\', '-').replace('/', '-')
            to_template(full_path, f'{template_dir}/new/{virtual_path}', relative_path)
            continue

        directory = file
        if directory in ['.git', '.idea', 'Replicant', 'docs', 'bin', 'obj']: # TODO suportar imagens para copiar pngs de documentação do docs
            continue

        __process_files_in_directory(full_path, root_path, template_dir)


def __clean_template_directory(template_dir):
    new_command_dir = os.path.join(template_dir, 'new')
    for file in os.listdir(new_command_dir):
        file_name = os.path.abspath(os.path.join(new_command_dir, file))

        if os.path.isfile(file_name):
            os.remove(file_name)
        else:
            rmtree(file_name, ignore_errors=False)


def __process_files_in_path(path, template_dir):
    __process_files_in_directory(path, path, template_dir)


def update_template():
    template_dir = './_templates/clean-ms-gen'
    __clean_template_directory(template_dir)
    __process_files_in_path('..', template_dir)


if __name__ == "__main__":
    update_template()