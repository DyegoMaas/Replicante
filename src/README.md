# Gerador de templates

Este script gera um template [Hygen](https://www.hygen.io) a partir do projeto atual.

Conceitualmente, esta solution é um Projeto Vivo. Compila, tem testes funcionais, tudo certinho.

Quando quisermos atualizar o template para montar um novo microserviço, o processo será esse:

1) Rodar `python update-template.py`, que transforma o projeto atual em um template Hygen
2) Rodar `hygen clean-ms-gen new <NomeServico>`

E assim, o novo serviço será gerado na pasta `/templator/<NomeServico>` (ou esse é o plano).