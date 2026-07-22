# Game Design Document — Guerreiro da Masmorra

> Documento de referência com tudo que já está implementado no jogo. Serve para organizar as ideias
> acumuladas ao longo do desenvolvimento e como ponto de partida para decidir o que vem a seguir.
> Todo o jogo roda num único `index.html`; as referências de linha citadas aqui podem se mover conforme
> o arquivo evolui — use-as como ponto de partida, não como verdade absoluta.

## 1. Visão geral

RPG tático em turnos, grátis, jogável direto no navegador (H5 Games/AdSense) e também empacotado como
app Android via Capacitor. Sem contas obrigatórias — progresso salvo em `localStorage`, com opção de
login e salvamento em nuvem via Firebase (Auth + Firestore) para quem quiser continuar em outro
aparelho.

O pilar central do jogo é que **o combate é ativo, não passivo**: mesmo em um RPG de turnos clássico,
cada golpe recebido vira um evento de reflexo em tempo real (parry, esquiva, salto), e cada ataque
especial vira um minijogo de precisão. A build do personagem (atributos, gemas) importa, mas o reflexo
do jogador decide boa parte da batalha.

Estrutura de progressão: **Acampamento** (tela de upgrades e loja) → **Mapa-múndi** (navegação entre
cidades e portas de masmorra, recrutamento de heróis por duelo) → **Masmorra** (3 ondas de combate) →
volta ao Acampamento com ouro e recompensas.

---

## 2. Heróis

Cinco heróis, cada um com progressão de atributos e gemas **totalmente independente** (guardada por
herói em `S.heroes[id]`). Trocar de herói ativo no acampamento é feito arrastando a tela para o lado.

| Herói | HP | ATK | DEF | Como recruta | Estilo |
|---|---|---|---|---|---|
| **Guerreiro** ⚔️ | 60 | 10 | 3 | Inicial | Acumula fúria atacando e defendendo; usa todo o menu de especiais |
| **Mago Arcanista** 🃏 | 45 | 8 | 2 | Cidade 0 do mapa | Cartas mágicas: monta a mão, combina cores/tipos, arrisca a Carta da Morte |
| **Caçadora** 🏹 | 55 | 12 | 2 | Duelo na cidade 2 | Igual ao Guerreiro, mas só ganha fúria defendendo (mais precisa, mais reativa) |
| **Lanceiro** 🔱 | 75 | 11 | 5 | Duelo na cidade 4 | Igual ao Guerreiro; a maior vida/defesa do elenco, tanque |
| **Monge** 📿 | 52 | 9 | 3 | Duelo na cidade 6 | Igual ao Guerreiro; meio-termo equilibrado |

**Importante sobre Caçadora/Lanceiro/Monge**: eles compartilham exatamente o mesmo motor de combate do
Guerreiro (parry, esquiva, fúria, Sequência Mortal, Combo, Lâmina Invisível) — não têm habilidade
especial própria no código hoje. A diferenciação atual é de atributos-base, sprite, e uma regra sutil:
**só o Guerreiro ganha fúria com o ataque simples**; os outros três só acumulam fúria defendendo bem
(parry/bloqueio/esquiva de salto) ou tomando dano, o que empurra o jogador para um estilo mais
defensivo/reativo com eles. Isso deixa margem para, no futuro, dar a cada um uma identidade de combate
própria (a exemplo do que já foi feito com o Mago).

Duas cidades do mapa (índices 8 e 10, de 6 no total) não têm gatilho de duelo — parecem reservadas para
heróis futuros.

### 2.1 Recrutamento por duelo

Cada herói recrutável tem uma **cidade** no mapa-múndi. Parar o token ali libera o botão "⚔ Desafiar
[Nome] (2 ondas + duelo)". O duelo consome 1 tocha e roda no **mesmo motor de masmorra de 3 ondas**: 2
ondas comuns + uma "onda 3" que é o próprio herói-alvo convertido em chefe (sempre com fase 2 de
enrage). A dificuldade do duelo escala com o **nível de masmorra atual do jogador**, não com o nível do
herói desafiado — ou seja, acompanha o quanto você já progrediu, não é um desafio fixo. Vencer marca
`wonDuel=true`; falta confirmar no menu "Recrutar" para o herói entrar oficialmente na equipe, sempre no
Nv.1 de progressão própria.

---

## 3. Sistema de combate do Guerreiro (e dos heróis que o compartilham)

