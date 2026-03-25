
## Simulador de Custos de Frota — Frota Própria vs Subcontratação

### Visão Geral
Aplicação web interativa que permite simular e comparar custos de transporte entre frota própria (3 tipos de veículo: 6t, 9t, 15t) e transportadora subcontratada (Pombalense), para dois cenários: Polímeros/Equipamentos e Construção.

### Estrutura da Aplicação

#### 1. Página Principal — Dashboard com Tabs
- **Tab Polímeros/Equipamentos** — simulação por peso
- **Tab Construção** — simulação por dimensão/comprimento
- **Tab Comparação Global** — resumo lado a lado dos dois cenários

#### 2. Simulador de Polímeros/Equipamentos (por peso)
**Inputs:**
- Origem e Destino (selecção de locais pré-definidos da tabela Pombalense)
- Km totais (campo numérico)
- Lista de cargas com peso bruto (ton) — adicionar/remover linhas
- Cliente (texto livre)

**Cálculos automáticos:**
- Carga total (soma dos pesos)
- Custo Pombalense (baseado na tabela de preços por peso/km do modelo)
- Custo Frota Própria por tipo de veículo (€/km × km ida e volta)
- Nº de fretes necessários por tipo de veículo (com base na capacidade)

**Output:**
- Tabela comparativa: Pombalense vs Frota 6t vs Frota 9t vs Frota 15t
- Indicação visual da opção mais económica (highlight verde)

#### 3. Simulador de Construção (por dimensão)
**Inputs:**
- Origem e Destino
- Km totais
- Lista de placas: nº de placas, comprimento (selecção: chapas 2×1.05m, 3×2m, 4-6m, 7-8m)

**Cálculos automáticos:**
- Comprimento total
- Nº de fretes por tipo de veículo
- Custo subcontratação vs frota própria (incluindo suplemento por comprimento excessivo se aplicável)

**Output:**
- Tabela comparativa com custos por opção
- Indicação da opção mais económica

#### 4. Gráficos de Comparação
- Gráfico de barras: custo por opção de transporte (para cada cenário)
- Gráfico de barras agrupadas: comparação global dos dois cenários
- Custo por km e custo por tonelada/metro para cada opção

#### 5. Dados Base (página de configuração)
- Tabela editável com custos €/km da frota própria
- Tabela de preços da Pombalense (por peso e por metro)
- Tabela de locais com IDs
- Todos os dados pré-carregados do modelo Excel original

### Design
- Layout limpo e profissional com cards
- Cores: verde para opção mais barata, vermelho para a mais cara
- Responsivo para desktop e tablet
- Formulários claros com labels em português
