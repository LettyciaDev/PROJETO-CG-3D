# Cubo Mágico 3D

Simulador interativo de Cubo Mágico 3x3x3 que roda direto no navegador, feito com **Three.js**. Não precisa de back-end, instalação de dependências nem etapa de build.

## Funcionalidades

- Cubo 3x3x3 montado com 27 peças (cubinhos) independentes
- Rotação animada das seis faces (U, D, L, R, F e B), com giro de 90 graus no sentido horário olhando de frente para a face
- Câmera livre com o mouse (órbita com amortecimento e zoom limitado)
- Contador de movimentos
- **Embaralhar:** executa 20 giros aleatórios em sequência
- **Resolver:** desfaz o histórico de movimentos, com animação
- **Resetar:** volta o cubo ao estado inicial na hora
- Detecção de vitória, com aviso na tela e o total de movimentos
- Três temas de cores: Padrão, Neon e Pastel
- Interface escura, com painéis translúcidos, e legenda de faces clicável

## Como executar

1. Baixe ou clone o repositório:

   ```bash
   git clone https://github.com/LettyciaDev/PROJETO-CG-3D.git
   cd PROJETO-CG-3D
   ```

2. Abra o arquivo `index.html` em um navegador moderno (Chrome, Firefox, Edge ou Safari).

Se preferir abrir por um servidor local, qualquer um serve. Por exemplo, com Python:

```bash
python3 -m http.server 8000
```

e depois acesse `http://localhost:8000`.

> O Three.js (r128) e o OrbitControls (0.128) são carregados por CDN, então é preciso ter conexão com a internet.

## Controles

| Ação                 | Como fazer                                            |
| -------------------- | ----------------------------------------------------- |
| Girar a câmera       | Arrastar com o mouse                                  |
| Aproximar ou afastar | Roda do mouse (distância entre 6 e 20)                |
| Girar uma face       | Clicar no botão da face na legenda, ou usar o teclado |
| Embaralhar           | Botão **Embaralhar**                                  |
| Resolver             | Botão **Resolver**                                    |
| Resetar              | Botão **Resetar**                                     |
| Trocar o tema        | Seletor no painel do topo                             |

Teclas das faces:

| Tecla | Face            |
| ----- | --------------- |
| `U`   | Topo (Up)       |
| `D`   | Base (Down)     |
| `L`   | Esquerda (Left) |
| `R`   | Direita (Right) |
| `F`   | Frontal (Front) |
| `B`   | Traseira (Back) |

Atalhos com Ctrl, Cmd ou Alt, e teclas mantidas pressionadas, são ignorados para não conflitar com os atalhos do navegador (como Ctrl+R).

## Estrutura do projeto

```
PROJETO-CG-3D/
├── index.html   # Estrutura da página, estilos (CSS) e interface
├── app.js       # Cena 3D, cubo, rotações, lógica do jogo, temas e teclado
└── README.md
```

## Como funciona

- **Montagem do cubo:** três laços aninhados criam 27 malhas (`BoxGeometry`) separadas por uma pequena folga. Cada peça tem seus próprios materiais: só as faces voltadas para fora recebem a cor do tema, e as internas ficam em cinza escuro. Um miolo esférico no centro preenche o interior sem aparecer quando uma camada gira.
- **Giro de uma face:** as nove peças da face são selecionadas pela posição em coordenadas de mundo e anexadas a um grupo pivô temporário. O pivô gira em torno do eixo da face, com suavização _easeOutQuad_, e depois as peças voltam ao grupo do cubo, com as posições arredondadas para evitar erro acumulado. Uma trava impede dois giros ao mesmo tempo.
- **Histórico:** cada giro é registrado, e quatro giros seguidos da mesma face (que se cancelam) são removidos. O botão **Resolver** percorre o histórico de trás para frente.
- **Vitória:** depois de cada giro, a normal original de cada adesivo é rotacionada pela orientação atual da peça e comparada com a original.
- **Temas:** a troca de tema recolore apenas os adesivos, sem recriar a geometria.

## Limitações conhecidas

- A detecção de vitória confere a orientação dos adesivos, mas não compara a posição de cada peça com a posição inicial.
- O botão **Resolver** apenas desfaz o histórico de movimentos; não é um algoritmo de resolução. Depois de **Resetar**, ou de uma vitória, o histórico é apagado.
- Não há giro no sentido anti-horário pelo teclado ou pelos botões.
- É necessário ter internet para carregar as bibliotecas por CDN.

## Tecnologias

- HTML5, CSS3 e JavaScript
- [Three.js](https://threejs.org/) r128
- OrbitControls (Three.js 0.128)

## Equipe

| Integrante       | GitHub                                        |
| ---------------- | --------------------------------------------- |
| Lettycia Vitória | [LettyciaDev](https://github.com/LettyciaDev) |
| Anna Beatriz     | [Anninhaxs](https://github.com/Anninhaxs)     |
| Lucas Fernandes  | [Bye-bit](https://github.com/Bye-bit)         |
