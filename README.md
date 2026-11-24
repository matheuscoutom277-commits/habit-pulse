# HabitPulse

HabitPulse é um aplicativo simples de bem-estar para acompanhar o humor e criar
hábitos com consistência. Os registros ficam salvos no navegador, sem precisar
de uma conta ou serviço de backend.

## Funcionalidades

- Registro de humor com nota de 1 a 5, tags de sentimento e anotação opcional.
- Histórico de check-ins com filtros por sentimento e nota.
- Gráfico de humor dos últimos sete dias.
- Criação e acompanhamento de hábitos diários.
- Insights sobre tags frequentes e hábitos concluídos.
- Exportação e importação de backups em JSON.

## Tecnologias

- HTML, CSS e JavaScript sem framework de aplicação.
- Tailwind CSS via CDN para estilos.
- Chart.js via CDN para o gráfico.
- `localStorage` do navegador para persistir os dados.
- Google Fonts (DM Sans).

## Executar localmente

Não é necessário instalar dependências nem executar um processo de build. Abra
`index.html` em um navegador ou sirva a pasta com qualquer servidor estático.
O projeto também pode ser publicado diretamente no GitHub Pages.

## Publicar no GitHub Pages

1. Envie os arquivos do projeto para um repositório GitHub.
2. Nas configurações do repositório, abra **Pages**.
3. Escolha a branch e a pasta raiz (`/`) como origem da publicação.
4. Salve e aguarde o GitHub Pages publicar o site.

Os recursos locais usam caminhos relativos, como `./app.js`, para funcionar
tanto na raiz do domínio quanto em sites de projeto hospedados em um subcaminho.
Tailwind CSS, Chart.js e a fonte são carregados de seus CDNs e precisam de acesso
à internet. Os dados salvos no `localStorage` são específicos do navegador e da
origem do site; exporte um backup para transferi-los ou guardá-los.