A ordem de ação em cada rodada é decidida por uma **fila de iniciativa por velocidade**: cada unidade
tem uma velocidade-base (guerreiro 10, servo 12, arqueiro 9, monge 8, lanceiro 7, chefe 6, árvore 5)
somada a um rolamento de sorte 0–5. Um chefe enfurecido (fase 2) pode entrar na fila 2–3 vezes na mesma
rodada.

### 3.1 Reações a golpes inimigos (QTE por golpe)

- **Parry** — tocar quando o círculo de reação está fechando. Nos últimos ~32% da janela conta como
  **PARRY PERFEITO** (dano zero, +1 fúria, cansa o atacante, e ainda **riposta**: `max(1, round(ATK*0.5)
  − DEF do alvo)`); fora dessa janela conta como **bloqueio** (dano = `ATK inimigo − DEF`, ainda dá +1
  fúria).
- **Esquiva de salto** (arrastar para cima, contra golpes rasteiros) — sucesso anula o dano, dá +1
  fúria, e abre uma janela de **Ataque Aéreo** (toque rápido, ~1,1s) que causa dano extra de
  `max(1, round(ATK*0.9) − DEF)`.
- **Esquiva lateral** (deslizar ⬅➡, contra golpes "rolantes"/varredura e contra explosões de goblin) —
  só anula o dano; **não** gera fúria nem cansa o inimigo.
- Falhar qualquer reação (ou estar com a guarda quebrada) = dano cheio (`ATK inimigo + variação
  aleatória 0–3`).
- Golpes de inimigos de fogo que acertam em cheio grudam uma **dinamite** no herói (explode no início do
  próximo turno).

Cada monstro tem um repertório fixo de golpes nomeados (mostrados na tela antes do ataque, ensinando o
padrão ao jogador), cada um com 1–3 hits. **Defender um combo inteiro com reações perfeitas** rende um
**contra-ataque automático de 1,5×–2× o próprio dano**. Em fase 2 de chefe o combo ganha +1 golpe extra
e fica 25% mais rápido; em NG+, todo combo de múltiplos golpes ganha +1 golpe adicional por ciclo (até
3 extras).

### 3.2 Fúria (0–5)

Fontes: ataque simples (só Guerreiro), parry perfeito, bloqueio, esquiva de salto, e sofrer dano. O
Monge inimigo pode lançar "Selo da Fúria", bloqueando o ganho de fúria por 2–3 turnos. A Poção de
Adrenalina enche a fúria para 5/5 na hora. Gastar fúria em um especial **não zera a barra** — só
subtrai o valor efetivamente usado.

### 3.3 Menu de especiais

| Especial | Custo | Efeito |
|---|---|---|
| ⚡ Fúria do Fogo | 1–5 (escalonado) | Golpe único; multiplicador cresce com a fúria (×1.1 → ×1.5); em fúria 5, vira área (×1.5 em todos) |
| ☠ Sequência Mortal | 2 (fixo) | Barra oscilante, 3 idas e voltas acelerando; travar na zona certa dá ×1.1 / ×1.5 / ×2 |
| 🗡 Combo | 1 (usa até a fúria disponível) | 2 a 4 golpes em sequência (QTE de tempo por golpe), multiplicadores de 1.2× a 2× |
| 👻 Lâmina Invisível | 1 por golpe (= fúria atual) | N golpes de ×0.85 cada, em alvos aleatórios entre os vivos (pode repetir alvo) |

Todo especial deixa o herói **exausto por 1 rodada** (perde a rodada seguinte inteira).

### 3.4 Exaustão (stagger) — do herói e dos monstros

- **Do herói**: barra 0–100; cada golpe sofrido soma `max(6, round(dano*140/HP máximo))`. Se chegar a
  100 **durante um combo de múltiplos golpes inimigos**, o herói fica com a guarda quebrada até o
  próximo turno (não consegue mais reagir naquele combo).
- **Dos monstros** ("cansado"/"exausto"): cada golpe especial/combo/riposte soma ao contador do inimigo
  até um teto por categoria — **monstro normal = 5, Boss = 10, Big Boss (nível efetivo ≥20) = 15, Huge
  Boss (nível efetivo ≥30) = 20**. No teto, o próximo golpe com multiplicador ≥1.5 deixa o monstro
  **exausto por 3 rodadas**. Golpes fracos (parry perfeito, Lâmina Invisível) só acumulam o contador,
  não "estouram" o cansaço sozinhos.

