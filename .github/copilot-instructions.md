# Diretrizes de Design - HabitPulse (Neo-Brutalismo Suave)

Ao editar o visual de `#file:index.html` e `#file:app.js`, abandone qualquer estética escura/genérica de IA e aplique rigorosamente o estilo **Neo-Brutalismo Suave**:

1. **Proibições (Anti-AI Slop):**
   - NUNCA use fundo escuro (`dark`), azul-marinho (`#0b1020`), roxo neon, gradientes ou sombras suaves difusas (`shadow-lg`, `shadow-xl`).
   - Remova a classe `dark` da tag `<html>`.

2. **Paleta de Cores (Chapada e Vibrante):**
   - **Fundo da página:** Creme claro / Off-white (`#FAF7F2`).
   - **Cards e Superfícies:** Branco puro (`#FFFFFF`) com contraste alto.
   - **Bordas e Textos:** Preto carvão (`#111111`) para 100% dos textos, ícones e bordas.
   - **Cores de Destaque (Acentos):**
     - Amarelo Manteiga (`#FFE66D`) para botões principais e destaques ativos.
     - Verde Menta (`#7AE582`) para hábitos concluídos e feedbacks positivos.
     - Coral Suave (`#FF8A7A`) para alertas, tags ou botões de ação secundária.
     - Azul Céu (`#7BDFF2`) para detalhes do gráfico e badges.

3. **Assinatura Visual Neo-Brutalista (Tailwind):**
   - **Bordas nítidas:** Use `border-2 border-[#111111]` em todos os cards, inputs, botões e pílulas de tags.
   - **Sombras duras (Hard Shadows):** Use `shadow-[4px_4px_0px_0px_#111111]` nos cards principais e `shadow-[2px_2px_0px_0px_#111111]` nos botões.
   - **Efeito tátil ao clicar:** Nos botões, adicione `transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` para simular um botão físico afundando.
   - **Cantos:** Use `rounded-xl` nos cards e `rounded-lg` nos botões (nem muito quadrado, nem redondo demais).

4. **Tipografia:**
   - Importe do Google Fonts a fonte **`Space Grotesk`** (pesos 500 e 700) para títulos, números e botões, e **`Inter`** (pesos 400 e 500) para textos corridos.
   - Use títulos fortes em negrito (`font-bold tracking-tight`).

5. **Gráfico (Chart.js no `#file:app.js`):**
   - Atualize as cores do gráfico para combinar com o tema claro: linha preta (`#111111`) com espessura `3`, pontos preenchidos em Amarelo (`#FFE66D`) com borda preta, e textos/eixos em `#111111` (sem grade escura).
