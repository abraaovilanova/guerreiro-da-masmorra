# ⚔️ Guerreiro da Masmorra

RPG tático em turnos onde seu reflexo decide a batalha — não só a sua build. Grátis, jogável direto no
navegador e também disponível como aplicativo Android.

Desça a masmorra, enfrente hordas de monstros e prove seu valor em um RPG tático por turnos. Sem anúncios
forçados e sem precisar criar conta.

## 🎮 Combate ativo, não passivo

Esqueça ficar só escolhendo comandos e vendo a barra de vida descer. Aqui cada golpe é um evento de tempo
real:

- Toque no instante certo para um **parry** perfeito — dano zero e o inimigo sai cansado
- Arraste para cima para **saltar** sobre golpes rasteiros
- Deslize para o lado para **esquivar** de ataques laterais
- Encadeie **combos** acertando o ritmo de cada golpe
- Trave a **Sequência Mortal** na zona certa da barra oscilante para dano crítico

Defender bem enche sua barra de fúria — gaste em ataques especiais devastadores ou deixe estourar em fúria
total contra todos os inimigos.

## 🦸 Cinco heróis, cinco estilos de jogo

Comece com o Guerreiro e recrute o resto no mapa-múndi:

- **Guerreiro** — acumula fúria e libera Sequência Mortal, Combo e Fúria do Fogo
- **Mago Arcanista** — monta a mão com cartas mágicas, funde elementos iguais (Fogo + Fogo = Grande
  Labareda) e desenha o padrão de cada feitiço na tela antes do tempo acabar
- **Caçadora** — Tiro Certeiro que ignora a armadura do alvo, precisão acima de tudo
- **Lanceiro** — Investida em Leque atinge toda a linha inimiga de uma vez; especial sempre focado em dano
  máximo num único alvo
- **Monge** — equilíbrio entre disciplina, cura e resistência

Cada herói evolui sozinho: recrutou alguém novo? Vale voltar às masmorras iniciais pra treinar do zero.
Troque de herói no acampamento arrastando a tela.

## 🐲 Masmorras, ondas e chefes épicos

Cada masmorra tem 3 ondas — comuns, reforçados e o Chefe. Goblins de fogo grudam dinamite que explode no
início do seu turno, monstros explosivos detonam ao morrer, e chefes como o Rei Slime e a Árvore Anciã
entram em Fase 2 ao perder metade da vida: mais rápidos, mais fortes, com turnos extras.

## 💰 Progressão no acampamento

Ouro ganho em batalha vira vida, ataque e defesa no Mercado. Compre tochas para abrir novas masmorras e
mapas para fugir de combates difíceis. Chefes especiais liberam Gemas — Gema do Arremesso, Gema Vital,
Gema Perfurante — com poderes passivos evoluíveis até o nível máximo. Abra o Baú do Dia todo dia por um
bônus grátis.

## 🗺️ Mapa-múndi e duelos

Navegue entre cidades num mapa tático estilo Final Fantasy Tactics e desafie heróis em duelo para
recrutá-los para sua equipe.

## 💡 Dicas rápidas

- Priorize o parry perfeito: dano zero, mais fúria, inimigo cansado
- Gaste ouro cedo em Vida e Defesa pra sobreviver às primeiras masmorras
- Abra o Baú do Dia todos os dias
- Equipe a gema certa pro seu estilo antes de encarar chefes

Sem tutorial arrastado, sem grind forçado: é pegar e jogar.

## Desenvolvimento

Servidor local para testes:

```
python3 -m http.server 8000
```

Fonte dos assets Tiny Swords (Free Pack):
https://github.com/Hdisa/Tiny-Swords/tree/master/Assets/Tiny%20Swords/Factions/Goblins/Troops/TNT


Aqui está uma versão refinada, bem estruturada e clara do seu prompt para o **Claude Code**. Organizá-lo em tópicos e regras explícitas ajuda a IA a entender a lógica de jogo (GDD) sem ambiguidades:

---

### Prompt Refatorado

> **Objetivo:** Atualizar o sistema de combate, mecânica de fúria e habilidades do jogo com base nas especificações abaixo.
> ---
> 
> 
> ### 1. Status de Cansaço e Tipos de Inimigos
> 
> 
> Atualize o limite/patamar de resistência para aplicar o estado **"Cansado"** ou **"Exausto"** conforme a categoria do inimigo:
> * **Monstros Normais:** Ficam **Cansados** ao atingir 5 de resistência/dano.
> * **Bosses:** Ficam **Exaustos** ao atingir 10 de resistência/dano.
> * **Big Boss** *(disponível após a Masmorra 20)*: Fica **Cansado** ao atingir 15 de resistência/dano.
> * **Huge Boss** *(disponível após a Masmorra 30)*: Fica **Cansado** ao atingir 20 de resistência/dano.
> 
> 
> ---
> 
> 
> ### 2. Mecânica de Consumo de Fúria
> 
> 
> * **Ajuste de Recurso:** Ao gastar Fúria, **não zerar** a barra.
> * **Regra:** Subtraia apenas o valor consumido do total atual de Fúria (`furia_atual = furia_atual - furia_gasta`).
> 
> 
> ---
> 
> 
> ### 3. Nova Habilidade: *Lâmina Invisível*
> 
> 
> Adicione o novo ataque **Lâmina Invisível**. A área de efeito e o número de ataques dependem do **Nível de Fúria** atual:
> * **Nível 1 de Fúria:** Ataca aleatoriamente apenas **1 monstro**.
> * **Nível 2 de Fúria:** Ataca aleatoriamente **2 monstros**.
> * **Nível 3 de Fúria:** Pode atacar os **3 monstros** (1 ataque em cada).
> * **Nível 4 de Fúria:** Realiza **4 ataques no total**, distribuídos aleatoriamente entre os **3 monstros** (podendo repetir alvos mais de duas vezes).
> * **Nível 5 de Fúria:** Realiza **5 ataques no total**, distribuídos aleatoriamente entre os **3 monstros** (podendo repetir alvos mais de duas vezes).
> 
> 
> ---
> 
> 
> ### 4. Alteração de Item/Habilidade Especial
> 
> 
> * **Substituição:** Remova a Habilidade Especial antiga e adicione o item **Poção de Adrenalina**.
> * **Efeito:** Preenche instantaneamente 100% da barra de Fúria.
> * **Limite de Inventário:** O jogador pode carregar no máximo **3 unidades** deste item.

tanto a poção de cura como a poção de adrenalina deve ficar na opção "poção"
>  ~/my-github/guerreiro-da-masmorra/assets/Addin's 256 Potion Icons - RPG Icon Pack/Full Spritesheet tem um sprit com várias poções, escolha uma para o icone do titulo "Poção" e outras duas para cada uma das poçoes disponíveis
> 
> ---
> 
> 
> **Instruções de Implementação:** Refatore as classes/funções correspondentes garantindo que as regras de estado dos bosses, cálculo de fúria e lógica do ataque *Lâmina Invisível* funcionem corretamente nas estruturas de código existentes.



o mago pode jogar combinação de cartas, mas elas podem se anular, por exemplo, jogar dois foto melhora o dano, jogar um fogo e um gelo é quase nulo. Sempre que o mago fizer um ataque básico ele compra uma carta nova.

as cartas são, fogo - gelo / agua - raio / cura - morte

sempre que o mago mata algum mostro ele ganha a carta da morte, que ao ser jogata mata instantanemaente um mostro ou tira 25% da vida de um boss, essa carta é destruida quando jogada e outra carta que esteja na mão, caso o mago não tenha nenhuma carta na mão ele perde 25% de vida