### 3.5 Escudo Arcano e fase 2 de chefe

A partir da masmorra Nv.5, chefes têm 45% de chance de gastar o turno conjurando 2–3 escudos (teto 10).
Com escudo de pé, golpes quebram escudos em vez de tirar HP (a Gema Perfurante deixa uma fração do dano
atravessar mesmo assim). Chefes marcados para fase 2 (60% de chance a partir do nível efetivo 3, sempre
no duelo) **enfurecem automaticamente ao cair a 50% do HP**: ataque ×1.4, golpe extra no combo, 25% mais
rápido, e entra na fila de iniciativa 2–3 vezes por rodada.

### 3.6 Pedrada e poções

- **Pedrada** 🪨 — mecânica lateral gratuita, arrastar do herói até um monstro; 1 grátis por rodada
  (mais com a Gema do Arremesso); dano = `round(ATK*0.2)`, ou quebra 1 escudo.
- **Poção de Cura** — cura 40% do HP máximo; consome o turno.
- **Poção de Adrenalina** — enche a fúria (5/5); consome o turno.
- Ambas começam em ×3 por masmorra, e ficam sob o mesmo botão "Poção" no menu.

---

## 4. Sistema de cartas do Mago Arcanista

O Mago não usa o menu do Guerreiro — tem seu próprio menu de batalha (**Ataque simples** / **Conjurar**)
e uma mão de cartas visível na base da tela. Também pode jogar pedra como os demais heróis.

### 4.1 Cartas e cores

| Carta | Cor | Base | Efeito solo |
|---|---|---|---|
| 🔥 Bola de Fogo | Roxo | 9 | Dano no alvo |
| ❄️ Lasca de Gelo | Roxo | 10 | Dano no alvo |
| 💧 Jato d'Água | Roxo | 9 | Dano no alvo |
| ⚡ Faísca | Roxo | 8 | Dano no alvo |
| 💚 Bênção (cura) | Verde | 14 | Cura o próprio mago |
| 🛡️ Couraça Arcana (defesa) | Verde | 12 | Concede escudo que absorve o próximo golpe recebido |
| 💀 Carta da Morte | Preto | 0 | Abate instantâneo (ver 4.4) — nunca combina com outra cor |

- A mão começa **vazia** e tem limite de **7 cartas**; além disso a carta se dissipa.
- **Toda rodada, o mago compra 1 carta aleatória automaticamente** (do conjunto roxo+verde, nunca a
  morte) — sempre há algo para jogar.
- **Ataque simples**: causa dano mágico simples no alvo mirado (baseado no Ataque do mago) **e** concede
  mais uma carta aleatória.
- As cartas **persistem entre ondas** (só são zeradas ao entrar em uma masmorra nova).
- Toda carta jogada é destruída.

### 4.2 Conjurar — seleção e combos

O jogador toca até **3 cartas** da mão para selecioná-las (destaque dourado) e segura "Conjurar" para
jogá-las juntas. Só combina cartas da **mesma cor**; caso contrário a jogada é rejeitada sem custo.

- **Mesma cor + mesmo tipo exato** (ex.: fogo+fogo, ou fogo+fogo+fogo): o poder é
  `nº de cartas × soma das cartas` — e o **nº de monstros atingidos = nº de cartas** (1 carta → só o
  alvo; 2 cartas → o alvo + outro monstro; 3 cartas → **todos os monstros vivos, com ataque crítico**).
- **Mesma cor, tipos diferentes** (ex.: fogo + faísca): o poder também é `nº de cartas × soma das
  cartas`, mas atinge **só o monstro mirado**, nunca em área.
- **Verde do mesmo tipo** (cura+cura ou defesa+defesa): soma o efeito (cura ou escudo) pela mesma
  fórmula de poder.
- **Verde misto** (cura+defesa): aplica **os dois efeitos parciais** — metade do poder de cura e metade
  do poder de escudo, cada um calculado separadamente.
- **Quebra de escudo**: quando o ataque acaba concentrado em **um único monstro** (seja por serem tipos
  diferentes, seja porque só sobrou um inimigo vivo), quebra **1 escudo por carta usada**. Em ataques
  de área (3 cartas iguais acertando vários monstros), cada alvo quebra escudo pela regra antiga
  (1, ou 2 em crítico/dano alto).

### 4.3 Escala com o Ataque do acampamento

O poder de toda carta (dano, cura e escudo) é multiplicado por `Ataque atual do mago ÷ 8` (8 é o Ataque
inicial do Mago) — ou seja, comprar Ataque no acampamento também fortalece as cartas, não só o Ataque
Simples.

### 4.4 Carta da Morte

Concedida automaticamente **toda vez que o mago mata um monstro** (por qualquer meio: Ataque Simples,
Conjurar, ou pedrada). Jogada **sozinha**:
- Abate o monstro mirado instantaneamente (remove todo o HP, ignora escudo).
- Se houver **qualquer outra carta na mão**, o mago sofre de volta a soma do poder delas, e a mão
  inteira é destruída junto.

### 4.5 "Destruir carta" (transformação, não descarte)

Selecionar **1 a 3 cartas da morte** e usar "Destruir carta" na verdade **funde** essas cartas em **uma
única carta aleatória qualquer** (do conjunto roxo+verde) — quanto mais cartas da morte fundidas, mais
forte a carta resultante (`base × nº de cartas fundidas`). Essa ação **consome o turno**, igual às
outras ações de combate.

---

## 5. Estrutura das masmorras

- **3 ondas por masmorra**: ondas 1 e 2 são monstros comuns (a onda 2 vem 30% mais forte e rende 25%
  mais ouro); a onda 3 é sempre um chefe.
- Escala por nível de masmorra `L`: multiplicador de stats dos monstros = `(1 + (L-1)*0.25) × NG+`;
  ouro por monstro = `round((12 + 4*L) × NG+)`.
- **Masmorras múltiplas de 5** (5, 10, 15…): o chefe vem escoltado por 2 guardas mais fracos. O chefe
  da masmorra 1 e o de toda masmorra múltipla de 5 **derruba um Pergaminho de Gema** (libera uma nova
  gema no Mercado, na ordem fixa Pedra → Vital → Eco → Perfurante).
- **Cores de masmorra** (sorteadas ao vencer a atual): Vermelha, Negra, Azul, Púrpura, Dourada — mudam o
  conjunto de sprites de goblins/tropas e o nome do chefe ("Cavaleiro [Cor]").
- **Biomas de cenário** (sorteados por batalha, independentes da cor): Castelo, Floresta, Cemitério,
  Ruínas — só decorativo.
- **`DUNGEON_CAP = 33`**: vencer a masmorra 33 "completa" o jogo e oferece iniciar o **NG+**.
- **Ciclo NG+**: volta para a masmorra 1 e reseta a posição no mapa, mas mantém ouro/atributos/gemas.
  `nível efetivo = dgLv + ngPlus*5` continua controlando todo gatilho de conteúdo (goblins de fogo,
  escudo arcano, etc.), então nada desbloqueado se perde. Por ciclo de NG+: monstros ficam 25% mais
  fortes/valiosos (`1.25^ngPlus`), as janelas de QTE encolhem (mais rápido), e combos ganham +1 golpe
  extra (até 3 no total).

### 5.1 Bestiário

**Comuns**: Servo, Arqueiro, Lanceiro, Monge (suporte inimigo — cura aliados, lança maldição de dreno
de HP ou "Selo da Fúria", ataca à distância), Gnomo Arruaceiro, Ladrão, Cobra Venenosa, Aranha Gigante,
Goblin da Tocha e Goblin Dinamite (ambos de fogo, liberados a partir da masmorra 3), Caveira Amaldiçoada,
Minotauro, Gnoll/Lagarto/Peixe-Arpoador/Xamã (à distância), Peixe-Remo, Tartaruga Blindada (defesa
alta), Cavaleiro Selvagem — liberados progressivamente por nível efetivo mínimo.

**Chefes**: Cavaleiro da cor da masmorra (genérico), Rei Slime, Árvore Anciã (brota do chão em vez de
correr), Urso Feroz, Minotauro Ancestral, Troll das Cavernas, Panda Guerreiro.

**Goblins de fogo**: acerto em cheio gruda dinamite no herói (explode no turno seguinte); ao **morrer**,
detona uma Explosão Final (dano `max(3, round(ATK*0.5))`, única defesa é a esquiva lateral) que
estilhaça os outros monstros vivos e pode encadear outra explosão.

---

## 6. Progressão e economia

### 6.1 Acampamento (upgrades)

| Atributo | Ganho por compra | Custo-base |
|---|---|---|
| Vida | +20 HP máx | 50 |
| Ataque | +3 ATK | 60 |
| Defesa | +2 DEF | 60 |

Custo de cada compra: `base × 1.55^nível já comprado` (crescimento exponencial), progressão
independente por herói.

### 6.2 Mercado

- **Tocha** (entrada de masmorra/duelo): 40 ouro cada, teto de 20; regenera 1 a cada 10 minutos reais.
- **Mapa** (item de fuga): 30 ouro cada.
- **Baú do Dia**: 1×/dia, requer vídeo premiado; recompensa = `round((80 + 40*(dgLv-1)) × NG+)` ouro.
  Agora com **animação de abertura** (ver 6.4).
- Bônus de vitória de masmorra: `round((150 + 60*(dgLv-1)) × NG+)` ouro, com opção de vídeo para
  dobrar.

### 6.3 Gemas

4 gemas, desbloqueadas por pergaminhos (masmorra 1 e múltiplas de 5), na ordem fixa Pedra → Vital →
Eco → Perfurante. Evoluir de nível custa `4000 × 5^(nível-1)` ouro. **Só 1 gema equipada por vez.**

| Gema | Efeito (Nv.1 → Nv.5) |
|---|---|
| 🪨 Gema do Arremesso | Pedradas grátis por rodada: 2 → 6 |
| 💗 Gema Vital | Cura no parry perfeito: 5% → 13% do HP máximo |
| ⚔️ Gema do Eco | Ataque simples golpeia 2×; 2º golpe vale 50% → 100% do normal |
| 💠 Gema Perfurante | % do dano que atravessa escudo arcano: 40% → 80% |

### 6.4 Animação de baús

Ao vencer uma masmorra, completar o jogo (masmorra 33), ou abrir o Baú do Dia, toca uma animação de
abertura de baú (4 quadros: fechado → tremendo → abrindo → aberto com tesouro) no topo do overlay de
recompensa. O design do baú (12 variações, `assets/chests/chest1.png`…`chest12.png`, extraídas de
`assets/baus.png`) muda conforme o nível de masmorra vencido, ciclando de 1 a 12 e recomeçando.

---

## 7. Mapa-múndi

Mapa estilo Final Fantasy Tactics: 11 nós alternando **cidade** (6 nós pares, com prédios do Tiny
Swords) e **porta de masmorra** (5 nós ímpares, um por nível de masmorra dentro da "região" atual). O
jogador se move entre nós adjacentes já alcançados arrastando/tocando. `região = floor((dgLv-1)/5)` e a
porta de fronteira liberada acompanham o nível de masmorra atual. Parar na porta de fronteira mostra
"Entrar na Masmorra"; parar na cidade de um herói não recrutado mostra "Desafiar" (ver seção 2.1).

---

## 8. Persistência e técnico

- **Save local**: `localStorage` (chave `rpg-guerreiro-v3`). Guarda stats "vivos" do herói ativo, ouro,
  tochas/timer de recarga, mapas, nível/cor de masmorra, vitórias/entradas, tutorial concluído, baú do
  dia, gemas (desbloqueadas/nível/equipada), posição no mapa, ciclo NG+, e a progressão própria de cada
  herói (`S.heroes[id]`). Migrações defensivas tratam saves de versões antigas.
- **Nuvem**: login e salvamento via Firebase (Auth + Firestore), com tratamento especial para
  autenticação dentro do WebView do Android (o popup do Google não funciona ali — usa sessão via
  idToken).
- **Plataformas**: Web (H5 Games Ads / AdSense Ad Placement API) e Android nativo via Capacitor, com
  anúncios premiados/intersticiais via `@capacitor-community/admob` quando disponível, caindo para o
  caminho web caso contrário.

---

## 9. Pontas soltas / ideias para explorar depois

- Caçadora, Lanceiro e Monge ainda não têm identidade de combate própria (usam o motor do Guerreiro
  1:1) — candidatos naturais a receber um sistema exclusivo, do jeito que o Mago já tem o dele.
- Duas cidades do mapa (índices 8 e 10) não têm duelo associado — espaço reservado para heróis futuros.
- O Monge **inimigo** já cura aliados e lança maldições; o Monge **jogável** poderia espelhar parte
  disso como especial próprio.
